use substrate_fixed::{transcendental::pow, types::I33F31};
pub struct EloRank {
    pub k: i32,
}

impl EloRank {
    fn calculate_expected(&self, score_a: u32, score_b: u32) -> I33F31 {
        let exp = (I33F31::from(score_b) - I33F31::from(score_a)) / I33F31::from(400);
        let pow_result: I33F31 = pow(I33F31::from(10), exp).unwrap();
        I33F31::from(1) / (I33F31::from(1) + pow_result)
    }

    pub fn calculate(&self, winner: u32, looser: u32) -> (u32, u32) {
        let k = self.k;

        let expected_a = self.calculate_expected(winner, looser);
        let expected_b = self.calculate_expected(looser, winner);

        let (score_w, score_l) = (1, 0);
        let winner_new_score =
            I33F31::from(winner) + I33F31::from(k) * (I33F31::from(score_w) - expected_a);
        let looser_new_score =
            I33F31::from(looser) + I33F31::from(k) * (I33F31::from(score_l) - expected_b);

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
