use crate::{mock::*, AuditorMap, Error, Winner};
use frame_support::{assert_noop, assert_ok};
use frame_system::ensure_signed;
use sp_core::H256;

#[test]
fn sign_up_works() {
    new_test_ext().execute_with(|| {
        // Given
        let sender = ensure_signed(Origin::signed(1)).expect("Signing failed");
        let hash = H256::repeat_byte(1);

        // When
        // Sign up a new auditor, read the auditor_data from Storage
        let sign_up_result = AuditRepModule::sign_up(Origin::signed(1), hash);
        let auditor_data = AuditorMap::<Test>::try_get(sender);

        // Then
        // Check that new Auditor exists with score None and correct Profile
        let auditor_data = auditor_data.as_ref().expect("Auditor data not available");
        assert_ok!(sign_up_result);
        assert_eq!(auditor_data.score, None);
        assert_eq!(auditor_data.profile_hash, hash);
    });
}

#[test]
fn sign_up_update_profile_works() {
    new_test_ext().execute_with(|| {
        // Given
        let sender = ensure_signed(Origin::signed(1)).expect("Sigining failed");
        let hash = H256::repeat_byte(1);
        let hash_for_update = H256::repeat_byte(2);

        // When
        // Sign up a new auditor, read the auditor_data from Storage
        let sign_up_result = AuditRepModule::sign_up(Origin::signed(1), hash);
        let auditor_data_before_update = AuditorMap::<Test>::try_get(&sender);
        let update_profile_result =
            AuditRepModule::update_profile(Origin::signed(1), hash_for_update);
        let auditor_data_after_update = AuditorMap::<Test>::try_get(sender);

        // Then
        // Check that the Auditor exists and the profile was updated accordingly
        assert_ok!(sign_up_result);
        assert_eq!(
            auditor_data_before_update
                .as_ref()
                .expect("Auditor data not available")
                .profile_hash,
            hash
        );
        assert_ok!(update_profile_result);
        assert_eq!(
            auditor_data_after_update
                .as_ref()
                .expect("Auditor data after update not available")
                .profile_hash,
            hash_for_update
        );
    });
}

#[test]
fn sign_up_fails_when_balance_too_low() {
    new_test_ext().execute_with(|| {
        // Given
        let auditor = Origin::signed(1);
        let hash = H256::repeat_byte(4);

        // When
        let result = AuditRepModule::sign_up(auditor, hash);

        // Then
        assert_noop!(result, Error::<Test>::InsufficientStake);
    });
}

#[test]
fn sign_up_error_for_double_sign_up() {
    new_test_ext().execute_with(|| {
        // Given
        let auditor1 = Origin::signed(1);
        let auditor2 = Origin::signed(2);

        // When
        // Sign up Auditor, should work
        let auditor1_sign_up_result =
            AuditRepModule::sign_up(auditor1.clone(), H256::repeat_byte(1));
        //Sign up second (different) auditor, should also work
        let auditor2_sign_up_result =
            AuditRepModule::sign_up(auditor2, H256::repeat_byte(1));
        // Sign up an already signed up auditor, should return an error
        let auditor_1_second_sign_up_result =
            AuditRepModule::sign_up(auditor1, H256::repeat_byte(1));

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
fn sign_up_cancellation_works() {
    new_test_ext().execute_with(|| {
        // Given
        let sender = ensure_signed(Origin::signed(1)).expect("Signing failed");
        let hash = H256::repeat_byte(1);

        // When
        // Sign up a new auditor, read the auditor_data from Storage
        let sign_up_result = AuditRepModule::sign_up(Origin::signed(1), hash);
        let auditor_data_before_cancellation = AuditorMap::<Test>::try_get(&sender);
        let cancellation_result = AuditRepModule::cancel_account(Origin::signed(1));
        let auditor_data_after_cancellation = AuditorMap::<Test>::try_get(sender);
        let cancellation_of_cancelled_account = AuditRepModule::cancel_account(Origin::signed(1));

        // Then
        // Check that new Auditor exists after creation and is successfully cancelled
        let auditor_data = auditor_data_before_cancellation
            .as_ref()
            .expect("Auditor data not available");
        assert_ok!(sign_up_result);
        assert_eq!(auditor_data.score, None);
        assert_eq!(auditor_data.profile_hash, hash);
        assert_ok!(cancellation_result);
        assert_noop!(auditor_data_after_cancellation, ());
        assert_noop!(
            cancellation_of_cancelled_account,
            Error::<Test>::UnknownAuditor
        );
    });
}

#[test]
fn approval_of_auditor_works() {
    new_test_ext().execute_with(|| {
        // Given
        let approvee = Origin::signed(1);
        let approvee_id = ensure_signed(approvee.clone()).expect("Sigining failed");
        let hash = H256::repeat_byte(1);
        let approver = Origin::signed(4);
        let approver_id = ensure_signed(approver.clone()).expect("Sigining failed");

        // When
        // Sign up a new auditor, read the auditor_data from Storage
        let sign_up_result = AuditRepModule::sign_up(approvee, hash);
        let approval_result = AuditRepModule::approve_auditor(approver.clone(), approvee_id);
        let double_approval_result = AuditRepModule::approve_auditor(approver.clone(), approvee_id);
        let auditor_data = AuditorMap::<Test>::try_get(approvee_id);

        // Then
        // Check that new Auditor exists with score None and correct Profile
        assert_ok!(sign_up_result);
        assert_ok!(approval_result);
        let auditor_data = auditor_data.as_ref().expect("Auditor data not available");
        assert_eq!(auditor_data.score, None);
        assert_eq!(auditor_data.profile_hash, hash);
        assert_eq!(auditor_data.approved_by.contains(&approver_id), true);
        assert_eq!(auditor_data.approved_by.len(), 1);
        assert_noop!(double_approval_result, Error::<Test>::AlreadyApproved);
    });
}

#[test]
fn approval_with_low_reputation_fails() {
    new_test_ext().execute_with(|| {
        // Given
        let approvee = Origin::signed(1);
        let approvee_id = ensure_signed(approvee.clone()).expect("Signing failed");
        let hash = H256::repeat_byte(1);
        let approver_low_rep = Origin::signed(7);

        // When
        // Sign up a new auditor, read the auditor_data from Storage
        let sign_up_result = AuditRepModule::sign_up(approvee, hash);
        let approval_result =
            AuditRepModule::approve_auditor(approver_low_rep.clone(), approvee_id);
        let auditor_data = AuditorMap::<Test>::try_get(approvee_id);

        // Then
        // Check that new Auditor exists with score None and correct Profile
        assert_ok!(sign_up_result);
        assert_noop!(approval_result, Error::<Test>::ReputationTooLow);
        let auditor_data = auditor_data.as_ref().expect("Auditor data not available");
        assert_eq!(auditor_data.score, None);
        assert_eq!(auditor_data.profile_hash, hash);
        assert_eq!(auditor_data.approved_by.is_empty(), true);
    });
}

#[test]
fn approval_works() {
    new_test_ext().execute_with(|| {
        // Given
        let approvee = Origin::signed(1);
        let approvee_id = ensure_signed(approvee.clone()).expect("Signing failed");
        let hash = H256::repeat_byte(1);
        let approver1 = Origin::signed(4);
        let approver2 = Origin::signed(5);
        let approver3 = Origin::signed(6);

        // When
        // Sign up a new auditor, read the auditor_data from Storage
        let sign_up_result = AuditRepModule::sign_up(approvee, hash);
        let approval1_result = AuditRepModule::approve_auditor(approver1, approvee_id);
        let approval2_result = AuditRepModule::approve_auditor(approver2, approvee_id);
        let approval3_result = AuditRepModule::approve_auditor(approver3, approvee_id);
        let auditor_data = AuditorMap::<Test>::try_get(approvee_id);

        // Then
        // Check that new Auditor exists with score None and correct Profile
        assert_ok!(sign_up_result);
        assert_ok!(approval1_result);
        assert_ok!(approval2_result);
        assert_ok!(approval3_result);
        let auditor_data = auditor_data.as_ref().expect("Auditor data not available");
        // User should have received 3 approvals
        assert_eq!(auditor_data.approved_by.len(), 3);
        // User should now have the auditor status
        assert_eq!(auditor_data.score, Some(1000));
    });
}

#[test]
fn elo_score_update_works() {
    new_test_ext().execute_with(|| {
        // Given
        let player0 = Origin::signed(4);
        let player0_id = ensure_signed(player0.clone()).expect("Signing failed");
        let player1 = Origin::signed(5);
        let player1_id = ensure_signed(player1.clone()).expect("Signing failed");

        // When
        // Submit a game result, initially both players have score 2000, Player0 wins
        let game_result =
            AuditRepModule::game_result(Origin::root(), player0_id, player1_id, Winner::Player0);
        let player0_data = AuditorMap::<Test>::try_get(player0_id);
        let player1_data = AuditorMap::<Test>::try_get(player1_id);

        // Then
        // Check that Score of Player0 is now higher then Score of Player1 and check for exact scores
        let player0_data = player0_data.expect("Data for player0 not available");
        let player1_data = player1_data.expect("Data for player1 not available");
        assert_ok!(game_result);
        let (player0_score, player1_score) = (
            player0_data.score.expect("player0 not approved"),
            player1_data.score.expect("player1 not approved"),
        );
        assert!(player0_score > player1_score);
        assert_eq!(player0_score, 2016);
        assert_eq!(player1_score, 1984);
    })
}
