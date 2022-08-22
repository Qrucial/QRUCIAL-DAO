#![cfg_attr(not(feature = "std"), no_std)]

/// Edit this file to define custom logic or remove it if it is not needed.
/// Learn more about FRAME and the core library of Substrate FRAME pallets:
/// <https://docs.substrate.io/v3/runtime/frame>
pub use pallet::*;
use sp_std::prelude::*;

#[cfg(test)]
mod mock;

#[cfg(test)]
mod tests;

#[cfg(feature = "runtime-benchmarks")]
mod benchmarking;

#[frame_support::pallet]
pub mod pallet {
    use super::*;
    use frame_support::{pallet_prelude::*, storage::bounded_vec};
    use frame_system::pallet_prelude::*;
    use sp_core::H256;

    #[derive(Encode, Decode, Default, Clone, PartialEq, TypeInfo, MaxEncodedLen)]
    pub struct AuditorData<Hash, AccountId> {
        score: Option<u32>,
        profile_hash: Hash,
        approved_by: BoundedVec<AccountId, ConstU32<3>>,
    }

    /// Configure the pallet by specifying the parameters and types on which it depends.
    #[pallet::config]
    pub trait Config: frame_system::Config {
        /// Because this pallet emits events, it depends on the runtime's definition of an event.
        type Event: From<Event<Self>> + IsType<<Self as frame_system::Config>::Event>;
    }

    #[pallet::pallet]
    #[pallet::generate_store(pub(super) trait Store)]
    pub struct Pallet<T>(_);

    // Storage for auditor scores
    // If a new Auditor signed up whose approval is pending, the Auditor scrore will be None
    #[pallet::storage]
    #[pallet::getter(fn auditor_score)]
    pub(super) type AuditorScore<T: Config> =
        StorageMap<_, Blake2_128Concat, T::AccountId, AuditorData<sp_core::H256, T::AccountId>>;

    // New Auditor signed up
    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        /// Event documentation should end with an array that provides descriptive names for event
        /// parameters. [something, who]
        SignedUp { who: T::AccountId },
    }

    // Errors inform users that something went wrong.
    #[pallet::error]
    pub enum Error<T> {
        /// Error names should be descriptive.
        NoneValue,
        /// Errors should have helpful documentation associated with them.
        StorageOverflow,
        // Auditor is already signed up
        AlreadySignedUp,
    }

    // Dispatchable functions allows users to interact with the pallet and invoke state changes.
    // These functions materialize as "extrinsics", which are often compared to transactions.
    // Dispatchable functions must be annotated with a weight and must return a DispatchResult.
    #[pallet::call]
    impl<T: Config> Pallet<T> {
        #[pallet::weight(10_000 + T::DbWeight::get().writes(1))]
        // Signs up a new Auditor
        // ToDo: Auditor needs to stake tokens, needs to provide hash of porfile markdown
        pub fn sign_up(origin: OriginFor<T>, profile_hash: H256) -> DispatchResult {
            // Check that the extrinsic was signed and get the signer.
            // This function will return an error if the extrinsic is not signed.
            // https://docs.substrate.io/v3/runtime/origins
            let sender = ensure_signed(origin)?;

            // Ensure that auditor is not already signed up
            ensure!(
                !AuditorScore::<T>::contains_key(&sender),
                Error::<T>::AlreadySignedUp
            );

            // Register new Auditor
            let auditor_data = AuditorData::<H256, T::AccountId> {
                score: None,
                profile_hash,
                approved_by: BoundedVec::with_bounded_capacity(3)
            };
            <AuditorScore<T>>::insert(sender.clone(), auditor_data);

            // Emit an event.
            Self::deposit_event(Event::SignedUp { who: sender });
            // Return a successful DispatchResultWithPostInfo
            Ok(())
        }

        #[pallet::weight(10_000 + T::DbWeight::get().writes(1))]
        pub fn update_profile(origin: OriginFor<T>, profile_hash: H256) -> DispatchResult {
           unimplemented!();  
        }

        #[pallet::weight(10_000 + T::DbWeight::get().writes(1))]
        pub fn cancel_account(origin: OriginFor<T>) -> DispatchResult {
           unimplemented!();  
        }
        
        #[pallet::weight(10_000 + T::DbWeight::get().writes(1))]
        pub fn approve_auditor(origin: OriginFor<T>, to_approve: T::AccountId) -> DispatchResult {
           unimplemented!();  
        }
    }

    
}
