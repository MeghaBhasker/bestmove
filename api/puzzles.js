// api/puzzles.js  — Vercel serverless function
// Place this file at: bestmove/api/puzzles.js

import fs from "fs";
import path from "path";
import { createInterface } from "readline";

// Lichess CSV columns:
// PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const rating  = parseInt(req.query.rating  || "1200");
  const count   = parseInt(req.query.count   || "6");
  const themes  = (req.query.themes || "").split(",").filter(Boolean);

  const ratingMin = Math.max(400,  rating - 200);
  const ratingMax = Math.min(3000, rating + 200);

  const csvPath = path.join(process.cwd(), "data", "lichess_db_puzzle.csv");

  if (!fs.existsSync(csvPath)) {
    return res.status(500).json({ error: "Puzzle database not found. See README." });
  }

  const results = [];
  const rl = createInterface({
    input: fs.createReadStream(csvPath),
    crlfDelay: Infinity,
  });

  let isHeader = true;
  let sampled  = 0;
  // reservoir sampling so we don't always return puzzles from the top of the file
  const SCAN_LIMIT = 50000;

  for await (const line of rl) {
    if (isHeader) { isHeader = false; continue; }
    if (sampled >= SCAN_LIMIT) break;
    sampled++;

    const cols   = line.split(",");
    const id     = cols[0];
    const fen    = cols[1];
    const moves  = cols[2];          // space-separated UCI moves
    const puzzleRating = parseInt(cols[3]);
    const puzzleThemes = (cols[7] || "").split(" ");
    const gameUrl = cols[8] || "";

    if (isNaN(puzzleRating)) continue;
    if (puzzleRating < ratingMin || puzzleRating > ratingMax) continue;

    // Theme filter — if user specified themes, at least one must match
    if (themes.length > 0) {
      const hasTheme = themes.some(t => puzzleThemes.includes(t));
      if (!hasTheme) continue;
    }

    results.push({
      id,
      fen,
      solution: moves.split(" "),     // array of UCI moves e.g. ["e2e4","e7e5"]
      rating: puzzleRating,
      themes: puzzleThemes,
      gameUrl,
      concept: formatTheme(puzzleThemes[0]),
      appTheme: mapToAppTheme(puzzleThemes),
      prompt: getSidePrompt(fen),
    });
  }

  rl.close();

  // Shuffle and return `count` puzzles
  const shuffled = results.sort(() => Math.random() - 0.5).slice(0, count);

  if (shuffled.length === 0) {
    return res.status(404).json({ error: "No puzzles found for this rating range." });
  }

  res.status(200).json({ puzzles: shuffled });
}

function getSidePrompt(fen) {
  return fen.split(" ")[1] === "w"
    ? "Find the best move for White."
    : "Find the best move for Black.";
}

function formatTheme(theme = "") {
  return theme.replace(/([A-Z])/g, " $1").trim() || "Tactics";
}

function mapToAppTheme(themes = []) {
  if (themes.some(t => ["endgame","rookEndgame","pawnEndgame","queenEndgame","bishopEndgame","knightEndgame"].includes(t))) return "Endgames";
  if (themes.some(t => ["fork","pin","skewer","discoveredAttack","doubleCheck","attraction","deflection","interference"].includes(t))) return "Calculation";
  if (themes.some(t => ["hangingPiece","blunder","capture","trappedPiece"].includes(t))) return "Blunders";
  return "Strategy";
}