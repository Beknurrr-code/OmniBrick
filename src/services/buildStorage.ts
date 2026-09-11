import type { 
  RobotBuild, 
  PromptBuild, 
  MCPToolBuild, 
  AnyBuild, 
  BuildType,
  RobotCapability 
} from "../types";
import { BUILTIN_TOOLS } from "../engine/mcpRegistry";

export const DEFAULT_CAPABILITIES: RobotCapability[] = [
  {
    id: "vision",
    name: "Computer Vision",
    description: "Real-time frame ingestion and visual feature extraction via camera feed.",
    enabled: true,
    requiredHardware: ["camera"],
    category: "perception",
  },
  {
    id: "object_detection",
    name: "Object Detection",
    description: "Identifies colored targets, shapes, obstacles and bounding boxes.",
    enabled: true,
    requiredHardware: ["camera"],
    category: "perception",
  },
  {
    id: "navigation",
    name: "Navigation & Pathing",
    description: "Calculates angular bearing and drives toward coordinates.",
    enabled: true,
    requiredHardware: ["motors"],
    category: "locomotion",
  },
  {
    id: "movement",
    name: "Differential Movement",
    description: "Independent dual-wheel velocity and rotation control.",
    enabled: true,
    requiredHardware: ["motors"],
    category: "locomotion",
  },
  {
    id: "speech",
    name: "Voice Vocalization (TTS)",
    description: "Speaks aloud intentions and mission status via speaker.",
    enabled: true,
    requiredHardware: ["speaker"],
    category: "interaction",
  },
  {
    id: "person_tracking",
    name: "Person Tracking",
    description: "Tracks human presence and maintains relative follow distance.",
    enabled: false,
    requiredHardware: ["camera", "motors"],
    category: "perception",
  },
  {
    id: "obstacle_avoidance",
    name: "Reflex Obstacle Avoidance",
    description: "Emergency perimeter braking when sensors detect proximity < 25cm.",
    enabled: true,
    requiredHardware: ["sensors", "motors"],
    category: "locomotion",
  },
  {
    id: "grabbing",
    name: "Object Manipulation",
    description: "Actuates claw/gripper to secure and transport detected objects.",
    enabled: false,
    requiredHardware: ["motors"],
    category: "manipulation",
  },
];

const STORAGE_KEY_ROBOTS = "omnibrick_builds_robots_v2";
const STORAGE_KEY_PROMPTS = "omnibrick_builds_prompts_v2";
const STORAGE_KEY_TOOLS = "omnibrick_builds_tools_v2";

export const SEED_ROBOT_BUILDS: RobotBuild[] = [
  {
    type: "robot",
    id: "build-red-cube-hunter",
    name: "Red Cube Hunter",
    tagline: "Autonomous optical search rover for target cubes",
    description: "Flagship vision-guided rover equipped with optical detection, real-time object tracking, and dual-motor differential drive.",
    difficulty: "medium",
    category: "rover",
    author: "Beknur (Founder)",
    version: "1.2.0",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ["Vision", "Red-Cube", "Autonomous", "Shipathon-2026"],
    hardware: {
      chassis: "lego",
      motors: [
        { id: "m-left", port: "M1", role: "drive_left", label: "Left Wheel Motor", maxPower: 100, speedLimit: 80 },
        { id: "m-right", port: "M2", role: "drive_right", label: "Right Wheel Motor", maxPower: 100, speedLimit: 80 },
      ],
      sensors: [
        { id: "s-sonar", port: "S1", type: "ultrasonic", label: "Front Distance Sonar" },
        { id: "s-gyro", port: "internal", type: "gyro", label: "Chassis Gyroscope" },
      ],
      camera: {
        enabled: true,
        source: "phone_back",
        resolution: "640x480",
        fps: 20,
        status: "connected",
      },
    },
    capabilities: DEFAULT_CAPABILITIES.map(c => ({
      ...c,
      enabled: ["vision", "object_detection", "navigation", "movement", "speech", "obstacle_avoidance"].includes(c.id),
    })),
    tools: BUILTIN_TOOLS.map(t => ({ ...t })),
    connectedMcps: [
      {
        id: "mcp-vision-core",
        name: "Vision Engine MCP Server",
        description: "Local computer vision inference providing detect_object & scan_scene",
        status: "connected",
        endpoint: "embedded://vision-v1",
        availableTools: ["detect_object", "scan_visual_environment"],
        permissions: ["camera_feed"],
      },
      {
        id: "mcp-chassis-driver",
        name: "Differential Drive MCP Driver",
        description: "Standard HAL adapter for 2-wheel robotic bases",
        status: "connected",
        endpoint: "embedded://diff-drive-v1",
        availableTools: ["drive_motors", "turn_robot", "stop_robot"],
        permissions: ["motor_control"],
      },
    ],
    ai: {
      name: "Red Cube Hunter Brain",
      tagline: "Visual Target Finder",
      systemPrompt: "You are the autonomous brain of Red Cube Hunter. Your directive is to explore the arena, locate the red cube using camera vision, drive toward it, and vocalize when acquired.",
      instructions: "1. Scan optical field of view before initiating thrust.\n2. Keep minimum 20cm clearance from walls.\n3. Vocalize task completion over speaker.",
      reasoningEffort: "fast",
      voiceTone: "tactical",
      temperature: 0.7,
    },
    variables: {
      search_color: {
        key: "search_color",
        label: "Target Color",
        type: "string",
        value: "red",
        description: "Hue filter for visual object detection",
      },
      max_speed: {
        key: "max_speed",
        label: "Max Cruising Speed",
        type: "number",
        value: 65,
        unit: "%",
        description: "Maximum PWM motor output cap",
      },
      target_distance_cm: {
        key: "target_distance_cm",
        label: "Stop Distance",
        type: "number",
        value: 45,
        unit: "cm",
        description: "Proximity threshold to declare target acquired",
      },
    },
    execution: {
      defaultMode: "mock_simulator",
      autoReflexes: true,
      safetyTimeoutMs: 5000,
      logLevel: "info",
    },
    connectedDevice: "Virtual Simulation Arena (20Hz)",
    lastRunAt: "Just now",
    isPublished: true,
    priceBricks: 0,
    downloads: 342,
    likes: 89,
  },
  {
    type: "robot",
    id: "build-cyberpup-neo",
    name: "CyberPup Neo",
    tagline: "Emotive companion pet with audio-motion reflexes",
    description: "Interactive desk pet with head-tracking gestures, responsive audio chirps, and perimeter surveillance.",
    difficulty: "easy",
    category: "pet",
    author: "Beknur",
    version: "1.0.4",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ["Pet", "Audio", "Emotive"],
    hardware: {
      chassis: "lego",
      motors: [
        { id: "m-head", port: "M1", role: "head_pan", label: "Neck Pan Motor", maxPower: 70 },
        { id: "m-tilt", port: "M2", role: "head_tilt", label: "Neck Tilt Motor", maxPower: 70 },
      ],
      sensors: [
        { id: "s-touch", port: "S1", type: "touch", label: "Petting Sensor" },
      ],
      camera: {
        enabled: true,
        source: "phone_front",
        resolution: "320x240",
        fps: 10,
        status: "connected",
      },
    },
    capabilities: DEFAULT_CAPABILITIES.map(c => ({
      ...c,
      enabled: ["vision", "speech", "person_tracking"].includes(c.id),
    })),
    tools: BUILTIN_TOOLS.filter(t => t.name !== "drive_motors"),
    ai: {
      name: "CyberPup",
      tagline: "AI Pet Companion",
      systemPrompt: "You are CyberPup Neo, a curious and loyal robot companion. Respond warmly when spoken to and guard your station diligently.",
      instructions: "Nod when spoken to, emit friendly chimes, and greet new people.",
      reasoningEffort: "fast",
      voiceTone: "friendly",
      temperature: 0.8,
    },
    variables: {
      wag_intensity: {
        key: "wag_intensity",
        label: "Reaction Intensity",
        type: "number",
        value: 80,
        unit: "%",
        description: "Speed of emotive neck motions",
      },
    },
    execution: {
      defaultMode: "mock_simulator",
      autoReflexes: true,
      safetyTimeoutMs: 5000,
      logLevel: "info",
    },
    isPublished: true,
    priceBricks: 250,
    downloads: 120,
    likes: 45,
  },
  {
    type: "robot",
    id: "build-titan-claw",
    name: "Titan Claw Manipulator",
    tagline: "Precision 3-DOF pick-and-place robotic arm",
    description: "Robotic arm configuration designed for sorting colored cubes and physical object manipulation via inverse kinematics.",
    difficulty: "hard",
    category: "arm",
    author: "OmniBrick Labs",
    version: "2.1.0",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ["Arm", "IK", "Industrial"],
    hardware: {
      chassis: "diy",
      motors: [
        { id: "m-base", port: "M1", role: "head_pan", label: "Base Rotating Turntable", maxPower: 75 },
        { id: "m-elbow", port: "M2", role: "arm_lift", label: "Elbow Lift Actuator", maxPower: 90 },
        { id: "m-grip", port: "M3", role: "gripper", label: "Two-Finger Clamp", maxPower: 100 },
      ],
      sensors: [
        { id: "s-color", port: "S1", type: "color", label: "Sorting Optical Sensor" },
      ],
      camera: {
        enabled: true,
        source: "phone_back",
        resolution: "640x480",
        fps: 20,
        status: "connected",
      },
    },
    capabilities: DEFAULT_CAPABILITIES.map(c => ({
      ...c,
      enabled: ["vision", "object_detection", "grabbing"].includes(c.id),
    })),
    tools: BUILTIN_TOOLS.map(t => ({ ...t })),
    ai: {
      name: "Titan Claw Controller",
      systemPrompt: "You are Titan Claw, a precision sorting and manipulation arm. Calculate joint angles, detect items, and actuate end-effector.",
      instructions: "Confirm grip closure before lifting.",
      reasoningEffort: "deep",
      voiceTone: "minimal",
    },
    variables: {
      grip_pressure: {
        key: "grip_pressure",
        label: "Clamp Pressure",
        type: "number",
        value: 70,
        unit: "%",
        description: "Servo torque limit on gripper closure",
      },
    },
    execution: {
      defaultMode: "mock_simulator",
      autoReflexes: true,
      safetyTimeoutMs: 5000,
      logLevel: "actions_only",
    },
    isPublished: true,
    priceBricks: 500,
    downloads: 98,
    likes: 31,
  },
  {
    type: "robot",
    id: "build-kinematics-racer",
    name: "Kinematics Arc Racer",
    tagline: "High-speed rover with mathematical code execution",
    description: "Demonstrates closed-loop differential trajectory solving, arc turns, and real-time JavaScript kinematics calculations in sandboxed execution.",
    difficulty: "easy",
    category: "rover",
    author: "Beknur (Founder)",
    version: "1.0.0",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ["Kinematics", "Math-Sandbox", "Differential-Drive", "Speed"],
    hardware: {
      chassis: "lego",
      motors: [
        { id: "m-left", port: "M1", role: "drive_left", label: "Left Wheel Motor", maxPower: 100, speedLimit: 95 },
        { id: "m-right", port: "M2", role: "drive_right", label: "Right Wheel Motor", maxPower: 100, speedLimit: 95 },
      ],
      sensors: [
        { id: "s-sonar", port: "S1", type: "ultrasonic", label: "Front Distance Sonar" },
        { id: "s-gyro", port: "internal", type: "gyro", label: "Chassis Gyroscope" },
      ],
      camera: {
        enabled: true,
        source: "phone_back",
        resolution: "640x480",
        fps: 20,
        status: "connected",
      },
    },
    capabilities: DEFAULT_CAPABILITIES.map(c => ({
      ...c,
      enabled: ["navigation", "movement", "speech", "obstacle_avoidance"].includes(c.id),
    })),
    tools: BUILTIN_TOOLS.map(t => ({ ...t })),
    ai: {
      name: "Kinematics Racer Brain",
      systemPrompt: "You are Kinematics Arc Racer. You evaluate complex driving curves using execute_code, calculate differential wheel velocities, and execute agile high-speed maneuvers.",
      instructions: "Always solve arc kinematics in code before executing physical motor rotation.",
      reasoningEffort: "fast",
      voiceTone: "tactical",
    },
    variables: {
      max_speed: {
        key: "max_speed",
        label: "Max Cruising Speed",
        type: "number",
        value: 85,
        unit: "%",
        description: "PWM throttle ceiling",
      },
      track_width_cm: {
        key: "track_width_cm",
        label: "Track Width",
        type: "number",
        value: 14,
        unit: "cm",
        description: "Distance between drive wheel centerlines",
      },
    },
    execution: {
      defaultMode: "mock_simulator",
      autoReflexes: true,
      safetyTimeoutMs: 5000,
      logLevel: "info",
    },
    isPublished: true,
    priceBricks: 100,
    downloads: 215,
    likes: 64,
  },
];

export const SEED_PROMPT_BUILDS: PromptBuild[] = [
  {
    type: "prompt",
    id: "prompt-red-seeker",
    name: "Red Object Seeker Behavior",
    tagline: "High-focus visual homing logic for colored items",
    description: "Reusable AI persona that prioritizes optical tracking, calculates target bearings, and approaches cautiously.",
    author: "Beknur",
    version: "1.0.0",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ["Search", "Computer Vision", "Homing"],
    systemPrompt: "You are an autonomous homing brain. Continuously analyze camera feeds for target colors, calculate relative angles, and issue forward propulsion until reached.",
    guidelines: [
      "Always verify target bearing before continuous throttle",
      "Halt immediately when proximity drops below safe threshold",
      "Announce status transitions to pilot",
    ],
    recommendedVariables: {
      search_color: { key: "search_color", label: "Target Color", type: "string", value: "red", description: "Color to target" },
    },
    compatibleCapabilities: ["vision", "object_detection", "navigation"],
    isPublished: true,
    priceBricks: 150,
    downloads: 74,
    likes: 22,
  },
  {
    type: "prompt",
    id: "prompt-cautious-explorer",
    name: "Cautious Maze Explorer Logic",
    tagline: "Obstacle-avoiding wandering behavior with perimeter mapping",
    description: "System instructions that enforce safe forward exploration while actively maintaining clearance from walls and sudden hurdles.",
    author: "OmniBrick Labs",
    version: "1.1.2",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ["Navigation", "Safety", "Maze"],
    systemPrompt: "You are a cautious exploration agent. Sweep sensors 360 degrees, advance into open corridors, and reverse on sonar trigger.",
    guidelines: [
      "Keep 25cm minimum clearance from perimeter walls",
      "Rotate 90 degrees when cornered",
    ],
    recommendedVariables: {
      wall_distance_cm: { key: "wall_distance_cm", label: "Clearance", type: "number", value: 30, unit: "cm", description: "Safe perimeter distance" },
    },
    compatibleCapabilities: ["navigation", "obstacle_avoidance", "movement"],
    isPublished: true,
    priceBricks: 200,
    downloads: 112,
    likes: 35,
  },
];

export const SEED_MCP_TOOL_BUILDS: MCPToolBuild[] = [
  {
    type: "mcp_tool",
    id: "mcp-build-vision-core",
    name: "Vision Core Tools Bundle",
    tagline: "Multimodal object identification & bounding box extraction",
    description: "Standardized MCP tool definitions for camera snapshot analysis, color isolation, and distance estimation.",
    author: "OmniBrick Labs",
    version: "2.0.0",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ["Vision", "MCP", "AI-Tools"],
    tools: [
      {
        id: "tool-vision-detect",
        name: "detect_object",
        label: "Detect Target Object",
        description: "Scans optical feed for specified object label or color.",
        enabled: true,
        inputSchema: [
          { name: "color", type: "string", description: "Target color (e.g. 'red', 'blue')", default: "red" },
        ],
        outputType: "{ found: boolean, distanceCm: number, bearingDeg: number }",
        permissions: ["camera_feed"],
        source: "builtin",
      },
      {
        id: "tool-vision-scan",
        name: "scan_visual_environment",
        label: "Scan Environment",
        description: "Captures 360 panorama or wide-angle frame to find candidates.",
        enabled: true,
        permissions: ["camera_feed"],
        source: "builtin",
      },
    ],
    serverType: "embedded_ts",
    requiredPermissions: ["camera_feed"],
    isPublished: true,
    priceBricks: 300,
    downloads: 215,
    likes: 64,
  },
  {
    type: "mcp_tool",
    id: "mcp-build-differential-chassis",
    name: "Differential Chassis Driver",
    tagline: "Standard motor actuation commands for wheeled rovers",
    description: "Full suite of movement tools including drive_motors, turn_robot, and emergency stop_robot.",
    author: "Beknur",
    version: "1.3.0",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ["Motors", "Hardware", "Chassis"],
    tools: [
      {
        id: "tool-drive",
        name: "drive_motors",
        label: "Drive Actuators",
        description: "Powers differential motors (-100 to +100%) for duration.",
        enabled: true,
        inputSchema: [
          { name: "leftSpeed", type: "number", description: "Left motor PWM (-100 to 100)" },
          { name: "rightSpeed", type: "number", description: "Right motor PWM (-100 to 100)" },
          { name: "durationMs", type: "number", description: "Duration in milliseconds" },
        ],
        permissions: ["motor_control"],
        source: "builtin",
      },
      {
        id: "tool-turn",
        name: "turn_robot",
        label: "Turn Chassis",
        description: "Rotates chassis in place by degrees.",
        enabled: true,
        permissions: ["motor_control"],
        source: "builtin",
      },
      {
        id: "tool-stop",
        name: "stop_robot",
        label: "Emergency Halt",
        description: "Cuts power immediately to all motors.",
        enabled: true,
        permissions: ["motor_control"],
        source: "builtin",
      },
    ],
    serverType: "embedded_ts",
    requiredPermissions: ["motor_control"],
    isPublished: true,
    priceBricks: 250,
    downloads: 180,
    likes: 52,
  },
];

export class BuildStorageService {
  // ─── Robot Builds ───
  getRobotBuilds(): RobotBuild[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ROBOTS);
      if (!raw) {
        this.saveAllRobots(SEED_ROBOT_BUILDS);
        return SEED_ROBOT_BUILDS;
      }
      return JSON.parse(raw);
    } catch {
      return SEED_ROBOT_BUILDS;
    }
  }

  getRobotById(id: string): RobotBuild | undefined {
    return this.getRobotBuilds().find(b => b.id === id);
  }

  saveRobotBuild(build: RobotBuild): void {
    const builds = this.getRobotBuilds();
    const idx = builds.findIndex(b => b.id === build.id);
    const updated = {
      ...build,
      type: "robot" as const,
      updatedAt: new Date().toISOString(),
    };
    if (idx !== -1) {
      builds[idx] = updated;
    } else {
      builds.unshift(updated);
    }
    this.saveAllRobots(builds);
  }

  deleteRobotBuild(id: string): void {
    const builds = this.getRobotBuilds().filter(b => b.id !== id);
    this.saveAllRobots(builds);
  }

  // ─── Prompt Builds ───
  getPromptBuilds(): PromptBuild[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PROMPTS);
      if (!raw) {
        this.saveAllPrompts(SEED_PROMPT_BUILDS);
        return SEED_PROMPT_BUILDS;
      }
      return JSON.parse(raw);
    } catch {
      return SEED_PROMPT_BUILDS;
    }
  }

  savePromptBuild(build: PromptBuild): void {
    const builds = this.getPromptBuilds();
    const idx = builds.findIndex(b => b.id === build.id);
    const updated = { ...build, type: "prompt" as const, updatedAt: new Date().toISOString() };
    if (idx !== -1) {
      builds[idx] = updated;
    } else {
      builds.unshift(updated);
    }
    this.saveAllPrompts(builds);
  }

  deletePromptBuild(id: string): void {
    const builds = this.getPromptBuilds().filter(b => b.id !== id);
    this.saveAllPrompts(builds);
  }

  // ─── MCP Tool Builds ───
  getMCPToolBuilds(): MCPToolBuild[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_TOOLS);
      if (!raw) {
        this.saveAllTools(SEED_MCP_TOOL_BUILDS);
        return SEED_MCP_TOOL_BUILDS;
      }
      return JSON.parse(raw);
    } catch {
      return SEED_MCP_TOOL_BUILDS;
    }
  }

  saveMCPToolBuild(build: MCPToolBuild): void {
    const builds = this.getMCPToolBuilds();
    const idx = builds.findIndex(b => b.id === build.id);
    const updated = { ...build, type: "mcp_tool" as const, updatedAt: new Date().toISOString() };
    if (idx !== -1) {
      builds[idx] = updated;
    } else {
      builds.unshift(updated);
    }
    this.saveAllTools(builds);
  }

  deleteMCPToolBuild(id: string): void {
    const builds = this.getMCPToolBuilds().filter(b => b.id !== id);
    this.saveAllTools(builds);
  }

  deleteAnyBuild(id: string, type?: BuildType): void {
    if (type === "prompt") {
      this.deletePromptBuild(id);
    } else if (type === "mcp_tool") {
      this.deleteMCPToolBuild(id);
    } else {
      this.deleteRobotBuild(id);
    }
  }

  // ─── Unified Queries ───
  getAllBuilds(): AnyBuild[] {
    return [
      ...this.getRobotBuilds(),
      ...this.getPromptBuilds(),
      ...this.getMCPToolBuilds(),
    ];
  }

  forkBuild(sourceId: string, author: string = "Pilot"): AnyBuild | null {
    const all = this.getAllBuilds();
    const source = all.find(b => b.id === sourceId);
    if (!source) return null;

    const forkedId = `build-fork-${Date.now()}`;
    const forkedBase = {
      ...source,
      id: forkedId,
      name: `${source.name} (Remix)`,
      author,
      forkedFromId: source.id,
      downloads: 0,
      likes: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (source.type === "robot") {
      this.saveRobotBuild(forkedBase as RobotBuild);
    } else if (source.type === "prompt") {
      this.savePromptBuild(forkedBase as PromptBuild);
    } else {
      this.saveMCPToolBuild(forkedBase as MCPToolBuild);
    }

    return forkedBase;
  }

  // ─── Export & Import Manifest (.json) ───
  exportBuildAsJson(build: AnyBuild): void {
    if (typeof window === "undefined") return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(build, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${build.name.toLowerCase().replace(/\s+/g, "_")}_manifest.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  importBuildFromJson(jsonStr: string): AnyBuild {
    const parsed = JSON.parse(jsonStr);
    if (!parsed.name) {
      throw new Error("Invalid manifest: Missing robot name");
    }
    const buildId = parsed.id ? `${parsed.id}-imported-${Date.now().toString().slice(-4)}` : `build-imported-${Date.now()}`;
    const importedBuild: AnyBuild = {
      ...parsed,
      id: buildId,
      updatedAt: new Date().toISOString(),
    };

    if (importedBuild.type === "prompt") {
      this.savePromptBuild(importedBuild as PromptBuild);
    } else if (importedBuild.type === "mcp_tool") {
      this.saveMCPToolBuild(importedBuild as MCPToolBuild);
    } else {
      this.saveRobotBuild(importedBuild as RobotBuild);
    }
    return importedBuild;
  }

  // Legacy compat aliases
  getBuilds(): RobotBuild[] {
    return this.getRobotBuilds();
  }

  getBuildById(id: string): RobotBuild | undefined {
    return this.getRobotById(id);
  }

  saveBuild(build: RobotBuild): void {
    this.saveRobotBuild(build);
  }

  deleteBuild(id: string): void {
    this.deleteRobotBuild(id);
  }

  private saveAllRobots(builds: RobotBuild[]): void {
    localStorage.setItem(STORAGE_KEY_ROBOTS, JSON.stringify(builds));
  }

  private saveAllPrompts(builds: PromptBuild[]): void {
    localStorage.setItem(STORAGE_KEY_PROMPTS, JSON.stringify(builds));
  }

  private saveAllTools(builds: MCPToolBuild[]): void {
    localStorage.setItem(STORAGE_KEY_TOOLS, JSON.stringify(builds));
  }
}

export const buildStorage = new BuildStorageService();
