// Brain Brick Kinematics & Pre-Acceleration Safety Engine
// Computes safe distance, braking margins, and ramp-up throttle before motors engage

export interface SafeTrajectoryResult {
  isSafe: boolean;
  safeDistanceCm: number;
  safeSpeedPercent: number;
  durationMs: number;
  clearanceCm: number;
  reason: string;
  spokenAnnouncement: string;
  recommendedEvasion?: "turn_left" | "turn_right" | "reverse";
}

export const SAFETY_CLEARANCE_MARGIN_CM = 25; // minimum stop buffer
export const ESTIMATED_WHEEL_VELOCITY_CM_PER_SEC = 35; // typical speed at 60% power for 5.6cm wheels

/**
 * Pre-Acceleration Trajectory & Collision Clearance Evaluator
 * Verifies spatial clearance with forward sonar BEFORE wheels start spinning.
 */
export function calculateSafeDriveTrajectory(
  requestedSpeed: number = 60,
  requestedDistCm: number = 50,
  currentClearanceCm: number = 999
): SafeTrajectoryResult {
  const clearance = Math.max(0, currentClearanceCm);

  // 1. Critical Obstacle Hazard: less than margin (e.g. <25cm)
  if (clearance <= SAFETY_CLEARANCE_MARGIN_CM) {
    const evasion = clearance < 15 ? "reverse" : "turn_right";
    return {
      isSafe: false,
      safeDistanceCm: 0,
      safeSpeedPercent: 0,
      durationMs: 0,
      clearanceCm: clearance,
      reason: `Obstacle too close (${clearance}cm). Safety boundary requires at least ${SAFETY_CLEARANCE_MARGIN_CM}cm margin.`,
      spokenAnnouncement: `Внимание! Препятствие прямо впереди, всего ${Math.round(clearance)} сантиметров. Разгон заблокирован для защиты моторов.`,
      recommendedEvasion: evasion,
    };
  }

  // 2. Compute available free travel buffer
  const maxAvailableTravelCm = clearance - SAFETY_CLEARANCE_MARGIN_CM;
  const safeDistanceCm = Math.min(requestedDistCm, maxAvailableTravelCm);

  // 3. Compute speed ceiling based on clearance
  // If corridor is tight (25-50cm), clamp speed to 40% for precision
  let safeSpeed = Math.abs(requestedSpeed);
  if (clearance < 50) {
    safeSpeed = Math.min(safeSpeed, 40);
  } else if (clearance < 80) {
    safeSpeed = Math.min(safeSpeed, 55);
  } else {
    safeSpeed = Math.min(safeSpeed, 75);
  }

  // Direction sign (+ forward, - reverse)
  if (requestedSpeed < 0) {
    safeSpeed = -safeSpeed;
  }

  // 4. Compute duration based on linear velocity
  // Distance / Velocity * 1000 ms, with ramp-up overhead (+200ms)
  const speedRatio = Math.max(0.2, Math.abs(safeSpeed) / 60);
  const effectiveVelocity = ESTIMATED_WHEEL_VELOCITY_CM_PER_SEC * speedRatio;
  const baseTravelTimeMs = Math.round((safeDistanceCm / effectiveVelocity) * 1000);
  const durationMs = Math.max(400, Math.min(3000, baseTravelTimeMs + 200));

  // 5. Generate descriptive natural vocal announcement
  let spokenAnnouncement = "";
  if (safeDistanceCm < requestedDistCm) {
    spokenAnnouncement = `Дистанция впереди ${Math.round(clearance)} см. Скорректировал ход до ${Math.round(safeDistanceCm)} см, чтобы не врезаться. Плавно разгоняюсь.`;
  } else {
    spokenAnnouncement = `Путь свободен на ${Math.round(clearance)} см. Рассчитал ход ${Math.round(safeDistanceCm)} см. Начинаю движение.`;
  }

  return {
    isSafe: true,
    safeDistanceCm,
    safeSpeedPercent: safeSpeed,
    durationMs,
    clearanceCm: clearance,
    reason: `Clearance ${clearance}cm is sufficient. Safe travel window: ${safeDistanceCm}cm.`,
    spokenAnnouncement,
  };
}
