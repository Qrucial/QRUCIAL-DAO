//! # ELO rating
//! 
//! This module contains all of the standard methods that would be used to calculate elo.
//! The module provied the constants WIN, LOSE and DRAW.

// Taken from: https://urcra.github.io/skill-rating/doc/src/skill_rating/src/elo/mod.rs.html#1-102

pub mod systems;

/// The EloRating type is i32 since a rating can be negative.
pub type EloRating = i32;
/// The score for a won game
pub const WIN: f32 = 1_f32;
/// The score for a drawn game
pub const DRAW: f32 = 0.5;
/// The score for a lost game
pub const LOSS: f32 = 0_f32;

fn rating_change(k: u32, score: f32, exp_score: f32) -> EloRating {
    (k as f32 * (score - exp_score)) as i32
}

/// Calculates the expected outcome of a match between two players.
/// This will always be a number between 0 and 1.
/// The closer to 1 the more favored the match is for player a.
///
/// # Example
///
/// Chance of a person winning
///
/// ```
/// use skill_rating::elo;
/// 
/// let john = 1700;
/// let paul = 1800;
///
/// // Calculate johns chance to win against paul
/// let chance = elo::expected_score(john, paul) * 100_f32;
/// ```
pub fn expected_score(r_a: EloRating, r_b: EloRating) -> f32 {
    1_f32 / (1_f32 + 10_f32.powf(((r_b - r_a) as f32) / 400_f32))
}



/// Calculates the updated elo ratings of both players after a match.
/// The k_a and k_b are the K factors used to determine the updated rating,
/// If you just want a default behaviou set these to 32, or use game_icc() instead.
///
/// # Example
///
/// Updates the rankings of John and Paul, after Paul won over John.
///
/// ```
/// use skill_rating::elo;
/// 
/// let john = 1700;
/// let paul = 1800;
///
/// let (john, paul) = elo::game(paul, john, elo::WIN, 32, 32);
/// ```
pub fn game(r_a: EloRating, r_b: EloRating, s_a: f32, k_a: u32, k_b: u32) -> (EloRating, EloRating) {
    let s_b = 1_f32 - s_a;

    let e_a = expected_score(r_a, r_b);
    let e_b = 1_f32 - e_a;


    let new_a = r_a + rating_change(k_a, s_a, e_a);
    let new_b = r_b + rating_change(k_b, s_b, e_b);


    (new_a, new_b)
}


/// Calculates the updated elo of a player, after a series of games.
/// This might be used to calculate the rating of a player after a tournement.
///
/// # Example
///
/// Update the rating of John after competing in a chess tournement.
///
/// ```
/// use skill_rating::elo;
/// 
/// let john = 1700;
/// 
/// // An array containing the results of johns games in the tournement
/// let games = [(1600, elo::WIN), (1800, elo::DRAW), (2000, elo::LOSS)];
///
/// let john = elo::series(john, &games, 32);
/// ```
pub fn series(r_a: EloRating, games: &[(EloRating, f32)], k_factor: u32) -> EloRating {
    let mut score = 0_f32;
    let mut exp_score = 0_f32;

    for game in games {
        score += game.1;
        exp_score = expected_score(r_a, game.0);
    }

    r_a + rating_change(k_factor, score, exp_score)
}
