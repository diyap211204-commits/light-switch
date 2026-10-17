import { useState, useEffect, useRef, useCallback } from "react";

const TONES = [
  { id: "warm", label: "Warm", c: "255,190,90" },
  { id: "neutral", label: "Neutral", c: "255,240,210" },
  { id: "cool", label: "Cool", c: "190,225,255" },
];
const SLEEP = [
  { m: 0, label: "Off" },
  { m: 1, label: "1 min" },
  { m: 5, label: "5 min" },
  { m: 15, label: "15 min" },
];

const nowLabel = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
let nextId = 1;

function clickSound(up) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = up ? 880 : 520; o.type = "square";
    g.gain.setValueAtTime(0.06, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
    o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.09);
  } catch {}  
}

export default function App() {
  const [on, setOn] = useState(false);
  const [bright, setBright] = useState(65);
  const [tone, setTone] = useState("warm");
  const [sound, setSound] = useState(true);
  const [log, setLog] = useState([]);
  const [sleepSec, setSleepSec] = useState(0);
  const [customMin, setCustomMin] = useState("");
  const [customSec, setCustomSec] = useState("");
  const [left, setLeft] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [flicker, setFlicker] = useState(false);
  const [pull, setPull] = useState(false);
  const pageRef = useRef(null);

  const tn = TONES.find((t) => t.id === tone);
  const glow = on ? 0.15 + (0.85 * bright) / 100 : 0;
  const rgb = `rgb(${tn.c})`;

  const addLog = useCallback((text) => {
    setLog((l) => [{ id: nextId++, t: nowLabel(), text }, ...l].slice(0, 6));
  }, []);

  const setPower = useCallback((next, source = "Manual") => {
    setOn(next);
    if (sound) clickSound(next);
    addLog(`${source}: ${next ? "ON" : "OFF"}`);
    if (next) {
      setFlicker(true);
      setTimeout(() => setFlicker(false), 750);
    }
  }, [sound, addLog]);

  const lampClick = () => {
    setPull(true);
    setTimeout(() => setPull(false), 220);
    setPower(!on);
  };
  useEffect(() => {
    if (!on) return;
    setElapsed(0);
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [on]);
  useEffect(() => {
    if (!on || !sleepSec) { setLeft(null); return; }
    setLeft(sleepSec);
  }, [on, sleepSec]);
  useEffect(() => {
    if (left === null) return;
    if (left <= 0) { setPower(false, "Sleep timer"); return; }
    const id = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(id);
  }, [left, setPower]);
  useEffect(() => {
    const h = (e) => {
      if (e.key.toLowerCase() === "l" && !e.metaKey && !e.ctrlKey && !e.altKey) setPower(!on);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [on, setPower]);
  const onMove = (e) => {
    const el = pageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    el.style.setProperty("--mx", `${x}px`);
    el.style.setProperty("--my", `${y}px`);
  };

  const isCustom = sleepSec > 0 && !SLEEP.some((s) => s.m * 60 === sleepSec);
  const applyCustom = (e) => {
    e.preventDefault();
    const m = Math.min(999, Math.max(0, parseInt(customMin, 10) || 0));
    const sec = Math.min(59, Math.max(0, parseInt(customSec, 10) || 0));
    const total = m * 60 + sec;
    if (!total) return;
    setCustomMin(String(m));
    setCustomSec(String(sec));
    setSleepSec(total);
    addLog(`Sleep timer: ${fmt(total)} (custom)`);
  };

  const logBrightness = (e) => addLog(`Brightness: ${e.target.value}%`);

  return (
    <main
      ref={pageRef}
      onPointerMove={onMove}
      className={`page ${on ? "on" : ""}`}
      style={{ "--rgb": tn.c, "--glow": glow }}
    >
      <section className="scene" aria-hidden="true">
        <svg viewBox="0 0 400 430" preserveAspectRatio="xMidYMax meet" className={flicker ? "flicker" : ""}>
            <defs>
              <linearGradient id="brass" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#f7e2a8" />
                <stop offset="0.5" stopColor="#c0903f" />
                <stop offset="1" stopColor="#7a5220" />
              </linearGradient>
              <linearGradient id="porcelain" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#8f897b" />
                <stop offset="0.3" stopColor="#f3eee2" />
                <stop offset="0.6" stopColor="#cfc8b8" />
                <stop offset="1" stopColor="#6d685d" />
              </linearGradient>
              <linearGradient id="fabricOff" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#3f3b34" />
                <stop offset="0.4" stopColor="#6c665a" />
                <stop offset="1" stopColor="#38342d" />
              </linearGradient>
              <radialGradient id="fabricLit" cx="0.5" cy="0.5" r="0.62">
                <stop offset="0" stopColor="#fffbe9" />
                <stop offset="0.35" stopColor={rgb} />
                <stop offset="1" stopColor={rgb} stopOpacity="0.8" />
              </radialGradient>
              <linearGradient id="roundness" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#000" stopOpacity="0.5" />
                <stop offset="0.28" stopColor="#000" stopOpacity="0" />
                <stop offset="0.72" stopColor="#000" stopOpacity="0" />
                <stop offset="1" stopColor="#000" stopOpacity="0.55" />
              </linearGradient>
              <linearGradient id="desk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#2d2833" />
                <stop offset="1" stopColor="#0e0f16" />
              </linearGradient>
              <linearGradient id="beamUp" gradientUnits="userSpaceOnUse" x1="0" y1="150" x2="0" y2="-20">
                <stop offset="0" stopColor={rgb} stopOpacity="0.55" />
                <stop offset="1" stopColor={rgb} stopOpacity="0" />
              </linearGradient>
              <linearGradient id="beamDown" gradientUnits="userSpaceOnUse" x1="0" y1="262" x2="0" y2="392">
                <stop offset="0" stopColor={rgb} stopOpacity="0.6" />
                <stop offset="1" stopColor={rgb} stopOpacity="0.12" />
              </linearGradient>
              <radialGradient id="pool">
                <stop offset="0" stopColor={rgb} stopOpacity="0.8" />
                <stop offset="1" stopColor={rgb} stopOpacity="0" />
              </radialGradient>
              <radialGradient id="halo">
                <stop offset="0" stopColor={rgb} stopOpacity="0.55" />
                <stop offset="1" stopColor={rgb} stopOpacity="0" />
              </radialGradient>
              <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="9" />
              </filter>
              <clipPath id="shadeClip">
                <path d="M138 150 L112 262 A88 14 0 0 0 288 262 L262 150 Z" />
              </clipPath>
            </defs>
  
            {/* desk */}
            <rect x="-400" y="392" width="1200" height="200" fill="url(#desk)" />
            <line x1="-400" y1="392.5" x2="800" y2="392.5" className="desk-edge" />
  
            {/* spill light: up onto the wall, down onto the desk */}
            <g className="light" style={{ opacity: glow }}>
              <circle cx="200" cy="206" r="190" fill="url(#halo)" />
              <polygon points="140,150 260,150 345,-20 55,-20" fill="url(#beamUp)" filter="url(#soft)" />
              <polygon points="112,262 288,262 372,392 28,392" fill="url(#beamDown)" filter="url(#soft)" />
              <ellipse cx="200" cy="398" rx="170" ry="17" fill="url(#pool)" />
              {[[150, 300, 0], [240, 330, 1.4], [190, 360, 0.7], [280, 290, 2.1], [120, 340, 2.6], [160, 90, 0.4], [250, 70, 1.8]].map(([x, y, d], i) => (
                <circle key={i} cx={x} cy={y} r={i % 2 ? 1.3 : 1.9} className="mote" style={{ animationDelay: `${d}s` }} />
              ))}
            </g>
  
            <g className="lamp-hit" onClick={lampClick}>
            {/* ceramic base */}
            <ellipse cx="200" cy="393" rx="64" ry="7" className="contact" />
            <path d="M200 296 C268 304 262 352 240 372 Q236 386 232 390 H168 Q164 386 160 372 C138 352 132 304 200 296 Z" fill="url(#porcelain)" />
            <path d="M156 336 Q158 316 176 308" className="sheen" />
            <path d="M162 374 Q200 382 238 374" fill="none" stroke="#c0903f" strokeWidth="3" />
            <path d="M165 380 Q200 388 235 380" fill="none" stroke="#c0903f" strokeWidth="1.2" />
            <path d="M232 390 Q290 396 330 388" className="cord" />
  
            {/* neck and finial */}
            <rect x="192" y="262" width="16" height="42" rx="3" fill="url(#brass)" />
            <ellipse cx="200" cy="302" rx="22" ry="5" fill="url(#brass)" />
  
            {/* fabric drum shade */}
            <path d="M138 150 L112 262 A88 14 0 0 0 288 262 L262 150 Z" fill="url(#fabricOff)" />
            <g clipPath="url(#shadeClip)">
              <rect x="100" y="140" width="200" height="140" fill="url(#fabricLit)" className="light" style={{ opacity: glow }} />
              <rect x="100" y="140" width="200" height="140" fill="url(#roundness)" />
              {[-60, -30, 0, 30, 60].map((dx) => (
                <path key={dx} d={`M${200 + dx * 0.7} 150 L${200 + dx * 1.45} 276`} className="weave" />
              ))}
            </g>
            <ellipse cx="200" cy="150" rx="62" ry="10" className="inside" />
            <ellipse cx="200" cy="150" rx="62" ry="10" fill="#fff3cf" className="light" style={{ opacity: glow * 0.9 }} />
            <ellipse cx="200" cy="150" rx="62" ry="10" className="rim" />
            <path d="M112 262 A88 14 0 0 0 288 262" className="rim" />
            <rect x="196" y="132" width="8" height="18" rx="2" fill="url(#brass)" />
            <circle cx="200" cy="130" r="6" fill="url(#brass)" />
          
            {/* pull chain */}
            <g className="chain" style={{ transform: pull ? "translateY(10px)" : "translateY(0)" }}>
              <path d="M252 274 V324" className="beads" />
              <path d="M252 322 q-6 7 0 15 q6 -8 0 -15z" fill="url(#brass)" />
            </g>
            </g>
          </svg>
      </section>

      <section className="panel">
        <p className="eyebrow">Desk lamp</p>
        <h1 className="state" aria-live="polite">{on ? "Lamp is on" : "Lamp is off"}</h1>
        <p className="meta">
          {on ? `${tn.label} light, ${bright}%, on for ${fmt(elapsed)}` : `${tn.label} light at ${bright}% when switched on`}
        </p>

        <button
          type="button" role="switch" aria-checked={on} aria-label="Light on or off"
          className={`switch ${on ? "on" : ""}`}
          onClick={() => setPower(!on)}
        >
          <span className="knob">{on ? "☀" : "☾"}</span>
          <span className="sw-text">{on ? "ON" : "OFF"}</span>
        </button>

        <div className="block">
          <div className="row">
            <h2>Brightness</h2>
            <output>{bright}%</output>
          </div>
          <input
            type="range" min="10" max="100" value={bright} aria-label="Brightness"
            style={{ "--pct": `${((bright - 10) / 90) * 100}%` }}
            onChange={(e) => setBright(Number(e.target.value))}
            onPointerUp={logBrightness} onKeyUp={logBrightness}
          />
        </div>

        <div className="block">
          <h2>Light tone</h2>
          <div className="swatches" role="radiogroup" aria-label="Light tone">
            {TONES.map((t) => (
              <button
                key={t.id} role="radio" aria-checked={tone === t.id}
                className={`swatch ${tone === t.id ? "sel" : ""}`}
                onClick={() => { setTone(t.id); addLog(`Light tone: ${t.label}`); }}
              >
                <span className="dot" style={{ background: `rgb(${t.c})`, "--c": `rgba(${t.c},0.75)` }} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="block">
          <div className="row">
            <h2>Sleep timer</h2>
            {left !== null && <output>Off in {fmt(left)}</output>}
          </div>
          <div className="seg">
            {SLEEP.map((s) => (
              <button
                key={s.m} aria-pressed={sleepSec === s.m * 60} className={sleepSec === s.m * 60 ? "sel" : ""}
                onClick={() => { setSleepSec(s.m * 60); addLog(s.m ? `Sleep timer: ${s.m} min` : "Sleep timer: off"); }}
              >
                {s.label}
              </button>
            ))}
          </div>
          <form className="custom" onSubmit={applyCustom}>
            <span className="custom-label">Custom</span>
            <input
              type="number" min="0" max="999" inputMode="numeric" placeholder="0" aria-label="Minutes"
              value={customMin} onChange={(e) => setCustomMin(e.target.value)}
            />
            <span>min</span>
            <input
              type="number" min="0" max="59" inputMode="numeric" placeholder="0" aria-label="Seconds"
              value={customSec} onChange={(e) => setCustomSec(e.target.value)}
            />
            <span>sec</span>
            <button type="submit" className={`set ${isCustom ? "sel" : ""}`}>Set</button>
          </form>
        </div>

        <div className="block">
          <div className="row">
            <h2>Activity</h2>
            <div className="tools">
              {log.length > 0 && <button className="link" onClick={() => setLog([])}>Clear</button>}
              <label className="check">
                <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} /> Click sound
              </label>
            </div>
          </div>
          <ul className="log">
            {log.length === 0 && <li className="empty">No activity yet. Flip the switch to start.</li>}
            {log.map((e) => (<li key={e.id}><time>{e.t}</time>{e.text}</li>))}
          </ul>
        </div>
      </section>
    </main>
  );
}