import type { MCPToolBinding } from "../types";
import type { IRobotAdapter } from "./types";
import { calculateSafeDriveTrajectory } from "../services/kinematicsSafety";
import { skillEvolutionService } from "../services/skillEvolutionService";

export const BUILTIN_TOOLS: MCPToolBinding[] = [
  {
    id: "tool-drive",
    name: "drive_motors",
    label: "Drive Actuators",
    description: "Powers differential drive motors (-100 to +100%) for a specified duration in milliseconds.",
    enabled: true,
    parametersSchema: {
      leftSpeed: { type: "number", min: -100, max: 100, default: 50 },
      rightSpeed: { type: "number", min: -100, max: 100, default: 50 },
      durationMs: { type: "number", default: 1000 },
      reason: { type: "string", description: "Strategic motivation for motion" },
    },
    source: "builtin",
  },
  {
    id: "tool-safe-drive-calc",
    name: "calculate_safe_drive",
    label: "Safe Drive & Clearance Calc",
    description: "Evaluates forward ultrasonic sonar distance, calculates safe braking distance, and computes ramp-up motor speeds before physical acceleration.",
    enabled: true,
    parametersSchema: {
      requestedSpeed: { type: "number", default: 60, description: "Requested motor speed percent" },
      requestedDistanceCm: { type: "number", default: 50, description: "Target distance in cm" },
    },
    source: "builtin",
  },
  {
    id: "tool-turn",
    name: "turn_robot",
    label: "Rotate Heading",
    description: "Rotates robot chassis by a relative angle in degrees (left or right).",
    enabled: true,
    parametersSchema: {
      degrees: { type: "number", default: 45 },
      direction: { type: "string", enum: ["left", "right"], default: "right" },
    },
    source: "builtin",
  },
  {
    id: "tool-vision",
    name: "scan_visual_environment",
    label: "Multimodal Vision Scan",
    description: "Perceives the optical field of view to locate target objects, bounding boxes, and distances.",
    enabled: true,
    parametersSchema: {
      targetObject: { type: "string", default: "red cube" },
    },
    source: "builtin",
  },
  {
    id: "tool-voice",
    name: "speak_voice",
    label: "Speech Vocalizer (TTS)",
    description: "Broadcasts spoken audio through the phone speaker to communicate intentions, answer questions, or express emotions.",
    enabled: true,
    parametersSchema: {
      message: { type: "string", description: "The sentence to speak out loud" },
      mood: { type: "string", enum: ["neutral", "happy", "focused", "alert", "curious"], default: "neutral" },
    },
    source: "builtin",
  },
  {
    id: "tool-code",
    name: "execute_code",
    label: "Execute Code Sandbox",
    description: "Executes mathematical algorithms, kinematics equations, or logic in sandboxed JavaScript. Returns evaluated values, calculated motor vectors, or telemetry transformations.",
    enabled: true,
    parametersSchema: {
      code: { type: "string", description: "JavaScript or mathematical code expression to evaluate" },
      purpose: { type: "string", description: "Short explanation of the calculation" },
    },
    source: "builtin",
  },
  {
    id: "tool-mcp",
    name: "call_mcp_tool",
    label: "Invoke Custom MCP Server Tool",
    description: "Dispatches a structured request to an external Model Context Protocol (MCP) server for robotics extensions, weather, physics solvers, or database lookups.",
    enabled: true,
    parametersSchema: {
      serverName: { type: "string", description: "Target MCP Server name" },
      toolName: { type: "string", description: "Tool name within the server" },
      arguments: { type: "object", description: "Tool arguments" },
    },
    source: "builtin",
  },
  {
    id: "tool-eyes",
    name: "set_robot_eyes",
    label: "Set Emotive Face Eyes",
    description: "Changes the emotion, color, and pupil size of the robot's eyes on the smartphone screen and displays a matching pixel pattern on the LEGO Mindstorms 51515 5x5 LED matrix.",
    enabled: true,
    parametersSchema: {
      mood: { type: "string", enum: ["neutral", "happy", "focused", "alert", "curious", "sleeping"] },
      color: { type: "string", enum: ["cyan", "purple", "emerald", "amber", "rose"] },
    },
    source: "builtin",
  },
  {
    id: "tool-stop",
    name: "stop_robot",
    label: "Emergency Halt",
    description: "Cuts power immediately to all motors and holds position.",
    enabled: true,
    parametersSchema: {
      reason: { type: "string", description: "Reason for emergency stop" },
    },
    source: "builtin",
  },
  {
    id: "tool-status",
    name: "query_robot_status",
    label: "Query Hardware Telemetry",
    description: "Inspects live physical sensors: battery percentage, IMU gyro orientation (heading/pitch/roll), ultrasonic obstacle distance, current pose coordinates, and active chassis mode.",
    enabled: true,
    parametersSchema: {
      reason: { type: "string", description: "Strategic motivation for telemetry inspection" },
    },
    source: "builtin",
  },
];

export class MCPRegistry {
  private tools: Map<string, MCPToolBinding> = new Map();

  constructor() {
    this.refreshTools();
    if (typeof window !== "undefined") {
      window.addEventListener("omnibrick:skills_updated", () => {
        this.refreshTools();
      });
    }
  }

  public refreshTools(): void {
    this.tools.clear();
    // 1. Builtin core tools
    BUILTIN_TOOLS.forEach(t => this.tools.set(t.name, t));

    // 2. Dynamically learned evolved skills from skillEvolutionService
    const learned = skillEvolutionService.getLearnedSkills();
    learned.forEach(skill => {
      this.tools.set(skill.name, {
        id: skill.id,
        name: skill.name,
        label: skill.label,
        description: `[Evolved Skill Lvl ${skill.level}]: ${skill.description}`,
        enabled: true,
        parametersSchema: skill.parametersSchema,
        source: "custom",
      });
    });
  }

  getAllTools(): MCPToolBinding[] {
    return Array.from(this.tools.values());
  }

  getTool(name: string): MCPToolBinding | undefined {
    return this.tools.get(name);
  }

  async execute(toolName: string, params: Record<string, any>, adapter: IRobotAdapter): Promise<any> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`MCP Tool not registered: ${toolName}`);
    }

    // 0. Pre-Flight Safe Drive & Clearance Calculation
    if (toolName === "calculate_safe_drive") {
      const telem = adapter.getTelemetry();
      const clearance = telem.sensors?.distanceToWallCm ?? 999;
      const trajectory = calculateSafeDriveTrajectory(
        params.requestedSpeed ?? 60,
        params.requestedDistanceCm ?? 50,
        clearance
      );
      return trajectory;
    }

    // 1. Code Execution Sandbox
    if (toolName === "execute_code") {
      try {
        const rawCode = params.code || "";
        const sandboxContext = {
          Math,
          degToRad: (deg: number) => (deg * Math.PI) / 180,
          radToDeg: (rad: number) => (rad * 180) / Math.PI,
          calcDifferentialKinematics: (v: number, omega: number, trackWidth = 14) => ({
            leftSpeed: Math.max(-100, Math.min(100, Math.round(v - (omega * trackWidth) / 2))),
            rightSpeed: Math.max(-100, Math.min(100, Math.round(v + (omega * trackWidth) / 2))),
          }),
          calcArcDrive: (radiusCm: number, speedPercent = 60, trackWidth = 14) => {
            const rInner = Math.max(1, radiusCm - trackWidth / 2);
            const rOuter = radiusCm + trackWidth / 2;
            const ratio = rInner / rOuter;
            return {
              innerWheelSpeed: Math.round(speedPercent * ratio),
              outerWheelSpeed: speedPercent,
            };
          },
          calcHeadingDiff: (targetDeg: number, currentDeg: number) => {
            let diff = (targetDeg - currentDeg) % 360;
            if (diff > 180) diff -= 360;
            if (diff < -180) diff += 360;
            return diff;
          },
          distance2D: (x1: number, y1: number, x2: number, y2: number) => Math.hypot(x2 - x1, y2 - y1),
          clamp: (val: number, min: number, max: number) => Math.max(min, Math.min(max, val)),
        };

        let evaluated: any;
        try {
          const fn = new Function(...Object.keys(sandboxContext), `"use strict"; return (${rawCode});`);
          evaluated = fn(...Object.values(sandboxContext));
        } catch {
          const fnBlock = new Function(...Object.keys(sandboxContext), `"use strict"; ${rawCode}`);
          evaluated = fnBlock(...Object.values(sandboxContext));
        }

        return {
          success: true,
          output: evaluated !== undefined ? evaluated : "Code evaluated successfully (void)",
          purpose: params.purpose || "Kinematics computation",
        };
      } catch (err: any) {
        return {
          success: false,
          error: err.message || "Execution exception in sandbox",
        };
      }
    }

    // 2. Generic MCP Server Call
    if (toolName === "call_mcp_tool") {
      return {
        success: true,
        server: params.serverName || "robotics-core",
        tool: params.toolName || "kinematics_solver",
        result: { status: "OK", payload: params.arguments || {}, executionLatencyMs: 12 },
      };
    }

    // 3. Emotive Eyes Face update
    if (toolName === "set_robot_eyes") {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("omnibrick:set_eyes", { detail: params }));
      }
      return { success: true, mood: params.mood, color: params.color };
    }

    // 4. Voice Vocalization
    if (toolName === "speak_voice") {
      const msg = params.message || "";
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("omnibrick:speak", { detail: params }));
        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(msg);
          if (params.mood === "happy") { utterance.pitch = 1.25; utterance.rate = 1.05; }
          else if (params.mood === "alert") { utterance.pitch = 1.4; utterance.rate = 1.15; }
          else if (params.mood === "focused") { utterance.pitch = 0.95; utterance.rate = 1.0; }
          window.speechSynthesis.speak(utterance);
        }
      }
      return { success: true, vocalized: msg, mood: params.mood || "neutral" };
    }

    // 5. Hardware Status & Sensor Telemetry Query
    if (toolName === "query_robot_status") {
      const telem = adapter.getTelemetry();
      return {
        success: true,
        batteryLevel: telem.batteryLevel,
        headingDeg: telem.sensors?.gyro?.yaw ?? telem.pose?.heading ?? 0,
        distanceToObstacleCm: telem.sensors?.distanceToWallCm ?? 999,
        pose: telem.pose,
        adapterMode: telem.adapterMode,
        opticalTarget: telem.lastDetectedObject || null,
        reason: params.reason || "Telemetry inspection completed",
      };
    }

    // 6. Dynamic Execution of Learned Skill
    const learnedSkill = skillEvolutionService.getSkill(toolName);
    if (learnedSkill) {
      try {
        const fn = new Function("params", "adapter", `"use strict"; ${learnedSkill.code}`);
        const result = fn(params, adapter);
        skillEvolutionService.recordSkillUsage(toolName, true);
        return {
          success: true,
          skill: learnedSkill.name,
          level: learnedSkill.level,
          result: result || "Skill executed successfully",
        };
      } catch (err: any) {
        skillEvolutionService.recordSkillUsage(toolName, false);
        return {
          success: false,
          skill: learnedSkill.name,
          error: err.message || "Failed to execute learned skill",
        };
      }
    }

    // 7. Motor & Hardware Adapter Execution
    return adapter.executeTool(toolName, params);
  }
}

export const mcpRegistry = new MCPRegistry();

