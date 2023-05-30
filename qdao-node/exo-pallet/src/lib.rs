#![cfg_attr(not(feature = "std"), no_std)]

use codec::{Decode, Encode, MaxEncodedLen};
use frame_support::{
    fail, parameter_types,
    sp_runtime::{traits::AtLeast32BitUnsigned, DispatchError, RuntimeDebug},
    traits::{Currency, ReservableCurrency},
    BoundedVec,
};
use frame_system::Config as SystemConfig;
pub use pallet::*;
use qdao_audit_pallet::{Game, Score};
use scale_info::TypeInfo;
use sp_std::prelude::*;

#[cfg(test)]
mod mock;

#[cfg(test)]
mod tests;

#[cfg(feature = "runtime-benchmarks")]
mod benchmarking;

pub type DepositBalanceOf<T> =
    <<T as Config>::Currency as Currency<<T as SystemConfig>::AccountId>>::Balance;
pub type AccountId<T> = <T as SystemConfig>::AccountId;
pub type AuditorId<T> = AccountId<T>;
/// Keccak256 of the project package (say .tar.gz) the review URL resolves to
pub type ReviewHash<T> = <T as SystemConfig>::Hash;
/// Frontend specifies usage, 0 is miscellaneous
pub type Classification = u16;
/// 0-9 misc, 10-19 low, 20-29 medium, 30-39 high, 40-49 critical)
pub type Risk = u8;
/// Ordinal of a report that belongs to a given Review
pub type ReportId = u32;
/// Ordinal of a vulnerability that belongs to a given Report
pub type VulnerabilityId = u32;
/// Ordinal of a challenge that belongs to a given Report
pub type ChallengeId = u32;

parameter_types! {
    pub MaxUrlLength: u32 = 256;
    pub MaxClassificationLength: u32 = 40;
    pub MaxDescriptionLength: u32 = 4096;
    pub MaxReportsPerReview: u32 = 10;
    pub MaxVulnerabilitiesPerReport: u32 = 50;
    pub MaxChallengesPerReport: u32 = 10;
}

#[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
/// All information related to a requested review. The `requestor` deposits some amount of `bounty` to ask for a review of some source
/// code. The source code is pointed to by `url` and the content downloaded from that URL can be validated with having the specified
/// `hash`.
///
/// Later in the process automated review results and challenges will arrive to existing review results to provide feedback about the
/// source code.
///
/// Finally at the end of the review period those who provided useful feedback will be rewarded from the bounty.
pub struct Review<AccountId, ReviewHash, Balance> {
    /// Owner of request
    requestor: AccountId,
    /// Minimum score of an auditor that can add reports or challenge them on this review
    min_auditor_score: Score,
    /// Remaining balance stored in "NFT"
    bounty: Balance,
    /// Request ID
    hash: ReviewHash,
    /// Original link to reviewed package
    url: BoundedVec<u8, MaxUrlLength>,
}

#[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
#[repr(u32)]
#[non_exhaustive]
pub enum Tool {
    Manual = 0,
    Clippy = 1,
    CargoAudit = 2,
    Octopus = 3,
}

#[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
pub struct Vulnerability {
    /// The tool that was used to report this vulnerability. Manually reported
    /// vulnerabilities use `Tool::Manual`.
    tool: Tool,
    // TODO review what fields we should use here (location in source code,
    // should we really publish these in cleartext immediately, etc.)
    /// Tool specific vulnerability-type. Frontend specifies usage,
    /// 0 is miscellaneous for each tool.
    classification: Classification,
    /// 0-9 misc, 10-19 low, 20-29 medium, 30-39 high, 40-49 critical).
    risk: Risk,
    /// Free format, might contain an URL to some known vulnerability.
    description: BoundedVec<u8, MaxDescriptionLength>,
}

#[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
#[repr(i8)]
pub enum ReportKind {
    Invalid = -1i8,
    Success = 0,
}

/// A report a given auditor sent for a given review.
#[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
pub struct Report<AuditorId> {
    auditor: AuditorId,
    kind: ReportKind,
}

#[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
#[repr(i8)]
pub enum ChallengeState {
    Removed = -1i8,
    Pending = 0,
    Accepted = 1,
    Rejected = 2,
}

#[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
pub struct Challenge<AuditorId> {
    auditor: AuditorId,
    state: ChallengeState,
    remove_vulnerabilities: BoundedVec<VulnerabilityId, MaxVulnerabilitiesPerReport>,
    add_vulnerabilities: BoundedVec<Vulnerability, MaxVulnerabilitiesPerReport>,
    patch_vulnerabilities: BoundedVec<PatchVulnerability, MaxVulnerabilitiesPerReport>,
}

#[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
pub struct PatchVulnerability {
    vulnerability_id: VulnerabilityId,
    risk: Option<Risk>,
    classification: Option<Classification>,
    description: Option<BoundedVec<u8, MaxDescriptionLength>>,
}

#[frame_support::pallet]
pub mod pallet {
    use super::*;
    use frame_support::pallet_prelude::*;
    use frame_system::pallet_prelude::*;

    /// Configure the pallet by specifying the parameters and types on which it depends.
    #[pallet::config]
    pub trait Config: frame_system::Config {
        /// Because this pallet emits events, it depends on the runtime's definition of an event.
        type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;

        /// Origin that can approve challenges
        type ApproveChallengeOrigin: EnsureOrigin<Self::RuntimeOrigin>;

        /// Origin that can reject challenges
        type RejectChallengeOrigin: EnsureOrigin<Self::RuntimeOrigin>;

        /// Origin that can remove challenges
        type RemoveChallengeOrigin: EnsureOrigin<Self::RuntimeOrigin>;

        /// Units for balance
        type Balance: Member + Parameter + AtLeast32BitUnsigned + Default + Copy;

        /// Currency mechanism
        type Currency: ReservableCurrency<<Self as SystemConfig>::AccountId>;

        type Game: qdao_audit_pallet::pallet::Game<Self>;
    }

    #[pallet::pallet]
    #[pallet::generate_store(pub(super) trait Store)]
    pub struct Pallet<T>(_);

    #[pallet::storage]
    #[pallet::getter(fn reviews)]
    /// All ongoing reviews
    pub type Reviews<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        ReviewHash<T>,
        Review<AccountId<T>, ReviewHash<T>, DepositBalanceOf<T>>,
        OptionQuery,
    >;

    #[pallet::storage]
    #[pallet::getter(fn reports)]
    /// All reports that were received on ongoing reviews
    pub type Reports<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        ReviewHash<T>,
        BoundedVec<Report<AuditorId<T>>, MaxReportsPerReview>,
        ValueQuery,
    >;

    #[pallet::storage]
    #[pallet::getter(fn vulnerabilities)]
    /// All vulnerabilities that were received on ongoing reviews
    pub type Vulnerabilities<T: Config> = StorageNMap<
        _,
        (
            NMapKey<Blake2_128Concat, ReviewHash<T>>,
            NMapKey<Twox128, ReportId>,
        ),
        BoundedVec<Vulnerability, MaxVulnerabilitiesPerReport>,
    >;

    #[pallet::storage]
    #[pallet::getter(fn challenges)]
    /// All challenges that were received on ongoing reviews
    pub type Challenges<T: Config> = StorageDoubleMap<
        _,
        Blake2_128Concat,
        ReviewHash<T>,
        Twox128,
        ReportId,
        BoundedVec<Challenge<AuditorId<T>>, MaxChallengesPerReport>,
        ValueQuery,
    >;

    // Pallets use events to inform users when important changes are made.
    // https://docs.substrate.io/v3/runtime/events-and-errors
    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        /// A new review was requested. [requestor, min_auditor_score, bounty, url, hash]
        ReviewRequest {
            requestor: AccountId<T>,
            min_auditor_score: Score,
            bounty: DepositBalanceOf<T>,
            url: BoundedVec<u8, MaxUrlLength>,
            hash: ReviewHash<T>,
        },
        /// An auditor deemed the review invalid [hash, auditor]
        ReviewInvalid {
            hash: ReviewHash<T>,
            report_id: ReportId,
            auditor: AuditorId<T>,
        },
        /// An auditor sent a report for a review [hash, report_id, auditor]
        ReviewReportCreated {
            hash: ReviewHash<T>,
            report_id: ReportId,
            auditor: AuditorId<T>,
        },
        /// A vulnerability was added to a report for a review [hash, report_id, vulnerability_id, vulnerability]
        VulnerabilityAdded {
            hash: ReviewHash<T>,
            report_id: ReportId,
            vulnerability_id: VulnerabilityId,
            vulnerability: Vulnerability,
        },
        /// An auditor challenged a report for a review [hash, report_id, auditor]
        ChallengeStarted {
            hash: ReviewHash<T>,
            report_id: ReportId,
            challenge_id: ChallengeId,
            auditor: AuditorId<T>,
        },
        /// An challenge was accepted by the committee [hash, report_id, challenge_id]
        ChallengeAccepted {
            hash: ReviewHash<T>,
            report_id: ReportId,
            challenge_id: ChallengeId,
        },
        /// Another challenge was accepted by the committee for a report, so this one was removed [hash, report_id, challenge_id]
        ChallengeRemoved {
            hash: ReviewHash<T>,
            report_id: ReportId,
            challenge_id: ChallengeId,
        },
        /// This challenge was explicitly rejected by the committee [hash, report_id, challenge_id]
        ChallengeRejected {
            hash: ReviewHash<T>,
            report_id: ReportId,
            challenge_id: ChallengeId,
        },
        /// A vulnerability was modified in a report for a review [hash, report_id, vulnerability_id, vulnerability]
        VulnerabilityPatched {
            hash: ReviewHash<T>,
            report_id: ReportId,
            vulnerability_id: VulnerabilityId,
            vulnerability: Vulnerability,
        },
        /// A vulnerability was removed from a report for a review [hash, report_id, vulnerability_id]
        VulnerabilityRemoved {
            hash: ReviewHash<T>,
            report_id: ReportId,
            vulnerability_id: VulnerabilityId,
        },
    }

    // Errors inform users that something went wrong.
    #[pallet::error]
    pub enum Error<T> {
        /// URL provided is longer than MaxUrlLength
        UrlTooLong,
        /// The hash specified does not point to an ongoing review
        ReviewNotFound,
        /// There is already an ongoing review with the same hash
        DuplicateReviewFound,
        /// The auditor has not enough reputation to create a report for a review or challenge a report
        NotEnoughReputation,
        /// Could not find a report based on the search query
        ReportNotFound,
        /// There is already a report from an auditor for this review
        DuplicateReportFound,
        /// Cannot add more reports for this review
        TooManyReports,
        /// A challenge cannot be sent for a report from the same auditor
        CannotChallengeSelf,
        /// Cannot add more challenges for this review
        TooManyChallenges,
        /// Could not find a challenge based on the search query
        ChallengeNotFound,
        /// There is already a pending challenge from an auditor for this report
        DuplicateChallengeFound,
        /// Cannot add more vulnerabilities for this report or challenge
        TooManyVulnerabilites,
    }

    // Dispatchable functions allows users to interact with the pallet and invoke state changes.
    // These functions materialize as "extrinsics", which are often compared to transactions.
    // Dispatchable functions must be annotated with a weight and must return a DispatchResult.
    #[pallet::call]
    impl<T: Config> Pallet<T> {
        /// Request an audit. Declare source code URL, the hash of the source code and proposed bounty amount
        #[pallet::call_index(0)]
        #[pallet::weight(Weight::from_ref_time(10_000) + T::DbWeight::get().writes(1))]
        pub fn request_review(
            origin: OriginFor<T>,
            url: Vec<u8>,
            hash: ReviewHash<T>,
            bounty: DepositBalanceOf<T>,
            min_auditor_score: Score,
        ) -> DispatchResult {
            let requestor = ensure_signed(origin)?;

            ensure!(
                !Reviews::<T>::contains_key(&hash),
                Error::<T>::DuplicateReviewFound
            );

            T::Currency::reserve(&requestor, bounty)?;

            let url: BoundedVec<u8, MaxUrlLength> =
                url.try_into().map_err(|_| Error::<T>::UrlTooLong)?;

            Reviews::<T>::insert(
                &hash,
                Review {
                    requestor: requestor.clone(),
                    min_auditor_score,
                    bounty,
                    hash,
                    url: url.clone(),
                },
            );

            Self::deposit_event(Event::ReviewRequest {
                requestor,
                min_auditor_score,
                bounty,
                hash,
                url,
            });
            // Return a successful DispatchResultWithPostInfo
            Ok(())
        }

        /// An auditor checked the review request and either the review hash did not match the project package content, or the package
        /// could not be unpacked, compiled or whatever other reason the audit itself could not even be started.
        #[pallet::call_index(1)]
        #[pallet::weight(Weight::from_ref_time(100) + T::DbWeight::get().writes(1))]
        pub fn review_invalid(origin: OriginFor<T>, hash: ReviewHash<T>) -> DispatchResult {
            // === How to extract the following code nicely into its own method?
            let auditor = Self::audit_review(origin, &hash)?;
            let report_id = Self::new_report_id(&auditor, &hash)?;

            Reports::<T>::try_append(
                &hash,
                Report {
                    auditor: auditor.clone(),
                    kind: ReportKind::Invalid,
                },
            )
            .map_err(|()| Error::<T>::TooManyReports)?;

            Self::deposit_event(Event::ReviewInvalid {
                auditor,
                report_id,
                hash,
            });
            Ok(())
        }

        /// Record automated request processing results
        #[pallet::call_index(2)]
        #[pallet::weight(Weight::from_ref_time(1000) + T::DbWeight::get().writes(1))]
        pub fn review_report(
            origin: OriginFor<T>,
            hash: ReviewHash<T>,
            vulnerabilities: BoundedVec<Vulnerability, MaxVulnerabilitiesPerReport>,
        ) -> DispatchResult {
            let auditor = Self::audit_review(origin, &hash)?;
            let report_id = Self::new_report_id(&auditor, &hash)?;

            Reports::<T>::try_append(
                &hash,
                Report {
                    auditor: auditor.clone(),
                    kind: ReportKind::Success,
                },
            )
            .map_err(|()| Error::<T>::TooManyReports)?;

            Self::deposit_event(Event::ReviewReportCreated {
                hash,
                report_id,
                auditor,
            });

            Vulnerabilities::<T>::insert((hash, report_id), vulnerabilities.clone());
            for (vulnerability_id, vulnerability) in vulnerabilities.into_iter().enumerate() {
                Self::deposit_event(Event::VulnerabilityAdded {
                    hash,
                    report_id,
                    vulnerability_id: vulnerability_id
                        .try_into()
                        .expect("Both usize and u32 are larger than MaxVulnerabilitiesPerReport"),
                    vulnerability,
                });
            }

            Ok(())
        }

        /// Challenge an existing review report with some manual feedback
        #[pallet::call_index(3)]
        #[pallet::weight(Weight::from_ref_time(1000) + T::DbWeight::get().writes(1))]
        pub fn challenge_report(
            origin: OriginFor<T>,
            hash: ReviewHash<T>,
            report_id: ReportId,
            remove_vulnerabilities: BoundedVec<VulnerabilityId, MaxVulnerabilitiesPerReport>,
            add_vulnerabilities: BoundedVec<Vulnerability, MaxVulnerabilitiesPerReport>,
            patch_vulnerabilities: BoundedVec<PatchVulnerability, MaxVulnerabilitiesPerReport>,
        ) -> DispatchResult {
            let auditor = Self::audit_review(origin, &hash)?;
            let report_auditor = Self::report_auditor(&hash, report_id)?;
            ensure!(&report_auditor != &auditor, Error::<T>::CannotChallengeSelf);

            // Nice to have: check VulnerabilityIds against those in the Report not only on the frontend, but also here
            let challenge_id = Self::new_challenge_id(&auditor, &hash, report_id)?;
            Challenges::<T>::try_append(
                &hash,
                report_id,
                Challenge {
                    auditor: auditor.clone(),
                    state: ChallengeState::Pending,
                    remove_vulnerabilities,
                    add_vulnerabilities,
                    patch_vulnerabilities,
                },
            )
            .map_err(|()| Error::<T>::TooManyChallenges)?;

            Self::deposit_event(Event::ChallengeStarted {
                hash,
                report_id,
                challenge_id,
                auditor,
            });
            Ok(())
        }

        /// Approve a challenge. When the audit is finished, part of the audit fee goes to the challenger
        /// and the original deposit will be returned.
        ///
        /// May only be called from `T::ApproveChallengeOrigin`.
        #[pallet::call_index(4)]
        #[pallet::weight(Weight::from_ref_time(1000) + T::DbWeight::get().writes(1))]
        pub fn approve_challenge(
            origin: OriginFor<T>,
            hash: ReviewHash<T>,
            report_id: ReportId,
            challenge_id: ChallengeId,
        ) -> DispatchResult {
            T::ApproveChallengeOrigin::ensure_origin(origin)?;
            Self::close_challenge(
                &hash,
                report_id,
                challenge_id,
                ChallengeState::Accepted,
                qdao_audit_pallet::Winner::Player0,
            )?;
            Self::deposit_event(Event::ChallengeAccepted {
                hash,
                report_id,
                challenge_id,
            });
            Ok(())
        }

        /// Reject a challenge. The challenge deposit will be slashed.
        ///
        /// May only be called from `T::RejectChallengeOrigin`.
        #[pallet::call_index(5)]
        #[pallet::weight(Weight::from_ref_time(1000) + T::DbWeight::get().writes(1))]
        pub fn reject_challenge(
            origin: OriginFor<T>,
            hash: ReviewHash<T>,
            report_id: ReportId,
            challenge_id: ChallengeId,
        ) -> DispatchResult {
            T::RejectChallengeOrigin::ensure_origin(origin)?;
            Self::close_challenge(
                &hash,
                report_id,
                challenge_id,
                ChallengeState::Rejected,
                qdao_audit_pallet::Winner::Player1,
            )?;
            Self::deposit_event(Event::ChallengeRejected {
                hash,
                report_id,
                challenge_id,
            });
            Ok(())
        }

        /// Remove a challenge.
        ///
        /// May only be called from `T::RemoveChallengeOrigin`.
        #[pallet::call_index(6)]
        #[pallet::weight(Weight::from_ref_time(1000) + T::DbWeight::get().writes(1))]
        pub fn remove_challenge(
            origin: OriginFor<T>,
            hash: ReviewHash<T>,
            report_id: ReportId,
            challenge_id: ChallengeId,
        ) -> DispatchResult {
            T::RemoveChallengeOrigin::ensure_origin(origin)?;
            Self::close_challenge(
                &hash,
                report_id,
                challenge_id,
                ChallengeState::Removed,
                qdao_audit_pallet::Winner::Draw,
            )?;
            Self::deposit_event(Event::ChallengeRemoved {
                hash,
                report_id,
                challenge_id,
            });
            Ok(())
        }
    }

    impl<T: Config> Pallet<T> {
        /// Makes sure the extrinsic is signed by an account who has minimum score needed to audit a review.
        fn audit_review(
            origin: OriginFor<T>,
            hash: &ReviewHash<T>,
        ) -> Result<AuditorId<T>, DispatchError> {
            let auditor = ensure_signed(origin)?;
            let review = Reviews::<T>::try_get(hash).map_err(|_| Error::<T>::ReviewNotFound)?;
            ensure!(
                T::Game::has_enough_rank(&auditor, review.min_auditor_score),
                Error::<T>::NotEnoughReputation
            );
            Ok(auditor)
        }

        fn new_report_id(
            auditor: &AuditorId<T>,
            hash: &ReviewHash<T>,
        ) -> Result<ReportId, DispatchError> {
            let reports = Reports::<T>::get(hash);
            ensure!(
                reports.iter().find(|r| &r.auditor == auditor).is_none(),
                Error::<T>::DuplicateReportFound
            );
            let report_id = reports
                .len()
                .try_into()
                .expect("Both usize and u32 are larger than MaxReportsPerReview");
            Ok(report_id)
        }

        fn report_auditor(
            hash: &ReviewHash<T>,
            report_id: ReportId,
        ) -> Result<AuditorId<T>, DispatchError> {
            let reports = Reports::<T>::get(hash);
            let Some(report) = reports
                .get(
                    usize::try_from(report_id)
                        .expect("Both usize and u32 are larger than MaxReportsPerReview"),
                ) else { fail!(Error::<T>::ReportNotFound) };
            Ok(report.auditor.clone())
        }

        fn new_challenge_id(
            auditor: &AuditorId<T>,
            hash: &ReviewHash<T>,
            report_id: ReportId,
        ) -> Result<ChallengeId, DispatchError> {
            let challenges = Challenges::<T>::get(hash, report_id);
            ensure!(
                challenges.iter().find(|r| &r.auditor == auditor).is_none(),
                Error::<T>::DuplicateChallengeFound
            );
            let challenge_id = challenges
                .len()
                .try_into()
                .expect("Both usize and u32 are larger than MaxReportsPerReview");
            Ok(challenge_id)
        }

        fn close_challenge(
            hash: &ReviewHash<T>,
            report_id: ReportId,
            challenge_id: ChallengeId,
            state: ChallengeState,
            winner: qdao_audit_pallet::Winner,
        ) -> DispatchResult {
            let report_auditor = Self::report_auditor(hash, report_id)?;
            let challenger = Challenges::<T>::try_mutate(
                hash,
                report_id,
                |challenges| -> Result<AuditorId<T>, DispatchError> {
                    let Some(challenge) = challenges
                    .get_mut(
                        usize::try_from(challenge_id)
                            .expect("Both usize and u32 are larger than MaxChallengesPerReport"),
                    ) else { fail!(Error::<T>::ChallengeNotFound) };
                    challenge.state = state;
                    Ok(challenge.auditor.clone())
                },
            )?;

            T::Game::apply_result(&challenger, &report_auditor, winner)?;

            Ok(())
        }
    }
}
