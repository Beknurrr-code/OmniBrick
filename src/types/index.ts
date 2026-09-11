// ─── BRAIN BRICK DOMAIN TYPES (SPEC v2026) ───

export type BuildType = "robot" | "prompt" | "mcp_tool";

export type ChassisType = "lego" | "arduino" | "esp32" | "diy" | "virtual";
export type MotorPort = "M1" | "M2" | "M3" | "M4" | "A" | "B" | "C" | "D";
export type SensorPort = "S1" | "S2" | "S3" | "S4" | "internal";

export type MotorRole = 
  | "drive_left" 
  | "drive_right" 
  | "arm_lift" 
  | "gripper" 
  | "head_pan" 
  | "head_tilt" 
  | "custom";

export type SensorType = 
  | "ultrasonic" 
  | "optical" 
  | "color" 
  | "gyro" 
  | "touch" 
  | "battery"
  | "lidar";

export interface MotorConfig {
  id: string;
  port: MotorPort;
  role: MotorRole;
  label: string;
  inverted?: boolean;
  maxPower?: number; // 0..100
  speedLimit?: number;
}

export interface SensorConfig {
  id: string;
  port: SensorPort;
  type: SensorType;
  label: string;
}

export interface CameraConfig {
  enabled: boolean;
  source: "phone_back" | "phone_front" | "external_stream" | "virtual_simulation";
  resolution: "320x240" | "640x480" | "1280x720";
  fps: number;
  status?: "connected" | "standby" | "mocking";
}

export interface HardwareManifest {
  chassis: ChassisType;
  motors: MotorConfig[];
  sensors: SensorConfig[];
  camera: CameraConfig;
}

// ─── High-Level Capabilities (Section 8) ───
export type CapabilityId = 
  | "vision"
  | "object_detection"
  | "navigation"
  | "movement"
  | "speech"
  | "person_tracking"
  | "obstacle_avoidance"
  | "grabbing";

export interface RobotCapability {
  id: CapabilityId;
  name: string;
  description: string;
  enabled: boolean;
  requiredHardware: ("camera" | "motors" | "sensors" | "speaker")[];
  category: "perception" | "locomotion" | "interaction" | "manipulation";
}

// ─── Tools & MCP (Sections 9 & 10) ───
export interface ToolParameter {
  name: string;
  type: "string" | "number" | "boolean" | "object";
  description: string;
  required?: boolean;
  default?: any;
}

export interface MCPToolBinding {
  id: string;
  name: string; // e.g. "detect_object", "move_forward", "turn_robot", "stop_robot", "speak"
  label: string;
  description: string;
  enabled: boolean;
  parametersSchema?: Record<string, any>;
  inputSchema?: ToolParameter[];
  outputType?: string;
  permissions?: ("motor_control" | "camera_feed" | "speech_output" | "network")[];
  source: "builtin" | "marketplace" | "custom";
  mcpServer?: string;
}

export interface ConnectedMCPServer {
  id: string;
  name: string;
  description: string;
  status: "connected" | "disconnected" | "error";
  endpoint: string;
  availableTools: string[];
  permissions: string[];
}

// ─── AI Behavior & Variables (Sections 11 & 12) ───
export interface AIPersona {
  name: string;
  tagline?: string;
  systemPrompt: string;
  instructions: string;
  reasoningEffort: "fast" | "deep";
  voiceTone: "tactical" | "friendly" | "curious" | "minimal";
  temperature?: number;
}

export interface BuildVariable {
  key: string;
  label: string;
  type: "string" | "number" | "boolean";
  value: any;
  unit?: string;
  description: string;
}

export interface ExecutionSettings {
  defaultMode: "mock_simulator" | "lego_spike" | "real_ble" | "wifi_esp";
  autoReflexes: boolean; // fast hardware obstacle avoidance
  safetyTimeoutMs: number;
  logLevel: "debug" | "info" | "actions_only";
}

// ─── 1. Robot Build (Section 3 & 6) ───
export interface RobotBuild {
  type: "robot";
  id: string;
  name: string;
  tagline: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  category: "rover" | "arm" | "pet" | "drone" | "custom";
  author: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];

  // 8 Sections of Editor
  hardware: HardwareManifest;
  capabilities: RobotCapability[];
  tools: MCPToolBinding[];
  connectedMcps?: ConnectedMCPServer[];
  ai: AIPersona;
  variables: Record<string, BuildVariable>;
  execution: ExecutionSettings;

  // Metadata & Marketplace
  connectedDevice?: string;
  lastRunAt?: string;
  isPublished?: boolean;
  priceBricks?: number;
  downloads?: number;
  likes?: number;
  forkedFromId?: string;
}

// ─── 2. Prompt Build (Section 3) ───
export interface PromptBuild {
  type: "prompt";
  id: string;
  name: string;
  tagline: string;
  description: string;
  author: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];

  systemPrompt: string;
  guidelines: string[];
  recommendedVariables: Record<string, BuildVariable>;
  compatibleCapabilities: CapabilityId[];

  isPublished?: boolean;
  priceBricks?: number;
  downloads?: number;
  likes?: number;
  forkedFromId?: string;
}

// ─── 3. MCP Tool Build (Section 3) ───
export interface MCPToolBuild {
  type: "mcp_tool";
  id: string;
  name: string;
  tagline: string;
  description: string;
  author: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];

  tools: MCPToolBinding[];
  serverType: "embedded_ts" | "remote_sse" | "websocket";
  endpoint?: string;
  requiredPermissions: string[];

  isPublished?: boolean;
  priceBricks?: number;
  downloads?: number;
  likes?: number;
  forkedFromId?: string;
}

export type AnyBuild = RobotBuild | PromptBuild | MCPToolBuild;

// ─── AI Builder Conversational & Diff Model (Section 5) ───
export interface BuildDiffProposal {
  addedCapabilities?: RobotCapability[];
  removedCapabilities?: CapabilityId[];
  addedTools?: MCPToolBinding[];
  updatedHardware?: Partial<HardwareManifest>;
  updatedPrompt?: string;
  updatedVariables?: Record<string, BuildVariable>;
  explanation: string;
  warnings?: string[];
  applied?: boolean;
}

export interface AIBuilderMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: number;
  diff?: BuildDiffProposal;
}

// ─── Live Transcript & Run Screen (Section 15) ───
export type TranscriptRole = 
  | "user" 
  | "ai_thought" 
  | "tool_call" 
  | "tool_result" 
  | "robot_action";

export interface LiveTranscriptEntry {
  id: string;
  timestamp: number;
  role: TranscriptRole;
  label: string; // e.g. "You", "AI Brain", "Tool: detect_object", "Result", "Robot"
  content: string;
  payload?: any;
}

// ─── Test Execution Pipeline (Section 13) ───
export interface TestStepResult {
  stepIndex: number;
  title: string;
  component: "camera" | "vision_tool" | "reasoning" | "motion_tool" | "stop";
  status: "pending" | "running" | "passed" | "failed";
  output: string;
  durationMs: number;
}

// ─── Telemetry & Runtime State (Section 16) ───
export interface RobotPose {
  x: number;       // cm (0..500)
  y: number;       // cm (0..500)
  heading: number; // degrees 0..360
}

export interface DetectedTarget {
  label: string;
  confidence: number;
  distanceCm: number;
  bearingDeg?: number;
  bbox?: [number, number, number, number];
}

export type RobotOperationalState = "connected" | "running" | "paused" | "error" | "offline";

export interface RobotTelemetry {
  robotId: string;
  timestamp: number;
  operationalState: RobotOperationalState;
  adapterMode: "mock_simulator" | "lego_spike" | "real_ble" | "wifi_esp";
  batteryLevel: number; // 0..100
  currentTask: string;
  currentAction: string;
  pose: RobotPose;
  motors: Record<string, { speed: number; position: number }>;
  sensors: {
    distanceToWallCm: number;
    opticalTargetDetected: boolean;
    gyro: { yaw: number; pitch: number; roll: number };
  };
  lastDetectedObject?: DetectedTarget;
}

export interface AICognitiveStep {
  stepId: string;
  timestamp: number;
  thought: string;
  plannedAction?: string;
  toolCalls?: Array<{
    toolName: string;
    params: Record<string, any>;
    status: "executing" | "success" | "error";
    result?: any;
  }>;
}

// ─── Subscription & User Entitlements (Section 30 & 31) ───
export type SubscriptionTier = "free" | "pro" | "team" | "lifetime";

export interface UserSubscriptionState {
  tier: SubscriptionTier;
  isProActive: boolean;
  expirationDate?: string | null;
  entitlements: string[];
}

export interface PilotProfile {
  id: string;
  username: string;
  callsign: string;
  email: string;
  bio?: string;
  bricksBalance: number;
  missionsCompleted: number;
  rank: string;
  publishedBuildsCount?: number;
  followersCount?: number;
  followingCount?: number;
}

// ─── Onboarding (Section 32) ───
export interface OnboardingState {
  completed: boolean;
  goal?: "assistant" | "rover" | "arm" | "explorer";
  setupType?: "have_robot" | "want_to_build" | "just_explore";
}
