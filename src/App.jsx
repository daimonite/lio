import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";

/* ------------------------------------------------------------------
   THREAD & HEART — an animated love letter
   Signature idea: the poem's own metaphor (a torn heart, mended with
   yarn/stitches) becomes the interactive object. A stitched heart
   seals the closed letter; as the poem types itself out, the thread
   redraws itself around the heart, so by the last line the heart is
   fully "mended" and glows. Everything else (stars, drifting hearts,
   parchment card) stays quiet so that idea can carry the page.
------------------------------------------------------------------- */

const POEM_LINES = [
  "You once asked how could i love someone like you …like I didn’t leave out any clues",
  "And come on ..just look at you …. so damn beautiful…how can anyone not fall too..",
  "The very thought of you brightens my mood …the sound of your voice makes me feel good ..",
  "You are someone i nvr want to lose ….and i do hope dreams come true …because i had one where i was someone to you",
  "",
  "My heart is shattered, in more pieces than two,",
  "I tried mending with glue, but it just won’t do.",
  "So, doc, I’m here, needing stitches from you,",
  "Thread me with yarn, knit the pieces through.",
  "Bind every fragment, weave them tight,",
  "Patch up the cracks, make wrongs feel right.",
  "A sweater once torn, now warm as new,",
  "Held by the yarn of love—and you.",
  "",
  "I cant always be alex ….i dont always have the courage ..especially when I know i cant make it perfect",
  "Yes i mess things up …thats why i don want it yo be with your heart",
  "You say you are confused ..,moody ..,anxious..annoying…turn the other side of the coin…and i see that you are smart …,and ooh that singing voice …aaah your way with words..your laugh …your smile…your little nose..and ur taste in the old shows ..",
  "You are selina kyle to my bruce wayne …marinette to my adrien…lois lane to my Clark kent ..i wish our story was the kind that nvr ends ..",
];

const SIGNATURE = "~lio~";

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);
  return reduced;
}

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function StitchedHeart({ progress, size = 120, sealed = false, className = "" }) {
  const stitchCount = 6;
  const heartPath =
    "M50,88 C50,88 8,58 8,33 C8,17 21,6 36,6 C44,6 50,12 50,19 C50,12 56,6 64,6 C79,6 92,17 92,33 C92,58 50,88 50,88 Z";

  return (
    <svg
      viewBox="0 0 100 96"
      width={size}
      height={size * 0.96}
      className={`tl-heart ${className}`}
      role="img"
      aria-label={sealed ? "Sealed heart, tap to open" : "Heart mending as the letter is read"}
    >
      <path d={heartPath} className="tl-heart-base" />
      <path
        d={heartPath}
        pathLength="1"
        className="tl-heart-thread"
        style={{
          strokeDasharray: 1,
          strokeDashoffset: 1 - progress,
        }}
      />
      {Array.from({ length: stitchCount }).map((_, i) => {
        const y = 22 + i * 9;
        const on = progress > (i + 0.5) / stitchCount;
        return (
          <line
            key={i}
            x1={46 - (i % 2 === 0 ? 4 : 2)}
            y1={y}
            x2={54 + (i % 2 === 0 ? 4 : 2)}
            y2={y + 5}
            className="tl-stitch"
            style={{ opacity: on ? 1 : 0 }}
          />
        );
      })}
    </svg>
  );
}

export default function LoveLetterSite() {
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [burst, setBurst] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardWrapRef = useRef(null);
  const scrollRef = useRef(null);
  const timerRef = useRef(null);

  const totalChars = useMemo(
    () => POEM_LINES.reduce((sum, l) => sum + Math.max(l.length, 1), 0),
    []
  );

  const typedSoFar = useMemo(() => {
    let sum = 0;
    for (let i = 0; i < lineIdx; i++) sum += Math.max(POEM_LINES[i].length, 1);
    return sum + charIdx;
  }, [lineIdx, charIdx]);

  const progress = done ? 1 : Math.min(typedSoFar / totalChars, 0.98);

  const stars = useMemo(() => {
    const rnd = seeded(7);
    return Array.from({ length: 46 }).map((_, i) => ({
      id: i,
      left: rnd() * 100,
      top: rnd() * 100,
      size: 1 + rnd() * 2,
      delay: rnd() * 6,
      dur: 3 + rnd() * 4,
    }));
  }, []);

  const drifters = useMemo(() => {
    const rnd = seeded(42);
    return Array.from({ length: 14 }).map((_, i) => ({
      id: i,
      left: rnd() * 100,
      size: 10 + rnd() * 16,
      delay: rnd() * 10,
      dur: 12 + rnd() * 10,
      drift: (rnd() - 0.5) * 60,
    }));
  }, []);

  const confetti = useMemo(() => {
    const rnd = seeded(101 + burst);
    if (!burst) return [];
    return Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      angle: (360 / 18) * i + rnd() * 12,
      dist: 60 + rnd() * 70,
      size: 8 + rnd() * 10,
      dur: 0.8 + rnd() * 0.6,
    }));
  }, [burst]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Extra holds on the lines that are the actual emotional turns —
  // not just "read slower everywhere," but a real beat where it matters.
  const LINE_HOLD = { 12: 950, 17: 1500 };
  const BASE_CHAR_DELAY = 38;

  // Pause AFTER the character just typed, based on what it was and
  // what's coming next — so a run of dots ("…") reads as one held
  // breath instead of several stutter-stops, a comma gets a short
  // lift, and a period/ellipsis/! gets a real stop.
  const extraCharPause = (justTyped, upcoming) => {
    if (!justTyped) return 0;
    if (justTyped === ",") return 190;
    if (justTyped === "!" || justTyped === "?") return 400;
    if (justTyped === "." || justTyped === "…") {
      if (upcoming === "." || upcoming === "…") return 25; // mid-run, keep going
      return 430; // end of the pause
    }
    return 0;
  };

  const endOfLinePause = (line, idx) => {
    if (line.length === 0) return 950; // stanza breath
    const base = 480 + Math.min(line.length * 3, 380);
    return base + (LINE_HOLD[idx] || 0);
  };

  useEffect(() => {
    if (!open) return;
    if (reducedMotion) {
      setLineIdx(POEM_LINES.length);
      setDone(true);
      return;
    }
    if (lineIdx >= POEM_LINES.length) {
      if (!done) setDone(true);
      return;
    }
    const line = POEM_LINES[lineIdx];
    if (charIdx < line.length) {
      const justTyped = charIdx > 0 ? line[charIdx - 1] : undefined;
      const upcoming = line[charIdx];
      const jitter = Math.random() * 14 - 7;
      const delay =
        BASE_CHAR_DELAY + extraCharPause(justTyped, upcoming) + jitter;
      timerRef.current = setTimeout(
        () => setCharIdx((c) => c + 1),
        Math.max(delay, 16)
      );
    } else {
      timerRef.current = setTimeout(() => {
        setLineIdx((l) => l + 1);
        setCharIdx(0);
      }, endOfLinePause(line, lineIdx));
    }
    return clearTimer;
  }, [open, lineIdx, charIdx, reducedMotion, done, clearTimer]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lineIdx, charIdx]);

  const handleOpen = () => {
    if (open) return;
    setOpen(true);
  };

  const handleSkip = () => {
    clearTimer();
    setLineIdx(POEM_LINES.length);
    setCharIdx(0);
    setDone(true);
  };

  const handleReplay = () => {
    clearTimer();
    setDone(false);
    setLineIdx(0);
    setCharIdx(0);
  };

  const handleMouseMove = (e) => {
    if (open || reducedMotion || !cardWrapRef.current) return;
    const rect = cardWrapRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -14, y: px * 16 });
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  return (
    <div className="tl-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,500&family=Caveat:wght@500;700&family=Playfair+Display:ital,wght@0,600;1,500&display=swap');

        .tl-root {
          --ink: #f4e9ec;
          --wine: #4a1030;
          --wine-deep: #22071a;
          --gold: #d8b46a;
          --gold-soft: #e9d3a3;
          --rose: #e78ba0;
          --paper: #f6ecd9;
          --paper-shadow: #d8c7a4;
          position: relative;
          min-height: 100vh;
          width: 100%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 16px;
          background: radial-gradient(ellipse at 50% 20%, #3a1230 0%, var(--wine-deep) 55%, #12040d 100%);
          font-family: 'Cormorant Garamond', serif;
          box-sizing: border-box;
        }
        .tl-root * { box-sizing: border-box; }

        .tl-stars { position: absolute; inset: 0; pointer-events: none; }
        .tl-star {
          position: absolute; border-radius: 50%;
          background: var(--gold-soft);
          animation: tl-twinkle ease-in-out infinite;
        }
        @keyframes tl-twinkle {
          0%, 100% { opacity: 0.15; transform: scale(0.8); }
          50% { opacity: 0.9; transform: scale(1.15); }
        }

        .tl-drifters { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
        .tl-drifter {
          position: absolute; bottom: -40px; opacity: 0;
          color: var(--rose);
          animation: tl-drift linear infinite;
        }
        @keyframes tl-drift {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.55; }
          90% { opacity: 0.4; }
          100% { transform: translate(var(--dx), -115vh) rotate(25deg); opacity: 0; }
        }

        .tl-scene {
          position: relative;
          width: min(92vw, 560px);
          perspective: 1800px;
          z-index: 2;
        }

        .tl-heading {
          text-align: center;
          color: var(--gold-soft);
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-weight: 500;
          letter-spacing: 0.06em;
          font-size: clamp(1rem, 2.4vw, 1.25rem);
          margin-bottom: 22px;
          opacity: 0.85;
        }

        .tl-card-wrap {
          position: relative;
          width: 100%;
          height: min(78vh, 640px);
          transform-style: preserve-3d;
        }

        .tl-card {
          position: absolute;
          inset: 0;
          border-radius: 18px;
          transform-style: preserve-3d;
          transition: transform 1.1s cubic-bezier(.22,.85,.32,1.15);
          transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
        }
        .tl-card.tl-open {
          transform: rotateY(180deg);
        }

        .tl-face {
          position: absolute;
          inset: 0;
          border-radius: 18px;
          backface-visibility: hidden;
          overflow: hidden;
          box-shadow: 0 30px 60px -20px rgba(0,0,0,0.65), 0 0 0 1px rgba(216,180,106,0.25);
        }

        .tl-face-front {
          background:
            radial-gradient(circle at 30% 20%, rgba(255,255,255,0.06), transparent 40%),
            linear-gradient(155deg, #5c1c3c 0%, #3a0f28 60%, #240a1b 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 22px;
          cursor: pointer;
          border: 1px solid rgba(216,180,106,0.35);
        }
        .tl-face-front:before {
          content: '';
          position: absolute; inset: 10px;
          border: 1px solid rgba(216,180,106,0.25);
          border-radius: 12px;
          pointer-events: none;
        }

        .tl-seal-label {
          font-family: 'Caveat', cursive;
          font-size: clamp(1.4rem, 4vw, 1.9rem);
          color: var(--gold-soft);
          opacity: 0.9;
        }
        .tl-seal-sub {
          font-size: 0.85rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(244,233,236,0.55);
        }

        .tl-heart { transition: transform 0.3s ease; }
        .tl-face-front button.tl-seal-btn {
          background: none; border: none; padding: 14px; cursor: pointer;
          border-radius: 50%;
          transition: transform 0.25s ease, filter 0.25s ease;
        }
        .tl-face-front button.tl-seal-btn:hover .tl-heart,
        .tl-face-front button.tl-seal-btn:focus-visible .tl-heart {
          transform: scale(1.06);
          filter: drop-shadow(0 0 14px rgba(216,180,106,0.55));
        }
        .tl-face-front button.tl-seal-btn:focus-visible {
          outline: 2px solid var(--gold-soft);
          outline-offset: 4px;
        }

        .tl-heart-base { fill: rgba(231,139,160,0.12); stroke: rgba(231,139,160,0.35); stroke-width: 1.4; }
        .tl-heart-thread { fill: none; stroke: var(--gold); stroke-width: 2.4; stroke-linecap: round; filter: drop-shadow(0 0 3px rgba(216,180,106,0.5)); transition: stroke-dashoffset 0.05s linear; }
        .tl-stitch { stroke: var(--gold-soft); stroke-width: 1.6; stroke-linecap: round; transition: opacity 0.4s ease; }

        .tl-face-back {
          background:
            repeating-linear-gradient(180deg, transparent 0 34px, rgba(180,150,90,0.06) 34px 35px),
            linear-gradient(160deg, var(--paper) 0%, #efe0c2 100%);
          transform: rotateY(180deg);
          display: flex;
          flex-direction: column;
          border: 1px solid rgba(90,50,20,0.2);
        }

        .tl-back-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 22px 8px;
          flex-shrink: 0;
        }
        .tl-back-header .tl-mark {
          font-family: 'Caveat', cursive;
          font-size: 1.2rem;
          color: #7a3b1f;
          opacity: 0.7;
        }
        .tl-mini-heart { width: 30px; }

        .tl-letter-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 4px 26px 20px;
          scrollbar-width: thin;
          scrollbar-color: #c9a066 transparent;
        }
        .tl-letter-scroll::-webkit-scrollbar { width: 6px; }
        .tl-letter-scroll::-webkit-scrollbar-thumb { background: #c9a066; border-radius: 4px; }

        .tl-poem-line {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: clamp(1rem, 2.1vw, 1.18rem);
          line-height: 1.75;
          color: #4a2c14;
          margin: 0 0 4px;
          min-height: 1.3em;
        }
        .tl-cursor {
          display: inline-block;
          width: 2px; height: 1em;
          background: #7a3b1f;
          margin-left: 2px;
          animation: tl-blink 0.9s steps(1) infinite;
          transform: translateY(2px);
        }
        @keyframes tl-blink { 50% { opacity: 0; } }

        .tl-signature {
          font-family: 'Caveat', cursive;
          font-size: clamp(1.8rem, 5vw, 2.4rem);
          color: #7a3b1f;
          text-align: right;
          margin-top: 14px;
          opacity: 0;
          transform: translateY(6px);
          animation: tl-fade-up 0.9s ease forwards;
        }
        @keyframes tl-fade-up { to { opacity: 1; transform: translateY(0); } }

        .tl-controls {
          display: flex;
          justify-content: center;
          gap: 12px;
          padding: 12px 20px 18px;
          flex-shrink: 0;
          border-top: 1px solid rgba(90,50,20,0.12);
        }
        .tl-btn {
          font-family: 'Cormorant Garamond', serif;
          font-size: 0.9rem;
          letter-spacing: 0.06em;
          background: transparent;
          border: 1px solid #a97a45;
          color: #6b3a1c;
          padding: 7px 16px;
          border-radius: 999px;
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease;
        }
        .tl-btn:hover { background: #a97a45; color: #fff8ec; }

        .tl-mend-heart-holder {
          position: absolute;
          bottom: -18px;
          right: -18px;
          width: 64px;
          transform: rotateY(180deg);
          filter: drop-shadow(0 6px 12px rgba(0,0,0,0.25));
        }

        .tl-confetti-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 5;
        }
        .tl-confetti-piece {
          position: absolute;
          top: 50%; left: 50%;
          color: var(--rose);
          animation: tl-burst ease-out forwards;
        }
        @keyframes tl-burst {
          0% { transform: translate(-50%,-50%) rotate(0deg) scale(0.4); opacity: 1; }
          100% {
            transform:
              translate(calc(-50% + var(--bx)), calc(-50% + var(--by)))
              rotate(200deg) scale(1);
            opacity: 0;
          }
        }

        @media (max-width: 420px) {
          .tl-card-wrap { height: min(82vh, 560px); }
        }

        @media (prefers-reduced-motion: reduce) {
          .tl-star, .tl-drifter, .tl-cursor { animation: none !important; }
          .tl-card { transition: transform 0.4s ease; }
        }
      `}</style>

      <div className="tl-stars">
        {stars.map((s) => (
          <div
            key={s.id}
            className="tl-star"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.dur}s`,
            }}
          />
        ))}
      </div>

      <div className="tl-drifters">
        {drifters.map((d) => (
          <div
            key={d.id}
            className="tl-drifter"
            style={{
              left: `${d.left}%`,
              animationDelay: `${d.delay}s`,
              animationDuration: `${d.dur}s`,
              "--dx": `${d.drift}px`,
            }}
          >
            <svg width={d.size} height={d.size} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21s-7.5-4.6-10-9.3C.6 8.2 2.4 5 5.6 5c1.9 0 3.4 1 4.4 2.6C11 6 12.5 5 14.4 5c3.2 0 5 3.2 3.6 6.7C19.5 16.4 12 21 12 21z" />
            </svg>
          </div>
        ))}
      </div>

      <div className="tl-scene">
        <p className="tl-heading">for the one who keeps asking how</p>

        <div
          className="tl-card-wrap"
          ref={cardWrapRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div
            className={`tl-card ${open ? "tl-open" : ""}`}
            style={
              open
                ? undefined
                : { "--rx": `${tilt.x}deg`, "--ry": `${tilt.y}deg` }
            }
          >
            <div className="tl-face tl-face-front" onClick={handleOpen}>
              <span className="tl-seal-sub">a letter, sealed</span>
              <button
                className="tl-seal-btn"
                aria-label="Open the letter"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpen();
                }}
              >
                <StitchedHeart progress={open ? 1 : 0.02} sealed size={110} />
              </button>
              <span className="tl-seal-label">touch the thread to open</span>
            </div>

            <div className="tl-face tl-face-back">
              <div className="tl-back-header">
                <span className="tl-mark">thread &amp; heart</span>
                <div className="tl-mini-heart">
                  <StitchedHeart progress={progress} size={30} />
                </div>
              </div>

              <div className="tl-letter-scroll" ref={scrollRef}>
                {POEM_LINES.slice(0, Math.min(lineIdx + 1, POEM_LINES.length)).map(
                  (line, i) => {
                    const isCurrent = i === lineIdx && !done;
                    const text = isCurrent ? line.slice(0, charIdx) : line;
                    return (
                      <p className="tl-poem-line" key={i}>
                        {text}
                        {isCurrent && <span className="tl-cursor" />}
                      </p>
                    );
                  }
                )}

                {done && (
                  <p
                    className="tl-signature"
                    onClick={() => setBurst((b) => b + 1)}
                    title="tap the signature"
                  >
                    {SIGNATURE}
                  </p>
                )}
              </div>

              <div className="tl-controls">
                {!done && (
                  <button className="tl-btn" onClick={handleSkip}>
                    reveal it all
                  </button>
                )}
                {done && (
                  <button className="tl-btn" onClick={handleReplay}>
                    read it again
                  </button>
                )}
              </div>

              <div className="tl-mend-heart-holder">
                <StitchedHeart progress={progress} size={64} />
              </div>
            </div>
          </div>

          {burst > 0 && (
            <div className="tl-confetti-layer">
              {confetti.map((c) => {
                const rad = (c.angle * Math.PI) / 180;
                const bx = Math.cos(rad) * c.dist;
                const by = Math.sin(rad) * c.dist;
                return (
                  <svg
                    key={`${burst}-${c.id}`}
                    className="tl-confetti-piece"
                    width={c.size}
                    height={c.size}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    style={{
                      "--bx": `${bx}px`,
                      "--by": `${by}px`,
                      animationDuration: `${c.dur}s`,
                    }}
                  >
                    <path d="M12 21s-7.5-4.6-10-9.3C.6 8.2 2.4 5 5.6 5c1.9 0 3.4 1 4.4 2.6C11 6 12.5 5 14.4 5c3.2 0 5 3.2 3.6 6.7C19.5 16.4 12 21 12 21z" />
                  </svg>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
