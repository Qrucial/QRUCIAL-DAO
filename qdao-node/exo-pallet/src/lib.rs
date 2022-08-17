#![cfg_attr(not(feature = "std"), no_std)]

/// Edit this file to define custom logic or remove it if it is not needed.
/// Learn more about FRAME and the core library of Substrate FRAME pallets:
/// <https://docs.substrate.io/v3/runtime/frame>
pub use pallet::*;
use sp_std::prelude::*;
use frame_support::{BoundedVec, parameter_types, sp_runtime::{RuntimeDebug, traits::{AtLeast32BitUnsigned}}, traits::{Currency, ReservableCurrency}};
use frame_system::Config as SystemConfig;
use codec::{Encode, Decode, HasCompact, MaxEncodedLen};
use scale_info::TypeInfo;

#[cfg(test)]
mod mock;

#[cfg(test)]
mod tests;

#[cfg(feature = "runtime-benchmarks")]
mod benchmarking;

type DepositBalanceOf<T> = <<T as Config>::Currency as Currency<<T as SystemConfig>::AccountId>>::Balance;

parameter_types! {
    pub MaxUrlLength: u32 = 256;
}

#[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen, Default)]
#[scale_info(skip_type_params(T))]
///All information related to requested review
pub struct ReviewData<T: Config> {
    ///Remaining balance stored in "NFT"
    deposit: DepositBalanceOf<T>,
    author: T::AccountId,
    hash: T::Hash,
    url: BoundedVec<u8, MaxUrlLength>,
    result: u32,
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
        type Event: From<Event<Self>> + IsType<<Self as frame_system::Config>::Event>;

        /// Units for balance
        type Balance: Member + Parameter + AtLeast32BitUnsigned + Default + Copy;

        ///Currency mechanism
        type Currency: ReservableCurrency<Self::AccountId>;
    }

    #[pallet::pallet]
    #[pallet::generate_store(pub(super) trait Store)]
    pub struct Pallet<T>(_);

    #[pallet::storage]
    #[pallet::getter(fn something)]
    ///
    pub type ReviewRecord<T: Config> = StorageMap<
        _, 
        Blake2_128Concat,
        T::Hash,
        ReviewData<T>,
    >;

    // Pallets use events to inform users when important changes are made.
    // https://docs.substrate.io/v3/runtime/events-and-errors
    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        /// Event documentation should end with an array that provides descriptive names for event
        /// parameters. [something, who]
        ExecutionRequest {
            who: T::AccountId,
            url: Vec<u8>,
            hash: T::Hash,
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
    }

    // Dispatchable functions allows users to interact with the pallet and invoke state changes.
    // These functions materialize as "extrinsics", which are often compared to transactions.
    // Dispatchable functions must be annotated with a weight and must return a DispatchResult.
    #[pallet::call]
    impl<T: Config> Pallet<T> {
        /// An example dispatchable that takes a singles value as a parameter, writes the value to
        /// storage and emits an event. This function must be dispatched by a signed extrinsic.
        #[pallet::weight(10_000 + T::DbWeight::get().writes(1))]
        pub fn tool_exec_req(origin: OriginFor<T>, url: Vec<u8>, hash: T::Hash, stake: DepositBalanceOf<T>) -> DispatchResult {
            // Check that the extrinsic was signed and get the signer.
            // This function will return an error if the extrinsic is not signed.
            // https://docs.substrate.io/v3/runtime/origins
            let sender = ensure_signed(origin)?;
            let author = sender.clone();

            // TBA Check if balance is > and deduced

            let url_bounded = url.clone().try_into().map_err(|_| Error::<T>::UrlTooLong)?;

            //create "NFT" without any data
            ReviewRecord::<T>::insert(hash, ReviewData{
                deposit: stake,
                author: author,
                hash: hash,
                url: url_bounded,
                result: 0,
            });

            // Emit an event.
            Self::deposit_event(Event::ExecutionRequest {
                who: sender,
                url: url,
                hash: hash,
            });
            // Return a successful DispatchResultWithPostInfo
            Ok(())
        }
    }
}
