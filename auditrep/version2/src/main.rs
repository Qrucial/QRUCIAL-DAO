pub struct EloRank {
    pub k: i32,
}

impl EloRank {
    fn calculate_expected(&self, score_a: f64, score_b: f64) -> f64 {
        1.0 / (1.0 + (10f64.powf((score_b - score_a) / 400.0)))
    }

    pub fn calculate(&self, winner: f64, looser: f64) -> (f64, f64) {
        let k = self.k as f64;

        let expected_a = self.calculate_expected(winner, looser);
        let expected_b = self.calculate_expected(looser, winner);

        let (score_w, score_l) = (1.0, 0.0);
        let winner_new_score = winner + k * (score_w - expected_a);
        let looser_new_score = looser + k * (score_l - expected_b);

        (winner_new_score, looser_new_score)
    }
}

#[cfg(test)]
mod tests {
    use crate::EloRank;

    #[test]
    fn calculates_correct_ratings() {
        let elo = EloRank { k: 32 };
        let (winner_new, looser_new) = elo.calculate(1200.0, 1400.0);
        assert_eq!(winner_new, 1224.3119016527346);
        assert_eq!(looser_new, 1375.6880983472654);

        let (winner_new, looser_new) = elo.calculate(1400.0, 1200.0);
        assert_eq!(winner_new, 1407.6880983472654);
        assert_eq!(looser_new, 1192.3119016527346);
    }

    #[test]
    fn rounds_ratings_properly() {
        let elo = EloRank { k: 32 };
        let (winner_new, looser_new) = elo.calculate(1802.0, 1186.0);
        assert_eq!(winner_new, 1802.8970197488543);
        assert_eq!(looser_new, 1185.1029802511457);
    }
}

//extern crate elo;

//use elo::EloRank;

fn main() {
    let elo1 = EloRank { k: 32 };
    let winner = 1200.0;
    let looser = 1400.0;

    let (winner_new_score, looser_new_score) = elo1.calculate(winner, looser);
    println!("{}", winner_new_score);
    println!("{}", looser_new_score)
}

