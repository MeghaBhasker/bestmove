import { useState, useRef, useCallback } from "react";

const THEMES = ["Blunders", "Strategy", "Endgames", "Calculation"];

const POSITIONS = [
  {
    id: 1,
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    prompt: "Find the best move for White.",
    bestMove: { from: "f3", to: "g5" },
    bestMoveLabel: "Ng5",
    concept: "Fork Threat",
    theme: "Calculation",
    explanation: "Ng5 attacks the undefended f7 pawn, threatening both Nxf7 (forking the queen and rook) and Bxf7+. This forces Black into a difficult defensive position.",
    wrongExplanation: "That move doesn't capitalize on the weakness of f7. White has a forcing sequence available — try moving the knight on f3.",
    evalDrop: -1.8,
    continuation: "After Ng5, Black must defend f7 carefully or face material loss."
  },
  {
    id: 2,
    fen: "r2q1rk1/ppp2ppp/2np1n2/2b1p1B1/2B1P1b1/2NP1N2/PPP2PPP/R2Q1RK1 w - - 0 8",
    prompt: "Find the best move for White.",
    bestMove: { from: "g5", to: "f6" },
    bestMoveLabel: "Bxf6",
    concept: "Bishop Trade for Attack",
    theme: "Strategy",
    explanation: "Bxf6 removes a key defender of the Black king. After gxf6, the h-file becomes weakened and White gains long-term attacking chances against the doubled pawns.",
    wrongExplanation: "That move doesn't address the structural imbalances. White should trade the bishop on g5 for the knight on f6.",
    evalDrop: -0.9,
    continuation: "After Bxf6 gxf6, White has Nd5 with a powerful knight outpost."
  },
  {
    id: 3,
    fen: "8/5pk1/6p1/8/5PKP/8/8/8 w - - 0 1",
    prompt: "King and pawn endgame — find the winning idea for White.",
    bestMove: { from: "f4", to: "g5" },
    bestMoveLabel: "Kg5",
    concept: "King Opposition",
    theme: "Endgames",
    explanation: "Kg5 seizes the opposition, forcing Black's king to give way. The White king penetrates to escort the h-pawn to promotion.",
    wrongExplanation: "That loses the opposition. In king and pawn endings, seizing the opposition is often the decisive factor. Try moving the king to g5.",
    evalDrop: -2.2,
    continuation: "After Kg5 Kg7 h5 gxh5 Kxh5, White queens first."
  },
  {
    id: 4,
    fen: "r1bq1rk1/pp2ppbp/2np1np1/8/3NP3/2N1BP2/PPP3PP/R2QKB1R w KQ - 0 9",
    prompt: "Find the prophylactic move for White.",
    bestMove: { from: "d4", to: "d5" },
    bestMoveLabel: "Nd5",
    concept: "Prophylaxis",
    theme: "Strategy",
    explanation: "Nd5 is a powerful centralizing move that also prevents Black from playing ...e5, which would give Black good counterplay in the center.",
    wrongExplanation: "That allows Black to seize the center with ...e5. Good players anticipate the opponent's plans — try the knight on d4.",
    evalDrop: -0.7,
    continuation: "After Nd5, White dominates the center and Black struggles for counterplay."
  },
  {
    id: 5,
    fen: "2r3k1/5ppp/p3p3/1p6/3R4/1P3PP1/P4KPP/8 w - - 0 1",
    prompt: "Find the most active rook move for White.",
    bestMove: { from: "d4", to: "d6" },
    bestMoveLabel: "Rd6",
    concept: "Rook Activity",
    theme: "Endgames",
    explanation: "Rd6 attacks the e6 pawn and ties down Black's rook to passive defense. Active rook placement is the #1 principle in rook endgames.",
    wrongExplanation: "Passive rook play loses in endgames. The rook must be active — try moving it to the 6th rank to attack the e6 pawn.",
    evalDrop: -1.1,
    continuation: "After Rd6, Black's rook must stay on c8 to defend e6, giving White a free king march."
  },
  {
    id: 6,
    fen: "r2qk2r/pb1nbppp/1p2pn2/2pP4/2P5/2NBPN2/PP3PPP/R1BQK2R w KQkq - 0 10",
    prompt: "What's the best central break for White?",
    bestMove: { from: "e3", to: "e4" },
    bestMoveLabel: "e4",
    concept: "Central Break",
    theme: "Calculation",
    explanation: "e4 is the thematic break in this structure. It fights for the center, opens lines for the bishops, and creates the threat of e5 to drive back the knight.",
    wrongExplanation: "That doesn't challenge Black's central control. White needs the e4 pawn break — try pushing the e3 pawn.",
    evalDrop: -0.6,
    continuation: "After e4, if cxd3 cxd3 gives White a strong pawn center and open c-file."
  }
];

// --- FEN parser ---
function parseFen(fen) {
  const rows = fen.split(" ")[0].split("/");
  const board = {};
  rows.forEach((row, ri) => {
    let ci = 0;
    for (const ch of row) {
      if (isNaN(ch)) {
        const file = String.fromCharCode(97 + ci);
        const rank = String(8 - ri);
        board[file + rank] = ch;
        ci++;
      } else {
        ci += parseInt(ch);
      }
    }
  });
  return board;
}

function applyMove(board, from, to) {
  const next = { ...board };
  next[to] = next[from];
  delete next[from];
  return next;
}

const PIECE_UNICODE = {
  K:"♔", Q:"♕", R:"♖", B:"♗", N:"♘", P:"♙",
  k:"♚", q:"♛", r:"♜", b:"♝", n:"♞", p:"♟"
};

const LIGHT_SQ = "#EEEED2";
const DARK_SQ  = "#769656";
const SEL_LIGHT = "#F6F669";
const SEL_DARK  = "#BACA2B";
const HINT_COLOR = "rgba(0,0,0,0.18)";

function ChessBoard({ fen, onMove, disabled }) {
  const [board, setBoard] = useState(() => parseFen(fen));
  const [selected, setSelected] = useState(null); // square string e.g. "e2"
  const [dragging, setDragging] = useState(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [lastMove, setLastMove] = useState(null);
  const boardRef = useRef(null);
  const SQ = 62;

  const files = ["a","b","c","d","e","f","g","h"];
  const ranks = ["8","7","6","5","4","3","2","1"];

  const squareFromCoords = useCallback((clientX, clientY) => {
    if (!boardRef.current) return null;
    const rect = boardRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const ci = Math.floor(x / SQ);
    const ri = Math.floor(y / SQ);
    if (ci < 0 || ci > 7 || ri < 0 || ri > 7) return null;
    return files[ci] + ranks[ri];
  }, [SQ]);

  const tryMove = useCallback((from, to) => {
    if (!from || !to || from === to) return false;
    const piece = board[from];
    if (!piece) return false;
    // Only allow white pieces to move (uppercase)
    if (piece !== piece.toUpperCase()) return false;
    const next = applyMove(board, from, to);
    setBoard(next);
    setLastMove({ from, to });
    onMove(from, to);
    return true;
  }, [board, onMove]);

  // Click-to-move
  const handleSquareClick = useCallback((sq) => {
    if (disabled) return;
    if (selected) {
      if (selected === sq) { setSelected(null); return; }
      const piece = board[selected];
      if (piece && piece === piece.toUpperCase()) {
        const moved = tryMove(selected, sq);
        setSelected(null);
        if (!moved && board[sq] && board[sq] === board[sq].toUpperCase()) {
          setSelected(sq);
        }
      } else {
        setSelected(null);
      }
    } else {
      const piece = board[sq];
      if (piece && piece === piece.toUpperCase()) setSelected(sq);
    }
  }, [disabled, selected, board, tryMove]);

  // Drag
  const handleMouseDown = useCallback((e, sq) => {
    if (disabled) return;
    const piece = board[sq];
    if (!piece || piece !== piece.toUpperCase()) return;
    e.preventDefault();
    setDragging(sq);
    setSelected(sq);
    setDragPos({ x: e.clientX, y: e.clientY });
  }, [disabled, board]);

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return;
    setDragPos({ x: e.clientX, y: e.clientY });
  }, [dragging]);

  const handleMouseUp = useCallback((e) => {
    if (!dragging) return;
    const to = squareFromCoords(e.clientX, e.clientY);
    if (to && to !== dragging) {
      tryMove(dragging, to);
      setSelected(null);
    }
    setDragging(null);
  }, [dragging, squareFromCoords, tryMove]);

  // Touch
  const handleTouchStart = useCallback((e, sq) => {
    if (disabled) return;
    const piece = board[sq];
    if (!piece || piece !== piece.toUpperCase()) return;
    setDragging(sq);
    setSelected(sq);
    const t = e.touches[0];
    setDragPos({ x: t.clientX, y: t.clientY });
  }, [disabled, board]);

  const handleTouchMove = useCallback((e) => {
    if (!dragging) return;
    e.preventDefault();
    const t = e.touches[0];
    setDragPos({ x: t.clientX, y: t.clientY });
  }, [dragging]);

  const handleTouchEnd = useCallback((e) => {
    if (!dragging) return;
    const t = e.changedTouches[0];
    const to = squareFromCoords(t.clientX, t.clientY);
    if (to && to !== dragging) {
      tryMove(dragging, to);
      setSelected(null);
    }
    setDragging(null);
  }, [dragging, squareFromCoords, tryMove]);

  const draggedPiece = dragging ? board[dragging] : null;

  return (
    <div
      style={{ position: "relative", userSelect: "none", touchAction: "none" }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        ref={boardRef}
        style={{
          display: "inline-block",
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: "0 4px 24px rgba(0,0,0,0.55)",
          border: "2px solid #222",
          cursor: disabled ? "default" : "grab",
        }}
      >
        {ranks.map((rank, ri) => (
          <div key={rank} style={{ display: "flex" }}>
            {files.map((file, ci) => {
              const sq = file + rank;
              const isLight = (ri + ci) % 2 === 0;
              const bg = isLight ? LIGHT_SQ : DARK_SQ;
              const isSelected = selected === sq;
              const isLastFrom = lastMove?.from === sq;
              const isLastTo = lastMove?.to === sq;
              const piece = board[sq];
              const isBeingDragged = dragging === sq;

              let sqBg = bg;
              if (isSelected) sqBg = isLight ? SEL_LIGHT : SEL_DARK;
              else if (isLastFrom || isLastTo) sqBg = isLight ? "#CDD26A" : "#AABA44";

              const coordColor = isLight ? DARK_SQ : LIGHT_SQ;

              return (
                <div
                  key={sq}
                  onClick={() => handleSquareClick(sq)}
                  onMouseDown={(e) => handleMouseDown(e, sq)}
                  onTouchStart={(e) => handleTouchStart(e, sq)}
                  style={{
                    width: SQ, height: SQ,
                    background: sqBg,
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    cursor: piece && piece === piece.toUpperCase() && !disabled ? "grab" : "default",
                  }}
                >
                  {ci === 0 && (
                    <span style={{ position:"absolute", top:2, left:3, fontSize:10, fontWeight:700, color:coordColor, zIndex:1, pointerEvents:"none" }}>
                      {rank}
                    </span>
                  )}
                  {ri === 7 && (
                    <span style={{ position:"absolute", bottom:2, right:4, fontSize:10, fontWeight:700, color:coordColor, zIndex:1, pointerEvents:"none" }}>
                      {file}
                    </span>
                  )}
                  {/* Dot hint when piece selected */}
                  {selected && !isBeingDragged && !piece && !disabled && (
                    <div style={{ width:20, height:20, borderRadius:"50%", background:HINT_COLOR, pointerEvents:"none" }} />
                  )}
                  {selected && !isBeingDragged && piece && !disabled && piece !== piece.toUpperCase() && (
                    <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:`4px solid ${HINT_COLOR}`, pointerEvents:"none", zIndex:2 }} />
                  )}
                  {piece && !isBeingDragged && (
                    <span style={{
                      fontSize: SQ * 0.74,
                      lineHeight: 1,
                      display: "block",
                      color: piece === piece.toUpperCase() ? "#fff" : "#1a1a1a",
                      textShadow: piece === piece.toUpperCase()
                        ? "0 0 2px #000,0 0 3px #000,1px 1px 0 #555,-1px -1px 0 #555"
                        : "0 0 2px rgba(255,255,255,0.2)",
                      pointerEvents: "none",
                      zIndex: 3,
                      position: "relative",
                    }}>
                      {PIECE_UNICODE[piece]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Floating dragged piece */}
      {dragging && draggedPiece && (
        <span style={{
          position: "fixed",
          left: dragPos.x - SQ / 2,
          top: dragPos.y - SQ / 2,
          width: SQ, height: SQ,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: SQ * 0.82,
          lineHeight: 1,
          color: draggedPiece === draggedPiece.toUpperCase() ? "#fff" : "#1a1a1a",
          textShadow: draggedPiece === draggedPiece.toUpperCase()
            ? "0 0 3px #000,0 0 5px #000,1px 1px 0 #555"
            : "0 0 3px rgba(255,255,255,0.3)",
          pointerEvents: "none",
          zIndex: 9999,
          filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.5))",
          cursor: "grabbing",
        }}>
          {PIECE_UNICODE[draggedPiece]}
        </span>
      )}
    </div>
  );
}

// ---- Main App ----
const SCREEN = { HOME:"home", ONBOARD1:"onboard1", ONBOARD2:"onboard2", DASH:"dash", SESSION:"session", SUMMARY:"summary", REVIEW:"review" };

export default function BestMove() {
  const [screen, setScreen] = useState(SCREEN.HOME);
  const [rating, setRating] = useState("");
  const [timePerDay, setTimePerDay] = useState(null);
  const [struggles, setStruggles] = useState([]);
  const [level, setLevel] = useState(null);
  const [streak] = useState(3);

  const [posIdx, setPosIdx] = useState(0);
  const [moveResult, setMoveResult] = useState(null); // null | "correct" | "wrong"
  const [results, setResults] = useState([]);
  const [boardKey, setBoardKey] = useState(0); // force re-mount board on next position

  const pos = POSITIONS[posIdx];
  const accuracy = results.length ? Math.round(results.filter(r => r.correct && r.firstTry).length / results.length * 100) : 0;
  const missedThemes = [...new Set(results.filter(r => !r.correct || !r.firstTry).map(r => r.theme))];

  function generateLevel() {
    const base = parseInt(rating) || 1200;
    setLevel(Math.max(800, Math.min(1500, base - 80 + Math.floor(Math.random() * 40))));
  }

  const handleMove = useCallback((from, to) => {
    if (moveResult === "correct") return;
    const best = pos.bestMove;
    const isCorrect = from === best.from && to === best.to;
    setMoveResult(isCorrect ? "correct" : "wrong");
    const isFirstTry = moveResult === null;
    if (isFirstTry) {
      setResults(prev => [...prev, { id: pos.id, correct: isCorrect, firstTry: true, theme: pos.theme }]);
    }
  }, [pos, moveResult]);

  function nextPosition() {
    setMoveResult(null);
    setBoardKey(k => k + 1);
    if (posIdx + 1 >= POSITIONS.length) {
      setScreen(SCREEN.SUMMARY);
    } else {
      setPosIdx(i => i + 1);
    }
  }

  function startSession() {
    setPosIdx(0);
    setMoveResult(null);
    setBoardKey(k => k + 1);
    setResults([]);
    setScreen(SCREEN.SESSION);
  }

  const s = {
    page: { minHeight:"100vh", background:"#0f0f13", color:"#e8e8e8", fontFamily:"'Segoe UI',system-ui,sans-serif", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px 16px" },
    card: { background:"#1a1a24", borderRadius:16, padding:"32px 28px", maxWidth:500, width:"100%", boxShadow:"0 8px 40px rgba(0,0,0,0.5)" },
    h1: { fontSize:32, fontWeight:800, color:"#fff", margin:0, letterSpacing:"-0.5px" },
    h2: { fontSize:22, fontWeight:700, color:"#fff", margin:"0 0 8px" },
    sub: { color:"#888", fontSize:15, marginTop:8, lineHeight:1.5 },
    btn: { background:"linear-gradient(135deg,#6C63FF,#4F46E5)", color:"#fff", border:"none", borderRadius:10, padding:"14px 28px", fontSize:16, fontWeight:700, cursor:"pointer", width:"100%", marginTop:16 },
    btnSec: { background:"#252535", color:"#ccc", border:"1px solid #333", borderRadius:10, padding:"12px 24px", fontSize:14, fontWeight:600, cursor:"pointer", width:"100%", marginTop:8 },
    input: { width:"100%", background:"#252535", border:"1px solid #333", borderRadius:8, padding:"12px 14px", color:"#fff", fontSize:16, outline:"none", boxSizing:"border-box" },
    label: { fontSize:13, color:"#888", marginBottom:6, display:"block", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px" },
    chip: (a) => ({ padding:"10px 18px", borderRadius:8, border:a?"2px solid #6C63FF":"1px solid #333", background:a?"#2a2a4a":"#252535", color:a?"#a89fff":"#999", cursor:"pointer", fontSize:14, fontWeight:600 }),
    badge: (color) => ({ display:"inline-block", padding:"4px 10px", borderRadius:20, fontSize:12, fontWeight:700, background:color+"22", color, border:`1px solid ${color}44` }),
    statBox: { background:"#252535", borderRadius:12, padding:"16px 20px", flex:1 },
    progress: { height:6, background:"#252535", borderRadius:3, overflow:"hidden", marginTop:12 },
    pFill: (pct) => ({ height:"100%", width:`${pct}%`, background:"#6C63FF", borderRadius:3, transition:"width .4s" }),
    correct: { background:"#0d2a1a", border:"1px solid #1a5c33", borderRadius:12, padding:16, marginTop:16 },
    wrong: { background:"#2a0d0d", border:"1px solid #5c1a1a", borderRadius:12, padding:16, marginTop:16 },
  };

  if (screen === SCREEN.HOME) return (
    <div style={s.page}>
      <div style={{...s.card, textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:12}}>♟</div>
        <h1 style={s.h1}>BestMove</h1>
        <p style={{...s.sub,fontSize:17,maxWidth:320,margin:"12px auto 0"}}>Train your brain to find the best move in any position.</p>
        <button style={s.btn} onClick={()=>setScreen(SCREEN.ONBOARD1)}>→ Start Training</button>
        <p style={{...s.sub,fontSize:13,marginTop:16}}>Built for 1000–1500 rated players · 6 positions per day</p>
      </div>
    </div>
  );

  if (screen === SCREEN.ONBOARD1) return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:24}}>
          <span style={{fontSize:22}}>♟</span><span style={{fontWeight:800,fontSize:18}}>BestMove</span>
          <span style={{...s.badge("#6C63FF"),marginLeft:"auto"}}>1 of 2</span>
        </div>
        <h2 style={s.h2}>Let's calibrate your training</h2>
        <div style={{marginTop:24}}>
          <label style={s.label}>Your current chess rating</label>
          <input style={s.input} type="number" placeholder="e.g. 1150" value={rating} onChange={e=>setRating(e.target.value)}/>
        </div>
        <div style={{marginTop:20}}>
          <label style={s.label}>Daily training time</label>
          <div style={{display:"flex",gap:8,marginTop:4}}>
            {[5,10,15].map(t=>(
              <button key={t} style={{...s.chip(timePerDay===t),flex:1}} onClick={()=>setTimePerDay(t)}>{t} min</button>
            ))}
          </div>
        </div>
        <button style={{...s.btn,opacity:rating&&timePerDay?1:0.4}} disabled={!rating||!timePerDay} onClick={()=>setScreen(SCREEN.ONBOARD2)}>Continue →</button>
      </div>
    </div>
  );

  if (screen === SCREEN.ONBOARD2) return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:24}}>
          <span style={{fontSize:22}}>♟</span><span style={{fontWeight:800,fontSize:18}}>BestMove</span>
          <span style={{...s.badge("#6C63FF"),marginLeft:"auto"}}>2 of 2</span>
        </div>
        <h2 style={s.h2}>What do you struggle with most?</h2>
        <p style={s.sub}>Select all that apply.</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:20}}>
          {THEMES.map(t=>(
            <button key={t} style={s.chip(struggles.includes(t))} onClick={()=>setStruggles(p=>p.includes(t)?p.filter(x=>x!==t):[...p,t])}>
              {t==="Blunders"?"⚡":t==="Strategy"?"🧭":t==="Endgames"?"🏁":"🔢"} {t}
            </button>
          ))}
        </div>
        <button style={{...s.btn,opacity:struggles.length?1:0.4}} disabled={!struggles.length} onClick={()=>{generateLevel();setScreen(SCREEN.DASH);}}>
          → Generate My BestMove Level
        </button>
      </div>
    </div>
  );

  if (screen === SCREEN.DASH) return (
    <div style={s.page}>
      <div style={{...s.card,maxWidth:520}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:22}}>♟</span><span style={{fontWeight:800,fontSize:18}}>BestMove</span></div>
          <span style={{fontSize:13,color:"#888"}}>🔥 {streak} day streak</span>
        </div>
        <div style={{background:"linear-gradient(135deg,#2a2a4a,#1e1e32)",borderRadius:14,padding:"20px 24px",marginBottom:20}}>
          <div style={{fontSize:12,color:"#888",textTransform:"uppercase",letterSpacing:"0.5px",fontWeight:600}}>Your BestMove Level</div>
          <div style={{fontSize:52,fontWeight:900,color:"#a89fff",lineHeight:1.1,margin:"4px 0"}}>{level}</div>
          <div style={{fontSize:13,color:"#666"}}>Based on rating {rating} · {struggles.join(", ")} focus</div>
        </div>
        <div style={{display:"flex",gap:12,marginBottom:20}}>
          <div style={s.statBox}><div style={{fontSize:11,color:"#666",fontWeight:700,textTransform:"uppercase"}}>Today</div><div style={{fontSize:26,fontWeight:800,color:"#fff",marginTop:4}}>6</div><div style={{fontSize:12,color:"#888"}}>positions</div></div>
          <div style={s.statBox}><div style={{fontSize:11,color:"#666",fontWeight:700,textTransform:"uppercase"}}>Accuracy</div><div style={{fontSize:26,fontWeight:800,color:"#4ade80",marginTop:4}}>—</div></div>
          <div style={s.statBox}><div style={{fontSize:11,color:"#666",fontWeight:700,textTransform:"uppercase"}}>Streak</div><div style={{fontSize:26,fontWeight:800,color:"#f59e0b",marginTop:4}}>🔥{streak}</div></div>
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:12,color:"#888",fontWeight:600,marginBottom:10,textTransform:"uppercase"}}>Weakness Themes</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{struggles.map(t=><span key={t} style={s.badge("#f87171")}>{t}</span>)}</div>
        </div>
        <button style={s.btn} onClick={startSession}>→ Start Daily Path</button>
      </div>
    </div>
  );

  if (screen === SCREEN.SESSION) return (
    <div style={s.page}>
      <div style={{...s.card,maxWidth:560}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <span style={{fontWeight:800,fontSize:16}}>♟ BestMove</span>
          <span style={{fontSize:13,color:"#888"}}>Position {posIdx+1} / {POSITIONS.length}</span>
        </div>
        <div style={s.progress}><div style={s.pFill((posIdx/POSITIONS.length)*100)}/></div>
        <div style={{margin:"16px 0 6px",display:"flex",gap:8,flexWrap:"wrap"}}>
          <span style={s.badge("#6C63FF")}>{pos.theme}</span>
          <span style={s.badge("#888")}>{pos.concept}</span>
        </div>
        <p style={{color:"#ccc",fontSize:15,margin:"0 0 16px",lineHeight:1.5}}>{pos.prompt}</p>
        <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
          <ChessBoard
            key={boardKey}
            fen={pos.fen}
            onMove={handleMove}
            disabled={moveResult === "correct"}
          />
        </div>

        {!moveResult && (
          <div style={{textAlign:"center",color:"#666",fontSize:13,marginTop:4}}>
            Drag or click a piece to move · White to play
          </div>
        )}

        {moveResult === "correct" && (
          <div style={s.correct}>
            <div style={{fontWeight:700,fontSize:14,color:"#4ade80",marginBottom:6}}>✓ Correct! {pos.concept}</div>
            <div style={{fontSize:14,color:"#ccc",lineHeight:1.6}}>{pos.explanation}</div>
            <div style={{marginTop:8,fontSize:13,color:"#888",fontStyle:"italic"}}>{pos.continuation}</div>
          </div>
        )}

        {moveResult === "wrong" && (
          <div style={s.wrong}>
            <div style={{fontWeight:700,fontSize:14,color:"#f87171",marginBottom:6}}>✗ Not quite — {pos.concept}</div>
            <div style={{fontSize:14,color:"#ccc",lineHeight:1.6}}>{pos.wrongExplanation}</div>
            <div style={{marginTop:8,fontSize:13,color:"#888"}}>Eval drop: <span style={{color:"#f87171",fontWeight:700}}>{pos.evalDrop} pawns</span></div>
          </div>
        )}

        {moveResult && (
          <div style={{display:"flex",gap:8,marginTop:14}}>
            {moveResult === "wrong" && (
              <button style={{...s.btnSec,flex:1,marginTop:0}} onClick={()=>{setMoveResult(null);setBoardKey(k=>k+1);}}>
                ↺ Try Again
              </button>
            )}
            <button style={{...s.btn,flex:2,marginTop:0}} onClick={nextPosition}>
              {posIdx+1>=POSITIONS.length?"See Results →":"Next Position →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (screen === SCREEN.SUMMARY) {
    const levelChange = accuracy>=70?15:accuracy>=50?0:-10;
    const newLevel = level+levelChange;
    return (
      <div style={s.page}>
        <div style={{...s.card,maxWidth:500,textAlign:"center"}}>
          <div style={{fontSize:48,marginBottom:8}}>{accuracy>=70?"🏆":accuracy>=50?"💪":"📚"}</div>
          <h2 style={s.h2}>Session Complete!</h2>
          <div style={{background:"#252535",borderRadius:12,padding:"20px",margin:"20px 0"}}>
            <div style={{fontSize:52,fontWeight:900,color:accuracy>=70?"#4ade80":accuracy>=50?"#f59e0b":"#f87171"}}>{accuracy}%</div>
            <div style={{fontSize:14,color:"#888"}}>First-try accuracy</div>
          </div>
          <div style={{display:"flex",gap:12,marginBottom:20}}>
            <div style={{...s.statBox,textAlign:"center"}}>
              <div style={{fontSize:11,color:"#666",fontWeight:700,textTransform:"uppercase"}}>Level</div>
              <div style={{fontSize:22,fontWeight:800,color:levelChange>0?"#4ade80":levelChange<0?"#f87171":"#fff",marginTop:4}}>
                {levelChange>0?"↑":levelChange<0?"↓":"→"} {newLevel}
              </div>
              <div style={{fontSize:12,color:"#888"}}>{levelChange>0?`+${levelChange}`:levelChange}</div>
            </div>
            <div style={{...s.statBox,textAlign:"center"}}>
              <div style={{fontSize:11,color:"#666",fontWeight:700,textTransform:"uppercase"}}>Correct</div>
              <div style={{fontSize:22,fontWeight:800,color:"#fff",marginTop:4}}>{results.filter(r=>r.correct&&r.firstTry).length} / {results.length}</div>
            </div>
          </div>
          {missedThemes.length>0&&(
            <div style={{textAlign:"left",marginBottom:20}}>
              <div style={{fontSize:12,color:"#888",fontWeight:700,textTransform:"uppercase",marginBottom:8}}>Themes to Work On</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{missedThemes.map(t=><span key={t} style={s.badge("#f87171")}>{t}</span>)}</div>
            </div>
          )}
          {accuracy>=60&&<div style={{background:"#0d2a1a",border:"1px solid #1a5c33",borderRadius:10,padding:"12px 16px",fontSize:14,color:"#4ade80",marginBottom:16}}>
            ✓ You improved in: {results.filter(r=>r.correct&&r.firstTry).map(r=>r.theme)[0]||"Calculation"}
          </div>}
          <button style={s.btn} onClick={()=>setScreen(SCREEN.REVIEW)}>→ Review Mistakes</button>
          <button style={s.btnSec} onClick={()=>setScreen(SCREEN.DASH)}>End Session</button>
        </div>
      </div>
    );
  }

  if (screen === SCREEN.REVIEW) {
    const wrongIds = results.filter(r=>!r.correct||!r.firstTry).map(r=>r.id);
    const reviewPositions = POSITIONS.filter(p=>wrongIds.includes(p.id));
    return (
      <div style={s.page}>
        <div style={{...s.card,maxWidth:500}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <h2 style={{...s.h2,margin:0}}>Mistake Review</h2>
            <span style={s.badge("#f87171")}>{reviewPositions.length} positions</span>
          </div>
          {reviewPositions.length===0?(
            <div style={{textAlign:"center",padding:"32px 0"}}>
              <div style={{fontSize:40}}>🎯</div>
              <p style={{color:"#888",marginTop:12}}>No mistakes! Perfect session.</p>
            </div>
          ):reviewPositions.map(p=>(
            <div key={p.id} style={{background:"#252535",borderRadius:12,padding:16,marginBottom:12}}>
              <div style={{display:"flex",gap:8,marginBottom:8}}>
                <span style={s.badge("#f87171")}>{p.theme}</span>
                <span style={s.badge("#888")}>{p.concept}</span>
              </div>
              <p style={{color:"#ccc",fontSize:14,margin:"0 0 8px"}}>{p.prompt}</p>
              <div style={{fontSize:14,color:"#888",lineHeight:1.5}}>
                <span style={{color:"#4ade80",fontWeight:700}}>Best move: {p.bestMoveLabel}</span><br/>
                {p.explanation}
              </div>
            </div>
          ))}
          <div style={{display:"flex",gap:8,marginTop:8}}>
            {reviewPositions.length>0&&<button style={{...s.btn,flex:2,marginTop:0}} onClick={startSession}>Reattempt Weak Themes</button>}
            <button style={{...s.btnSec,flex:1}} onClick={()=>setScreen(SCREEN.DASH)}>Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}