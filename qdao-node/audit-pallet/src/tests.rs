use crate::{mock::*, AuditorMap, Error};
use frame_support::{assert_noop, assert_ok};
use frame_system::ensure_signed;
use sp_core::H256;

#[test]
fn sign_up_works() {
    new_test_ext().execute_with(|| {
        // Given
        let sender = ensure_signed(Origin::signed(1)).unwrap();
        let hash = H256::repeat_byte(1);
        let stake = 100;

        // When
        // Sign up a new auditor, read the auditor_data from Storage
        let sign_up_result = AuditRepModule::sign_up(Origin::signed(1), hash, stake);
        let auditor_data = AuditorMap::<Test>::try_get(sender);

        // Then
        // Check that new Auditor exists with score None and correct Profile
        assert_ok!(sign_up_result);
        assert_eq!(auditor_data.as_ref().unwrap().score, None);
        assert_eq!(auditor_data.as_ref().unwrap().profile_hash, hash);
    });
}

#[test]
fn sign_up_fails_when_stake_too_low() {
    new_test_ext().execute_with(|| {
        // Given
        let auditor = Origin::signed(1);
        let hash = H256::repeat_byte(1);
        let stake = 50;

        // When
        let result = AuditRepModule::sign_up(auditor, hash, stake);

        // Then
        assert_noop!(result, Error::<Test>::InsufficientStake);
    });
}

#[test]
fn correct_error_for_double_sign_up() {
    new_test_ext().execute_with(|| {
        // Given
        let auditor1 = Origin::signed(1);
        let auditor2 = Origin::signed(2);
        let stake = 100;

        // When
        // Sign up Auditor, should work
        let auditor1_sign_up_result =
            AuditRepModule::sign_up(auditor1.clone(), H256::repeat_byte(1), stake);
        //Sign up second (different) auditor, should also work
        let auditor2_sign_up_result =
            AuditRepModule::sign_up(auditor2, H256::repeat_byte(1), stake);
        // Sign up an already signed up auditor, should return an error
        let auditor_1_second_sign_up_result =
            AuditRepModule::sign_up(auditor1, H256::repeat_byte(1), stake);

        // Then
        assert_ok!(auditor1_sign_up_result);
        assert_ok!(auditor2_sign_up_result);
        assert_noop!(
            auditor_1_second_sign_up_result,
            Error::<Test>::AlreadySignedUp
        );
    });
}

#[test]
fn approval_works() {
    new_test_ext().execute_with(|| {
        // Given
        let approvee = ensure_signed(Origin::signed(1)).unwrap();
        let hash = H256::repeat_byte(1);
        let stake = 100;
        let _approver = ensure_signed(Origin::signed(4)).unwrap();

        // When
        // Sign up a new auditor, read the auditor_data from Storage
        let sign_up_result = AuditRepModule::sign_up(Origin::signed(1), hash, stake);
        let approval_result = AuditRepModule::approve_auditor(Origin::signed(4), approvee);
        let auditor_data = AuditorMap::<Test>::try_get(approvee);

        // Then
        // Check that new Auditor exists with score None and correct Profile
        assert_ok!(sign_up_result);
        assert_ok!(approval_result);
        assert_eq!(auditor_data.as_ref().unwrap().score, None);
        assert_eq!(auditor_data.as_ref().unwrap().profile_hash, hash);
    });
}
