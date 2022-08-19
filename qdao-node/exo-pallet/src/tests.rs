use crate::{mock::*, Error};
use frame_support::{assert_noop, assert_ok};
use sp_core::H256;

#[test]
fn dispatch_review_request() {
    new_test_ext().execute_with(|| {
        assert_ok!(Exosys::tool_exec_req(Origin::signed(1), Vec::new(), H256::zero(), 1));
    });
}

/*
#[test]
fn it_works_for_default_value() {
    new_test_ext().execute_with(|| {
        // Dispatch a signed extrinsic.
        assert_ok!(TemplateModule::do_something(Origin::signed(1), 42));
        // Read pallet storage and assert an expected result.
        assert_eq!(TemplateModule::something(), Some(42));
    });
}

#[test]
fn correct_error_for_none_value() {
    new_test_ext().execute_with(|| {
        // Ensure the expected error is thrown when no value is present.
        assert_noop!(
            TemplateModule::cause_error(Origin::signed(1)),
            Error::<Test>::NoneValue
        );
    });
}
*/
