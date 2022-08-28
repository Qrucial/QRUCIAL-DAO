use substrate_fixed::{FixedI64,transcendental::pow, types::I33F95};
use sp_runtime::traits::Saturating;
use sp_runtime::{FixedPointNumber};
pub struct EloRank {
    pub k: i32,
}

// Storage for auditors and their score
//      Auditor ID = pubkey
//      Score (multiple of them!)
// History of games?

// Storage for audits and requestors (NFT! this is a link)
//      Audit_Requestor --> List, NTDNFT owner, vuln approver?
//      Tags (Rust smart contract ink! AND EVM Solidity) --> can be extended

// Fixed values
//      elo_ratio
//      start_score
//      max_elo_score
//      min_elo_score

// Functions needed / extrinsics!
//      sign_up() --> anyone can sign up by paying X coins/fee/stake OR captcha
//      add_auditor() --> governance only!
//      remove_auditor() --> governance only! TEMPORARY FUNCTION, eg SUDO
//      approve_signup --> governance only!
//      extend_tag() --> governance only!
//      challange_vuln() --> any signed up auditor
//          - Uses the EloRank implementation
//          - Call storage and list it, time limit
//          - Who wins?
//      council_challenge_decide() --> governance only! BLACKBELTS

impl EloRank {
    fn calculate_expected(&self, score_a: u32, score_b: u32) -> I33F95 {
        let exp = (I33F95::from(score_b) - I33F95::from(score_a))
            / I33F95::from(400);
        let res:I33F95 = pow(I33F95::from(10), exp).unwrap();
        I33F95::from(1) / (I33F95::from(1)+res)
    }

    pub fn calculate(&self, winner: u32, looser: u32) -> (u32, u32) {
        let k = self.k as u32;

        let expected_a = self.calculate_expected(winner, looser);
        let expected_b = self.calculate_expected(looser, winner);

        let (score_w, score_l) = (1, 0);
        let winner_new_score = I33F95::from(winner as i16)
            + I33F95::from(k) * (I33F95::from(score_w as i16) - expected_a);
        let looser_new_score = I33F95::from(looser as i16)
            + I33F95::from(k as i16) * (I33F95::from(score_l as i16) - expected_b);

        (
            winner_new_score.round().to_num(),
            looser_new_score.round().to_num(),
        )
    }
}

#[cfg(test)]
mod tests {
    use crate::elo_comp::EloRank;

    #[test]
    fn calculates_correct_ratings() {
        let elo = EloRank { k: 32 };
        let (winner_new, looser_new) = elo.calculate(1200, 1400);
        assert_eq!(winner_new, 1224);
        assert_eq!(looser_new, 1376);

        let (winner_new, looser_new) = elo.calculate(1400, 1200);
        assert_eq!(winner_new, 1408);
        assert_eq!(looser_new, 1192);
    }

    #[test]
    fn rounds_ratings_properly() {
        let elo = EloRank { k: 32 };
        let (winner_new, looser_new) = elo.calculate(1802, 1186);
        assert_eq!(winner_new, 1803);
        assert_eq!(looser_new, 1185);
    }
}
