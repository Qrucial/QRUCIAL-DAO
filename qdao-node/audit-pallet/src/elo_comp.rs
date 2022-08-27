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
    fn calculate_expected(&self, score_a: u32, score_b: u32) -> f32 {
        1.0 / (1.0 + (10f32.powf((score_b as f32 - score_a as f32) / 400.0)))
    }

    pub fn calculate(&self, winner: u32, looser: u32) -> (u32, u32) {
        let k = self.k as u32;

        let expected_a = self.calculate_expected(winner, looser);
        let expected_b = self.calculate_expected(looser, winner);

        let (score_w, score_l) = (1, 0);
        let winner_new_score = winner as f32 + k as f32 * (score_w as f32 - expected_a);
        let looser_new_score = looser as f32 + k as f32 * (score_l as f32 - expected_b);

        (winner_new_score.round() as u32, looser_new_score.round() as u32)
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
