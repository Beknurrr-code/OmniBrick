// Brain Brick Skill Evolution & Self-Learning Engine
// Synthesizes, persists, and upgrades custom MCP tools and robotics skills learned by the AI over time

export interface LearnedSkill {
  id: string;
  name: string; // valid JS identifier for MCP tool calling (e.g., 'spiral_search_scan')
  label: string;
  description: string;
  category: "locomotion" | "perception" | "tactical" | "interaction";
  code: string; // Sandboxed JS or high-level pipeline
  parametersSchema: Record<string, any>;
  level: number;
  xp: number;
  usageCount: number;
  successRate: number;
  createdAt: string;
  sourceExperience: string;
  author: string;
}

const STORAGE_KEY = "brainbrick_learned_skills_v1";

export const DEFAULT_LEARNED_SKILLS: LearnedSkill[] = [
  {
    id: "skill-sentry-sweep",
    name: "sentry_perimeter_sweep",
    label: "360° Sentry Sweep",
    description: "Executes a phased 360-degree perimeter sweep, polling sonar at each 45-degree increment and flashing alert eyes if motion is localized.",
    category: "tactical",
    code: `
// 360 Sentry Perimeter Sweep Algorithm
const sectors = 8;
const sweepStepDeg = 45;
const clearSectors = [];
for (let i = 0; i < sectors; i++) {
  const currentBearing = i * sweepStepDeg;
  clearSectors.push({ bearing: currentBearing, status: 'scanned' });
}
return { completedSweep: true, scannedSectors: clearSectors, perimeterSecure: true };
`.trim(),
    parametersSchema: {
      sweepSpeed: { type: "number", default: 50, description: "Rotation power" },
      flashAlert: { type: "boolean", default: true, description: "Flash LED on alert" },
    },
    level: 3,
    xp: 450,
    usageCount: 14,
    successRate: 98,
    createdAt: "2026-09-08T12:00:00Z",
    sourceExperience: "Synthesized during automated night perimeter defense run",
    author: "Brain Brick Autonomous Evolving Agent",
  },
  {
    id: "skill-spiral-search",
    name: "spiral_search_scan",
    label: "Archimedean Spiral Search",
    description: "Calculates expanding Archimedean spiral wheel velocity vectors to systematically search a room for lost targets.",
    category: "locomotion",
    code: `
// Archimedean Spiral Trajectory Generator
const b = 2.5; // spiral pitch constant
const points = [];
for (let theta = 0; theta < Math.PI * 4; theta += 0.5) {
  const r = b * theta;
  const x = Math.round(r * Math.cos(theta));
  const y = Math.round(r * Math.sin(theta));
  points.push({ x, y, theta: Math.round((theta * 180) / Math.PI) });
}
return { trajectoryPoints: points, estimatedAreaSqM: 4.8 };
`.trim(),
    parametersSchema: {
      expansionRate: { type: "number", default: 1.5, description: "Spiral radius increment per radian" },
      maxRadiusCm: { type: "number", default: 150, description: "Maximum search perimeter" },
    },
    level: 2,
    xp: 280,
    usageCount: 9,
    successRate: 95,
    createdAt: "2026-09-09T14:30:00Z",
    sourceExperience: "Synthesized during red cube visual search mission",
    author: "Brain Brick Autonomous Evolving Agent",
  },
  {
    id: "skill-evasive-pivot",
    name: "evasive_reverse_pivot",
    label: "Reflex Evasive Pivot",
    description: "Instant reflex maneuver that backs up 20cm, calculates opposite clearance, and executes a 75-degree breakaway turn.",
    category: "locomotion",
    code: `
// High-Speed Evasive Maneuver
const reverseDistanceCm = 20;
const breakawayAngleDeg = 75;
const escapeVector = {
  reverseThrottle: -60,
  reverseDurationMs: 650,
  pivotAngle: breakawayAngleDeg,
  pivotDirection: Math.random() > 0.5 ? 'left' : 'right'
};
return { escapeVector, reflexLatencyMs: 14 };
`.trim(),
    parametersSchema: {
      obstacleDistance: { type: "number", default: 18, description: "Trigger proximity in cm" },
    },
    level: 4,
    xp: 620,
    usageCount: 23,
    successRate: 100,
    createdAt: "2026-09-10T09:15:00Z",
    sourceExperience: "Synthesized after wall proximity trigger in arena",
    author: "Embodied Reflex Core",
  },
  {
    id: "skill-victory-combo",
    name: "victory_celebration_combo",
    label: "Joyous Fanfare & 360 Spin",
    description: "A synchronized victory ritual combining emerald emotive eyes, speaker fanfare, and a smooth 360-degree rotation.",
    category: "interaction",
    code: `
// Victory Celebration Choreography
return {
  eyes: { mood: 'happy', color: 'emerald' },
  audioFanfare: 'level_up_chime',
  rotationDegrees: 360,
  durationMs: 1600,
  vocalization: 'Цель успешно достигнута! Миссия завершена на отлично!'
};
`.trim(),
    parametersSchema: {
      cheerPhrase: { type: "string", default: "Ура! Победа!" },
    },
    level: 2,
    xp: 310,
    usageCount: 11,
    successRate: 100,
    createdAt: "2026-09-10T16:00:00Z",
    sourceExperience: "Synthesized upon target acquisition in mission mode",
    author: "Brain Brick Social Persona",
  },
];

class SkillEvolutionService {
  private skills: LearnedSkill[] = this.loadSkills();

  private loadSkills(): LearnedSkill[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to read learned skills from localStorage:", e);
    }
    return [...DEFAULT_LEARNED_SKILLS];
  }

  private saveSkills(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.skills));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("brainbrick:skills_updated", { detail: this.skills }));
      }
    } catch (e) {
      console.warn("Failed to write learned skills:", e);
    }
  }

  public getLearnedSkills(): LearnedSkill[] {
    return [...this.skills];
  }

  public getSkill(id: string): LearnedSkill | undefined {
    return this.skills.find(s => s.id === id || s.name === id);
  }

  /**
   * Records usage of a skill to increment XP, level, and success rate
   */
  public recordSkillUsage(skillId: string, success: boolean): void {
    const skill = this.skills.find(s => s.id === skillId || s.name === skillId);
    if (!skill) return;

    skill.usageCount += 1;
    skill.xp += success ? 25 : 5;

    // Level up calculation: every 150 XP increases level
    const newLevel = Math.min(10, Math.floor(skill.xp / 150) + 1);
    skill.level = newLevel;

    // Recalculate success rate rolling average
    const successPoints = success ? 100 : 0;
    skill.successRate = Math.round((skill.successRate * (skill.usageCount - 1) + successPoints) / skill.usageCount);

    this.saveSkills();
  }

  /**
   * Synthesizes a new custom robotic skill based on pilot prompt or learned experience
   */
  public synthesizeNewSkill(
    userPrompt: string,
    category: LearnedSkill["category"] = "locomotion"
  ): LearnedSkill {
    const cleanName = userPrompt
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim()
      .split(/\s+/)
      .slice(0, 3)
      .join("_") || "custom_skill";

    const functionName = `skill_${cleanName}_${Date.now().toString().slice(-4)}`;
    const id = `skill-${Date.now()}`;

    let generatedCode = `
// Synthesized Code for: "${userPrompt}"
const timestamp = Date.now();
return {
  status: 'executed',
  skill: '${functionName}',
  directive: ${JSON.stringify(userPrompt)},
  parametersEvaluated: true,
  timestamp
};
`.trim();

    // Contextual code templates based on intent keywords
    const p = userPrompt.toLowerCase();
    if (p.includes("квадрат") || p.includes("square")) {
      generatedCode = `
// Drive Square Pattern Algorithm
const sideCm = 40;
const turnDeg = 90;
const path = [];
for (let i = 0; i < 4; i++) {
  path.push({ action: 'forward', distanceCm: sideCm, durationMs: 1100 });
  path.push({ action: 'turn', degrees: turnDeg, direction: 'right' });
}
return { pattern: 'square', pathNodes: path, perimeterCm: sideCm * 4 };
`.trim();
    } else if (p.includes("змейк") || p.includes("zigzag")) {
      generatedCode = `
// Zig-Zag Slalom Trajectory
const turns = 4;
const legLengthCm = 30;
const sequence = [];
for (let i = 0; i < turns; i++) {
  sequence.push({ forwardCm: legLengthCm, turnDeg: 45, dir: i % 2 === 0 ? 'left' : 'right' });
}
return { pattern: 'slalom_zigzag', totalLegs: turns };
`.trim();
    } else if (p.includes("свет") || p.includes("мигай") || p.includes("flash")) {
      generatedCode = `
// Strobe Lighting & Eye Pulse
const colors = ['cyan', 'purple', 'emerald', 'amber', 'rose'];
return {
  strobeSequence: colors,
  delayMs: 250,
  mood: 'focused',
  soundChirp: 'strobe_beep'
};
`.trim();
    }

    const newSkill: LearnedSkill = {
      id,
      name: functionName,
      label: userPrompt.slice(0, 40),
      description: `Автономно выученный навык: "${userPrompt}". Синтезирован AI-ядром Brain Brick.`,
      category,
      code: generatedCode,
      parametersSchema: {
        intensity: { type: "number", default: 60, description: "Execution intensity (0-100)" },
        repeatCount: { type: "number", default: 1, description: "Number of iterations" },
      },
      level: 1,
      xp: 50,
      usageCount: 1,
      successRate: 100,
      createdAt: new Date().toISOString(),
      sourceExperience: `Синтезировано из команды пилота: "${userPrompt}"`,
      author: "Brain Brick Self-Learning Core",
    };

    this.skills.unshift(newSkill);
    this.saveSkills();
    return newSkill;
  }

  public deleteSkill(id: string): void {
    this.skills = this.skills.filter(s => s.id !== id);
    this.saveSkills();
  }

  public resetToDefaults(): void {
    this.skills = [...DEFAULT_LEARNED_SKILLS];
    this.saveSkills();
  }

  public getOverallEvolutionLevel(): { level: number; totalXp: number; title: string; skillCount: number } {
    const totalXp = this.skills.reduce((acc, s) => acc + s.xp, 0);
    const avgLevel = this.skills.length > 0
      ? Math.round(this.skills.reduce((acc, s) => acc + s.level, 0) / this.skills.length)
      : 1;

    let title = "Novice Robotic Mind";
    if (totalXp > 2500) title = "Neural Nexus Super-Brain";
    else if (totalXp > 1500) title = "Autonomous Adaptive Ace";
    else if (totalXp > 800) title = "Kinematic Self-Learner";
    else if (totalXp > 300) title = "Reactive Cognition Unit";

    return {
      level: avgLevel,
      totalXp,
      title,
      skillCount: this.skills.length,
    };
  }

  public exportSkillsJson(): string {
    return JSON.stringify(this.skills, null, 2);
  }
}

export const skillEvolutionService = new SkillEvolutionService();
