import { useRef, useEffect, useState, useCallback } from "react";
import type { RobotTelemetry } from "../types";
import { RotateCcw, Compass, ZoomIn, ZoomOut } from "lucide-react";

interface VirtualArena3DProps {
  telemetry: RobotTelemetry;
  onTargetMove?: (x: number, y: number) => void;
  className?: string;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
}

interface Point3D {
  x: number;
  y: number; // height (up)
  z: number;
}

export default function VirtualArena3D({
  telemetry,
  onTargetMove,
  className = "",
  canvasRef: externalCanvasRef,
}: VirtualArena3DProps) {
  const internalCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = externalCanvasRef || internalCanvasRef;
  const [yaw, setYaw] = useState<number>(0.4); // horizontal angle in radians
  const [pitch, setPitch] = useState<number>(0.65); // vertical tilt in radians (approx 37 deg)
  const [zoom, setZoom] = useState<number>(1.0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [localTarget, setLocalTarget] = useState({ x: 340, y: 260 });
  const animFrameRef = useRef<number | null>(null);

  // Fixed 3D obstacles
  const obstacles = [
    { x: 230, z: 140, w: 60, d: 60, h: 40, label: "OBSTACLE 01" },
    { x: 160, z: 350, w: 80, d: 40, h: 35, label: "BARRIER" },
  ];

  // 3D to 2D perspective projection
  const project = useCallback(
    (p: Point3D, width: number, height: number): { x: number; y: number; scale: number; visible: boolean } => {
      const cx = p.x - 250;
      const cy = p.y;
      const cz = p.z - 250;

      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);
      const x1 = cx * cosY - cz * sinY;
      const z1 = cx * sinY + cz * cosY;

      const cosP = Math.cos(pitch);
      const sinP = Math.sin(pitch);
      const y2 = cy * cosP - z1 * sinP;
      const z2 = cy * sinP + z1 * cosP;

      const camDist = 650 / zoom;
      const totalZ = z2 + camDist;

      if (totalZ <= 10) {
        return { x: 0, y: 0, scale: 0, visible: false };
      }

      const fov = 480;
      const scale = fov / totalZ;
      const screenX = width / 2 + x1 * scale;
      const screenY = height / 2 - y2 * scale;

      return { x: screenX, y: screenY, scale, visible: true };
    },
    [yaw, pitch, zoom]
  );

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    setIsDragging(true);
    setDragStart({ x: clientX, y: clientY });
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const dx = clientX - dragStart.x;
    const dy = clientY - dragStart.y;

    setYaw((prev) => prev - dx * 0.007);
    setPitch((prev) => Math.max(0.15, Math.min(1.4, prev - dy * 0.007)));
    setDragStart({ x: clientX, y: clientY });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const resetCamera = () => {
    setYaw(0.4);
    setPitch(0.65);
    setZoom(1.0);
  };

  useEffect(() => {
    let lidarAngle = 0;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, "#030712");
      bgGrad.addColorStop(0.5, "#081028");
      bgGrad.addColorStop(1, "#02040a");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      const gridSize = 500;
      const step = 50;

      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(6, 182, 212, 0.18)";

      for (let x = 0; x <= gridSize; x += step) {
        const p1 = project({ x, y: 0, z: 0 }, width, height);
        const p2 = project({ x, y: 0, z: gridSize }, width, height);
        if (p1.visible && p2.visible) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }

      for (let z = 0; z <= gridSize; z += step) {
        const p1 = project({ x: 0, y: 0, z }, width, height);
        const p2 = project({ x: gridSize, y: 0, z }, width, height);
        if (p1.visible && p2.visible) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }

      const c1 = project({ x: 0, y: 0, z: 0 }, width, height);
      const c2 = project({ x: gridSize, y: 0, z: 0 }, width, height);
      const c3 = project({ x: gridSize, y: 0, z: gridSize }, width, height);
      const c4 = project({ x: 0, y: 0, z: gridSize }, width, height);

      if (c1.visible && c2.visible && c3.visible && c4.visible) {
        ctx.beginPath();
        ctx.moveTo(c1.x, c1.y);
        ctx.lineTo(c2.x, c2.y);
        ctx.lineTo(c3.x, c3.y);
        ctx.lineTo(c4.x, c4.y);
        ctx.closePath();
        ctx.strokeStyle = "rgba(6, 182, 212, 0.6)";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "rgba(6, 182, 212, 0.03)";
        ctx.fill();
      }

      obstacles.forEach((obs) => {
        const b1 = project({ x: obs.x, y: 0, z: obs.z }, width, height);
        const b2 = project({ x: obs.x + obs.w, y: 0, z: obs.z }, width, height);
        const b3 = project({ x: obs.x + obs.w, y: 0, z: obs.z + obs.d }, width, height);
        const b4 = project({ x: obs.x, y: 0, z: obs.z + obs.d }, width, height);

        const t1 = project({ x: obs.x, y: obs.h, z: obs.z }, width, height);
        const t2 = project({ x: obs.x + obs.w, y: obs.h, z: obs.z }, width, height);
        const t3 = project({ x: obs.x + obs.w, y: obs.h, z: obs.z + obs.d }, width, height);
        const t4 = project({ x: obs.x, y: obs.h, z: obs.z + obs.d }, width, height);

        if (t1.visible && t2.visible && t3.visible && t4.visible) {
          ctx.beginPath();
          ctx.moveTo(t1.x, t1.y);
          ctx.lineTo(t2.x, t2.y);
          ctx.lineTo(t3.x, t3.y);
          ctx.lineTo(t4.x, t4.y);
          ctx.closePath();
          ctx.fillStyle = "rgba(30, 41, 59, 0.9)";
          ctx.fill();
          ctx.strokeStyle = "rgba(245, 158, 11, 0.7)";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          [
            [b1, t1],
            [b2, t2],
            [b3, t3],
            [b4, t4],
          ].forEach(([base, top]) => {
            if (base.visible && top.visible) {
              ctx.beginPath();
              ctx.moveTo(base.x, base.y);
              ctx.lineTo(top.x, top.y);
              ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
              ctx.stroke();
            }
          });

          const centerTop = project(
            { x: obs.x + obs.w / 2, y: obs.h + 5, z: obs.z + obs.d / 2 },
            width,
            height
          );
          if (centerTop.visible) {
            ctx.fillStyle = "#fbbf24";
            ctx.font = `bold ${Math.max(9, Math.round(11 * centerTop.scale))}px monospace`;
            ctx.textAlign = "center";
            ctx.fillText(obs.label, centerTop.x, centerTop.y);
          }
        }
      });

      const now = Date.now();
      const hoverY = 18 + Math.sin(now * 0.004) * 6;
      const cubeSize = 22;
      const targetBase = project({ x: localTarget.x, y: 0, z: localTarget.y }, width, height);

      if (targetBase.visible) {
        ctx.beginPath();
        ctx.ellipse(targetBase.x, targetBase.y, 16 * targetBase.scale, 8 * targetBase.scale, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(239, 68, 68, 0.35)";
        ctx.fill();
      }

      const halfC = cubeSize / 2;
      const ct1 = project({ x: localTarget.x - halfC, y: hoverY + halfC, z: localTarget.y - halfC }, width, height);
      const ct2 = project({ x: localTarget.x + halfC, y: hoverY + halfC, z: localTarget.y - halfC }, width, height);
      const ct3 = project({ x: localTarget.x + halfC, y: hoverY + halfC, z: localTarget.y + halfC }, width, height);
      const ct4 = project({ x: localTarget.x - halfC, y: hoverY + halfC, z: localTarget.y + halfC }, width, height);

      const cb1 = project({ x: localTarget.x - halfC, y: hoverY - halfC, z: localTarget.y - halfC }, width, height);
      const cb2 = project({ x: localTarget.x + halfC, y: hoverY - halfC, z: localTarget.y - halfC }, width, height);
      const cb3 = project({ x: localTarget.x + halfC, y: hoverY - halfC, z: localTarget.y + halfC }, width, height);
      const cb4 = project({ x: localTarget.x - halfC, y: hoverY - halfC, z: localTarget.y + halfC }, width, height);

      if (ct1.visible && ct2.visible && ct3.visible && ct4.visible) {
        ctx.beginPath();
        ctx.moveTo(ct1.x, ct1.y);
        ctx.lineTo(ct2.x, ct2.y);
        ctx.lineTo(ct3.x, ct3.y);
        ctx.lineTo(ct4.x, ct4.y);
        ctx.closePath();
        ctx.fillStyle = "rgba(239, 68, 68, 0.85)";
        ctx.fill();
        ctx.strokeStyle = "#fca5a5";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        [
          [cb1, ct1],
          [cb2, ct2],
          [cb3, ct3],
          [cb4, ct4],
        ].forEach(([b, t]) => {
          if (b.visible && t.visible) {
            ctx.beginPath();
            ctx.moveTo(b.x, b.y);
            ctx.lineTo(t.x, t.y);
            ctx.strokeStyle = "rgba(239, 68, 68, 0.7)";
            ctx.stroke();
          }
        });

        const labelPos = project({ x: localTarget.x, y: hoverY + cubeSize + 8, z: localTarget.y }, width, height);
        if (labelPos.visible) {
          ctx.fillStyle = "#f87171";
          ctx.font = `bold ${Math.max(10, Math.round(12 * labelPos.scale))}px monospace`;
          ctx.textAlign = "center";
          ctx.fillText("🎯 TARGET CUBE", labelPos.x, labelPos.y);
        }
      }

      const rx = telemetry.pose.x || 120;
      const rz = telemetry.pose.y || 120;
      const headingDeg = telemetry.pose.heading || 0;
      const headingRad = (headingDeg * Math.PI) / 180;

      const robotW = 38;
      const robotL = 46;
      const robotH = 22;

      const cosH = Math.cos(headingRad);
      const sinH = Math.sin(headingRad);

      const rotateLocal = (lx: number, lz: number): { x: number; z: number } => {
        return {
          x: rx + lx * cosH - lz * sinH,
          z: rz + lx * sinH + lz * cosH,
        };
      };

      const rBase1 = rotateLocal(-robotW / 2, -robotL / 2);
      const rBase2 = rotateLocal(robotW / 2, -robotL / 2);
      const rBase3 = rotateLocal(robotW / 2, robotL / 2);
      const rBase4 = rotateLocal(-robotW / 2, robotL / 2);

      const rb1 = project({ x: rBase1.x, y: 0, z: rBase1.z }, width, height);
      const rb2 = project({ x: rBase2.x, y: 0, z: rBase2.z }, width, height);
      const rb3 = project({ x: rBase3.x, y: 0, z: rBase3.z }, width, height);
      const rb4 = project({ x: rBase4.x, y: 0, z: rBase4.z }, width, height);

      const rt1 = project({ x: rBase1.x, y: robotH, z: rBase1.z }, width, height);
      const rt2 = project({ x: rBase2.x, y: robotH, z: rBase2.z }, width, height);
      const rt3 = project({ x: rBase3.x, y: robotH, z: rBase3.z }, width, height);
      const rt4 = project({ x: rBase4.x, y: robotH, z: rBase4.z }, width, height);

      if (rt1.visible && rt2.visible && rt3.visible && rt4.visible) {
        ctx.beginPath();
        ctx.moveTo(rb1.x, rb1.y);
        ctx.lineTo(rb2.x, rb2.y);
        ctx.lineTo(rb3.x, rb3.y);
        ctx.lineTo(rb4.x, rb4.y);
        ctx.closePath();
        ctx.fillStyle = "rgba(6, 182, 212, 0.25)";
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(rt1.x, rt1.y);
        ctx.lineTo(rt2.x, rt2.y);
        ctx.lineTo(rt3.x, rt3.y);
        ctx.lineTo(rt4.x, rt4.y);
        ctx.closePath();
        ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
        ctx.fill();
        ctx.strokeStyle = "#22d3ee";
        ctx.lineWidth = 2;
        ctx.stroke();

        [
          [rb1, rt1],
          [rb2, rt2],
          [rb3, rt3],
          [rb4, rt4],
        ].forEach(([b, t]) => {
          if (b.visible && t.visible) {
            ctx.beginPath();
            ctx.moveTo(b.x, b.y);
            ctx.lineTo(t.x, t.y);
            ctx.strokeStyle = "rgba(34, 211, 238, 0.5)";
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        });

        lidarAngle = (lidarAngle + 0.06) % (Math.PI * 2);
        const domePos = project({ x: rx, y: robotH + 8, z: rz }, width, height);

        if (domePos.visible) {
          ctx.beginPath();
          ctx.arc(domePos.x, domePos.y, 7 * domePos.scale, 0, Math.PI * 2);
          ctx.fillStyle = "#06b6d4";
          ctx.fill();
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1;
          ctx.stroke();

          const laserDist = 130;
          const laserX = rx + Math.cos(headingRad + lidarAngle) * laserDist;
          const laserZ = rz + Math.sin(headingRad + lidarAngle) * laserDist;
          const laserTarget = project({ x: laserX, y: robotH + 4, z: laserZ }, width, height);

          if (laserTarget.visible) {
            ctx.beginPath();
            ctx.moveTo(domePos.x, domePos.y);
            ctx.lineTo(laserTarget.x, laserTarget.y);
            ctx.strokeStyle = "rgba(34, 211, 238, 0.7)";
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(laserTarget.x, laserTarget.y, 4 * laserTarget.scale, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(34, 211, 238, 0.9)";
            ctx.fill();
          }
        }

        const frontCenter = rotateLocal(0, robotL / 2 + 15);
        const noseProj = project({ x: frontCenter.x, y: robotH / 2, z: frontCenter.z }, width, height);
        const robotCenter = project({ x: rx, y: robotH / 2, z: rz }, width, height);

        if (noseProj.visible && robotCenter.visible) {
          ctx.beginPath();
          ctx.moveTo(robotCenter.x, robotCenter.y);
          ctx.lineTo(noseProj.x, noseProj.y);
          ctx.strokeStyle = "#38bdf8";
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }

        const rLabel = project({ x: rx, y: robotH + 24, z: rz }, width, height);
        if (rLabel.visible) {
          ctx.fillStyle = "#38bdf8";
          ctx.font = `bold ${Math.max(10, Math.round(12 * rLabel.scale))}px monospace`;
          ctx.textAlign = "center";
          ctx.fillText(`🤖 ${telemetry.operationalState || "ROBOT"}`, rLabel.x, rLabel.y);
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [project, telemetry, localTarget]);

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-black ${className}`}>
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="w-full h-full cursor-grab active:cursor-grabbing block touch-none"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      />

      <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-auto">
        <div className="px-2.5 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md border border-cyan-500/30 text-[10px] font-mono text-cyan-300 flex items-center gap-1.5 shadow-lg">
          <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: "12s" }} />
          <span>3D ORBIT VIEW (Потяните для вращения)</span>
        </div>
      </div>

      <div className="absolute top-3 right-3 flex items-center gap-1.5 pointer-events-auto">
        <button
          onClick={() => setZoom((z) => Math.min(2.0, z + 0.15))}
          className="p-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all shadow-md cursor-pointer"
          title="Zoom in"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
          className="p-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all shadow-md cursor-pointer"
          title="Zoom out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={resetCamera}
          className="p-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all shadow-md cursor-pointer"
          title="Сбросить ракурс 3D"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-slate-400 pointer-events-none px-1">
        <div className="bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800">
          Robot: <span className="text-cyan-400 font-bold">{Math.round(telemetry.pose.x || 0)}, {Math.round(telemetry.pose.y || 0)}</span> | Heading: <span className="text-amber-400 font-bold">{Math.round(telemetry.pose.heading || 0)}°</span>
        </div>
        <div className="bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800">
          Target: <span className="text-rose-400 font-bold">{localTarget.x}, {localTarget.y}</span>
        </div>
      </div>
    </div>
  );
}
