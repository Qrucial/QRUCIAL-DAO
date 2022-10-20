use crate::mock::*;
use frame_support::assert_ok;
use sp_core::H256;

#[test]
fn dispatch_review_request() {
    new_test_ext().execute_with(|| {
        assert_ok!(Exosys::tool_exec_req(
            Origin::signed(1),
            Vec::new(),
            H256::zero(),
            1
        ));
    });
}
