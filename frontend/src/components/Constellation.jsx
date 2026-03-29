import { useRef, useEffect } from "react";

export default function Constellation() {
  const ref = useRef(null);

  useEffect(() => {
    const cvs = ref.current;
    const ctx = cvs.getContext("2d");

    const CFG = {
      nodes: 62,
      connectDist: 190,
      nodeR: 3,
      glowR: 18,
      speed: 0.3,
      mouseR: 230,
      mouseForce: 0.025,
      wobble: 0.01,
    };
    const C = {
      n: [226, 188, 114],
      g: [198, 161, 91],
      e: [198, 161, 91],
      m: [237, 232, 217],
    };
    const rgba = ([r, g, b], a) => `rgba(${r},${g},${b},${a})`;

    let W,
      H,
      nodes = [],
      mouse = { x: -9999, y: -9999 },
      t = 0;

    const resize = () => {
      W = cvs.width = window.innerWidth;
      H = cvs.height = window.innerHeight;
    };

    const mkNode = () => {
      const a = Math.random() * Math.PI * 2;
      const s = CFG.speed * (0.2 + Math.random() * 0.8);
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        r: CFG.nodeR * (0.6 + Math.random() * 0.9),
        wAx: 0.006 + Math.random() * 0.01,
        wAy: 0.006 + Math.random() * 0.01,
        wFx: 0.003 + Math.random() * 0.005,
        wFy: 0.003 + Math.random() * 0.005,
        wPx: Math.random() * Math.PI * 2,
        wPy: Math.random() * Math.PI * 2,
      };
    };

    const init = () => {
      nodes = Array.from({ length: CFG.nodes }, mkNode);
    };

    const frame = () => {
      requestAnimationFrame(frame);
      t++;
      ctx.clearRect(0, 0, W, H);

      for (const n of nodes) {
        n.vx += Math.sin(t * n.wFx + n.wPx) * n.wAx * CFG.wobble;
        n.vy += Math.cos(t * n.wFy + n.wPy) * n.wAy * CFG.wobble;
        const dx = mouse.x - n.x,
          dy = mouse.y - n.y,
          d = Math.hypot(dx, dy);
        if (d < CFG.mouseR && d > 1) {
          const f = (1 - d / CFG.mouseR) * CFG.mouseForce;
          n.vx += (dx / d) * f;
          n.vy += (dy / d) * f;
        }
        const spd = Math.hypot(n.vx, n.vy);
        if (spd > CFG.speed) {
          n.vx = (n.vx / spd) * CFG.speed;
          n.vy = (n.vy / spd) * CFG.speed;
        }
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -20) n.x = W + 20;
        if (n.x > W + 20) n.x = -20;
        if (n.y < -20) n.y = H + 20;
        if (n.y > H + 20) n.y = -20;
      }

      ctx.lineWidth = 0.65;
      for (let i = 0; i < nodes.length; i++)
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i],
            b = nodes[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < CFG.connectDist) {
            const alpha = Math.pow(1 - dist / CFG.connectDist, 1.4) * 0.55;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = rgba(C.e, alpha);
            ctx.stroke();
          }
        }

      if (mouse.x > -100) {
        ctx.lineWidth = 0.55;
        for (const n of nodes) {
          const dist = Math.hypot(n.x - mouse.x, n.y - mouse.y);
          if (dist < CFG.mouseR) {
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(n.x, n.y);
            ctx.strokeStyle = rgba(C.m, (1 - dist / CFG.mouseR) * 0.4);
            ctx.stroke();
          }
        }
      }

      for (const n of nodes) {
        const gr = ctx.createRadialGradient(
          n.x,
          n.y,
          0,
          n.x,
          n.y,
          n.r * CFG.glowR * 0.45,
        );
        gr.addColorStop(0, rgba(C.g, 0.28));
        gr.addColorStop(0.35, rgba(C.g, 0.1));
        gr.addColorStop(1, rgba(C.g, 0));
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * CFG.glowR * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = gr;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = rgba(C.n, 0.92);
        ctx.fill();
      }

      if (mouse.x > -100) {
        const mr = 3.8;
        const mg = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          mr * 7,
        );
        mg.addColorStop(0, rgba(C.m, 0.3));
        mg.addColorStop(0.5, rgba(C.m, 0.1));
        mg.addColorStop(1, rgba(C.m, 0));
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, mr * 7, 0, Math.PI * 2);
        ctx.fillStyle = mg;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, mr, 0, Math.PI * 2);
        ctx.fillStyle = rgba(C.m, 0.8);
        ctx.fill();
      }
    };

    const onResize = () => {
      resize();
      init();
    };
    const onMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);

    resize();
    init();
    frame();

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return <canvas id="constellation-canvas" ref={ref} style={{ position: "fixed", top: 0, left: 0, zIndex: 0, pointerEvents: "none" }} />;

}
