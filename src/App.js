import { useState, useCallback, useEffect, useRef } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const THEMES = ["Blunders", "Strategy", "Endgames", "Calculation"];
const SCREEN = {
  HOME:"home", OB1:"ob1", OB2:"ob2", DASH:"dash",
  SESSION:"session", SUMMARY:"summary", REVIEW:"review",
  NOTATION:"notation", OPENING:"opening",
};
const LIGHT_SQ="#EEEED2", DARK_SQ="#769656";
const SEL_L="#F6F669", SEL_D="#BACA2B";
const HINT="rgba(0,0,0,0.18)";
const FILES=["a","b","c","d","e","f","g","h"];
const RANKS=["8","7","6","5","4","3","2","1"];
const PIECE_ICONS={P:"♙",N:"♘",B:"♗",R:"♖",Q:"♕",K:"♔",p:"♟",n:"♞",b:"♝",r:"♜",q:"♛",k:"♚"};

// ─── Fallback puzzles ─────────────────────────────────────────────────────────
const FALLBACK=[
  {id:"f1",fen:"r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",solution:["f3g5"],rating:1150,themes:["fork"],concept:"Fork Threat",appTheme:"Calculation"},
  {id:"f2",fen:"r2q1rk1/ppp2ppp/2np1n2/2b1p1B1/2B1P1b1/2NP1N2/PPP2PPP/R2Q1RK1 w - - 0 8",solution:["g5f6"],rating:1200,themes:["pin"],concept:"Pin",appTheme:"Calculation"},
  {id:"f3",fen:"8/5pk1/6p1/8/5PKP/8/8/8 w - - 0 1",solution:["f4g5"],rating:1100,themes:["endgame"],concept:"Pawn Endgame",appTheme:"Endgames"},
  {id:"f4",fen:"r1bq1rk1/pp2ppbp/2np1np1/8/3NP3/2N1BP2/PPP3PP/R2QKB1R w KQ - 0 9",solution:["d4d5"],rating:1300,themes:["quietMove"],concept:"Quiet Move",appTheme:"Strategy"},
  {id:"f5",fen:"2r3k1/5ppp/p3p3/1p6/3R4/1P3PP1/P4KPP/8 w - - 0 1",solution:["d4d6"],rating:1250,themes:["rookEndgame"],concept:"Rook Endgame",appTheme:"Endgames"},
  {id:"f6",fen:"r2qk2r/pb1nbppp/1p2pn2/2pP4/2P5/2NBPN2/PP3PPP/R1BQK2R w KQkq - 0 10",solution:["e3e4"],rating:1350,themes:["advancedPawn"],concept:"Central Break",appTheme:"Calculation"},
];

// ─── Opening database ─────────────────────────────────────────────────────────
const OPENINGS=[
  {id:"italian",name:"Italian Game",eco:"C50",color:"#f59e0b",icon:"🇮🇹",description:"One of the oldest openings. White aims for rapid development and control of the center.",
    lines:[
      {name:"Italian Main Line",moves:["e2e4","e7e5","g1f3","b8c6","f1c4","f8c5"],sans:["e4","e5","Nf3","Nc6","Bc4","Bc5"],theory:"The Italian Game begins with 1.e4 e5 2.Nf3 Nc6 3.Bc4. White targets the f7 pawn and prepares rapid development. Black responds 3...Bc5, the Giuoco Piano."},
      {name:"Two Knights Defense",moves:["e2e4","e7e5","g1f3","b8c6","f1c4","g8f6"],sans:["e4","e5","Nf3","Nc6","Bc4","Nf6"],theory:"Black counterattacks with 3...Nf6, immediately pressuring e4. This leads to sharp, tactical play popular at all levels."},
    ]},
  {id:"sicilian",name:"Sicilian Defense",eco:"B20",color:"#6C63FF",icon:"♞",description:"The most popular response to 1.e4. Black fights for the center asymmetrically.",
    lines:[
      {name:"Sicilian Najdorf",moves:["e2e4","c7c5","g1f3","d7d6","d2d4","c5d4","f3d4","g8f6","b1c3","a7a6"],sans:["e4","c5","Nf3","d6","d4","cxd4","Nxd4","Nf6","Nc3","a6"],theory:"The Najdorf (6...a6) was Fischer's and Kasparov's favorite. Black prepares ...e5 or ...b5 to fight for counterplay. One of the most analyzed openings in chess."},
      {name:"Sicilian Dragon",moves:["e2e4","c7c5","g1f3","d7d6","d2d4","c5d4","f3d4","g8f6","b1c3","g7g6"],sans:["e4","c5","Nf3","d6","d4","cxd4","Nxd4","Nf6","Nc3","g6"],theory:"The Dragon features Black's fianchettoed bishop on g7. Black gets active counterplay on the queenside and the long diagonal."},
    ]},
  {id:"london",name:"London System",eco:"D02",color:"#4ade80",icon:"🏙️",description:"A solid, flexible system for White. Easy to learn, hard to beat.",
    lines:[
      {name:"London Main Line",moves:["d2d4","d7d5","g1f3","g8f6","c1f4","e7e6","e2e3","f8e7","f1d3","e8g8"],sans:["d4","d5","Nf3","Nf6","Bf4","e6","e3","Be7","Bd3","O-O"],theory:"The London System (d4, Nf3, Bf4) is a universal setup. White develops solidly, avoids heavy theory, and builds a strong structure. Ideal for club players."},
      {name:"London vs King's Indian",moves:["d2d4","g8f6","g1f3","g7g6","c1f4","f8g7","e2e3","d7d6","h2h3"],sans:["d4","Nf6","Nf3","g6","Bf4","Bg7","e3","d6","h3"],theory:"Against the King's Indian setup, White plays h3 to prevent Ng4 and maintain the light-squared bishop, keeping a solid position."},
    ]},
  {id:"qgd",name:"Queen's Gambit",eco:"D30",color:"#f87171",icon:"♛",description:"White offers a pawn to gain central control. One of the oldest and most respected openings.",
    lines:[
      {name:"Queen's Gambit Declined",moves:["d2d4","d7d5","c2c4","e7e6","b1c3","g8f6","c1g5","f8e7","e2e3","e8g8"],sans:["d4","d5","c4","e6","Nc3","Nf6","Bg5","Be7","e3","O-O"],theory:"The QGD (2...e6) is the most classical response. Black declines the gambit and builds a solid position requiring deep understanding of pawn structures."},
      {name:"Queen's Gambit Accepted",moves:["d2d4","d7d5","c2c4","d5c4","g1f3","g8f6","e2e3","e7e6","f1c4"],sans:["d4","d5","c4","dxc4","Nf3","Nf6","e3","e6","Bxc4"],theory:"In the QGA, Black accepts the pawn but must return it. White gets rapid development and a strong center. Black aims for counterplay with ...c5."},
    ]},
];

// ─── Notation drill positions ─────────────────────────────────────────────────
const DRILL_POSITIONS=[
  {fen:"rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",move:{from:"e2",to:"e4"},san:"e4"},
  {fen:"rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2",move:{from:"e7",to:"e5"},san:"e5"},
  {fen:"rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2",move:{from:"g1",to:"f3"},san:"Nf3"},
  {fen:"r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",move:{from:"b8",to:"c6"},san:"Nc6"},
  {fen:"r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3",move:{from:"f1",to:"c4"},san:"Bc4"},
  {fen:"r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",move:{from:"f8",to:"c5"},san:"Bc5"},
  {fen:"rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",move:{from:"g8",to:"f6"},san:"Nf6"},
  {fen:"rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2",move:{from:"d7",to:"d5"},san:"d5"},
];

// ─── Board & FEN helpers ──────────────────────────────────────────────────────
const getSide=fen=>fen.split(" ")[1]||"w";

function parseFen(fen){
  const b={};
  fen.split(" ")[0].split("/").forEach((row,ri)=>{
    let ci=0;
    for(const ch of row){if(isNaN(ch)){b[FILES[ci]+(8-ri)]=ch;ci++;}else ci+=parseInt(ch);}
  });
  return b;
}

function applyMove(b,from,to){const n={...b};n[to]=n[from];delete n[from];return n;}

function getLegalMoves(board,sq){
  const piece=board[sq];if(!piece)return[];
  const type=piece.toUpperCase(),isW=piece===piece.toUpperCase();
  const fi=FILES.indexOf(sq[0]),ri=parseInt(sq[1]);
  const moves=[];
  const add=(f,r)=>{if(f<0||f>7||r<1||r>8)return false;const t=FILES[f]+r,occ=board[t];if(occ){if((occ===occ.toUpperCase())!==isW)moves.push(t);return false;}moves.push(t);return true;};
  const slide=(df,dr)=>{let f=fi+df,r=ri+dr;while(add(f,r)){f+=df;r+=dr;}};
  if(type==="P"){const dir=isW?1:-1,start=isW?2:7;const fwd=FILES[fi]+(ri+dir);if(!board[fwd]){moves.push(fwd);const f2=FILES[fi]+(ri+2*dir);if(ri===start&&!board[f2])moves.push(f2);}[-1,1].forEach(df=>{const cf=fi+df,cr=ri+dir;if(cf>=0&&cf<=7&&cr>=1&&cr<=8){const cs=FILES[cf]+cr;const c=board[cs];if(c&&(c===c.toUpperCase())!==isW)moves.push(cs);}});}
  else if(type==="N"){[[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]].forEach(([df,dr])=>add(fi+df,ri+dr));}
  else if(type==="B"){[[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([df,dr])=>slide(df,dr));}
  else if(type==="R"){[[1,0],[-1,0],[0,1],[0,-1]].forEach(([df,dr])=>slide(df,dr));}
  else if(type==="Q"){[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([df,dr])=>slide(df,dr));}
  else if(type==="K"){[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([df,dr])=>add(fi+df,ri+dr));}
  return moves;
}

function mapTheme(t=[]){
  if(t.some(x=>["endgame","rookEndgame","pawnEndgame","queenEndgame","bishopEndgame","knightEndgame"].includes(x)))return"Endgames";
  if(t.some(x=>["fork","pin","skewer","discoveredAttack","doubleCheck","attraction","deflection"].includes(x)))return"Calculation";
  if(t.some(x=>["hangingPiece","blunder","capture","trappedPiece"].includes(x)))return"Blunders";
  return"Strategy";
}

// ─── API calls ────────────────────────────────────────────────────────────────
async function fetchPuzzles(rating=1200){
  try{
    const calls=Array.from({length:6},()=>fetch("https://lichess.org/api/puzzle/next",{headers:{Accept:"application/json"}}).then(r=>r.json()));
    const res=await Promise.all(calls);
    const out=res.filter(d=>d?.puzzle).map(d=>{
      const p=d.puzzle;
      const setupMove=p.solution[0],solution=p.solution.slice(1);
      const userSide=getSide(p.fen)==="w"?"b":"w";
      return{id:p.id,fen:p.fen,setupMove,solution,rating:p.rating,themes:p.themes||[],concept:(p.themes?.[0]||"tactics").replace(/([A-Z])/g," $1").trim(),appTheme:mapTheme(p.themes||[]),userSide,prompt:userSide==="w"?"Find the best move for White.":"Find the best move for Black."};
    });
    return out.length>0?out:FALLBACK.map(p=>({...p,setupMove:null,solution:p.solution,userSide:getSide(p.fen)}));
  }catch{return FALLBACK.map(p=>({...p,setupMove:null,solution:p.solution,userSide:getSide(p.fen)}));}
}

async function getAnalysis(fen,bestMove){
  try{
    const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:500,messages:[{role:"user",content:`Chess FEN: ${fen}\nBest move: ${bestMove}\n\nExplain in 2 sentences why ${bestMove} is the best move and what concept it shows.\nAlso give a 4-move continuation from ${bestMove}.\nRespond ONLY as raw JSON:\n{"explanation":"...","continuation":["uci1","uci2","uci3","uci4"],"continuationSan":["san1","san2","san3","san4"]}`}]})});
    const d=await res.json();
    return JSON.parse((d.content?.[0]?.text||"{}").replace(/```json|```/g,"").trim());
  }catch{return{explanation:"",continuation:[],continuationSan:[]};}
}

// ─── CBurnett SVG pieces ──────────────────────────────────────────────────────
const PSVG={
  K:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22.5 11.63V6M20 8h5" stroke-linejoin="miter"/><path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill="#fff" stroke-linecap="butt" stroke-linejoin="miter"/><path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V17s-5.5-9.5-13-5c-4 2.5-4 9.5 0 12l3 5.5v7.5z" fill="#fff"/><path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0"/></g></svg>`,
  Q:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="#fff" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM24.5 7.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM41 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM16 8.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM33 8.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/><path d="M9 26c8.5-8.5 15.5-9 24 0l2.5-12.5L31 25l-.3-14.1-5.2 13.6-3-14.5-3 14.5-5.2-13.6L14 25 9.5 13.5z" stroke-linecap="butt"/><path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"/><path d="M11.5 30c3.5-1 18.5-1 22 0M12 33.5c4-1.5 17-1.5 21 0" fill="none"/></g></svg>`,
  R:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="#fff" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" stroke-linecap="butt"/><path d="M34 14l-3 3H14l-3-3"/><path d="M31 17v12.5H14V17" stroke-linecap="butt" stroke-linejoin="miter"/><path d="M31 29.5l1.5 2.5h-20l1.5-2.5"/><path d="M11 14h23" fill="none" stroke-linejoin="miter"/></g></svg>`,
  B:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><g fill="#fff" stroke-linecap="butt"><path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z"/><path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/><path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/></g><path d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5" stroke-linejoin="miter"/></g></svg>`,
  N:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill="#fff"/><path d="M24 18c.38 5.12-4.55 9.29-6.97 10.93-.98.65-1.3 1.9-.6 3.28" fill="#fff"/><path d="M9.5 25.5a.5.5 0 1 0 1 0 .5.5 0 1 0-1 0z" fill="#000" stroke="#000"/><path d="M14.933 15.75a5.26 5.26 0 0 1-1.298 2.114c-.839.81-1.993 1.308-2.883 1.308-.4 0-.755-.084-1.043-.268-.464-.295-.738-.828-.738-1.487 0-.3.058-.618.175-.944.23-.635.72-1.323 1.444-1.97.31-.278.642-.526.984-.742a7.6 7.6 0 0 1 1.048-.542 5.714 5.714 0 0 1 2.038-.432c.15 0 .302.007.452.022l.37.04" fill="#fff" stroke-linecap="butt"/><path d="M9 39h27v-3H9v3z" fill="#fff"/></g></svg>`,
  P:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03C15.41 27.09 11 31.58 11 39.5H34c0-7.92-4.41-12.41-7.41-13.47C28.06 24.84 29 23.03 29 21c0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#fff" stroke="#000" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  k:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22.5 11.63V6M20 8h5" stroke-linejoin="miter"/><path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill="#000" stroke-linecap="butt" stroke-linejoin="miter"/><path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V17s-5.5-9.5-13-5c-4 2.5-4 9.5 0 12l3 5.5v7.5z" fill="#000"/><path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0" stroke="#fff"/></g></svg>`,
  q:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><g stroke="none"><circle cx="6" cy="12" r="2.75" fill="#000"/><circle cx="14" cy="9" r="2.75" fill="#000"/><circle cx="22.5" cy="8" r="2.75" fill="#000"/><circle cx="31" cy="9" r="2.75" fill="#000"/><circle cx="39" cy="12" r="2.75" fill="#000"/></g><path d="M9 26c8.5-8.5 15.5-9 24 0l2.5-12.5L31 25l-.3-14.1-5.2 13.6-3-14.5-3 14.5-5.2-13.6L14 25 9.5 13.5z" stroke-linecap="butt" fill="#000"/><path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" fill="#000"/><path d="M11.5 30c3.5-1 18.5-1 22 0M12 33.5c4-1.5 17-1.5 21 0" fill="none" stroke="#fff"/></g></svg>`,
  r:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 39h27v-3H9v3zM12.5 32l1.5-2.5h17l1.5 2.5h-20zM12 36v-4h21v4H12z" stroke-linecap="butt" fill="#000"/><path d="M14 29.5v-13h17v13H14z" stroke-linecap="butt" stroke-linejoin="miter" fill="#000"/><path d="M14 16.5L11 14h23l-3 2.5H14zM11 14V9h4v2h5V9h5v2h5V9h4v5H11z" stroke-linecap="butt" fill="#000"/><path d="M12 35.5h21M13 31.5h19M14 29.5h17M14 16.5h17M11 14h23" fill="none" stroke="#fff" stroke-width="1" stroke-linejoin="miter"/></g></svg>`,
  b:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><g fill="#000" stroke-linecap="butt"><path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z"/><path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/><path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/></g><path d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5" stroke="#fff" stroke-linejoin="miter"/></g></svg>`,
  n:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill="#000"/><path d="M24 18c.38 5.12-4.55 9.29-6.97 10.93-.98.65-1.3 1.9-.6 3.28" fill="#000"/><path d="M9.5 25.5a.5.5 0 1 0 1 0 .5.5 0 1 0-1 0z" fill="#fff" stroke="#fff"/><path d="M14.933 15.75a5.26 5.26 0 0 1-1.298 2.114c-.839.81-1.993 1.308-2.883 1.308-.4 0-.755-.084-1.043-.268-.464-.295-.738-.828-.738-1.487 0-.3.058-.618.175-.944.23-.635.72-1.323 1.444-1.97.31-.278.642-.526.984-.742a7.6 7.6 0 0 1 1.048-.542 5.714 5.714 0 0 1 2.038-.432c.15 0 .302.007.452.022l.37.04" fill="#fff" stroke-linecap="butt"/><path d="M9 39h27v-3H9v3z" fill="#000"/></g></svg>`,
  p:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03C15.41 27.09 11 31.58 11 39.5H34c0-7.92-4.41-12.41-7.41-13.47C28.06 24.84 29 23.03 29 21c0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#000" stroke="#000" stroke-width="1.5" stroke-linecap="round"/></svg>`,
};
const Piece=({p})=>{const s=PSVG[p];if(!s)return null;return <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`} alt={p} width="52" height="52" style={{display:"block",pointerEvents:"none",userSelect:"none"}}/>;};

// ─── Shared board component ───────────────────────────────────────────────────
function Board({board,onMove,disabled,lastMove,flashSq,flashType,userSide="w",size=58,showCoords=true}){
  const[sel,setSel]=useState(null);
  const[dots,setDots]=useState([]);
  useEffect(()=>{setSel(null);setDots([]);},[board,disabled]);
  const mine=useCallback((piece)=>{if(!piece)return false;return userSide==="w"?piece===piece.toUpperCase():piece===piece.toLowerCase();},[userSide]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleClick=useCallback((sq)=>{
    if(disabled)return;
    const piece=board[sq];
    if(!sel){if(mine(piece)){setSel(sq);setDots(getLegalMoves(board,sq));}return;}
    if(sq===sel){setSel(null);setDots([]);return;}
    if(mine(piece)){setSel(sq);setDots(getLegalMoves(board,sq));return;}
    if(dots.includes(sq)){setSel(null);setDots([]);onMove&&onMove(sel+sq);}
    else{setSel(null);setDots([]);}
  },[disabled,sel,board,onMove,mine,dots]);
  return(
    <div style={{display:"inline-block",borderRadius:4,overflow:"hidden",boxShadow:"0 4px 24px rgba(0,0,0,0.6)",border:"2px solid #111"}}>
      <style>{`@keyframes fG{0%,100%{filter:brightness(1)}50%{filter:brightness(1.8)sepia(1)hue-rotate(80deg)}}@keyframes fR{0%,100%{filter:brightness(1)}50%{filter:brightness(1.8)sepia(1)hue-rotate(-20deg)}}@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}`}</style>
      {RANKS.map((rank,ri)=>(
        <div key={rank} style={{display:"flex"}}>
          {FILES.map((file,ci)=>{
            const sq=file+rank,isLight=(ri+ci)%2===0,piece=board[sq];
            const isSel=sel===sq,isLMF=lastMove?.from===sq,isLMT=lastMove?.to===sq,isDot=dots.includes(sq),isF=flashSq===sq;
            let bg=isLight?LIGHT_SQ:DARK_SQ;
            if(isSel)bg=isLight?SEL_L:SEL_D;
            else if(isLMF||isLMT)bg=isLight?"#CDD26A":"#AABA44";
            const cc=isLight?DARK_SQ:LIGHT_SQ;
            return(
              <div key={sq} onClick={()=>handleClick(sq)} style={{width:size,height:size,background:bg,position:"relative",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:disabled?"default":"pointer",animation:isF?(flashType==="correct"?"fG 0.5s ease 2":"fR 0.5s ease 2"):"none"}}>
                {showCoords&&ci===0&&<span style={{position:"absolute",top:1,left:2,fontSize:9,fontWeight:700,color:cc,pointerEvents:"none"}}>{rank}</span>}
                {showCoords&&ri===7&&<span style={{position:"absolute",bottom:1,right:2,fontSize:9,fontWeight:700,color:cc,pointerEvents:"none"}}>{file}</span>}
                {isDot&&!piece&&<div style={{width:size*0.28,height:size*0.28,borderRadius:"50%",background:HINT,pointerEvents:"none",zIndex:2}}/>}
                {isDot&&piece&&<div style={{position:"absolute",inset:0,borderRadius:"50%",border:`5px solid ${HINT}`,pointerEvents:"none",zIndex:2}}/>}
                {piece&&<Piece p={piece}/>}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Mini board for review ────────────────────────────────────────────────────
function MiniBoard({fenPos,highlight,size=28}){
  const board=parseFen(fenPos||"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR");
  return(
    <div style={{display:"inline-block",border:"1px solid #333",borderRadius:3,overflow:"hidden",flexShrink:0}}>
      {RANKS.map((rank,ri)=>(
        <div key={rank} style={{display:"flex"}}>
          {FILES.map((file,ci)=>{
            const sq=file+rank,isLight=(ri+ci)%2===0,piece=board[sq];
            const isHL=highlight&&(sq===highlight.from||sq===highlight.to);
            let bg=isLight?LIGHT_SQ:DARK_SQ;
            if(isHL)bg=isLight?"#CDD26A":"#AABA44";
            return(
              <div key={sq} style={{width:size,height:size,background:bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {piece&&<img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(PSVG[piece]||"")}`} alt={piece} width={size-4} height={size-4} style={{display:"block",pointerEvents:"none"}}/>}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Continuation bar ─────────────────────────────────────────────────────────
function ContBar({moves,idx,playing}){
  if(!moves.length)return null;
  return(
    <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center",marginTop:10,padding:"8px 12px",background:"#1a1a2e",borderRadius:8,border:"1px solid #333"}}>
      <span style={{fontSize:11,color:"#555",fontWeight:700,marginRight:4}}>LINE</span>
      {moves.map((san,i)=>{
        const active=i===idx,past=i<idx;
        return<span key={i} style={{display:"flex",alignItems:"center",gap:3}}>
          {i%2===0&&<span style={{fontSize:11,color:"#444"}}>{Math.floor(i/2)+1}.</span>}
          <span style={{fontSize:13,fontWeight:active?700:400,color:active?"#fff":past?"#a89fff":"#444",background:active?"#6C63FF":past?"#252545":"transparent",padding:"1px 6px",borderRadius:4,transition:"all .2s"}}>{san}</span>
        </span>;
      })}
      {playing&&<span style={{color:"#6C63FF",fontSize:10,marginLeft:4,animation:"blink 1s infinite"}}>●</span>}
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S={
  page:{minHeight:"100vh",background:"#0f0f13",color:"#e8e8e8",fontFamily:"'Segoe UI',system-ui,sans-serif",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 16px"},
  card:{background:"#1a1a24",borderRadius:16,padding:"28px 24px",maxWidth:520,width:"100%",boxShadow:"0 8px 40px rgba(0,0,0,0.5)"},
  h1:{fontSize:32,fontWeight:800,color:"#fff",margin:0},
  h2:{fontSize:22,fontWeight:700,color:"#fff",margin:"0 0 8px"},
  sub:{color:"#888",fontSize:15,marginTop:8,lineHeight:1.5},
  btn:(bg,dis)=>({background:dis?"#1a1a2a":bg||"linear-gradient(135deg,#6C63FF,#4F46E5)",color:dis?"#555":"#fff",border:"none",borderRadius:10,padding:"13px 24px",fontSize:15,fontWeight:700,cursor:dis?"not-allowed":"pointer",width:"100%",marginTop:12,opacity:dis?0.5:1}),
  btnSm:(bg,dis)=>({background:dis?"#1a1a2a":bg||"#252535",color:dis?"#555":"#fff",border:"1px solid #444",borderRadius:8,padding:"9px 16px",fontSize:13,fontWeight:700,cursor:dis?"not-allowed":"pointer",flex:1}),
  btnGhost:(c)=>({background:"transparent",color:c||"#888",border:`1px solid ${c||"#333"}`,borderRadius:10,padding:"11px 20px",fontSize:14,fontWeight:600,cursor:"pointer",width:"100%",marginTop:8}),
  input:{width:"100%",background:"#252535",border:"1px solid #333",borderRadius:8,padding:"12px 14px",color:"#fff",fontSize:16,outline:"none",boxSizing:"border-box"},
  label:{fontSize:13,color:"#888",marginBottom:6,display:"block",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px"},
  chip:(a)=>({padding:"10px 18px",borderRadius:8,border:a?"2px solid #6C63FF":"1px solid #333",background:a?"#2a2a4a":"#252535",color:a?"#a89fff":"#999",cursor:"pointer",fontSize:14,fontWeight:600}),
  badge:(c)=>({display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:700,background:c+"22",color:c,border:`1px solid ${c}44`}),
  statBox:{background:"#252535",borderRadius:12,padding:"14px 16px",flex:1,textAlign:"center"},
  prog:{height:6,background:"#252535",borderRadius:3,overflow:"hidden"},
  progFill:(p,c)=>({height:"100%",width:`${p}%`,background:c||"#6C63FF",borderRadius:3,transition:"width .5s"}),
  ok:{background:"#0d2a1a",border:"1px solid #1a5c33",borderRadius:12,padding:14,marginTop:12},
  err:{background:"#2a0d0d",border:"1px solid #5c1a1a",borderRadius:12,padding:14,marginTop:12},
  hint:{background:"#1a1a2e",border:"1px solid #4F46E5",borderRadius:12,padding:12,marginTop:12},
  optBtn:(state)=>({padding:"11px 16px",borderRadius:10,fontSize:15,fontWeight:600,cursor:state==="idle"?"pointer":"default",border:`2px solid ${state==="correct"?"#4ade80":state==="wrong"?"#f87171":state==="missed"?"#4ade80":"#333"}`,background:state==="correct"?"#0d2a1a":state==="wrong"?"#2a0d0d":state==="missed"?"#0a1f14":"#252535",color:state==="correct"?"#4ade80":state==="wrong"?"#f87171":state==="missed"?"#4ade80":"#ccc",transition:"all .2s"}),
  typeInput:(state)=>({width:"100%",background:"#252535",border:`2px solid ${state==="correct"?"#4ade80":state==="wrong"?"#f87171":"#333"}`,borderRadius:10,padding:"12px 16px",color:state==="correct"?"#4ade80":state==="wrong"?"#f87171":"#fff",fontSize:18,outline:"none",boxSizing:"border-box",textAlign:"center",fontWeight:700,letterSpacing:"2px"}),
};

// ─── Notation drill generators ────────────────────────────────────────────────
function genClickSquare(){const file=FILES[Math.floor(Math.random()*8)],rank=RANKS[Math.floor(Math.random()*8)],target=file+rank;return{type:"click_square",target,board:{}};}
function genNameSquare(){const fi=Math.floor(Math.random()*8),ri=Math.floor(Math.random()*8),correct=FILES[fi]+RANKS[ri];const opts=new Set([correct]);while(opts.size<4){const f=FILES[Math.floor(Math.random()*8)],r=RANKS[Math.floor(Math.random()*8)];opts.add(f+r);}return{type:"name_square",highlightSq:correct,correct,options:[...opts].sort(()=>Math.random()-0.5),board:{}};}
function genReadMove(){const pos=DRILL_POSITIONS[Math.floor(Math.random()*DRILL_POSITIONS.length)],board=parseFen(pos.fen);const wrong=[...new Set(DRILL_POSITIONS.map(p=>p.san).filter(s=>s!==pos.san))].sort(()=>Math.random()-0.5).slice(0,3);return{type:"read_move",board,move:pos.move,correct:pos.san,options:[pos.san,...wrong].sort(()=>Math.random()-0.5),lastMove:pos.move};}
function genWriteMove(){const pos=DRILL_POSITIONS[Math.floor(Math.random()*DRILL_POSITIONS.length)],board=parseFen(pos.fen);return{type:"write_move",board,move:pos.move,correct:pos.san,lastMove:pos.move};}
function genDrill(){return[genClickSquare,genNameSquare,genReadMove,genWriteMove][Math.floor(Math.random()*4)]();}

// ─── Notation Drills Screen ───────────────────────────────────────────────────
function NotationDrills({onBack}){
  const[mode,setMode]=useState("menu");
  const[drill,setDrill]=useState(null);
  const[score,setScore]=useState(0);
  const[total,setTotal]=useState(0);
  const[streak,setStreak]=useState(0);
  const[bestStreak,setBestStreak]=useState(0);
  const[answered,setAnswered]=useState(false);
  const[selectedOpt,setSelectedOpt]=useState(null);
  const[flashSq,setFlashSq]=useState(null);
  const[flashType,setFlashType]=useState(null);
  const[typeInput,setTypeInput]=useState("");
  const[typeState,setTypeState]=useState("idle");
  const[clickedSq,setClickedSq]=useState(null);
  const SESSION=10;
  const inputRef=useRef(null);

  function next(){setDrill(genDrill());setAnswered(false);setSelectedOpt(null);setFlashSq(null);setFlashType(null);setTypeInput("");setTypeState("idle");setClickedSq(null);}
  function start(){setScore(0);setTotal(0);setStreak(0);setMode("drill");next();}
  function correct(){const ns=streak+1;setScore(s=>s+1);setTotal(t=>t+1);setStreak(ns);if(ns>bestStreak)setBestStreak(ns);setAnswered(true);}
  function wrong(){setTotal(t=>t+1);setStreak(0);setAnswered(true);}

  function handleSquareClick(sq){
    if(answered||drill?.type!=="click_square")return;
    const ok=sq===drill.target;
    setClickedSq(sq);setFlashSq(sq);setFlashType(ok?"correct":"wrong");
    if(ok)correct();else wrong();
    setTimeout(()=>{if(total+1>=SESSION){setMode("results");return;}next();},ok?800:1400);
  }
  function handleMCQ(opt){
    if(answered)return;
    setSelectedOpt(opt);
    const ok=opt===drill.correct;
    setFlashSq(drill.lastMove?.to||drill.highlightSq);setFlashType(ok?"correct":"wrong");
    if(ok)correct();else wrong();
  }
  function handleTypeSubmit(){
    if(answered)return;
    const ok=typeInput.trim()===drill.correct||typeInput.trim()===drill.correct.toLowerCase();
    setTypeState(ok?"correct":"wrong");setFlashSq(drill.lastMove?.to);setFlashType(ok?"correct":"wrong");
    if(ok)correct();else wrong();
  }
  function advance(){if(total>=SESSION){setMode("results");return;}next();}
  useEffect(()=>{if(drill?.type==="write_move")inputRef.current?.focus();},[drill]);
  const acc=total>0?Math.round(score/total*100):0;

  if(mode==="menu")return(
    <div style={S.page}>
      <div style={{...S.card,textAlign:"center"}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:"#666",cursor:"pointer",fontSize:13,marginBottom:12,alignSelf:"flex-start",display:"block",textAlign:"left"}}>← Dashboard</button>
        <div style={{fontSize:44,marginBottom:10}}>🎯</div>
        <h2 style={{...S.h2,textAlign:"center"}}>Notation Drills</h2>
        <p style={{color:"#888",fontSize:14,marginBottom:20,lineHeight:1.5}}>Master algebraic notation — the language of chess. 10 questions, ~2 minutes.</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20,textAlign:"left"}}>
          {[{icon:"🎯",t:"Click the Square",d:"Show 'f6', click it on the board"},{icon:"🔍",t:"Name the Square",d:"Highlighted square — pick its name"},{icon:"📖",t:"Read the Move",d:"Move plays, pick SAN notation"},{icon:"✏️",t:"Write the Move",d:"Move plays, type the SAN notation"}].map(m=>(
            <div key={m.t} style={{background:"#252535",borderRadius:10,padding:"12px",border:"1px solid #333"}}>
              <div style={{fontSize:18,marginBottom:4}}>{m.icon}</div>
              <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:2}}>{m.t}</div>
              <div style={{fontSize:12,color:"#666"}}>{m.d}</div>
            </div>
          ))}
        </div>
        {bestStreak>0&&<p style={{color:"#f59e0b",fontSize:13,marginBottom:4}}>🔥 Best streak: {bestStreak}</p>}
        <button style={S.btn()} onClick={start}>→ Start Drills</button>
      </div>
    </div>
  );

  if(mode==="results")return(
    <div style={S.page}>
      <div style={{...S.card,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:8}}>{acc>=80?"🏆":acc>=60?"💪":"📚"}</div>
        <h2 style={{...S.h2,textAlign:"center"}}>Drill Complete!</h2>
        <div style={{background:"#252535",borderRadius:12,padding:20,margin:"16px 0"}}>
          <div style={{fontSize:52,fontWeight:900,color:acc>=80?"#4ade80":acc>=60?"#f59e0b":"#f87171"}}>{acc}%</div>
          <div style={{fontSize:13,color:"#888"}}>accuracy · {score}/{total} correct</div>
        </div>
        <div style={{display:"flex",gap:10,marginBottom:16}}>
          <div style={S.statBox}><div style={{fontSize:11,color:"#666",fontWeight:700,textTransform:"uppercase"}}>Best Streak</div><div style={{fontSize:22,fontWeight:800,color:"#f59e0b",marginTop:4}}>🔥{bestStreak}</div></div>
          <div style={S.statBox}><div style={{fontSize:11,color:"#666",fontWeight:700,textTransform:"uppercase"}}>XP Earned</div><div style={{fontSize:22,fontWeight:800,color:"#6C63FF",marginTop:4}}>+{score*5}</div></div>
        </div>
        <button style={S.btn()} onClick={start}>↺ Try Again</button>
        <button style={S.btnGhost()} onClick={onBack}>← Dashboard</button>
      </div>
    </div>
  );

  if(!drill)return null;
  const pct=(total/SESSION)*100;
  return(
    <div style={S.page}>
      <div style={{...S.card,maxWidth:560}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <span style={{fontWeight:800,fontSize:15}}>🎯 Notation Drills</span>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            {streak>0&&<span style={{fontSize:13,color:"#f59e0b",fontWeight:700}}>🔥{streak}</span>}
            <span style={{fontSize:13,color:"#666"}}>{total}/{SESSION}</span>
          </div>
        </div>
        <div style={{...S.prog,marginBottom:14}}><div style={S.progFill(pct,"linear-gradient(90deg,#6C63FF,#a89fff)")}/></div>
        <div style={{marginBottom:10}}>
          <span style={S.badge("#6C63FF")}>{drill.type==="click_square"?"Click Square":drill.type==="name_square"?"Name Square":drill.type==="read_move"?"Read Move":"Write Move"}</span>
          <span style={{...S.badge("#4ade80"),marginLeft:8}}>{score} correct</span>
        </div>

        {drill.type==="click_square"&&<>
          <p style={{fontSize:18,color:"#fff",fontWeight:700,margin:"0 0 4px"}}>Click on square <span style={{color:"#a89fff",fontFamily:"monospace",fontSize:22}}>{drill.target}</span></p>
          <p style={{color:"#666",fontSize:13,margin:"0 0 14px"}}>File: {drill.target[0].toUpperCase()} · Rank: {drill.target[1]}</p>
          <div style={{display:"flex",justifyContent:"center"}}>
            <Board board={{}} onMove={()=>{}} disabled={answered} lastMove={null} flashSq={flashSq} flashType={flashType} userSide="w" size={52}
              // override click
              onSquareClick={handleSquareClick}
            />
          </div>
          {answered&&<div style={{marginTop:12,padding:"10px 14px",background:clickedSq===drill.target?"#0d2a1a":"#2a0d0d",borderRadius:10,border:`1px solid ${clickedSq===drill.target?"#1a5c33":"#5c1a1a"}`}}>
            <span style={{color:clickedSq===drill.target?"#4ade80":"#f87171",fontWeight:700}}>{clickedSq===drill.target?"✓ Correct!":"✗ The answer was "+drill.target}</span>
          </div>}
        </>}

        {drill.type==="name_square"&&<>
          <p style={{fontSize:16,color:"#ccc",margin:"0 0 12px"}}>What square is highlighted?</p>
          <div style={{display:"flex",justifyContent:"center",marginBottom:12}}>
            <Board board={{}} disabled lastMove={null} flashSq={answered?drill.highlightSq:null} flashType={answered?"correct":null} userSide="w" size={52}
              highlightSqProp={drill.highlightSq}
            />
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {drill.options.map(opt=>{const state=!answered?"idle":opt===drill.correct?"correct":opt===selectedOpt?"wrong":"idle";return<button key={opt} style={{...S.optBtn(state),fontFamily:"monospace",fontSize:18,letterSpacing:"1px"}} onClick={()=>handleMCQ(opt)}>{opt}</button>;})}
          </div>
        </>}

        {drill.type==="read_move"&&<>
          <p style={{fontSize:16,color:"#ccc",margin:"0 0 12px"}}>Which move was just played?</p>
          <div style={{display:"flex",justifyContent:"center",marginBottom:12}}>
            <Board board={drill.board} disabled lastMove={drill.lastMove} flashSq={flashSq} flashType={flashType} userSide="w" size={52}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {drill.options.map(opt=>{const state=!answered?"idle":opt===drill.correct?"correct":opt===selectedOpt?"wrong":"idle";return<button key={opt} style={{...S.optBtn(state),fontFamily:"monospace",fontSize:16}} onClick={()=>handleMCQ(opt)}>{opt}</button>;})}
          </div>
        </>}

        {drill.type==="write_move"&&<>
          <p style={{fontSize:16,color:"#ccc",margin:"0 0 12px"}}>Type the move that was just played:</p>
          <div style={{display:"flex",justifyContent:"center",marginBottom:12}}>
            <Board board={drill.board} disabled lastMove={drill.lastMove} flashSq={flashSq} flashType={flashType} userSide="w" size={52}/>
          </div>
          <input ref={inputRef} style={S.typeInput(typeState)} value={typeInput} onChange={e=>setTypeInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!answered)handleTypeSubmit();}} placeholder="e.g. Nf3" disabled={answered} autoComplete="off" spellCheck={false}/>
          {!answered&&<button style={{...S.btn(),marginTop:10}} onClick={handleTypeSubmit} disabled={!typeInput.trim()}>Check →</button>}
          {answered&&<div style={{marginTop:10,padding:"10px 14px",background:typeState==="correct"?"#0d2a1a":"#2a0d0d",borderRadius:10,border:`1px solid ${typeState==="correct"?"#1a5c33":"#5c1a1a"}`}}>
            <span style={{color:typeState==="correct"?"#4ade80":"#f87171",fontWeight:700}}>{typeState==="correct"?"✓ Correct!":"✗ Answer: "}</span>
            {typeState==="wrong"&&<span style={{color:"#4ade80",fontWeight:700,fontFamily:"monospace"}}>{drill.correct}</span>}
          </div>}
        </>}

        {answered&&drill.type!=="click_square"&&<button style={{...S.btn(),marginTop:12}} onClick={advance}>{total>=SESSION?"See Results →":"Next →"}</button>}
      </div>
    </div>
  );
}

// ─── Opening Trainer Screen ───────────────────────────────────────────────────
function OpeningTrainer({onBack}){
  const[view,setView]=useState("menu");
  const[selOpening,setSelOpening]=useState(null);
  const[selLine,setSelLine]=useState(null);
  const[board,setBoard]=useState(parseFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"));
  const[moveIdx,setMoveIdx]=useState(-1);
  const[lastMove,setLastMove]=useState(null);
  const[autoPlaying,setAutoPlaying]=useState(false);
  const[quizBoard,setQuizBoard]=useState(null);
  const[quizMoveIdx,setQuizMoveIdx]=useState(0);
  const[quizLine,setQuizLine]=useState(null);
  const[quizResult,setQuizResult]=useState(null);
  const[quizFlash,setQuizFlash]=useState(null);
  const[quizFlashType,setQuizFlashType]=useState(null);
  const[quizScore,setQuizScore]=useState(0);
  const[quizTotal,setQuizTotal]=useState(0);
  const INIT="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";

  function startLearn(opening,line){setSelOpening(opening);setSelLine(line);setBoard(parseFen(INIT));setMoveIdx(-1);setLastMove(null);setView("learn");}
  function startQuiz(opening,line){
    const l=line||opening.lines[Math.floor(Math.random()*opening.lines.length)];
    setQuizLine(l);setSelOpening(opening);setQuizBoard(parseFen(INIT));setQuizMoveIdx(0);setQuizResult(null);setQuizScore(0);setQuizTotal(0);setLastMove(null);setView("quiz");
  }

  function boardAtMove(moves,upTo){let b=parseFen(INIT);for(let i=0;i<=upTo;i++){const f=moves[i].slice(0,2),t=moves[i].slice(2,4);b=applyMove(b,f,t);}return b;}
  function stepFwd(){if(!selLine||moveIdx>=selLine.moves.length-1)return;const next=moveIdx+1;setBoard(boardAtMove(selLine.moves,next));const f=selLine.moves[next].slice(0,2),t=selLine.moves[next].slice(2,4);setLastMove({from:f,to:t});setMoveIdx(next);}
  function stepBck(){if(moveIdx<0)return;const prev=moveIdx-1;if(prev<0){setBoard(parseFen(INIT));setLastMove(null);}else{setBoard(boardAtMove(selLine.moves,prev));const f=selLine.moves[prev].slice(0,2),t=selLine.moves[prev].slice(2,4);setLastMove({from:f,to:t});}setMoveIdx(prev);}
  async function autoPlay(){
    if(autoPlaying||!selLine)return;setAutoPlaying(true);setBoard(parseFen(INIT));setMoveIdx(-1);setLastMove(null);await new Promise(r=>setTimeout(r,400));
    for(let i=0;i<selLine.moves.length;i++){const f=selLine.moves[i].slice(0,2),to=selLine.moves[i].slice(2,4);setBoard(boardAtMove(selLine.moves,i));setLastMove({from:f,to});setMoveIdx(i);await new Promise(r=>setTimeout(r,850));}
    setAutoPlaying(false);
  }

  function handleQuizMove(uci){
    if(quizResult||!quizLine)return;
    const expected=quizLine.moves[quizMoveIdx],isOk=uci===expected;
    const from=uci.slice(0,2),to=uci.slice(2,4);
    setQuizBoard(b=>applyMove(b,from,to));setLastMove({from,to});
    setQuizFlash(to);setQuizFlashType(isOk?"correct":"wrong");
    setTimeout(()=>setQuizFlash(null),1500);
    if(isOk){
      setQuizScore(s=>s+1);setQuizTotal(t=>t+1);setQuizResult("correct");
      const next=quizMoveIdx+1;
      if(next<quizLine.moves.length){
        setTimeout(()=>{
          const rf=quizLine.moves[next].slice(0,2),rt=quizLine.moves[next].slice(2,4);
          setQuizBoard(b=>applyMove(b,rf,rt));setLastMove({from:rf,to:rt});
          const after=next+1;
          if(after>=quizLine.moves.length){setQuizTotal(t=>t+1);setTimeout(()=>setView("results"),800);}
          else{setQuizMoveIdx(after);setQuizResult(null);}
        },700);
      }else{setQuizTotal(t=>t+1);setTimeout(()=>setView("results"),800);}
    }else{setQuizTotal(t=>t+1);setQuizResult("wrong");}
  }

  function retryQuiz(){setQuizBoard(parseFen(INIT));setQuizMoveIdx(0);setQuizResult(null);setQuizScore(0);setQuizTotal(0);setLastMove(null);}
  const acc=quizTotal>0?Math.round(quizScore/quizTotal*100):0;
  const quizUserSide=quizMoveIdx%2===0?"w":"b";

  if(view==="menu")return(
    <div style={S.page}>
      <div style={{...S.card,maxWidth:540}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:"#666",cursor:"pointer",fontSize:13,marginBottom:12,padding:0}}>← Dashboard</button>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:44,marginBottom:8}}>📖</div>
          <h2 style={{...S.h2,textAlign:"center"}}>Opening Trainer</h2>
          <p style={{color:"#888",fontSize:14,lineHeight:1.5}}>Learn main lines, then test yourself by playing them on the board.</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {OPENINGS.map(o=>(
            <div key={o.id} onClick={()=>{setSelOpening(o);setView("select");}} style={{background:"#252535",borderRadius:12,padding:"16px",border:`1px solid ${o.color}33`,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.borderColor=o.color} onMouseLeave={e=>e.currentTarget.style.borderColor=o.color+"33"}>
              <div style={{fontSize:22,marginBottom:6}}>{o.icon}</div>
              <div style={{fontWeight:700,color:"#fff",fontSize:14,marginBottom:2}}>{o.name}</div>
              <div style={{fontSize:11,color:"#666",marginBottom:6}}>{o.eco}</div>
              <div style={{fontSize:12,color:"#888",lineHeight:1.4,marginBottom:8}}>{o.description}</div>
              <span style={S.badge(o.color)}>{o.lines.length} lines</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if(view==="select"&&selOpening)return(
    <div style={S.page}>
      <div style={S.card}>
        <button onClick={()=>setView("menu")} style={{background:"none",border:"none",color:"#666",cursor:"pointer",fontSize:13,marginBottom:14,padding:0}}>← Back</button>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
          <span style={{fontSize:26}}>{selOpening.icon}</span>
          <div><h2 style={{...S.h2,margin:0}}>{selOpening.name}</h2><span style={S.badge(selOpening.color)}>{selOpening.eco}</span></div>
        </div>
        <p style={{color:"#888",fontSize:14,marginBottom:18,lineHeight:1.5}}>{selOpening.description}</p>
        {selOpening.lines.map((line,i)=>(
          <div key={i} style={{background:"#252535",borderRadius:10,padding:"14px 16px",marginBottom:8,border:"1px solid #333"}}>
            <div style={{fontWeight:700,color:"#fff",fontSize:14,marginBottom:4}}>{line.name}</div>
            <div style={{fontSize:12,color:"#666",fontFamily:"monospace",marginBottom:10}}>{line.sans.join(" · ")}</div>
            <div style={{display:"flex",gap:8}}>
              <button style={{...S.btnSm(""),flex:1,background:"#2a2a4a",border:"1px solid #4F46E5",color:"#a89fff"}} onClick={()=>startLearn(selOpening,line)}>📖 Learn</button>
              <button style={{...S.btnSm(""),flex:1}} onClick={()=>startQuiz(selOpening,line)}>🎯 Quiz</button>
            </div>
          </div>
        ))}
        <button style={S.btn(`linear-gradient(135deg,${selOpening.color}cc,${selOpening.color}88)`)} onClick={()=>startQuiz(selOpening)}>🎯 Quiz All Lines</button>
      </div>
    </div>
  );

  if(view==="learn"&&selLine)return(
    <div style={S.page}>
      <div style={{...S.card,maxWidth:560}}>
        <button onClick={()=>setView("select")} style={{background:"none",border:"none",color:"#666",cursor:"pointer",fontSize:13,marginBottom:10,padding:0}}>← Back</button>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <h2 style={{fontSize:16,fontWeight:800,color:"#fff",margin:0}}>{selLine.name}</h2>
          <span style={S.badge(selOpening.color)}>{selOpening.eco}</span>
        </div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center",marginBottom:12,padding:"8px 10px",background:"#1a1a2e",borderRadius:8,border:"1px solid #333"}}>
          {selLine.sans.map((san,i)=>(
            <span key={i} style={{display:"flex",alignItems:"center",gap:3}}>
              {i%2===0&&<span style={{fontSize:11,color:"#444"}}>{Math.floor(i/2)+1}.</span>}
              <span style={{fontSize:13,fontWeight:i===moveIdx?700:400,color:i===moveIdx?"#fff":i<moveIdx?"#a89fff":"#444",background:i===moveIdx?"#6C63FF":i<moveIdx?"#252545":"transparent",padding:"1px 6px",borderRadius:4}}>{san}</span>
            </span>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"center",marginBottom:12}}>
          <Board board={board} disabled lastMove={lastMove} userSide="w" size={54}/>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          {[["⏮",()=>{setBoard(parseFen(INIT));setMoveIdx(-1);setLastMove(null);}],["◀",stepBck],["▶",stepFwd],["⏭",()=>{if(!selLine)return;setBoard(boardAtMove(selLine.moves,selLine.moves.length-1));const last=selLine.moves[selLine.moves.length-1];setLastMove({from:last.slice(0,2),to:last.slice(2,4)});setMoveIdx(selLine.moves.length-1);}]].map(([label,fn])=>(
            <button key={label} style={{...S.btnSm(),flex:1}} onClick={fn}>{label}</button>
          ))}
          <button style={{...S.btnSm("linear-gradient(135deg,#6C63FF,#4F46E5)"),flex:2}} onClick={autoPlay} disabled={autoPlaying}>{autoPlaying?"Playing…":"▶ Auto"}</button>
        </div>
        <div style={{background:"#252535",borderRadius:10,padding:"12px 14px",border:"1px solid #333",marginBottom:12}}>
          <div style={{fontSize:11,color:"#666",fontWeight:700,textTransform:"uppercase",marginBottom:4}}>Theory</div>
          <p style={{color:"#ccc",fontSize:14,margin:0,lineHeight:1.6}}>{selLine.theory}</p>
        </div>
        <button style={S.btn()} onClick={()=>startQuiz(selOpening,selLine)}>🎯 Test Yourself →</button>
      </div>
    </div>
  );

  if(view==="quiz"&&quizLine)return(
    <div style={S.page}>
      <div style={{...S.card,maxWidth:560}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <h2 style={{fontSize:15,fontWeight:800,color:"#fff",margin:0}}>{quizLine.name}</h2>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <span style={S.badge("#4ade80")}>{quizScore} ✓</span>
            <button onClick={()=>setView("select")} style={{background:"none",border:"none",color:"#666",cursor:"pointer",fontSize:13}}>✕</button>
          </div>
        </div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center",marginBottom:12,padding:"8px 10px",background:"#1a1a2e",borderRadius:8,border:"1px solid #333"}}>
          {quizLine.sans.map((san,i)=>{
            const played=i<quizMoveIdx,isCurrent=i===quizMoveIdx;
            return<span key={i} style={{display:"flex",alignItems:"center",gap:3}}>
              {i%2===0&&<span style={{fontSize:11,color:"#444"}}>{Math.floor(i/2)+1}.</span>}
              <span style={{fontSize:13,color:played?"#a89fff":"#333",background:played?"#252545":"transparent",padding:"1px 6px",borderRadius:4,minWidth:20,textAlign:"center",border:isCurrent?"1px dashed #6C63FF":"none"}}>{played?san:isCurrent?"?":"·"}</span>
            </span>;
          })}
        </div>
        <p style={{color:"#ccc",fontSize:14,margin:"0 0 10px"}}>{quizUserSide==="w"?"White":"Black"} to play — play the main line move</p>
        <div style={{display:"flex",justifyContent:"center",marginBottom:10}}>
          <Board board={quizBoard} onMove={handleQuizMove} disabled={!!quizResult} lastMove={lastMove} flashSq={quizFlash} flashType={quizFlashType} userSide={quizUserSide} size={54}/>
        </div>
        {quizResult==="correct"&&<div style={S.ok}><span style={{color:"#4ade80",fontWeight:700}}>✓ Correct! That's the main line.</span></div>}
        {quizResult==="wrong"&&<div style={S.err}>
          <div style={{color:"#f87171",fontWeight:700,marginBottom:6}}>✗ Not the main line.</div>
          <div style={{color:"#ccc",fontSize:13}}>The correct move was <span style={{color:"#4ade80",fontWeight:700,fontFamily:"monospace"}}>{quizLine.sans[quizMoveIdx]}</span></div>
          <button style={{...S.btnSm(),marginTop:10,width:"100%"}} onClick={retryQuiz}>↺ Retry from start</button>
        </div>}
      </div>
    </div>
  );

  if(view==="results")return(
    <div style={S.page}>
      <div style={{...S.card,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:8}}>{acc>=80?"🏆":acc>=60?"💪":"📚"}</div>
        <h2 style={{...S.h2,textAlign:"center"}}>Line Complete!</h2>
        <p style={{color:"#888",fontSize:14,marginBottom:14}}>{quizLine?.name}</p>
        <div style={{background:"#252535",borderRadius:12,padding:20,marginBottom:14}}>
          <div style={{fontSize:52,fontWeight:900,color:acc>=80?"#4ade80":acc>=60?"#f59e0b":"#f87171"}}>{acc}%</div>
          <div style={{fontSize:13,color:"#888"}}>{quizScore}/{quizTotal} correct</div>
        </div>
        {acc===100&&<div style={{...S.ok,marginBottom:12}}><span style={{color:"#4ade80",fontWeight:700}}>🎉 Perfect! You know this line cold.</span></div>}
        <button style={S.btn()} onClick={retryQuiz}>↺ Retry</button>
        <button style={S.btnGhost()} onClick={()=>setView("select")}>← Back to Lines</button>
        <button style={S.btnGhost()} onClick={onBack}>🏠 Dashboard</button>
      </div>
    </div>
  );
  return null;
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function BestMove(){
  const[screen,setScreen]=useState(SCREEN.HOME);
  const[rating,setRating]=useState("");
  const[timePerDay,setTimePerDay]=useState(null);
  const[struggles,setStruggles]=useState([]);
  const[level,setLevel]=useState(null);
  const[xp,setXp]=useState(0);
  const[streak]=useState(3);

  const[positions,setPositions]=useState([]);
  const[loading,setLoading]=useState(false);
  const[posIdx,setPosIdx]=useState(0);
  const[board,setBoard]=useState(null);
  const[lastMove,setLastMove]=useState(null);
  const[flashSq,setFlashSq]=useState(null);
  const[flashType,setFlashType]=useState(null);
  const[phase,setPhase]=useState("setup");
  const[attempts,setAttempts]=useState(0);
  const[analysis,setAnalysis]=useState(null);
  const[results,setResults]=useState([]);
  const[contSan,setContSan]=useState([]);
  const[contUci,setContUci]=useState([]);
  const[contIdx,setContIdx]=useState(-1);
  const[contPlaying,setContPlaying]=useState(false);

  const pos=positions[posIdx];
  const accuracy=results.length?Math.round(results.filter(r=>r.correct&&r.firstTry).length/results.length*100):0;
  const missedThemes=[...new Set(results.filter(r=>!r.correct||!r.firstTry).map(r=>r.theme))];
  const xpPct=Math.min(100,xp%100);

  useEffect(()=>{
    if(!pos)return;
    setBoard(parseFen(pos.fen));setLastMove(null);setFlashSq(null);
    setPhase("setup");setAnalysis(null);setAttempts(0);setContSan([]);setContUci([]);setContIdx(-1);
    if(pos.setupMove){
      const t=setTimeout(()=>{
        const f=pos.setupMove.slice(0,2),to=pos.setupMove.slice(2,4);
        setBoard(applyMove(parseFen(pos.fen),f,to));setLastMove({from:f,to});
        setTimeout(()=>setPhase("waiting"),300);
      },700);
      return()=>clearTimeout(t);
    }else{setTimeout(()=>setPhase("waiting"),400);}
  },[posIdx,positions]);

  const handleMove=useCallback(async(uci)=>{
    if(phase!=="waiting"||!pos)return;
    const bestUci=pos.solution[0],isCorrect=uci===bestUci;
    const from=uci.slice(0,2),to=uci.slice(2,4);
    setBoard(b=>applyMove(b,from,to));setLastMove({from,to});
    setFlashSq(to);setFlashType(isCorrect?"correct":"wrong");
    setTimeout(()=>setFlashSq(null),2000);
    const firstTry=attempts===0;
    if(isCorrect){
      setPhase("analysing");
      setResults(prev=>[...prev,{id:pos.id,correct:true,firstTry,theme:pos.appTheme,bestMove:bestUci,fen:pos.fen,setupMove:pos.setupMove}]);
      setXp(x=>x+(firstTry?10:5));
      if(pos.solution.length>1){const resp=pos.solution[1];const rf=resp.slice(0,2),rt=resp.slice(2,4);setTimeout(()=>{setBoard(b=>applyMove(b,rf,rt));setLastMove({from:rf,to:rt});},700);}
      const a=await getAnalysis(pos.fen,bestUci);
      setAnalysis({...a,isCorrect:true,bestMove:bestUci});setContSan(a.continuationSan||[]);setContUci(a.continuation||[]);
      setPhase("correct");
    }else{
      const na=attempts+1;setAttempts(na);
      if(firstTry)setResults(prev=>[...prev,{id:pos.id,correct:false,firstTry:true,theme:pos.appTheme,bestMove:bestUci,fen:pos.fen,setupMove:pos.setupMove}]);
      if(na>=2){
        setPhase("analysing");
        const a=await getAnalysis(pos.fen,bestUci);
        setAnalysis({...a,isCorrect:false,bestMove:bestUci});setContSan(a.continuationSan||[]);setContUci(a.continuation||[]);
        setPhase("revealed");
      }else{
        setPhase("wrong");
        setTimeout(()=>{const b=pos.setupMove?applyMove(parseFen(pos.fen),pos.setupMove.slice(0,2),pos.setupMove.slice(2,4)):parseFen(pos.fen);setBoard(b);setLastMove(pos.setupMove?{from:pos.setupMove.slice(0,2),to:pos.setupMove.slice(2,4)}:null);},1200);
      }
    }
  },[phase,pos,attempts]);

  function tryAgain(){const b=pos.setupMove?applyMove(parseFen(pos.fen),pos.setupMove.slice(0,2),pos.setupMove.slice(2,4)):parseFen(pos.fen);setBoard(b);setLastMove(pos.setupMove?{from:pos.setupMove.slice(0,2),to:pos.setupMove.slice(2,4)}:null);setPhase("waiting");}
  async function playCont(){
    if(contPlaying||!contUci.length||!pos)return;
    setContPlaying(true);setContIdx(-1);
    let b=pos.setupMove?applyMove(parseFen(pos.fen),pos.setupMove.slice(0,2),pos.setupMove.slice(2,4)):parseFen(pos.fen);
    const c=pos.solution[0];b=applyMove(b,c.slice(0,2),c.slice(2,4));
    setBoard({...b});setLastMove({from:c.slice(0,2),to:c.slice(2,4)});await new Promise(r=>setTimeout(r,400));
    for(let i=0;i<contUci.length;i++){const f=contUci[i].slice(0,2),t=contUci[i].slice(2,4);b=applyMove(b,f,t);setBoard({...b});setLastMove({from:f,to:t});setContIdx(i);await new Promise(r=>setTimeout(r,850));}
    setContPlaying(false);setPhase("cont");
  }
  function nextPos(){setFlashSq(null);if(posIdx+1>=positions.length)setScreen(SCREEN.SUMMARY);else setPosIdx(i=>i+1);}
  async function startSession(){
    setLoading(true);const puzzles=await fetchPuzzles(parseInt(rating)||1200);
    setPositions(puzzles);setPosIdx(0);setResults([]);setXp(0);setLoading(false);setScreen(SCREEN.SESSION);
  }
  function genLevel(){const b=parseInt(rating)||1200;setLevel(Math.max(800,Math.min(1500,b-80+Math.floor(Math.random()*40))));}

  const showFeedback=["correct","wrong","revealed","cont"].includes(phase);

  // ── Delegate to sub-screens ──
  if(screen===SCREEN.NOTATION)return <NotationDrills onBack={()=>setScreen(SCREEN.DASH)}/>;
  if(screen===SCREEN.OPENING)return <OpeningTrainer onBack={()=>setScreen(SCREEN.DASH)}/>;

  // ── Home ──
  if(screen===SCREEN.HOME)return(
    <div style={S.page}>
      <div style={{...S.card,textAlign:"center"}}>
        <div style={{fontSize:52,marginBottom:12}}>♟</div>
        <h1 style={S.h1}>BestMove</h1>
        <p style={{...S.sub,fontSize:17,maxWidth:320,margin:"12px auto 0"}}>Train your brain to find the best move in any position.</p>
        <button style={S.btn()} onClick={()=>setScreen(SCREEN.OB1)}>→ Start Training</button>
        <div style={{display:"flex",gap:20,justifyContent:"center",marginTop:20}}>
          {["4M+ puzzles","Opening trainer","Notation drills"].map(f=><span key={f} style={{fontSize:12,color:"#555",fontWeight:600}}>{f}</span>)}
        </div>
      </div>
    </div>
  );

  // ── Onboard 1 ──
  if(screen===SCREEN.OB1)return(
    <div style={S.page}>
      <div style={S.card}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:24}}><span style={{fontSize:20}}>♟</span><span style={{fontWeight:800,fontSize:18}}>BestMove</span><span style={{...S.badge("#6C63FF"),marginLeft:"auto"}}>1 of 2</span></div>
        <h2 style={S.h2}>Calibrate your training</h2>
        <div style={{marginTop:20}}>
          <label style={S.label}>Your chess rating</label>
          <input style={S.input} type="number" placeholder="e.g. 1150" value={rating} onChange={e=>setRating(e.target.value)}/>
        </div>
        <div style={{marginTop:16}}>
          <label style={S.label}>Daily time</label>
          <div style={{display:"flex",gap:8,marginTop:4}}>{[5,10,15].map(t=><button key={t} style={{...S.chip(timePerDay===t),flex:1}} onClick={()=>setTimePerDay(t)}>{t} min</button>)}</div>
        </div>
        <button style={S.btn("",!rating||!timePerDay)} disabled={!rating||!timePerDay} onClick={()=>setScreen(SCREEN.OB2)}>Continue →</button>
      </div>
    </div>
  );

  // ── Onboard 2 ──
  if(screen===SCREEN.OB2)return(
    <div style={S.page}>
      <div style={S.card}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:24}}><span style={{fontSize:20}}>♟</span><span style={{fontWeight:800,fontSize:18}}>BestMove</span><span style={{...S.badge("#6C63FF"),marginLeft:"auto"}}>2 of 2</span></div>
        <h2 style={S.h2}>What do you struggle with?</h2>
        <p style={S.sub}>We'll weight puzzles toward your weak spots.</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:20}}>
          {THEMES.map(t=><button key={t} style={S.chip(struggles.includes(t))} onClick={()=>setStruggles(p=>p.includes(t)?p.filter(x=>x!==t):[...p,t])}>{t==="Blunders"?"⚡":t==="Strategy"?"🧭":t==="Endgames"?"🏁":"🔢"} {t}</button>)}
        </div>
        <button style={S.btn("",!struggles.length)} disabled={!struggles.length} onClick={()=>{genLevel();setScreen(SCREEN.DASH);}}>→ Generate My Level</button>
      </div>
    </div>
  );

  // ── Dashboard ──
  if(screen===SCREEN.DASH)return(
    <div style={S.page}>
      <div style={{...S.card,maxWidth:520}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:20}}>♟</span><span style={{fontWeight:800,fontSize:18}}>BestMove</span></div>
          <span style={{fontSize:13,color:"#f59e0b",fontWeight:700}}>🔥 {streak} day streak</span>
        </div>

        {/* Level card */}
        <div style={{background:"linear-gradient(135deg,#2a2a4a,#1e1e32)",borderRadius:14,padding:"18px 20px",marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
            <div><div style={{fontSize:11,color:"#888",textTransform:"uppercase",fontWeight:600}}>BestMove Level</div><div style={{fontSize:48,fontWeight:900,color:"#a89fff",lineHeight:1.1,margin:"2px 0"}}>{level}</div></div>
            <div style={{textAlign:"right"}}><div style={{fontSize:11,color:"#666"}}>XP</div><div style={{fontSize:22,fontWeight:800,color:"#6C63FF"}}>{xp}</div></div>
          </div>
          <div style={{marginTop:10}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:11,color:"#666"}}>Next level</span><span style={{fontSize:11,color:"#6C63FF",fontWeight:700}}>{xpPct}/100</span></div>
            <div style={S.prog}><div style={S.progFill(xpPct,"linear-gradient(90deg,#6C63FF,#a89fff)")}/></div>
          </div>
        </div>

        {/* Stats */}
        <div style={{display:"flex",gap:10,marginBottom:14}}>
          <div style={S.statBox}><div style={{fontSize:11,color:"#666",fontWeight:700,textTransform:"uppercase"}}>Today</div><div style={{fontSize:22,fontWeight:800,color:"#fff",marginTop:4}}>6</div><div style={{fontSize:11,color:"#555"}}>puzzles</div></div>
          <div style={S.statBox}><div style={{fontSize:11,color:"#666",fontWeight:700,textTransform:"uppercase"}}>Streak</div><div style={{fontSize:22,fontWeight:800,color:"#f59e0b",marginTop:4}}>🔥{streak}</div></div>
          <div style={S.statBox}><div style={{fontSize:11,color:"#666",fontWeight:700,textTransform:"uppercase"}}>Rating</div><div style={{fontSize:22,fontWeight:800,color:"#4ade80",marginTop:4}}>{rating}</div></div>
        </div>

        {struggles.length>0&&<div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:"#666",fontWeight:700,textTransform:"uppercase",marginBottom:6}}>Focus Areas</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{struggles.map(t=><span key={t} style={S.badge("#f87171")}>{t}</span>)}</div>
        </div>}

        {/* Main CTA */}
        <button style={S.btn("",loading)} disabled={loading} onClick={startSession}>{loading?"⏳ Loading puzzles…":"→ Start Daily Path"}</button>

        {/* Training modes */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:12}}>
          <button onClick={()=>setScreen(SCREEN.NOTATION)} style={{background:"#252535",border:"1px solid #333",borderRadius:12,padding:"14px",cursor:"pointer",textAlign:"left"}}>
            <div style={{fontSize:22,marginBottom:6}}>🎯</div>
            <div style={{fontWeight:700,color:"#fff",fontSize:13,marginBottom:2}}>Notation Drills</div>
            <div style={{fontSize:12,color:"#666"}}>4 drill types · ~2 min</div>
          </button>
          <button onClick={()=>setScreen(SCREEN.OPENING)} style={{background:"#252535",border:"1px solid #333",borderRadius:12,padding:"14px",cursor:"pointer",textAlign:"left"}}>
            <div style={{fontSize:22,marginBottom:6}}>📖</div>
            <div style={{fontWeight:700,color:"#fff",fontSize:13,marginBottom:2}}>Opening Trainer</div>
            <div style={{fontSize:12,color:"#666"}}>4 openings · Learn & quiz</div>
          </button>
        </div>
      </div>
    </div>
  );

  // ── Session ──
  if(screen===SCREEN.SESSION&&pos)return(
    <div style={S.page}>
      <div style={{...S.card,maxWidth:560}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <span style={{fontWeight:800,fontSize:15}}>♟ BestMove</span>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:12,color:"#f59e0b",fontWeight:700}}>+{xp} XP</span>
            <span style={{fontSize:13,color:"#666"}}>{posIdx+1}/{positions.length}</span>
          </div>
        </div>
        <div style={{...S.prog,marginBottom:12}}><div style={S.progFill((posIdx/positions.length)*100)}/></div>
        <div style={{margin:"0 0 8px",display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
          <span style={S.badge("#6C63FF")}>{pos.appTheme}</span>
          <span style={S.badge("#444")}>{pos.concept}</span>
          {pos.rating&&<span style={S.badge("#f59e0b")}>★ {pos.rating}</span>}
          {attempts===1&&phase==="waiting"&&<span style={S.badge("#f87171")}>⚠ Last attempt</span>}
          {phase==="analysing"&&<span style={S.badge("#a89fff")}>⚙ Analysing…</span>}
          {phase==="setup"&&<span style={S.badge("#555")}>Setting up…</span>}
          {phase==="cont"&&<span style={S.badge("#a89fff")}>▶ Line</span>}
        </div>
        <p style={{color:"#ccc",fontSize:15,margin:"0 0 12px",lineHeight:1.5,minHeight:22}}>
          {phase==="setup"?"Watch the opponent's move…":phase==="analysing"?"Analysing…":phase==="cont"?"Engine continuation":phase==="revealed"?"Best move revealed:":pos.prompt}
        </p>
        <div style={{display:"flex",justifyContent:"center",marginBottom:10}}>
          {board&&<Board board={board} onMove={handleMove} disabled={phase!=="waiting"} lastMove={lastMove} flashSq={flashSq} flashType={flashType} userSide={pos.userSide} size={58}/>}
        </div>
        {contSan.length>0&&<ContBar moves={contSan} idx={contIdx} playing={contPlaying}/>}
        {phase==="wrong"&&<div style={S.hint}>
          <div style={{fontWeight:700,fontSize:13,color:"#a89fff",marginBottom:4}}>💡 Hint</div>
          <div style={{fontSize:14,color:"#ccc"}}>Think about <strong style={{color:"#a89fff"}}>{pos.concept}</strong> — there's a forcing sequence. Try again!</div>
          <div style={{display:"flex",gap:8,marginTop:10}}><button style={S.btnSm()} onClick={tryAgain}>↺ Try Again</button></div>
        </div>}
        {(phase==="correct"||phase==="cont")&&analysis&&<div style={S.ok}>
          <div style={{fontWeight:700,fontSize:14,color:"#4ade80",marginBottom:6}}>✓ Best move!{attempts===0?" First try 🎯":""}</div>
          <div style={{fontSize:14,color:"#ccc",lineHeight:1.6}}>{analysis.explanation}</div>
        </div>}
        {phase==="revealed"&&analysis&&<div style={S.err}>
          <div style={{fontWeight:700,fontSize:14,color:"#f87171",marginBottom:6}}>Best move: <span style={{color:"#4ade80"}}>{analysis.bestMove}</span></div>
          <div style={{fontSize:14,color:"#ccc",lineHeight:1.6}}>{analysis.explanation}</div>
        </div>}
        {showFeedback&&phase!=="wrong"&&<div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
          {(phase==="correct"||phase==="revealed")&&contUci.length>0&&<button style={S.btnSm("#1e1e4a",contPlaying)} onClick={playCont} disabled={contPlaying}>{contPlaying?"Playing…":"▶ Show Line"}</button>}
          {phase==="cont"&&<button style={S.btnSm()} onClick={tryAgain}>⟳ Reset</button>}
          <button style={{...S.btn(),flex:2,marginTop:0,padding:"9px",fontSize:14}} onClick={nextPos} disabled={contPlaying}>{posIdx+1>=positions.length?"See Results →":"Next →"}</button>
        </div>}
        {phase==="waiting"&&<div style={{textAlign:"center",color:"#555",fontSize:12,marginTop:8}}>{pos.userSide==="w"?"White":"Black"} to play · Click piece → destination{attempts===1&&<span style={{color:"#f87171",marginLeft:8}}>⚠ Last attempt</span>}</div>}
      </div>
    </div>
  );

  // ── Summary ──
  if(screen===SCREEN.SUMMARY){
    const lc=accuracy>=70?15:accuracy>=50?0:-10;
    return(
      <div style={S.page}>
        <div style={{...S.card,maxWidth:500,textAlign:"center"}}>
          <div style={{fontSize:52,marginBottom:8}}>{accuracy>=70?"🏆":accuracy>=50?"💪":"📚"}</div>
          <h2 style={{...S.h2,textAlign:"center"}}>Session Complete!</h2>
          <div style={{background:"#252535",borderRadius:12,padding:20,margin:"14px 0"}}>
            <div style={{fontSize:52,fontWeight:900,color:accuracy>=70?"#4ade80":accuracy>=50?"#f59e0b":"#f87171"}}>{accuracy}%</div>
            <div style={{fontSize:13,color:"#888"}}>First-try accuracy</div>
          </div>
          <div style={{display:"flex",gap:10,marginBottom:14}}>
            <div style={S.statBox}><div style={{fontSize:11,color:"#666",fontWeight:700,textTransform:"uppercase"}}>Level</div><div style={{fontSize:20,fontWeight:800,color:lc>0?"#4ade80":lc<0?"#f87171":"#fff",marginTop:4}}>{lc>0?"↑":lc<0?"↓":"→"} {(level||1200)+lc}</div></div>
            <div style={S.statBox}><div style={{fontSize:11,color:"#666",fontWeight:700,textTransform:"uppercase"}}>XP</div><div style={{fontSize:20,fontWeight:800,color:"#6C63FF",marginTop:4}}>+{xp}</div></div>
            <div style={S.statBox}><div style={{fontSize:11,color:"#666",fontWeight:700,textTransform:"uppercase"}}>Correct</div><div style={{fontSize:20,fontWeight:800,color:"#fff",marginTop:4}}>{results.filter(r=>r.correct&&r.firstTry).length}/{results.length}</div></div>
          </div>
          <div style={{...S.prog,marginBottom:14}}><div style={S.progFill(xpPct,"linear-gradient(90deg,#6C63FF,#a89fff)")}/></div>
          {missedThemes.length>0&&<div style={{textAlign:"left",marginBottom:14}}>
            <div style={{fontSize:11,color:"#888",fontWeight:700,textTransform:"uppercase",marginBottom:6}}>Work On</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{missedThemes.map(t=><span key={t} style={S.badge("#f87171")}>{t}</span>)}</div>
          </div>}
          <button style={S.btn()} onClick={()=>setScreen(SCREEN.REVIEW)}>→ Review Mistakes</button>
          <button style={S.btnGhost()} onClick={()=>setScreen(SCREEN.DASH)}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  // ── Review ──
  if(screen===SCREEN.REVIEW){
    const wrong=results.filter(r=>!r.correct||!r.firstTry);
    const revPos=positions.filter(p=>wrong.find(x=>x.id===p.id));
    return(
      <div style={S.page}>
        <div style={{...S.card,maxWidth:540}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
            <h2 style={{...S.h2,margin:0}}>Mistake Review</h2>
            <span style={S.badge("#f87171")}>{revPos.length} puzzles</span>
          </div>
          {revPos.length===0
            ?<div style={{textAlign:"center",padding:"28px 0"}}><div style={{fontSize:40}}>🎯</div><p style={{color:"#888",marginTop:10}}>Perfect session!</p></div>
            :revPos.map(p=>{
              const r=wrong.find(x=>x.id===p.id);
              const reviewFen=p.setupMove?p.fen:p.fen;
              const bFrom=r?.bestMove?.slice(0,2),bTo=r?.bestMove?.slice(2,4);
              return(
                <div key={p.id} style={{background:"#252535",borderRadius:12,padding:14,marginBottom:10,display:"flex",gap:12,alignItems:"flex-start"}}>
                  <div style={{flexShrink:0}}>
                    <MiniBoard fenPos={reviewFen.split(" ")[0]} highlight={bFrom&&bTo?{from:bFrom,to:bTo}:null}/>
                    <div style={{fontSize:10,color:"#555",textAlign:"center",marginTop:2}}>★ {p.rating}</div>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",gap:6,marginBottom:6,flexWrap:"wrap"}}>
                      <span style={S.badge("#f87171")}>{p.appTheme}</span>
                      <span style={S.badge("#444")}>{p.concept}</span>
                    </div>
                    <p style={{color:"#ccc",fontSize:13,margin:"0 0 4px"}}>{p.prompt}</p>
                    <div style={{fontSize:13,color:"#888"}}>Best: <span style={{color:"#4ade80",fontWeight:700,fontFamily:"monospace"}}>{r?.bestMove||"—"}</span></div>
                  </div>
                </div>
              );
            })
          }
          <div style={{display:"flex",gap:8,marginTop:10}}>
            {revPos.length>0&&<button style={{...S.btn(),flex:2,marginTop:0}} onClick={startSession}>↺ Retry Session</button>}
            <button style={{...S.btnGhost(),flex:1,marginTop:0}} onClick={()=>setScreen(SCREEN.DASH)}>Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}