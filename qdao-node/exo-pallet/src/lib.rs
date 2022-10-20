#![cfg_attr(not(feature = "std"), no_std)]

use codec::{Decode, Encode, MaxEncodedLen};
use frame_support::{
    parameter_types,
    sp_runtime::{traits::AtLeast32BitUnsigned, RuntimeDebug},
    traits::{Currency, ReservableCurrency},
    BoundedVec,
};
use frame_system::Config as SystemConfig;
pub use pallet::*;
use qdao_audit_pallet::Game;
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
pub type Importance = u32;

parameter_types! {
    pub MaxUrlLength: u32 = 256;
    pub MaxClassificationLength: u32 = 40;
}

#[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen, Default)]
#[scale_info(skip_type_params(T))]
///All information related to requested review
pub struct ReviewResult {
    result: u32,
}

#[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen, Default)]
#[scale_info(skip_type_params(T))]
/// All information related to a requested review. The `requestor` deposits some amount of `bounty` to ask for a review of some source
/// code. The source code is pointed to by `url` and the content downloaded from that URL can be validated with having the specified
/// `hash`.
///
/// Later in the process automated review results and challenges will arrive to existing review results to provide feedback about the
/// source code.
///
/// Finally at the end of the review period those who provided useful feedback will be rewarded from the bounty.
pub struct Review<T: Config> {
    /// Remaining balance stored in "NFT"
    bounty: DepositBalanceOf<T>,
    /// Owner of request
    requestor: T::AccountId,
    /// Request ID
    hash: T::Hash,
    /// Original link to reviewed package
    url: BoundedVec<u8, MaxUrlLength>,
}

pub enum Classification {
    /// Breaking some invariants by executing code when it is unexpected to run
    Reentrancy,
    /// Not checking authorization well
    Escalation,
    /// Something that did not fit the variants above
    Custom(BoundedVec<u8, MaxClassificationLength>),
}

pub enum VulnerabilityState {
    Reported,
    Rejected,
}

pub struct Vulnerability {
    // TODO review what fields we should use here (location in source code,
    // should we really publish these in cleartext immediately, etc.)
    classification: Classification,
    importance: Importance,
    description: (), // TODO
}

#[non_exhaustive]
pub enum Tool {
    Manual = 0,
    CargoAudit = 1,
}

pub struct ReviewReport<T: Config> {
    auditor: AccountId<T>,
    tool: Tool,
    importance: Importance,
}

pub struct Challenge<T: Config> {
    auditor: AccountId<T>,
    review_id: T::Hash,
    report_id: usize,
    reject_vulnerabilities: Vec<usize>,
    add_vulnerabilities: Vec<VulnerabilityProperties>,
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

        /// Units for balance
        type Balance: Member + Parameter + AtLeast32BitUnsigned + Default + Copy;

        /// Currency mechanism
        type Currency: ReservableCurrency<Self::AccountId>;

        type Game: qdao_audit_pallet::pallet::Game<Self>;
    }

    #[pallet::pallet]
    #[pallet::generate_store(pub(super) trait Store)]
    pub struct Pallet<T>(_);

    #[pallet::storage]
    #[pallet::getter(pub fn reviews)]
    /// All ongoing reviews
    pub type Reviews<T: Config> = StorageMap<_, Blake2_128Concat, T::Hash, Review<T>>;

    #[pallet::storage]
    #[pallet::getter(pub fn reports)]
    /// All reports that were received on ongoing reviews
    pub type Reports<T: Config> = StorageNMap<
        _,
        (NMapKey<Blake2_128Concat, T::Hash>, NMapKey<Twox128, usize>),
        ReviewReport<T>,
    >;

    #[pallet::storage]
    #[pallet::getter(pub fn reports)]
    /// All vulnerabilities that were received on ongoing reviews
    pub type Vulnerabilities<T: Config> = StorageNMap<
        _,
        (
            NMapKey<Blake2_128Concat, T::Hash>,
            NMapKey<Twox128, usize>,
            NMapKey<Twox128, usize>,
        ),
        Vulnerability<T>,
    >;
    // Pallets use events to inform users when important changes are made.
    // https://docs.substrate.io/v3/runtime/events-and-errors
    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        /// A new review was requested. [bounty, requestor, url, hash]
        ReviewRequest {
            bounty: DepositBalanceOf<T>,
            requestor: T::AccountId,
            url: BoundedVec<u8, MaxUrlLength>,
            hash: T::Hash,
        },
    }

    // Errors inform users that something went wrong.
    #[pallet::error]
    pub enum Error<T> {
        /// The hash specified does not point to an ongoing review.
        ReviewNotFound,
        /// URL provided is longer than MaxUrlLength
        UrlTooLong,
        /// There is already an ongoing review with the same hash.
        DuplicateReviewFound,
    }

    // Dispatchable functions allows users to interact with the pallet and invoke state changes.
    // These functions materialize as "extrinsics", which are often compared to transactions.
    // Dispatchable functions must be annotated with a weight and must return a DispatchResult.
    #[pallet::call]
    impl<T: Config> Pallet<T> {
        /// Request an audit. Declare source code URL, the hash of the source code and proposed bounty amount
        #[pallet::weight(Weight::from_ref_time(10_000) + T::DbWeight::get().writes(1))]
        pub fn request_review(
            origin: OriginFor<T>,
            url: Vec<u8>,
            hash: T::Hash,
            bounty: DepositBalanceOf<T>,
        ) -> DispatchResult {
            let requestor = ensure_signed(origin)?;

            ensure!(
                !Reviews::<T>::contains_key(hash),
                Error::<T>::DuplicateReviewFound
            );

            T::Currency::reserve(&requestor, bounty)?;

            let url = url.try_into().map_err(|_| Error::<T>::UrlTooLong)?;

            Reviews::<T>::insert(
                hash,
                Review {
                    bounty,
                    requestor,
                    hash,
                    url: url.clone(),
                },
            );

            Self::deposit_event(Event::ReviewRequest {
                bounty,
                requestor,
                hash,
                url,
            });
            // Return a successful DispatchResultWithPostInfo
            Ok(())
        }

        /// Cancel request due to invalid parameters
        #[pallet::weight(Weight::from_ref_time(100) + T::DbWeight::get().writes(1))]
        pub fn tool_exec_cancel_invalid(_origin: OriginFor<T>, _hash: T::Hash) -> DispatchResult {
            Ok(())
        }

        /// Record automated request processing results
        #[pallet::weight(Weight::from_ref_time(1000) + T::DbWeight::get().writes(1))]
        pub fn tool_exec_auto_report(
            _origin: OriginFor<T>,
            _hash: T::Hash,
            _result: Vec<u8>,
        ) -> DispatchResult {
            Ok(())
        }

        /// Challenge an existing review report with some manual feedback
        #[pallet::weight(Weight::from_ref_time(1000) + T::DbWeight::get().writes(1))]
        pub fn challenge_report(
            origin: OriginFor<T>,
            challenged_hash: T::Hash,
            _result: Vec<u8>,
        ) -> DispatchResult {
            let sender = ensure_signed(origin)?;
            let review = Reviews::<T>::get(challenged_hash).ok_or(Error::<T>::ReviewNotFound)?;

            // TODO Not all challenges should win, right? :smile:
            T::Game::apply_result(sender, review.requestor, qdao_audit_pallet::Winner::Player0)?;
            Ok(())
        }

        /// Approve a challenge. When the audit is finished, part of the audit fee goes to the challenger
        /// and the original deposit will be returned.
        ///
        /// May only be called from `T::ApproveOrigin`.
        ///
        /// # <weight>
        /// - Complexity: O(1).
        /// - DbReads: `Proposals`, `Approvals`
        /// - DbWrite: `Approvals`
        /// # </weight>
        #[pallet::weight(Weight::from_ref_time(1000) + T::DbWeight::get().writes(1))]
        pub fn approve_challenge(
            origin: OriginFor<T>,
            _challenge: T::Hash,
            importance: Importance,
        ) -> DispatchResult {
            T::ApproveChallengeOrigin::ensure_origin(origin)?;

            // ensure!(
            //     <Proposals<T, I>>::contains_key(proposal_id),
            //     Error::<T, I>::InvalidIndex
            // );
            // Approvals::<T, I>::try_append(proposal_id)
            //     .map_err(|_| Error::<T, I>::TooManyApprovals)?;
            Ok(())
        }

        /// Reject a challenge. The challenge deposit will be slashed.
        ///
        /// May only be called from `T::RejectChallengeOrigin`.
        ///
        /// # <weight>
        /// - Complexity: O(1)
        /// - DbReads: `Proposals`, `rejected proposer account`
        /// - DbWrites: `Proposals`, `rejected proposer account`
        /// # </weight>
        #[pallet::weight(Weight::from_ref_time(1000) + T::DbWeight::get().writes(1))]
        pub fn reject_challenge(origin: OriginFor<T>, _challenge: T::Hash) -> DispatchResult {
            T::RejectChallengeOrigin::ensure_origin(origin)?;

            // let proposal =
            //     <Proposals<T, I>>::take(&proposal_id).ok_or(Error::<T, I>::InvalidIndex)?;
            // let value = proposal.bond;
            // let imbalance = T::Currency::slash_reserved(&proposal.proposer, value).0;
            // T::OnSlash::on_unbalanced(imbalance);

            // Self::deposit_event(Event::<T, I>::Rejected {
            //     proposal_index: proposal_id,
            //     slashed: value,
            // });
            Ok(())
        }
    }
}
