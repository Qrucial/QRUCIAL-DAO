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
use sp_std::{marker::PhantomData, prelude::*};

#[cfg(test)]
mod mock;

#[cfg(test)]
mod tests;

#[cfg(feature = "runtime-benchmarks")]
mod benchmarking;

pub type DepositBalanceOf<T> =
    <<T as Config>::Currency as Currency<<T as SystemConfig>::AccountId>>::Balance;
pub type Risk = u32;

parameter_types! {
    pub MaxUrlLength: u32 = 256;
    pub MaxClassificationLength: u32 = 40;
    pub MaxDescriptionLength: u32 = 4096;
}

#[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen, Default)]
#[scale_info(skip_type_params(T))]
///All information related to requested review
pub struct ReviewResult {
    result: u32,
}

#[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
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
    requestor: <T as SystemConfig>::AccountId,
    /// Request ID
    hash: <T as SystemConfig>::Hash,
    /// Original link to reviewed package
    url: BoundedVec<u8, MaxUrlLength>,
}

#[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
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

#[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
#[scale_info(skip_type_params(T))]
pub struct Vulnerability<T: Config> {
    // TODO review what fields we should use here (location in source code,
    // should we really publish these in cleartext immediately, etc.)
    classification: Classification,
    risk: Risk,
    description: BoundedVec<u8, MaxDescriptionLength>, // TODO
    _t: PhantomData<T>,
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
#[scale_info(skip_type_params(T))]
pub struct ReviewReport<T: Config> {
    auditor: <T as SystemConfig>::AccountId,
    tool: Tool,
    risk: Risk,
}

// pub struct Challenge<T: Config> {
//     auditor: <T as SystemConfig>::AccountId,
//     review_id: <T as SystemConfig>::Hash,
//     report_id: u32,
//     reject_vulnerabilities: Vec<u32>,
//     add_vulnerabilities: Vec<VulnerabilityProperties>,
// }

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
        type Currency: ReservableCurrency<<Self as SystemConfig>::AccountId>;

        type Game: qdao_audit_pallet::pallet::Game<Self>;
    }

    #[pallet::pallet]
    #[pallet::generate_store(pub(super) trait Store)]
    pub struct Pallet<T>(_);

    #[pallet::storage]
    #[pallet::getter(fn reviews)]
    /// All ongoing reviews
    pub type Reviews<T: Config> = StorageMap<_, Blake2_128Concat, T::Hash, Review<T>>;

    #[pallet::storage]
    #[pallet::getter(fn reports)]
    /// All reports that were received on ongoing reviews
    pub type Reports<T: Config> = StorageNMap<
        _,
        (NMapKey<Blake2_128Concat, T::Hash>, NMapKey<Twox128, u32>),
        ReviewReport<T>,
    >;

    #[pallet::storage]
    #[pallet::getter(fn vulnerabilities)]
    /// All vulnerabilities that were received on ongoing reviews
    pub type Vulnerabilities<T: Config> = StorageNMap<
        _,
        (
            NMapKey<Blake2_128Concat, T::Hash>,
            NMapKey<Twox128, u32>,
            NMapKey<Twox128, u32>,
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
            requestor: <T as SystemConfig>::AccountId,
            url: BoundedVec<u8, MaxUrlLength>,
            hash: <T as SystemConfig>::Hash,
        },
        /// [ret_hash, ret_result]
        ExecutionFinish {
            ret_hash: <T as SystemConfig>::Hash,
            ret_result: Vec<u8>,
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
        #[pallet::call_index(0)]
        #[pallet::weight(Weight::from_ref_time(10_000) + T::DbWeight::get().writes(1))]
        pub fn request_review(
            origin: OriginFor<T>,
            url: Vec<u8>,
            hash: <T as SystemConfig>::Hash,
            bounty: DepositBalanceOf<T>,
        ) -> DispatchResult {
            let requestor = ensure_signed(origin)?;

            ensure!(
                !Reviews::<T>::contains_key(hash),
                Error::<T>::DuplicateReviewFound
            );

            T::Currency::reserve(&requestor, bounty)?;

            let url: BoundedVec<u8, MaxUrlLength> =
                url.try_into().map_err(|_| Error::<T>::UrlTooLong)?;

            Reviews::<T>::insert(
                hash,
                Review {
                    bounty,
                    requestor: requestor.clone(),
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
        #[pallet::call_index(1)]
        #[pallet::weight(Weight::from_ref_time(100) + T::DbWeight::get().writes(1))]
        pub fn tool_exec_cancel_invalid(
            _origin: OriginFor<T>,
            _hash: <T as SystemConfig>::Hash,
        ) -> DispatchResult {
            Ok(())
        }

        /// Record automated request processing results
        #[pallet::call_index(2)]
        #[pallet::weight(Weight::from_ref_time(1000) + T::DbWeight::get().writes(1))]
        pub fn tool_exec_auto_report(
            origin: OriginFor<T>,
            hash: <T as SystemConfig>::Hash,
            result: Vec<u8>,
        ) -> DispatchResult {
            let auditor = ensure_signed(origin)?;
            Self::deposit_event(Event::ExecutionFinish {
                ret_hash: hash,
                ret_result: result,
            });
            Ok(())
        }

        /// Challenge an existing review report with some manual feedback
        #[pallet::call_index(3)]
        #[pallet::weight(Weight::from_ref_time(1000) + T::DbWeight::get().writes(1))]
        pub fn challenge_report(
            origin: OriginFor<T>,
            challenged_hash: <T as SystemConfig>::Hash,
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
        #[pallet::call_index(4)]
        #[pallet::weight(Weight::from_ref_time(1000) + T::DbWeight::get().writes(1))]
        pub fn approve_challenge(
            origin: OriginFor<T>,
            _challenge: <T as SystemConfig>::Hash,
            risk: Risk,
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
        #[pallet::call_index(5)]
        #[pallet::weight(Weight::from_ref_time(1000) + T::DbWeight::get().writes(1))]
        pub fn reject_challenge(
            origin: OriginFor<T>,
            _challenge: <T as SystemConfig>::Hash,
        ) -> DispatchResult {
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
