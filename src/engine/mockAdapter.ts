import type { IRobotAdapter } from "./types";
import type { RobotTelemetry, RobotOperationalState } from "../types";

export class MockRobotAdapter implements IRobotAdapter {
  id: string;
  name: string = "Virtual Arena Simulator (2D/3D)";
  private connected: boolean = false;
  private isPaused: boolean = false;
  private telemetryCallback?: (t: RobotTelemetry) => void;

  // Arena Physics & Geometry (500cm x 500cm)
  private arena = { width: 500, height: 500 };
  private pose = { x: 120, y: 120, heading: 40 }; // heading in degrees (0..360)
  private target = { x: 340, y: 280, label: "red cube" };

  private motors: Record<string, { speed: number; position: number }> = {
    A: { speed: 0, position: 0 },
    B: { speed: 0, position: 0 },
  };

  private currentTask: string = "Idle standby";
  private currentAction: string = "Awaiting command";
  private loopInterval?: any;

  constructor(robotId: string = "sim-robot-01") {
    this.id = robotId;
  }

  async connect(): Promise<boolean> {
    this.connected = true;
    this.isPaused = false;
    this.startPhysicsLoop();
    return true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    if (this.loopInterval) clearInterval(this.loopInterval);
    await this.stopAll();
  }

  isConnected(): boolean {
    return this.connected;
  }

  setTargetPosition(x: number, y: number): void {
    this.target.x = Math.max(20, Math.min(this.arena.width - 20, x));
    this.target.y = Math.max(20, Math.min(this.arena.height - 20, y));
  }

  getTargetPosition(): { x: number; y: number; label: string } {
    return { ...this.target };
  }

  async sendMotorCommand(port: string, speed: number, durationMs?: number): Promise<void> {
    const clamped = Math.max(-100, Math.min(100, speed));
    this.motors[port] = {
      speed: clamped,
      position: (this.motors[port]?.position || 0) + clamped,
    };

    this.currentAction = `Thrust ${port}: ${clamped}%`;

    if (durationMs && durationMs > 0) {
      setTimeout(() => {
        if (this.motors[port]) {
          this.motors[port].speed = 0;
          this.currentAction = "Thrust complete";
        }
      }, durationMs);
    }
  }

  async stopAll(): Promise<void> {
    Object.keys(this.motors).forEach(p => {
      if (this.motors[p]) this.motors[p].speed = 0;
    });
    this.currentAction = "Actuators cut. Stopped.";
  }

  getTelemetry(): RobotTelemetry {
    // 1. Math geometry relative to target
    const dx = this.target.x - this.pose.x;
    const dy = this.target.y - this.pose.y;
    const distanceToTarget = Math.hypot(dx, dy);

    const angleToTargetRad = Math.atan2(dy, dx);
    const angleToTargetDeg = (angleToTargetRad * 180 / Math.PI + 360) % 360;
    const relativeAngle = ((angleToTargetDeg - this.pose.heading + 540) % 360) - 180;

    // 2. Camera Field of View (FOV: ±35° up to 380cm range)
    const inFov = Math.abs(relativeAngle) <= 35 && distanceToTarget < 380;

    // 3. Distance to boundary walls
    const distanceToWall = Math.min(
      this.pose.x,
      this.pose.y,
      this.arena.width - this.pose.x,
      this.arena.height - this.pose.y
    );

    const isMoving = (this.motors["A"]?.speed || 0) !== 0 || (this.motors["B"]?.speed || 0) !== 0;
    const operationalState: RobotOperationalState = !this.connected 
      ? "offline" 
      : this.isPaused 
      ? "paused" 
      : isMoving 
      ? "running" 
      : "connected";

    return {
      robotId: this.id,
      timestamp: Date.now(),
      operationalState,
      adapterMode: "mock_simulator",
      batteryLevel: 96,
      currentTask: inFov ? "Tracking Red Cube" : "Searching Arena",
      currentAction: this.currentAction,
      pose: {
        x: Math.round(this.pose.x * 10) / 10,
        y: Math.round(this.pose.y * 10) / 10,
        heading: Math.round(this.pose.heading),
      },
      motors: {
        A: { ...this.motors["A"] },
        B: { ...this.motors["B"] },
      },
      sensors: {
        distanceToWallCm: Math.round(distanceToWall),
        opticalTargetDetected: inFov,
        gyro: { yaw: Math.round(this.pose.heading), pitch: 0, roll: 0 },
      },
      lastDetectedObject: inFov ? {
        label: this.target.label,
        confidence: 0.97,
        distanceCm: Math.round(distanceToTarget),
        bearingDeg: Math.round(relativeAngle),
        bbox: [
          Math.max(10, Math.min(280, 160 + Math.round(relativeAngle * 4))),
          110,
          Math.max(24, Math.round(1800 / Math.max(20, distanceToTarget))),
          Math.max(24, Math.round(1800 / Math.max(20, distanceToTarget))),
        ],
      } : undefined,
    };
  }

  async executeTool(toolName: string, params: Record<string, any>): Promise<any> {
    switch (toolName) {
      case "robot_move_direction":
      case "drive_motors": {
        let leftSpeed = params.leftSpeed ?? 50;
        let rightSpeed = params.rightSpeed ?? 50;
        const durationMs = params.durationMs ?? 1000;
        if (params.direction === "forward") {
          const spd = params.speed ?? 60;
          leftSpeed = spd;
          rightSpeed = spd;
        } else if (params.direction === "backward") {
          const spd = params.speed ?? 60;
          leftSpeed = -spd;
          rightSpeed = -spd;
        }
        await this.sendMotorCommand("A", leftSpeed, durationMs);
        await this.sendMotorCommand("B", rightSpeed, durationMs);
        return { 
          success: true, 
          message: `Actuators engaged: Left=${leftSpeed}% Right=${rightSpeed}% (${durationMs}ms)` 
        };
      }

      case "robot_turn_to_heading":
      case "turn_robot": {
        const degrees = params.degrees ?? Math.abs(params.target_heading_deg ?? 45);
        const direction = params.direction ?? (params.target_heading_deg < 0 ? "left" : "right");
        const delta = direction === "right" ? degrees : -degrees;
        this.pose.heading = (this.pose.heading + delta + 360) % 360;
        this.currentAction = `Rotated ${degrees}° ${direction}`;
        return { success: true, newHeading: Math.round(this.pose.heading) };
      }

      case "detect_object": {
        const telem = this.getTelemetry();
        if (telem.lastDetectedObject) {
          return {
            found: true,
            label: telem.lastDetectedObject.label,
            distanceCm: telem.lastDetectedObject.distanceCm,
            bearingDeg: telem.lastDetectedObject.bearingDeg,
            confidence: telem.lastDetectedObject.confidence,
          };
        }
        return { found: false, message: "Target not in camera field of view." };
      }

      case "scan_visual_environment": {
        const telem = this.getTelemetry();
        if (telem.lastDetectedObject) {
          const dist = telem.lastDetectedObject.distanceCm;
          return {
            found: true,
            object: telem.lastDetectedObject.label,
            distanceCm: dist,
            bearingDeg: telem.lastDetectedObject.bearingDeg,
            confidence: telem.lastDetectedObject.confidence,
            actionHint: dist <= 45 ? "TARGET_REACHED" : "APPROACH_TARGET",
          };
        }
        return {
          found: false,
          actionHint: "SWEEP_HORIZON",
        };
      }

      case "speak_voice": {
        const message = params.message || "";
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(message);
          utterance.rate = 1.0;
          window.speechSynthesis.speak(utterance);
        }
        return { success: true, vocalized: message };
      }

      case "stop_robot": {
        await this.stopAll();
        return { success: true, message: "Actuators disengaged. Full stop." };
      }

      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  }

  onTelemetry(callback: (telemetry: RobotTelemetry) => void): void {
    this.telemetryCallback = callback;
  }

  private startPhysicsLoop() {
    if (this.loopInterval) clearInterval(this.loopInterval);

    // 20Hz update loop (50ms)
    this.loopInterval = setInterval(() => {
      const spdA = this.motors["A"]?.speed || 0;
      const spdB = this.motors["B"]?.speed || 0;

      if (spdA !== 0 || spdB !== 0) {
        // Differential drive forward velocity & angular yaw rate
        const v = (spdA + spdB) / 2 * 0.08; // cm per tick
        const w = (spdB - spdA) * 0.04;    // degrees per tick

        this.pose.heading = (this.pose.heading + w + 360) % 360;
        const rad = this.pose.heading * Math.PI / 180;

        const newX = this.pose.x + v * Math.cos(rad);
        const newY = this.pose.y + v * Math.sin(rad);

        // Boundary collision detection
        this.pose.x = Math.max(12, Math.min(this.arena.width - 12, newX));
        this.pose.y = Math.max(12, Math.min(this.arena.height - 12, newY));
      }

      if (this.telemetryCallback) {
        this.telemetryCallback(this.getTelemetry());
      }
    }, 50);
  }
}
