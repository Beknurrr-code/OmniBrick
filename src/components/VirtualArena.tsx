import { useRef, useEffect, useState } from "react";
import type { RobotTelemetry } from "../types";

interface VirtualArenaProps {
  telemetry: RobotTelemetry;
  onTargetMove?: (x: number, y: number) => void;
  className?: string;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
}

export default function VirtualArena({ 
  telemetry, 
  onTargetMove, 
  className = "",
  canvasRef: externalCanvasRef,
}: VirtualArenaProps) {
  const internalCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = externalCanvasRef || internalCanvasRef;
  const [isDragging, setIsDragging] = useState(false);
  const [localTarget, setLocalTarget] = useState({ x: 340, y: 260 });

  // Fixed arena obstacles (500x500cm coordinate space)
  const obstacles = [
    { x: 230, y: 140, w: 50, h: 50, label: "OBSTACLE 01" },
    { x: 160, y: 350, w: 70, h: 30, label: "BARRIER" },
  ];

  const getArenaCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;

    const arenaX = (canvasX / rect.width) * 500;
    const arenaY = (canvasY / rect.height) * 500;
    return { 
      x: Math.max(25, Math.min(475, Math.round(arenaX))), 
      y: Math.max(25, Math.min(475, Math.round(arenaY))) 
    };
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const coords = getArenaCoords(e);
    if (coords) {
      setIsDragging(true);
      setLocalTarget(coords);
      onTargetMove?.(coords.x, coords.y);
    }
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const coords = getArenaCoords(e);
    if (coords) {
      setLocalTarget(coords);
      onTargetMove?.(coords.x, coords.y);
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const scale = width / 500; // Scale 500cm to canvas pixels

    // 1. Futuristic Arena Floor
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, width, height);

    // 2. Subtle Grid
    ctx.strokeStyle = "rgba(148, 163, 184, 0.07)";
    ctx.lineWidth = 1;
    const step = 50 * scale;
    for (let x = 0; x <= width; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y <= height; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // 3. Glowing Perimeter Wall with safety margin
    ctx.strokeStyle = "rgba(6, 182, 212, 0.35)";
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, width - 8, height - 8);

    // 4. Draw Static Obstacles
    obstacles.forEach((obs) => {
      const ox = obs.x * scale;
      const oy = obs.y * scale;
      const ow = obs.w * scale;
      const oh = obs.h * scale;

      ctx.save();
      ctx.fillStyle = "#1e293b";
      ctx.strokeStyle = "rgba(234, 179, 8, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.fillRect(ox, oy, ow, oh);
      ctx.strokeRect(ox, oy, ow, oh);

      // Hazard diagonal stripes
      ctx.fillStyle = "rgba(234, 179, 8, 0.15)";
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "center";
      ctx.fillText(obs.label, ox + ow / 2, oy + oh / 2 + 3);
      ctx.restore();
    });

    const robotX = (telemetry.pose.x || 120) * scale;
    const robotY = (telemetry.pose.y || 120) * scale;
    const headingDeg = telemetry.pose.heading || 0;
    const headingRad = headingDeg * Math.PI / 180;

    const targetX = localTarget.x * scale;
    const targetY = localTarget.y * scale;

    const dx = targetX - robotX;
    const dy = targetY - robotY;
    const distancePx = Math.hypot(dx, dy);
    const distanceCm = Math.round(distancePx / scale);

    const isTargetSeen = telemetry.sensors.opticalTargetDetected;

    // 5. Optical Camera Field of View (FOV: ±35° up to 380cm)
    const fovRadius = 380 * scale;
    const fovAngle = 35 * Math.PI / 180;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(robotX, robotY);
    ctx.arc(robotX, robotY, fovRadius, headingRad - fovAngle, headingRad + fovAngle);
    ctx.closePath();

    ctx.fillStyle = isTargetSeen 
      ? "rgba(239, 68, 68, 0.18)" 
      : "rgba(6, 182, 212, 0.08)";
    ctx.fill();

    ctx.strokeStyle = isTargetSeen 
      ? "rgba(239, 68, 68, 0.7)" 
      : "rgba(6, 182, 212, 0.25)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // 6. Laser Tracking Line (when in sight)
    if (isTargetSeen) {
      ctx.save();
      ctx.strokeStyle = "rgba(239, 68, 68, 0.8)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(robotX, robotY);
      ctx.lineTo(targetX, targetY);
      ctx.stroke();

      // Distance tag midway
      const midX = (robotX + targetX) / 2;
      const midY = (robotY + targetY) / 2;
      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 9px monospace";
      ctx.fillText(`${distanceCm}cm`, midX + 6, midY - 6);
      ctx.restore();
    }

    // 7. TARGET: RED CUBE
    const cubeSize = 22 * scale;
    ctx.save();
    ctx.fillStyle = "#ef4444";
    ctx.shadowColor = "#ef4444";
    ctx.shadowBlur = isTargetSeen ? 25 : 10;
    ctx.fillRect(targetX - cubeSize / 2, targetY - cubeSize / 2, cubeSize, cubeSize);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(targetX - cubeSize / 2, targetY - cubeSize / 2, cubeSize, cubeSize);

    // Reticle brackets around target
    if (isTargetSeen) {
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2;
      const bSize = cubeSize + 8;
      ctx.strokeRect(targetX - bSize / 2, targetY - bSize / 2, bSize, bSize);
    }

    // Label
    ctx.fillStyle = "#fca5a5";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.fillText("TARGET: RED CUBE", targetX, targetY - cubeSize / 2 - 6);
    ctx.restore();

    // 8. ROBOT CHASSIS & ACTUATORS
    ctx.save();
    ctx.translate(robotX, robotY);
    ctx.rotate(headingRad);

    const bodyW = 32 * scale;
    const bodyH = 24 * scale;

    // Chassis Glow & Shell
    ctx.shadowColor = "rgba(6, 182, 212, 0.8)";
    ctx.shadowBlur = 14;
    ctx.fillStyle = "#0f172a";
    ctx.strokeStyle = "#06b6d4";
    ctx.lineWidth = 2;
    ctx.fillRect(-bodyW / 2, -bodyH / 2, bodyW, bodyH);
    ctx.strokeRect(-bodyW / 2, -bodyH / 2, bodyW, bodyH);

    // Differential Tread Wheels
    ctx.fillStyle = "#334155";
    ctx.fillRect(-bodyW / 2 + 2, -bodyH / 2 - 4, 14 * scale, 3.5);
    ctx.fillRect(-bodyW / 2 + 2, bodyH / 2 + 0.5, 14 * scale, 3.5);

    // Front Camera Lens Eye
    ctx.fillStyle = isTargetSeen ? "#ef4444" : "#06b6d4";
    ctx.shadowColor = isTargetSeen ? "#ef4444" : "#06b6d4";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(bodyW / 2 - 1, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    // Forward Heading Arrow
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(bodyW / 2 + 8, 0);
    ctx.stroke();

    ctx.restore();
  }, [telemetry, localTarget]);

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-slate-800 bg-[#020617] select-none ${className}`}>
      <canvas
        ref={canvasRef}
        width={500}
        height={500}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        className="w-full h-full aspect-square block cursor-crosshair"
      />
      
      {/* Top HUD Status */}
      <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1 bg-black/75 backdrop-blur-md rounded-xl border border-slate-800 text-[10px] font-mono">
        <span className={`w-2 h-2 rounded-full ${telemetry.sensors.opticalTargetDetected ? "bg-red-500 animate-ping" : "bg-cyan-400 animate-pulse"}`} />
        <span className="font-bold text-white">
          {telemetry.sensors.opticalTargetDetected ? "OPTICAL LOCK (RED CUBE)" : "2D SIMULATION ARENA (500x500cm)"}
        </span>
      </div>

      <div className="absolute top-3 right-3 text-[10px] font-mono bg-black/75 px-2.5 py-1 rounded-xl border border-slate-800 text-slate-400">
        💡 Drag or tap arena to reposition target
      </div>

      {/* Bottom Coordinates HUD */}
      <div className="absolute bottom-3 left-3 flex items-center gap-3 text-[10px] font-mono text-slate-300 bg-black/75 px-3 py-1 rounded-xl border border-slate-800">
        <span>X: {telemetry.pose.x}cm</span>
        <span>Y: {telemetry.pose.y}cm</span>
        <span className="text-cyan-400">HEAD: {telemetry.pose.heading}°</span>
        <span className="text-amber-400">WALL: {telemetry.sensors.distanceToWallCm}cm</span>
      </div>
    </div>
  );
}
