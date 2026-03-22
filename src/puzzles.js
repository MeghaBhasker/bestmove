// src/puzzles.js
// Drop this file into your src/ folder and import fetchPuzzles in App.js

const THEME_MAP = {
  Blunders:    ["hangingPiece", "blunder", "capture", "trappedPiece"],
  Calculation: ["fork", "pin", "skewer", "discoveredAttack", "doubleCheck", "attraction", "deflection"],
  Strategy:    ["quietMove", "defensiveMove", "zugzwang", "advancedPawn", "outpost", "prophylaxis"],
  Endgames:    ["endgame", "rookEndgame", "pawnEndgame", "queenEndgame", "bishopEndgame", "knightEndgame"],
};

// Fallback puzzles used if API is unavailable (e.g. in artifact sandbox)
export const FALLBACK_PUZZLES = [
  { id:"f1", fen:"r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4", solution:["f3g5"], rating:1150, themes:["fork"], concept:"Fork Threat", appTheme:"Calculation", prompt:"Find the best move for White.", gameUrl:"" },
  { id:"f2", fen:"r2q1rk1/ppp2ppp/2np1n2/2b1p1B1/2B1P1b1/2NP1N2/PPP2PPP/R2Q1RK1 w - - 0 8", solution:["g5f6"], rating:1200, themes:["pin"], concept:"Pin", appTheme:"Calculation", prompt:"Find the best move for White.", gameUrl:"" },
  { id:"f3", fen:"8/5pk1/6p1/8/5PKP/8/8/8 w - - 0 1", solution:["f4g5"], rating:1100, themes:["endgame","pawnEndgame"], concept:"Pawn Endgame", appTheme:"Endgames", prompt:"Find the winning idea for White.", gameUrl:"" },
  { id:"f4", fen:"r1bq1rk1/pp2ppbp/2np1np1/8/3NP3/2N1BP2/PPP3PP/R2QKB1R w KQ - 0 9", solution:["d4d5"], rating:1300, themes:["quietMove"], concept:"Quiet Move", appTheme:"Strategy", prompt:"Find the prophylactic move for White.", gameUrl:"" },
  { id:"f5", fen:"2r3k1/5ppp/p3p3/1p6/3R4/1P3PP1/P4KPP/8 w - - 0 1", solution:["d4d6"], rating:1250, themes:["rookEndgame"], concept:"Rook Endgame", appTheme:"Endgames", prompt:"Find the most active rook move.", gameUrl:"" },
  { id:"f6", fen:"r2qk2r/pb1nbppp/1p2pn2/2pP4/2P5/2NBPN2/PP3PPP/R1BQK2R w KQkq - 0 10", solution:["e3e4"], rating:1350, themes:["advancedPawn"], concept:"Central Break", appTheme:"Calculation", prompt:"Find the best central break for White.", gameUrl:"" },
];

/**
 * Fetch puzzles from your local API endpoint.
 * Falls back to FALLBACK_PUZZLES if the API is unreachable.
 */
export async function fetchPuzzles({ rating = 1200, count = 6, struggles = [] } = {}) {
  // Build lichess theme params from user's struggle areas
  const lichessThemes = struggles.flatMap(s => THEME_MAP[s] || []);
  const themeParam = lichessThemes.length > 0 ? lichessThemes.join(",") : "";

  const params = new URLSearchParams({
    rating: String(rating),
    count:  String(count),
    ...(themeParam && { themes: themeParam }),
  });

  try {
    const res = await fetch(`/api/puzzles?${params}`);
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    if (!data.puzzles?.length) throw new Error("empty");
    return data.puzzles;
  } catch (e) {
    console.warn("Puzzle API unavailable, using fallback:", e.message);
    return FALLBACK_PUZZLES;
  }
}