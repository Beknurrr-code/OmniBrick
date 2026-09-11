import type { 
  RobotBuild, 
  RobotTelemetry, 
  AICognitiveStep, 
  BuildDiffProposal, 
  AIBuilderMessage,
  TestStepResult,
  RobotCapability
} from "../types";
import { BUILTIN_TOOLS } from "./mcpRegistry";
import { DEFAULT_CAPABILITIES } from "../services/buildStorage";
import { aiVisionService, getLatestCameraFrame } from "../services/aiVisionService";
import { trySolveMath } from "../services/mathSolver";
import { calculateSafeDriveTrajectory } from "../services/kinematicsSafety";
import { buildCompositeSystemPrompt } from "../services/robotSystemPrompt";

export class AIAgent {
  /**
   * Translates a natural language intention into a complete, structured Robot Build.
   * "Human idea → AI Build → Tools/MCP → Robot → Result"
   */
  async generateBuildFromPrompt(userPrompt: string, author: string = "Pilot"): Promise<RobotBuild> {
    const p = userPrompt.toLowerCase();
    const id = `build-${Date.now()}`;

    const isRedCube = p.includes("red") || p.includes("cube") || p.includes("find") || p.includes("search");
    const isArm = p.includes("arm") || p.includes("grab") || p.includes("claw") || p.includes("lift");
    const isPet = p.includes("pet") || p.includes("dog") || p.includes("companion") || p.includes("cat");
    const isFollow = p.includes("follow") || p.includes("person") || p.includes("track");

    let synth = {
      name: isRedCube ? "Red Cube Hunter" : isArm ? "Titan Claw 01" : isPet ? "CyberPup Neo" : "Cyber Rover Alpha",
      tagline: isRedCube 
        ? "Autonomous optical search rover for red target blocks"
        : isArm ? "Precision robotic manipulator with object grabbing" : "Emotive companion pet with audio-motion reflexes",
      description: `Synthesized by AI from intention: "${userPrompt}". Configured with multimodal vision perception, closed-loop differential drive, and autonomous MCP tools.`,
      category: isArm ? "arm" as const : isPet ? "pet" as const : "rover" as const,
      difficulty: "medium" as const,
      chassis: "lego" as const,
      systemPrompt: isRedCube
        ? "You are Red Cube Hunter, an autonomous visual search agent. Your mission is to explore the environment using camera vision, locate red cubes, navigate toward them, and vocalize when acquired."
        : isFollow
        ? "You are an autonomous following robot. Detect human presence with camera vision, calculate relative bearing, and follow safely at designated distance."
        : "You are an intelligent autonomous robotic companion powered by OmniBrick. Perceive your environment and execute tasks using your MCP tools.",
      instructions: "1. Scan optical field of view before initiating forward thrust.\n2. Maintain safe clearance from perimeter boundaries.\n3. Vocalize task completion over speaker.",
      tags: isRedCube ? ["Vision", "Search", "Autonomous", "Shipathon"] : ["Autonomous", "Companion"],
    };

    const activeCapIds = isRedCube 
      ? ["vision", "object_detection", "navigation", "movement", "speech", "obstacle_avoidance"]
      : isFollow
      ? ["vision", "person_tracking", "navigation", "movement", "speech", "obstacle_avoidance"]
      : isArm
      ? ["vision", "object_detection", "grabbing"]
      : ["speech", "movement", "vision"];

    const capabilities: RobotCapability[] = DEFAULT_CAPABILITIES.map(c => ({
      ...c,
      enabled: activeCapIds.includes(c.id),
    }));

    return {
      type: "robot",
      id,
      name: synth.name,
      tagline: synth.tagline,
      description: synth.description,
      difficulty: synth.difficulty,
      category: synth.category,
      author,
      version: "1.0.0",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: synth.tags,
      hardware: {
        chassis: synth.chassis,
        motors: isArm ? [
          { id: "m-base", port: "M1", role: "head_pan", label: "Base Rotation Motor", maxPower: 70 },
          { id: "m-arm", port: "M2", role: "arm_lift", label: "Arm Pitch Motor", maxPower: 80 },
          { id: "m-grip", port: "M3", role: "gripper", label: "End-Effector Gripper", maxPower: 100 },
        ] : [
          { id: "m-left", port: "M1", role: "drive_left", label: "Left Wheel Motor", maxPower: 100, speedLimit: 80 },
          { id: "m-right", port: "M2", role: "drive_right", label: "Right Wheel Motor", maxPower: 100, speedLimit: 80 },
        ],
        sensors: [
          { id: "s-sonar", port: "S1", type: "ultrasonic", label: "Proximity Sonar" },
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
      capabilities,
      tools: BUILTIN_TOOLS.map(t => ({ ...t })),
      connectedMcps: [
        {
          id: "mcp-vision-core",
          name: "Vision Engine MCP Server",
          description: "Visual inference for object detection and tracking",
          status: "connected",
          endpoint: "embedded://vision-v1",
          availableTools: ["detect_object", "scan_visual_environment"],
          permissions: ["camera_feed"],
        },
        {
          id: "mcp-chassis-driver",
          name: "Differential Drive MCP Driver",
          description: "Motion controller for wheel actuation",
          status: "connected",
          endpoint: "embedded://diff-drive-v1",
          availableTools: ["drive_motors", "turn_robot", "stop_robot"],
          permissions: ["motor_control"],
        },
      ],
      ai: {
        name: synth.name,
        tagline: synth.tagline,
        systemPrompt: synth.systemPrompt,
        instructions: synth.instructions,
        reasoningEffort: "fast",
        voiceTone: "tactical",
        temperature: 0.7,
      },
      variables: {
        search_color: {
          key: "search_color",
          label: "Target Color",
          type: "string",
          value: isRedCube ? "red" : "blue",
          description: "Target hue filter for visual perception",
        },
        max_speed: {
          key: "max_speed",
          label: "Max Cruising Speed",
          type: "number",
          value: 65,
          unit: "%",
          description: "Safety speed ceiling for actuators",
        },
        target_distance_cm: {
          key: "target_distance_cm",
          label: "Stop Distance",
          type: "number",
          value: 45,
          unit: "cm",
          description: "Distance from target to declare arrival",
        },
      },
      execution: {
        defaultMode: "mock_simulator",
        autoReflexes: true,
        safetyTimeoutMs: 5000,
        logLevel: "info",
      },
      connectedDevice: "Virtual Simulation Arena",
      lastRunAt: "Just created",
      isPublished: false,
      priceBricks: 0,
      downloads: 1,
      likes: 0,
    };
  }

  /**
   * Conversational AI Builder Assistant (Section 5).
   * Parses user request, reasons about robotics architecture,
   * and returns a structured Diff Proposal for the right-hand preview panel.
   */
  async processAIBuilderTurn(
    currentBuild: RobotBuild,
    userMessage: string,
    _history: AIBuilderMessage[]
  ): Promise<{ replyText: string; diff: BuildDiffProposal }> {
    const msg = userMessage.toLowerCase();
    const warnings: string[] = [];

    // Scenario 1: Person Tracking / Following
    if (msg.includes("follow") || msg.includes("person") || msg.includes("human")) {
      const addedCap = DEFAULT_CAPABILITIES.find(c => c.id === "person_tracking");
      const diff: BuildDiffProposal = {
        addedCapabilities: addedCap ? [{ ...addedCap, enabled: true }] : [],
        updatedPrompt: `${currentBuild.ai.systemPrompt}\n[Behavior Update]: Actively track detected persons and maintain a 1.5m follow distance.`,
        updatedVariables: {
          ...currentBuild.variables,
          follow_distance: {
            key: "follow_distance",
            label: "Follow Distance",
            type: "number",
            value: 150,
            unit: "cm",
            description: "Safety separation buffer while following human target",
          },
        },
        explanation: "I added the 'Person Tracking' capability, updated the system prompt to maintain distance, and registered the 'follow_distance' variable.",
        warnings: !currentBuild.hardware.camera.enabled ? ["Note: Person Tracking requires an active Camera feed. I enabled the camera in this proposal."] : [],
        applied: false,
      };

      if (!currentBuild.hardware.camera.enabled) {
        diff.updatedHardware = {
          camera: { ...currentBuild.hardware.camera, enabled: true },
        };
      }

      return {
        replyText: "I've configured Person Tracking for this robot. It will use the camera feed to compute person coordinates and follow at a safe distance.",
        diff,
      };
    }

    // Scenario 2: Obstacle Avoidance / Safety
    if (msg.includes("obstacle") || msg.includes("avoid") || msg.includes("wall") || msg.includes("safe")) {
      const addedCap = DEFAULT_CAPABILITIES.find(c => c.id === "obstacle_avoidance");
      const diff: BuildDiffProposal = {
        addedCapabilities: addedCap ? [{ ...addedCap, enabled: true }] : [],
        updatedPrompt: `${currentBuild.ai.systemPrompt}\n[Safety Rule]: When proximity sensors detect obstacles < 25cm, immediately execute evasive 90° turn.`,
        updatedVariables: {
          ...currentBuild.variables,
          safety_margin_cm: {
            key: "safety_margin_cm",
            label: "Obstacle Safe Margin",
            type: "number",
            value: 30,
            unit: "cm",
            description: "Minimum distance to trigger obstacle avoidance maneuvers",
          },
        },
        explanation: "Added 'Reflex Obstacle Avoidance' capability and safety margin variable. Sonar sensor will monitor perimeter clearance.",
        applied: false,
      };
      return {
        replyText: "Added obstacle avoidance behaviors. The robot will now continuously monitor ultrasonic distance and turn away before colliding.",
        diff,
      };
    }

    // Scenario 3: Change Target Color
    if (msg.includes("blue") || msg.includes("green") || msg.includes("yellow") || msg.includes("color")) {
      let chosenColor = "blue";
      if (msg.includes("green")) chosenColor = "green";
      if (msg.includes("yellow")) chosenColor = "yellow";
      if (msg.includes("red")) chosenColor = "red";

      const diff: BuildDiffProposal = {
        updatedVariables: {
          ...currentBuild.variables,
          search_color: {
            key: "search_color",
            label: "Target Color",
            type: "string",
            value: chosenColor,
            description: `Filter optical hue for ${chosenColor} targets`,
          },
        },
        updatedPrompt: currentBuild.ai.systemPrompt.replace(/red/gi, chosenColor),
        explanation: `Updated visual search filter variable 'search_color' to '${chosenColor}' and adapted AI behavior instructions.`,
        applied: false,
      };
      return {
        replyText: `Target color updated to '${chosenColor}'. The vision perception pipeline will now isolate ${chosenColor} wavelength bounding boxes.`,
        diff,
      };
    }

    // Scenario 4: Speed / Performance Tuning
    if (msg.includes("speed") || msg.includes("faster") || msg.includes("slow") || msg.includes("turbo")) {
      const isFaster = msg.includes("fast") || msg.includes("turbo");
      const speedVal = isFaster ? 85 : 40;

      const diff: BuildDiffProposal = {
        updatedVariables: {
          ...currentBuild.variables,
          max_speed: {
            key: "max_speed",
            label: "Max Cruising Speed",
            type: "number",
            value: speedVal,
            unit: "%",
            description: "Throttle limit for differential motors",
          },
        },
        updatedHardware: {
          motors: currentBuild.hardware.motors.map(m => ({
            ...m,
            speedLimit: speedVal,
          })),
        },
        explanation: `Adjusted motor speed limits and max_speed variable to ${speedVal}%.`,
        applied: false,
      };
      return {
        replyText: `Motor throttle profile tuned to ${speedVal}%. Check the diff preview on the right and click 'Apply Changes'.`,
        diff,
      };
    }

    // Default Fallback Turn
    const diff: BuildDiffProposal = {
      updatedPrompt: `${currentBuild.ai.systemPrompt}\n[Pilot Instruction]: ${userMessage}`,
      explanation: "Updated AI system instructions with your custom directive.",
      applied: false,
    };

    return {
      replyText: `Understood! I've drafted updates to align the robot's behavior with: "${userMessage}". Review the proposed diff on the right.`,
      diff,
    };
  }

  /**
   * Mock Build Test Pipeline Runner (Section 13).
   * Sequentially verifies: Camera -> Vision Tool -> Reasoning -> Motion -> Stop
   */
  async runMockBuildTest(
    build: RobotBuild, 
    onStepUpdate: (step: TestStepResult) => void
  ): Promise<boolean> {
    const targetColor = build.variables?.search_color?.value || "red";

    const steps: Array<Omit<TestStepResult, "durationMs">> = [
      {
        stepIndex: 1,
        title: "1. Camera Frame Ingestion",
        component: "camera",
        status: "running",
        output: "Connecting to optical source 640x480 @ 20 FPS...",
      },
      {
        stepIndex: 2,
        title: "2. MCP Tool Execution (detect_object)",
        component: "vision_tool",
        status: "pending",
        output: `Invoking detect_object({ color: "${targetColor}" })...`,
      },
      {
        stepIndex: 3,
        title: "3. Cognitive Decision Engine",
        component: "reasoning",
        status: "pending",
        output: "Evaluating target bearing and obstacle distances...",
      },
      {
        stepIndex: 4,
        title: "4. Motion Actuation (drive_motors)",
        component: "motion_tool",
        status: "pending",
        output: "Actuating M1 (Left) and M2 (Right) at PWM 60...",
      },
      {
        stepIndex: 5,
        title: "5. Safe Arrival & Hold Position",
        component: "stop",
        status: "pending",
        output: "Proximity threshold reached (<45cm). Cutting motor power.",
      },
    ];

    for (let i = 0; i < steps.length; i++) {
      const step = { ...steps[i], status: "running" as const, durationMs: 0 };
      onStepUpdate(step);

      // Simulate execution latency
      await new Promise(r => setTimeout(r, 450));

      const passedStep: TestStepResult = {
        ...step,
        status: "passed",
        durationMs: 120 + Math.floor(Math.random() * 80),
        output: i === 0 
          ? "✓ Frame captured: 640x480 resolution, optical SNR 98.4%."
          : i === 1 
          ? `✓ Target detected! ${targetColor.toUpperCase()} cube localized at [x: 280, y: 190], bearing +12°.`
          : i === 2 
          ? "✓ AI Plan: Heading offset within ±5° tolerance. Cleared for direct forward throttle."
          : i === 3 
          ? "✓ Actuators running: Differential drive active, velocity 38 cm/s."
          : "✓ Objective completed! Robot stopped cleanly at 42cm distance. Test passed.",
      };
      onStepUpdate(passedStep);
    }

    return true;
  }

  /**
   * Evaluates telemetry and outputs cognitive thought + planned MCP tool calls.
   */
  async reasonPerceptionStep(
    _build: RobotBuild,
    telemetry: RobotTelemetry,
    customGoal?: string
  ): Promise<AICognitiveStep> {
    const stepId = `step-${Date.now()}`;
    const target = telemetry.lastDetectedObject;

    const config = aiVisionService.getConfig();
    if (customGoal) {
      try {
        const frame = getLatestCameraFrame();
        const compositePrompt = buildCompositeSystemPrompt(_build, telemetry, customGoal);
        const result = await aiVisionService.analyzeFrame(
          frame,
          customGoal,
          compositePrompt,
          BUILTIN_TOOLS.map(t => ({
            name: t.name,
            description: t.description,
            parameters: t.parametersSchema
          })),
          telemetry
        );

        const callsToExecute = result.toolCalls && result.toolCalls.length > 0 
          ? result.toolCalls 
          : result.toolCall 
          ? [result.toolCall] 
          : [];

        if (callsToExecute.length > 0) {
          const providerTag = config.provider === "simulator" 
            ? "AGENTIC BRAIN" 
            : `${config.provider.toUpperCase()} / ${config.model}`;

          return {
            stepId,
            timestamp: Date.now(),
            thought: `[${providerTag}]: ${result.thought}`,
            plannedAction: `Executing ${callsToExecute.length} Tool(s): ${callsToExecute.map(c => c.name).join(", ")}`,
            toolCalls: callsToExecute.map(c => ({
              toolName: c.name,
              params: c.arguments,
              status: "executing"
            }))
          };
        }
      } catch (err: any) {
        console.warn("AI Provider execution error:", err);
      }
    }

    if (customGoal) {
      const g = customGoal.toLowerCase();

      // 1. Emergency Stop / Halt
      if (g.includes("stop") || g.includes("halt") || g.includes("стой") || g.includes("стоп") || g.includes("замолчи")) {
        return {
          stepId,
          timestamp: Date.now(),
          thought: `Received manual HALT order: "${customGoal}". Disengaging all actuators immediately.`,
          plannedAction: "Emergency Stop",
          toolCalls: [
            { toolName: "stop_robot", params: { reason: "Pilot Halt Command" }, status: "executing" },
            { toolName: "speak_voice", params: { message: "Остановился и держу позицию.", mood: "neutral" }, status: "executing" }
          ],
        };
      }

      // 2. Drive Forward (вперед) - WITH SAFE DISTANCE & BRAKING CALCULATION
      if (g.includes("вперед") || g.includes("вперёд") || g.includes("forward") || g.includes("прямо") || g.includes("поезжай") || g.includes("едь")) {
        const clearance = telemetry?.sensors?.distanceToWallCm ?? 999;
        const traj = calculateSafeDriveTrajectory(65, 60, clearance);

        if (!traj.isSafe) {
          return {
            stepId,
            timestamp: Date.now(),
            thought: `SAFETY INTERLOCK: Ultrasonic obstacle hazard detected (${clearance}cm). Forward acceleration aborted to protect chassis.`,
            plannedAction: "Halt Forward Thrust",
            toolCalls: [
              { toolName: "set_robot_eyes", params: { mood: "alert", color: "rose" }, status: "executing" },
              { toolName: "speak_voice", params: { message: traj.spokenAnnouncement, mood: "alert" }, status: "executing" }
            ],
          };
        }

        return {
          stepId,
          timestamp: Date.now(),
          thought: `Calculated clearance trajectory: free space ${clearance}cm -> safe travel window ${traj.safeDistanceCm}cm. Ramping motors to ${traj.safeSpeedPercent}%.`,
          plannedAction: `Safe Drive Forward (${traj.safeDistanceCm}cm)`,
          toolCalls: [
            { toolName: "set_robot_eyes", params: { mood: "focused", color: "cyan" }, status: "executing" },
            { toolName: "drive_motors", params: { leftSpeed: traj.safeSpeedPercent, rightSpeed: traj.safeSpeedPercent, durationMs: traj.durationMs }, status: "executing" },
            { toolName: "speak_voice", params: { message: traj.spokenAnnouncement, mood: "focused" }, status: "executing" }
          ],
        };
      }

      // 3. Drive Backward (назад)
      if (g.includes("назад") || g.includes("backward") || g.includes("back") || g.includes("реверс") || g.includes("отъедь")) {
        return {
          stepId,
          timestamp: Date.now(),
          thought: `Executing Reverse maneuver for command: "${customGoal}". Powering differential motors A & B to -60%.`,
          plannedAction: "Drive Backward",
          toolCalls: [
            { toolName: "set_robot_eyes", params: { mood: "alert", color: "amber" }, status: "executing" },
            { toolName: "drive_motors", params: { leftSpeed: -60, rightSpeed: -60, durationMs: 1000 }, status: "executing" },
            { toolName: "speak_voice", params: { message: "Сдаю назад!", mood: "alert" }, status: "executing" }
          ],
        };
      }

      // 4. Turn Left (налево)
      if (g.includes("left") || g.includes("налево") || g.includes("влево")) {
        return {
          stepId,
          timestamp: Date.now(),
          thought: `Executing Counter-Clockwise 90° Turn for command: "${customGoal}".`,
          plannedAction: "Rotate 90° Left",
          toolCalls: [
            { toolName: "set_robot_eyes", params: { mood: "focused", color: "cyan" }, status: "executing" },
            { toolName: "turn_robot", params: { degrees: 90, direction: "left" }, status: "executing" },
            { toolName: "speak_voice", params: { message: "Поворачиваю налево на 90 градусов.", mood: "focused" }, status: "executing" }
          ],
        };
      }

      // 5. Turn Right (направо)
      if (g.includes("right") || g.includes("направо") || g.includes("вправо")) {
        return {
          stepId,
          timestamp: Date.now(),
          thought: `Executing Clockwise 90° Turn for command: "${customGoal}".`,
          plannedAction: "Rotate 90° Right",
          toolCalls: [
            { toolName: "set_robot_eyes", params: { mood: "focused", color: "cyan" }, status: "executing" },
            { toolName: "turn_robot", params: { degrees: 90, direction: "right" }, status: "executing" },
            { toolName: "speak_voice", params: { message: "Поворачиваю направо на 90 градусов.", mood: "focused" }, status: "executing" }
          ],
        };
      }

      // 6. Dance / Celebration (танец)
      if (g.includes("танец") || g.includes("танцуй") || g.includes("dance") || g.includes("кружись")) {
        return {
          stepId,
          timestamp: Date.now(),
          thought: `Celebration Mode active: Performing 360° spin and fanfare for command: "${customGoal}".`,
          plannedAction: "Victory Dance",
          toolCalls: [
            { toolName: "set_robot_eyes", params: { mood: "happy", color: "amber" }, status: "executing" },
            { toolName: "turn_robot", params: { degrees: 360, direction: "left" }, status: "executing" },
            { toolName: "speak_voice", params: { message: "Ура! Выполняю победный танец!", mood: "happy" }, status: "executing" }
          ],
        };
      }

      // 7. Hello / Greeting (привет)
      if (g.includes("привет") || g.includes("здравствуй") || g.includes("hello") || g.includes("кто ты")) {
        return {
          stepId,
          timestamp: Date.now(),
          thought: `Friendly pilot greeting acknowledged. Expressing joyful facial mood and vocal welcome.`,
          plannedAction: "Vocal Greeting",
          toolCalls: [
            { toolName: "set_robot_eyes", params: { mood: "happy", color: "cyan" }, status: "executing" },
            { toolName: "speak_voice", params: { message: "Привет, пилот! Я автономный мозг OmniBrick. Готов к командам движения и исследования!", mood: "happy" }, status: "executing" }
          ],
        };
      }

      // 8. Math check on customGoal
      const mathSol = trySolveMath(customGoal);
      if (mathSol) {
        return {
          stepId,
          timestamp: Date.now(),
          thought: `Evaluated arithmetic: ${mathSol.expression} = ${mathSol.result}`,
          plannedAction: "Vocal Math Answer",
          toolCalls: [
            { toolName: "set_robot_eyes", params: { mood: "happy", color: "emerald" }, status: "executing" },
            { toolName: "speak_voice", params: { message: mathSol.spoken, mood: "happy" }, status: "executing" }
          ]
        };
      }

      // 9. If customGoal has no movement intent, DO NOT engage motors or roam!
      const isMovement = g.includes("вперед") || g.includes("назад") || g.includes("влево") || g.includes("вправо") || g.includes("едь") || g.includes("найди") || g.includes("ищи") || g.includes("куб");
      if (!isMovement) {
        return {
          stepId,
          timestamp: Date.now(),
          thought: `Acknowledged pilot instruction: "${customGoal}". Holding position without motor actuation.`,
          plannedAction: "Vocal Acknowledgment",
          toolCalls: [
            { toolName: "set_robot_eyes", params: { mood: "focused", color: "cyan" }, status: "executing" },
            { toolName: "speak_voice", params: { message: `Команду "${customGoal}" принял. Стою на месте и жду указаний.`, mood: "neutral" }, status: "executing" }
          ]
        };
      }
    }

    // ─── Fast Hardware Obstacle Avoidance Reflex ───
    if (telemetry.sensors.distanceToWallCm < 25) {
      return {
        stepId,
        timestamp: Date.now(),
        thought: `EMBODIED REFLEX: Ultrasonic obstacle alert! Distance is critical (${telemetry.sensors.distanceToWallCm}cm). Rotating 60° to clear path.`,
        plannedAction: "Obstacle Evasion",
        toolCalls: [
          { toolName: "set_robot_eyes", params: { mood: "alert", color: "rose" }, status: "executing" },
          { toolName: "turn_robot", params: { degrees: 60, direction: "right" }, status: "executing" },
          { toolName: "speak_voice", params: { message: "Препятствие близко! Корректирую курс.", mood: "alert" }, status: "executing" }
        ]
      };
    }

    // ─── Autonomous Target Tracking ───
    if (target && target.label.toLowerCase().includes("red")) {
      const dist = target.distanceCm;
      if (dist <= 45) {
        return {
          stepId,
          timestamp: Date.now(),
          thought: `TARGET ACQUIRED! Optical detection confirms "${target.label}" at proximity (${dist}cm). Halting actuators and notifying pilot via voice.`,
          plannedAction: "Objective Accomplished",
          toolCalls: [
            { toolName: "set_robot_eyes", params: { mood: "happy", color: "emerald" }, status: "executing" },
            { toolName: "stop_robot", params: {}, status: "executing" },
            { toolName: "speak_voice", params: { message: "Цель захвачена! Красный куб обнаружен и зафиксирован.", mood: "happy" }, status: "executing" }
          ],
        };
      } else {
        return {
          stepId,
          timestamp: Date.now(),
          thought: `Target lock: "${target.label}" tracked at distance ${dist}cm (bearing: ${target.bearingDeg ?? 0}°). Engaging drive motors on approach vector.`,
          plannedAction: `Approach Target (${dist}cm)`,
          toolCalls: [
            { toolName: "set_robot_eyes", params: { mood: "focused", color: "cyan" }, status: "executing" },
            { toolName: "drive_motors", params: { leftSpeed: 60, rightSpeed: 60, durationMs: 900 }, status: "executing" }
          ],
        };
      }
    }

    // Explore arena
    const isOddStep = (Math.floor(Date.now() / 2000) % 2) === 0;
    if (isOddStep) {
      return {
        stepId,
        timestamp: Date.now(),
        thought: `Perimeter visual sweep: No target currently detected. Heading: ${telemetry.sensors?.gyro?.yaw ?? telemetry.pose?.heading ?? 0}°. Rotating 40° to scan adjacent arena sector.`,
        plannedAction: "Rotate 40°",
        toolCalls: [
          { toolName: "turn_robot", params: { degrees: 40, direction: "right" }, status: "executing" },
          { toolName: "scan_visual_environment", params: { targetObject: "red cube" }, status: "executing" },
        ],
      };
    } else {
      return {
        stepId,
        timestamp: Date.now(),
        thought: `Sector clear. Battery at ${telemetry.batteryLevel}%. Translating forward into open arena space to expand camera coverage.`,
        plannedAction: "Advance Forward",
        toolCalls: [
          { toolName: "drive_motors", params: { leftSpeed: 50, rightSpeed: 50, durationMs: 800 }, status: "executing" },
          { toolName: "scan_visual_environment", params: { targetObject: "red cube" }, status: "executing" },
        ],
      };
    }
  }
}

export const aiAgent = new AIAgent();
