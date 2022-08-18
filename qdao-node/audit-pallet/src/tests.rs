use crate::{mock::*, Error, AuditorScore};
use frame_support::{assert_noop, assert_ok};
use frame_system::ensure_signed;

#[test]
fn sign_up_works() {
    new_test_ext().execute_with(|| {
        // Sign up a new auditor, should work
        assert_ok!(AuditRepModule::sign_up(Origin::signed(1)));
        // Check that new Auditor exists with score None
        let sender = ensure_signed(Origin::signed(1)).unwrap();
        assert_eq!(AuditorScore::<Test>::try_get(sender), Ok(None));
    });
}

#[test]
fn correct_error_for_double_sign_up() {
    new_test_ext().execute_with(|| {
        // Sign up Auditor, should work
        assert_ok!(AuditRepModule::sign_up(Origin::signed(1)));
        //Sign up second (different) auditor, should also work
        assert_ok!(AuditRepModule::sign_up(Origin::signed(2)));
       // Sign up an already signed up auditor, should throw error
        assert_noop!(
            AuditRepModule::sign_up(Origin::signed(1)),
            Error::<Test>::AlreadySignedUp
        );
    });
}
