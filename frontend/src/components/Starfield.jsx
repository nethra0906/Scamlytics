import { useEffect, useRef } from "react";

/**
 * Ambient backdrop — a large, dense twisted particle ribbon (a DNA helicoid).
 *
 *  • Huge: spans well over half the viewport.
 *  • Dense: several thousand additively-blended points, drawn in colour/alpha
 *    buckets so the count stays cheap.
 *  • Scroll-driven: rotation is tied to scroll position (parallax). It stays
 *    perfectly still when you're not scrolling — rendering is event-driven, so
 *    it costs nothing while idle.
 *  • Interactive: particles near the pointer are gently pushed away and brighten.
 *  • Responsive to viewport size; respects prefers-reduced-motion.
 */
export default function Starfield() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const TAU = Math.PI * 2;

    // ── palette buckets (azure → cyan, + magenta specks) × alpha levels ────────
    const HUES = [[46, 155, 245], [26, 178, 250], [8, 198, 253], [0, 204, 255], [110, 150, 255], [190, 70, 200]];
    const ALEVELS = [0.07, 0.14, 0.22, 0.32, 0.46];
    const STYLES = HUES.map((c) => ALEVELS.map((a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`));

    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const TWISTS = 2.8, FOCAL = 680, CAMZ = 260, TILT = -0.42;
    const cosT = Math.cos(TILT), sinT = Math.sin(TILT);
    let HALFW = 300, HEIGHT = 1600, cx = 0, cy = 0;

    // geometry buffers (rebuilt on resize)
    let N = 0, lx, ly, lz, edge, hue, dustP;
    // per-frame scratch bucket point lists (flat [x,y,size,...])
    let buckets = [];

    let cur = 0, target = 0;       // eased vs scroll-target rotation
    let mx = -9999, my = -9999, lastMove = 0;
    let raf, running = false;

    const build = () => {
      const sf = Math.max(0.7, Math.min(1.5, Math.min(w, h) / 820));
      HALFW = Math.min(w, h) * 0.4;
      HEIGHT = Math.max(h * 1.5, 900) * (0.85 + sf * 0.1);
      cx = w > 900 ? w * 0.56 : w * 0.5;
      cy = h * 0.5;

      const LEN = Math.max(200, Math.min(480, Math.round((h * 1.5) / 3.4)));
      const WID = w < 640 ? 14 : 22;
      N = LEN * WID;
      lx = new Float32Array(N); ly = new Float32Array(N); lz = new Float32Array(N);
      edge = new Float32Array(N); hue = new Uint8Array(N);

      let n = 0;
      for (let i = 0; i < LEN; i++) {
        const tt = i / (LEN - 1);
        const theta = tt * TWISTS * TAU;
        const ct = Math.cos(theta), st = Math.sin(theta);
        const y = (tt - 0.5) * HEIGHT;
        for (let j = 0; j < WID; j++) {
          const uu = (j / (WID - 1)) * 2 - 1;
          lx[n] = uu * HALFW * ct; ly[n] = y; lz[n] = uu * HALFW * st;
          edge[n] = 0.3 + 0.7 * Math.abs(uu);
          let hi = Math.round((uu * 0.5 + 0.5) * 4);          // 0..4 azure→cyan
          if (((i * 17 + j * 7) % 149) < 2) hi = 5;           // sparse magenta
          hue[n] = hi;
          n++;
        }
      }

      // static dust
      const dn = Math.min(Math.round((w * h) / 13000), 200);
      dustP = new Float32Array(dn * 3);
      for (let k = 0; k < dn; k++) {
        dustP[k * 3] = Math.random() * w;
        dustP[k * 3 + 1] = Math.random() * h;
        dustP[k * 3 + 2] = Math.random() * 1.1 + 0.3;
      }
      buckets = Array.from({ length: HUES.length * ALEVELS.length }, () => []);
    };

    const resize = () => {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
      render();
    };

    const HR = 105, HR2 = HR * HR, PUSH = 18;
    const render = () => {
      ctx.clearRect(0, 0, w, h);

      // dust
      ctx.fillStyle = "rgba(160,170,210,0.28)";
      for (let k = 0; k < dustP.length; k += 3) ctx.fillRect(dustP[k], dustP[k + 1], dustP[k + 2], dustP[k + 2]);

      for (const b of buckets) b.length = 0;

      const cr = Math.cos(cur), sr = Math.sin(cur);
      const hovering = performance.now() - lastMove < 5000 && mx > -9000;

      for (let n = 0; n < N; n++) {
        const rx = lx[n] * cr - lz[n] * sr;
        const rz = lx[n] * sr + lz[n] * cr;
        const ny = ly[n] * cosT - rz * sinT;
        const nz = ly[n] * sinT + rz * cosT;
        const scale = FOCAL / (FOCAL + nz + CAMZ);
        if (scale <= 0) continue;
        let x = cx + rx * scale, y = cy + ny * scale;
        if (x < -30 || x > w + 30 || y < -30 || y > h + 30) continue;

        let boost = 0;
        if (hovering) {
          const dx = x - mx, dy = y - my, d2 = dx * dx + dy * dy;
          if (d2 < HR2) {
            const dd = Math.sqrt(d2) || 1, f = 1 - dd / HR;
            x += (dx / dd) * f * PUSH; y += (dy / dd) * f * PUSH;
            boost = f * 0.5;
          }
        }

        const depthB = scale > 0.62 ? (scale - 0.62) * 1.6 : 0;
        const bness = edge[n] * 0.42 + depthB * 0.5 + boost;
        let lvl = (bness * ALEVELS.length) | 0;
        if (lvl <= 0) continue;
        if (lvl >= ALEVELS.length) lvl = ALEVELS.length - 1;

        const size = Math.max(0.7, 1.9 * scale + boost * 2);
        const bk = buckets[hue[n] * ALEVELS.length + lvl];
        bk.push(x, y, size);
      }

      ctx.globalCompositeOperation = "lighter";
      for (let hIdx = 0; hIdx < HUES.length; hIdx++) {
        for (let a = 0; a < ALEVELS.length; a++) {
          const bk = buckets[hIdx * ALEVELS.length + a];
          if (!bk.length) continue;
          ctx.fillStyle = STYLES[hIdx][a];
          for (let p = 0; p < bk.length; p += 3) {
            const s = bk[p + 2];
            ctx.fillRect(bk[p] - s / 2, bk[p + 1] - s / 2, s, s);
          }
        }
      }
      ctx.globalCompositeOperation = "source-over";
    };

    const ROTK = 0.0012;
    const animate = () => {
      const rotMoving = Math.abs(cur - target) > 0.00005;
      if (rotMoving) cur += (target - cur) * 0.1;
      const pointerActive = performance.now() - lastMove < 160;
      render();
      if (rotMoving || pointerActive) raf = requestAnimationFrame(animate);
      else running = false;
    };
    const ensure = () => { if (!running) { running = true; raf = requestAnimationFrame(animate); } };

    const onScroll = () => {
      target = window.scrollY * ROTK;
      if (reduce) { cur = target; render(); } else ensure();
    };
    const onMove = (e) => { mx = e.clientX; my = e.clientY; lastMove = performance.now(); if (!reduce) ensure(); };

    resize();
    target = cur = window.scrollY * ROTK;
    render();
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", onScroll, { passive: true });
    if (!reduce) window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="fixed inset-0 -z-10 w-full h-full pointer-events-none" />;
}
