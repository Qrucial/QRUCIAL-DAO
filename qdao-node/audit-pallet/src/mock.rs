use crate::{self as qdao_pallet_dummy, AuditorData};
use frame_support::{
    parameter_types,
    traits::{ConstU16, ConstU64, GenesisBuild},
    BoundedVec,
};
use frame_system as system;
use sp_core::H256;
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
};

type UncheckedExtrinsic = frame_system::mocking::MockUncheckedExtrinsic<Test>;
type Block = frame_system::mocking::MockBlock<Test>;

// Configure a mock runtime to test the pallet.
frame_support::construct_runtime!(
    pub enum Test where
        Block = Block,
        NodeBlock = Block,
        UncheckedExtrinsic = UncheckedExtrinsic,
    {
        System: frame_system::{Pallet, Call, Config, Storage, Event<T>},
        AuditRepModule: qdao_pallet_dummy::{Pallet, Call, Storage, Event<T>},
        Balances: pallet_balances::{Pallet, Call, Storage, Config<T>, Event<T>},
    }
);

parameter_types! {
    pub const ExistentialDeposit: u64 = 1;
}

impl system::Config for Test {
    type BaseCallFilter = frame_support::traits::Everything;
    type BlockWeights = ();
    type BlockLength = ();
    type DbWeight = ();
    type Origin = Origin;
    type Call = Call;
    type Index = u64;
    type BlockNumber = u64;
    type Hash = H256;
    type Hashing = BlakeTwo256;
    type AccountId = u64;
    type Lookup = IdentityLookup<Self::AccountId>;
    type Header = Header;
    type Event = Event;
    type BlockHashCount = ConstU64<250>;
    type Version = ();
    type PalletInfo = PalletInfo;
    type AccountData = pallet_balances::AccountData<u64>;
    type OnNewAccount = ();
    type OnKilledAccount = ();
    type SystemWeightInfo = ();
    type SS58Prefix = ConstU16<42>;
    type OnSetCode = ();
    type MaxConsumers = frame_support::traits::ConstU32<16>;
}

impl pallet_balances::Config for Test {
    type Balance = u64;
    type DustRemoval = ();
    type Event = Event;
    type ExistentialDeposit = ExistentialDeposit;
    type AccountStore = System;
    type WeightInfo = ();
    type MaxLocks = ();
    type MaxReserves = ();
    type ReserveIdentifier = ();
}

impl qdao_pallet_dummy::Config for Test {
    type Event = Event;
    type Balance = u64;
    type Currency = Balances;
    type MinAuditorStake = frame_support::traits::ConstU64<100>;
}

// Build genesis storage according to the mock runtime.
pub fn new_test_ext() -> sp_io::TestExternalities {
    let mut t = system::GenesisConfig::default()
        .build_storage::<Test>()
        .unwrap();
    pallet_balances::GenesisConfig::<Test> {
        balances: vec![
            (1, 100),
            (2, 100),
            (3, 100),
            (10, 100),
            (20, 100),
            (30, 100),
        ],
    }
    .assimilate_storage(&mut t)
    .unwrap();
    let auditor_data = AuditorData::<H256, u64> {
        score: Some(2000),
        profile_hash: H256::repeat_byte(1),
        approved_by: BoundedVec::with_bounded_capacity(3),
    };
    let auditor_data_low_score = AuditorData::<H256, u64> {
        score: Some(1000),
        profile_hash: H256::repeat_byte(1),
        approved_by: BoundedVec::with_bounded_capacity(3),
    };
    qdao_pallet_dummy::GenesisConfig::<Test> {
        auditor_map: vec![
            (4, auditor_data.clone()),
            (5, auditor_data.clone()),
            (6, auditor_data),
            (7, auditor_data_low_score),
        ],
    }
    .assimilate_storage(&mut t)
    .unwrap();
    t.into()
}
