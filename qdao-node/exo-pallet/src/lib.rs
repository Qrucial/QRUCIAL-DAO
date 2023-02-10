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

type DepositBalanceOf<T> =
    <<T as Config>::Currency as Currency<<T as SystemConfig>::AccountId>>::Balance;

parameter_types! {
    pub MaxUrlLength: u32 = 256;
}

#[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen, Default)]
#[scale_info(skip_type_params(T))]
///All information related to requested review
pub struct ReviewResult {
    result: u32,
}

#[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen, Default)]
#[scale_info(skip_type_params(T))]
///All information related to requested review
pub struct ReviewData<T: Config> {
    /// Remaining balance stored in "NFT"
    deposit: DepositBalanceOf<T>,
    /// Owner of request
    requestor: T::AccountId,
    /// Request ID
    hash: T::Hash,
    /// Original link to reviewed package
    url: BoundedVec<u8, MaxUrlLength>,
    /// Struct to store result of review
    result: ReviewResult,
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

        /// Units for balance
        type Balance: Member + Parameter + AtLeast32BitUnsigned + Default + Copy;

        ///Currency mechanism
        type Currency: ReservableCurrency<Self::AccountId>;

        type Game: qdao_audit_pallet::pallet::Game<Self>;
    }

    #[pallet::pallet]
    #[pallet::generate_store(pub(super) trait Store)]
    pub struct Pallet<T>(_);

    #[pallet::storage]
    #[pallet::getter(fn something)]
    ///
    pub type ReviewRecord<T: Config> = StorageMap<_, Blake2_128Concat, T::Hash, ReviewData<T>>;

    // Pallets use events to inform users when important changes are made.
    // https://docs.substrate.io/v3/runtime/events-and-errors
    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        /// Event documentation should end with an array that provides descriptive names for event
        /// parameters. [who, url, hash]
        ExecutionRequest {
            who: T::AccountId,
            url: Vec<u8>,
            hash: T::Hash,
        },
        /// [ret_hash, ret_result]
        ExecutionFinish {
            ret_hash: T::Hash,
            ret_result: Vec<u8>,
        },
    }

    // Errors inform users that something went wrong.
    #[pallet::error]
    pub enum Error<T> {
        /// Error names should be descriptive.
        NoneValue,
        /// Errors should have helpful documentation associated with them.
        StorageOverflow,
        /// url address entered by user is longer than storage quota
        UrlTooLong,
        /// Request hash collision
        DuplicateEntry,
    }

    // Dispatchable functions allows users to interact with the pallet and invoke state changes.
    // These functions materialize as "extrinsics", which are often compared to transactions.
    // Dispatchable functions must be annotated with a weight and must return a DispatchResult.
    #[pallet::call]
    impl<T: Config> Pallet<T> {
        ///Request an audit - declare release location, its hash and proposed stake amount
        #[pallet::weight(Weight::from_ref_time(10_000) + T::DbWeight::get().writes(1))]
        pub fn tool_exec_req(
            origin: OriginFor<T>,
            url: Vec<u8>,
            hash: T::Hash,
            stake: DepositBalanceOf<T>,
        ) -> DispatchResult {
            let sender = ensure_signed(origin)?;

            ensure!(
                !ReviewRecord::<T>::contains_key(hash),
                Error::<T>::DuplicateEntry
            );

            let requestor = sender.clone();

            T::Currency::reserve(&sender, stake)?;

            let url_bounded = url.clone().try_into().map_err(|_| Error::<T>::UrlTooLong)?;

            ReviewRecord::<T>::insert(
                hash,
                ReviewData {
                    deposit: stake,
                    requestor,
                    hash,
                    url: url_bounded,
                    result: ReviewResult { result: 0 },
                },
            );

            Self::deposit_event(Event::ExecutionRequest {
                who: sender,
                url,
                hash,
            });
            // Return a successful DispatchResultWithPostInfo
            Ok(())
        }

        /// Cancel request due to invalid parameters
        //#[pallet::call_index(1)]
        #[pallet::weight(Weight::from_ref_time(100) + T::DbWeight::get().writes(1))]
        pub fn tool_exec_cancel_invalid(_origin: OriginFor<T>, _hash: T::Hash) -> DispatchResult {
            Ok(())
        }

        /// Record automated request processing results
        #[pallet::weight(Weight::from_ref_time(1000) + T::DbWeight::get().writes(1))]
        pub fn tool_exec_auto_report(
            _origin: OriginFor<T>,
            hash: T::Hash,
            result: Vec<u8>,
        ) -> DispatchResult {
            Self::deposit_event(Event::ExecutionFinish {
                ret_hash: hash,
                ret_result: result,
            });
            Ok(())
        }

        /// Record automated request processing results
        #[pallet::weight(Weight::from_ref_time(1000) + T::DbWeight::get().writes(1))]
        pub fn challenge_report(
            origin: OriginFor<T>,
            challenged_hash: T::Hash,
            _result: Vec<u8>,
        ) -> DispatchResult {
            let sender = ensure_signed(origin)?;
            let review = ReviewRecord::<T>::get(challenged_hash).ok_or(Error::<T>::NoneValue)?;
            // TODO Not all challenges should win, right? :smile:
            T::Game::apply_result(sender, review.requestor, qdao_audit_pallet::Winner::Player0)?;
            Ok(())
        }
    }
}
