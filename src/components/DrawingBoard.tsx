import { useEffect, useRef, useState } from 'react';
import { getGame } from '../state/gameStore';
import { AudioManager } from '../engine/AudioManager';
import { InteractionManager } from '../engine/InteractionManager';
import { saveDrawing } from './drawingStore';
import { showArtToPapa } from '../scenes/extras';

const COLORS = ['#2d2d3a', '#e2483f', '#ff9f43', '#ffd23f', '#6fbf4a', '#4fb0e8', '#3c5fd6', '#9b7bff', '#ff6f91', '#8a5a33'];
const SIZES = [8, 18, 34];
const W = 960;
const H = 600;

type Tool = 'crayon' | 'eraser' | 'star' | 'heart';

const stamp = (ctx: CanvasRenderingContext2D, tool: 'star' | 'heart', x: number, y: number, color: string, size: number) => {
  const r = 14 + size;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.strokeStyle = '#5a3b2a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  if (tool === 'star') {
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI / 5) * i - Math.PI / 2;
      const rr = i % 2 ? r * 0.45 : r;
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
  } else {
    ctx.moveTo(0, r * 0.35);
    ctx.bezierCurveTo(-r * 1.3, -r * 0.5, -r * 0.4, -r * 1.3, 0, -r * 0.45);
    ctx.bezierCurveTo(r * 0.4, -r * 1.3, r * 1.3, -r * 0.5, 0, r * 0.35);
  }
  ctx.fill();
  ctx.stroke();
  ctx.restore();
};

/** Full-screen crayon board. "Hang it up!" saves the picture; it then appears on Papa's wall. */
export function DrawingBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState(COLORS[1]);
  const [size, setSize] = useState(SIZES[1]);
  const [tool, setTool] = useState<Tool>('crayon');
  const drawn = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const lastSound = useRef(0);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#fffdf7';
    ctx.fillRect(0, 0, W, H);
  }, []);

  const pos = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };

  const line = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = tool === 'eraser' ? '#fffdf7' : color;
    ctx.lineWidth = tool === 'eraser' ? size * 2 : size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    drawn.current = true;
    const now = performance.now();
    if (now - lastSound.current > 260) {
      lastSound.current = now;
      AudioManager.play('scribble');
    }
  };

  const close = () => getGame().clearFx('ui:drawing');

  const clear = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#fffdf7';
    ctx.fillRect(0, 0, W, H);
    drawn.current = false;
    AudioManager.play('swish');
  };

  const done = () => {
    const c = canvasRef.current;
    if (!c || !drawn.current) return close();
    const small = document.createElement('canvas');
    small.width = 480;
    small.height = 300;
    small.getContext('2d')!.drawImage(c, 0, 0, 480, 300);
    if (saveDrawing(small.toDataURL('image/jpeg', 0.85))) {
      getGame().bumpDrawing();
      AudioManager.play('tada');
      close();
      const s = getGame();
      if (s.currentRoom === 'papa-room') setTimeout(() => InteractionManager.start(showArtToPapa), 250);
    } else close();
  };

  return (
    <div className="draw-overlay" onPointerDown={(e) => e.stopPropagation()}>
      <div className="draw-panel">
        <div className="draw-tools">
          <div className="crayons">
            {COLORS.map((c) => (
              <button
                key={c}
                aria-label="crayon colour"
                className={`crayon ${tool !== 'eraser' && color === c ? 'on' : ''}`}
                style={{ ['--c' as string]: c }}
                onPointerDown={() => {
                  setColor(c);
                  if (tool === 'eraser') setTool('crayon');
                  AudioManager.play('tap');
                }}
              />
            ))}
          </div>
          <div className="tool-row">
            {SIZES.map((sz) => (
              <button key={sz} aria-label="brush size" className={`tool ${size === sz ? 'on' : ''}`} onPointerDown={() => setSize(sz)}>
                <span className="dot" style={{ width: sz + 4, height: sz + 4 }} />
              </button>
            ))}
          </div>
          <div className="tool-row">
            <button aria-label="crayon" className={`tool ${tool === 'crayon' ? 'on' : ''}`} onPointerDown={() => setTool('crayon')}>
              <svg viewBox="0 0 40 40"><path d="M 8 32 L 12 22 L 28 6 L 34 12 L 18 28 Z" fill={color} stroke="#5a3b2a" strokeWidth="3" strokeLinejoin="round" /><path d="M 8 32 L 12 22 L 18 28 Z" fill="#f5deb3" stroke="#5a3b2a" strokeWidth="3" strokeLinejoin="round" /></svg>
            </button>
            <button aria-label="star stamp" className={`tool ${tool === 'star' ? 'on' : ''}`} onPointerDown={() => setTool('star')}>
              <svg viewBox="0 0 40 40"><path d="M 20 4 L 24.7 14 L 36 15.5 L 27.6 23 L 30 34 L 20 28.5 L 10 34 L 12.4 23 L 4 15.5 L 15.3 14 Z" fill="#ffd23f" stroke="#5a3b2a" strokeWidth="3" strokeLinejoin="round" /></svg>
            </button>
            <button aria-label="heart stamp" className={`tool ${tool === 'heart' ? 'on' : ''}`} onPointerDown={() => setTool('heart')}>
              <svg viewBox="0 0 40 40"><path d="M 20 34 C 2 22 6 6 20 14 C 34 6 38 22 20 34 Z" fill="#ff6f91" stroke="#5a3b2a" strokeWidth="3" strokeLinejoin="round" /></svg>
            </button>
            <button aria-label="eraser" className={`tool ${tool === 'eraser' ? 'on' : ''}`} onPointerDown={() => setTool('eraser')}>
              <svg viewBox="0 0 40 40"><rect x="6" y="14" width="28" height="14" rx="4" fill="#ffb3c1" stroke="#5a3b2a" strokeWidth="3" transform="rotate(-30 20 21)" /></svg>
            </button>
          </div>
          <button className="pill-btn small" onPointerDown={clear}>Start again</button>
        </div>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="draw-canvas"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            const p = pos(e);
            if (tool === 'star' || tool === 'heart') {
              const ctx = canvasRef.current?.getContext('2d');
              if (ctx) stamp(ctx, tool, p.x, p.y, tool === 'star' ? color : color, size);
              drawn.current = true;
              AudioManager.play('pop');
              return;
            }
            last.current = p;
            line(p, { x: p.x + 0.1, y: p.y + 0.1 });
          }}
          onPointerMove={(e) => {
            if (!last.current) return;
            const p = pos(e);
            line(last.current, p);
            last.current = p;
          }}
          onPointerUp={() => (last.current = null)}
          onPointerCancel={() => (last.current = null)}
        />
      </div>
      <div className="draw-actions">
        <button className="pill-btn ghost" onPointerDown={close}>Close</button>
        <button className="pill-btn go-btn" onPointerDown={done}>Hang it up!</button>
      </div>
    </div>
  );
}
