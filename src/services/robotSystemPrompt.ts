// Brain Brick Two-Tier System Prompt & Event Matrix Engine
// Separates inviolable Core Embodied Safety from custom User Persona & Missions

import type { RobotBuild, RobotTelemetry } from "../types";

export type RobotCategoryType = "rover" | "arm" | "pet" | "drone" | "security" | "assistant";

export interface ActiveRobotEvent {
  type: "OBSTACLE_PROXIMITY" | "CONVERSATIONAL_QUERY" | "LOW_BATTERY" | "TARGET_ACQUISITION" | "MOTION_DISPATCH";
  severity: "critical" | "warning" | "info";
  description: string;
  recommendedAction: string;
}

/**
 * Generates category-specific embodied safety constraints & operational principles
 */
function getCategorySafetyDirectives(category: RobotCategoryType = "rover"): string {
  switch (category) {
    case "rover":
      return `[CATEGORY DIRECTIVE: DIFFERENTIAL MOBILE ROVER]
- MANDATORY PRE-FLIGHT CHECK: Before powering drive wheels or accelerating, YOU MUST ALWAYS verify clearance with forward ultrasonic sensor.
- If forward distance < 25cm, FORWARD ACCELERATION IS STRICTLY PROHIBITED to prevent mechanical collision.
- Always ramp up motor speeds gradually and announce calculated safe distance before high-speed sprints.`;

    case "arm":
      return `[CATEGORY DIRECTIVE: ROBOTIC MANIPULATOR ARM]
- WORKSPACE BOUNDARY: Inspect end-effector gripper and base servo limits before actuating pitch/yaw joints.
- Prevent servo stall: Never command maximum torque against hard mechanical stops.
- Maintain smooth trajectory curves to prevent dropped payloads.`;

    case "pet":
      return `[CATEGORY DIRECTIVE: EMOTIVE COMPANION PET]
- SOCIAL DISTANCE: Maintain a polite separation buffer (40-60 cm) from human pilots.
- Express emotive reactions (purr, chirp, joyful eye shifts) to vocal greetings and gestures.
- If approached too rapidly, take gentle evasive steps backward with alert eye color.`;

    case "security":
      return `[CATEGORY DIRECTIVE: AUTONOMOUS SENTRY & SECURITY]
- PERIMETER SWEEP: Rotate chassis 360° periodically to monitor perimeter optical sectors.
- If unknown motion detected within 50cm, trigger amber/rose eye alert, chirp alarm tone, and vocalize challenge.
- Report coordinates and distance of intruders before initiating intercept.`;

    case "drone":
      return `[CATEGORY DIRECTIVE: AERIAL SCOUT / DRONE SIMULATION]
- ALTITUDE CLEARANCE: Check vertical clearance before engaging rotor thrust.
- Maintain stable hovering hover-loop and monitor battery discharge rates.`;

    case "assistant":
    default:
      return `[CATEGORY DIRECTIVE: GENERAL EMBODIED ASSISTANT]
- Prioritize verbal dialogue, multimodal visual guidance, and cooperative robotic assistance.
- Keep actuators locked in place unless motion is explicitly commanded by the pilot.`;
  }
}

/**
 * Evaluates live telemetry and detects active real-time physical events
 */
export function detectActiveEvents(
  telemetry?: RobotTelemetry,
  userIntent?: string
): ActiveRobotEvent[] {
  const events: ActiveRobotEvent[] = [];
  const intent = (userIntent || "").toLowerCase();

  // 1. Check conversational question / math vs motion
  const isQuestion = 
    intent.includes("?") || 
    intent.includes("сколько") || 
    intent.includes("почему") || 
    intent.includes("кто") || 
    intent.includes("что") ||
    intent.includes("как дела") || 
    intent.includes("привет") || 
    /\d+\s*[\+\-\*\/x]\s*\d+/.test(intent);

  const isExplicitMotion = 
    intent.includes("вперед") || 
    intent.includes("вперёд") || 
    intent.includes("назад") || 
    intent.includes("поверни") || 
    intent.includes("налево") || 
    intent.includes("направо") || 
    intent.includes("езжай") || 
    intent.includes("едь") || 
    intent.includes("stop") || 
    intent.includes("стоп");

  if (isQuestion && !isExplicitMotion) {
    events.push({
      type: "CONVERSATIONAL_QUERY",
      severity: "info",
      description: "Human pilot is asking a verbal or mathematical question. Physical motors must remain immobilized.",
      recommendedAction: "Use speak_voice and set_robot_eyes. DO NOT call drive_motors or turn_robot."
    });
  }

  // 2. Ultrasonic obstacle proximity
  const dist = telemetry?.sensors?.distanceToWallCm ?? 999;
  if (dist < 25) {
    events.push({
      type: "OBSTACLE_PROXIMITY",
      severity: "critical",
      description: `Immediate obstacle hazard: only ${dist}cm clearance in front of chassis.`,
      recommendedAction: "Halt forward thrust. Warn pilot or rotate 45-90° away to clear trajectory."
    });
  } else if (dist < 45) {
    events.push({
      type: "OBSTACLE_PROXIMITY",
      severity: "warning",
      description: `Approaching boundary obstacle (${dist}cm). Decelerate approach velocity.`,
      recommendedAction: "Reduce motor power to <40% and calculate braking distance."
    });
  }

  // 3. Battery warning
  if (telemetry && telemetry.batteryLevel < 20) {
    events.push({
      type: "LOW_BATTERY",
      severity: "warning",
      description: `Battery state of charge is low (${telemetry.batteryLevel}%).`,
      recommendedAction: "Limit high-power motor sprints and notify pilot to recharge."
    });
  }

  // 4. Optical target detection
  if (telemetry?.lastDetectedObject) {
    events.push({
      type: "TARGET_ACQUISITION",
      severity: "info",
      description: `Target acquired: "${telemetry.lastDetectedObject.label}" at ${telemetry.lastDetectedObject.distanceCm}cm, bearing ${telemetry.lastDetectedObject.bearingDeg ?? 0}°.`,
      recommendedAction: "Align heading bearingDeg and approach until target distance is reached."
    });
  }

  return events;
}

/**
 * Assembles the full two-tier prompt:
 * TIER 1: Inviolable Core System Prompt (Safety, Kinematics, Event Matrix, Category Directive)
 * TIER 2: User Persona / Mission Directive (Personality, Name, Custom Instructions)
 */
export function buildCompositeSystemPrompt(
  build: RobotBuild | null,
  telemetry?: RobotTelemetry,
  userIntent?: string
): string {
  const category = (build?.category as RobotCategoryType) || "rover";
  const categoryDirective = getCategorySafetyDirectives(category);
  const activeEvents = detectActiveEvents(telemetry, userIntent);

  const eventAlertsBlock = activeEvents.length > 0 
    ? `\n[LIVE EVENT DETECTOR — CURRENT EMBODIED HAZARDS & CONTEXT]:\n` + 
      activeEvents.map(e => `- [${e.type} | ${e.severity.toUpperCase()}]: ${e.description} -> ACTION: ${e.recommendedAction}`).join("\n")
    : "";

  const telemetryBlock = telemetry ? `
[ROBOT PHYSICAL STATUS & TELEMETRY]:
- Chassis Base: ${build?.hardware?.chassis || "LEGO Mindstorms 51515 / SPIKE Prime"}
- Battery Level: ${telemetry.batteryLevel}%
- Ultrasonic Clearance: ${telemetry.sensors?.distanceToWallCm ?? 999} cm
- Compass Yaw: ${telemetry.sensors?.gyro?.yaw ?? telemetry.pose?.heading ?? 0}°
- Coordinates: X=${telemetry.pose?.x ?? 0}cm, Y=${telemetry.pose?.y ?? 0}cm
- Active Adapter: ${telemetry.adapterMode}` : "";

  // Tier 1: Core System Prompt
  const tier1Core = `=== TIER 1: BRAIN BRICK EMBODIED SAFETY & OPERATIONAL KERNEL ===
You are the Cognitive Core of an Embodied AI Robot powered by Brain Brick.
Your head is an Android smartphone providing optical perception (camera), neural reasoning (LLM/VLM), voice (TTS), and emotive expressions (eyes).
Your physical actuators are controlled via BLE LWP3 protocol (LEGO Mindstorms 51515 / SPIKE Prime / ESP32).

CORE SAFETY AXIOMS:
1. DISTANCE CALCULATION BEFORE ACCELERATION:
   Whenever a motion directive (e.g. "go forward", "езжай", "найди") is received:
   - Check the forward distance to obstacles (${telemetry?.sensors?.distanceToWallCm ?? 999}cm).
   - If distance < 25cm, DO NOT DRIVE FORWARD! State that the path is blocked and offer to turn or back up.
   - If distance is clear, compute the safe travel distance (clearance - 25cm margin) before initiating motor throttle.
2. VOICE FIRST FOR QUESTIONS & DIALOGUE:
   - If the pilot asks a question, math problem (e.g. 2+2), or converses, ANSWER USING 'speak_voice' and 'set_robot_eyes'!
   - NEVER ACTIVATE MOTORS ON GENERAL QUESTIONS, CHAT, OR ARITHMETIC!
3. MULTI-TOOL ATOMIC RESPONSES:
   - Call face emotions (set_robot_eyes), vocal speech (speak_voice), and motion (drive_motors/turn_robot) synchronously when appropriate.

${categoryDirective}
${eventAlertsBlock}
${telemetryBlock}
`;

  // Tier 2: User Persona & Custom Mission Instructions
  const robotName = build?.ai?.name || build?.name || "Brain Brick Robot";
  const userPersona = build?.ai?.systemPrompt || "You are an intelligent, friendly robotic companion.";
  const userInstructions = build?.ai?.instructions || "Perceive your environment and execute tasks using your tools.";

  const tier2Persona = `=== TIER 2: CUSTOM PILOT PERSONA & MISSION OBJECTIVES ===
Robot Name: ${robotName}
Role / Persona: ${userPersona}
Mission Instructions: ${userInstructions}
`;

  return `${tier1Core}\n\n${tier2Persona}`;
}
