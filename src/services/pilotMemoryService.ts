import type { PilotHabit } from "../types";

const STORAGE_KEY = "omnibrick_pilot_habits_v1";

export const DEFAULT_HABITS: PilotHabit[] = [
  {
    id: "habit-antigravity-dev",
    title: "Программирование в Antigravity",
    description: "Пилот регулярно работает в Antigravity IDE по вечерам (21:00–23:00). Робот проактивно напоминает и готов продолжать проект.",
    category: "habit",
    confidence: 98,
    active: true,
    source: "Диалог с пилотом Бекнуром",
    createdAt: "2026-09-10T18:00:00Z",
    lastTriggered: "2026-09-14T21:00:00Z"
  },
  {
    id: "habit-floor-kinematics",
    title: "Калибровка скольжения (Ламинат)",
    description: "На гладком полу колёса LEGO проскальзывают. Скорость дугового разворота автоматически снижается на 15% для точности.",
    category: "kinematics",
    confidence: 94,
    active: true,
    source: "Авто-калибровка гироскопа IMU",
    createdAt: "2026-09-11T14:30:00Z",
    lastTriggered: "2026-09-14T19:45:00Z"
  },
  {
    id: "habit-concise-tone",
    title: "Инженерная лаконичность",
    description: "Пилот ценит скорость: ответы робота должны быть краткими, без вводных слов, с фокусом на телеметрию и вызовы тулов.",
    category: "preference",
    confidence: 96,
    active: true,
    source: "Анализ стиля команд пилота",
    createdAt: "2026-09-12T10:15:00Z",
    lastTriggered: "2026-09-14T20:10:00Z"
  },
  {
    id: "habit-safety-distance",
    title: "Буфер безопасности 25 см",
    description: "HC-SR04 сонар блокирует моторы при приближении к препятствиям ближе 25 см для предотвращения столкновений.",
    category: "environment",
    confidence: 100,
    active: true,
    source: "Аппаратный сторожевой рефлекс",
    createdAt: "2026-09-09T08:00:00Z",
    lastTriggered: "2026-09-14T21:15:00Z"
  }
];

class PilotMemoryService {
  private habits: PilotHabit[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.habits = JSON.parse(raw);
      } else {
        this.habits = DEFAULT_HABITS;
        this.save();
      }
    } catch {
      this.habits = DEFAULT_HABITS;
    }
  }

  private save(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.habits));
      window.dispatchEvent(new CustomEvent("omnibrick:memory_updated", { detail: this.habits }));
    } catch (e) {
      console.warn("Failed to persist pilot memory:", e);
    }
  }

  getHabits(): PilotHabit[] {
    if (this.habits.length === 0) this.load();
    return [...this.habits];
  }

  addHabit(data: Omit<PilotHabit, "id" | "createdAt">): PilotHabit {
    const newHabit: PilotHabit = {
      ...data,
      id: "habit-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
    };
    this.habits.unshift(newHabit);
    this.save();
    return newHabit;
  }

  toggleHabit(id: string): void {
    const habit = this.habits.find(h => h.id === id);
    if (habit) {
      habit.active = !habit.active;
      this.save();
    }
  }

  deleteHabit(id: string): void {
    this.habits = this.habits.filter(h => h.id !== id);
    this.save();
  }

  resetToDefaults(): void {
    this.habits = [...DEFAULT_HABITS];
    this.save();
  }

  getCognitiveXP(): { level: number; xp: number; nextLevelXp: number; progressPercent: number } {
    const activeCount = this.habits.filter(h => h.active).length;
    const avgConfidence = this.habits.length > 0 
      ? Math.round(this.habits.reduce((acc, h) => acc + h.confidence, 0) / this.habits.length)
      : 0;
    
    // XP calculation based on learned habits and confidence
    const xp = (activeCount * 250) + (avgConfidence * 5);
    const level = Math.max(1, Math.floor(xp / 500) + 1);
    const currentLevelBaseXp = (level - 1) * 500;
    const nextLevelXp = level * 500;
    const progressPercent = Math.min(100, Math.round(((xp - currentLevelBaseXp) / 500) * 100));

    return { level, xp, nextLevelXp, progressPercent };
  }
}

export const pilotMemoryService = new PilotMemoryService();
