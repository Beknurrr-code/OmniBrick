import type { RobotBuild, RobotTelemetry, AICognitiveStep } from "../types";
import type { IRobotAdapter } from "./types";
import { MockRobotAdapter } from "./mockAdapter";
import { BleRobotAdapter } from "./bleAdapter";
import { LegoRobotAdapter } from "./legoAdapter";
import { mcpRegistry } from "./mcpRegistry";
import { aiAgent } from "./aiAgent";
import { soundService } from "../services/soundService";

export class RobotEngine {
  private activeAdapter: IRobotAdapter;
  private mockAdapter: MockRobotAdapter;
  private bleAdapter: BleRobotAdapter;
  private legoAdapter: LegoRobotAdapter;
  private currentMode: "mock_simulator" | "lego_spike" | "real_ble" = "mock_simulator";

  private activeBuild: RobotBuild | null = null;
  private isAutonomousLoopActive: boolean = false;
  private autonomousTimer?: any;

  private telemetryListeners: Set<(t: RobotTelemetry) => void> = new Set();
  private cognitiveListeners: Set<(step: AICognitiveStep) => void> = new Set();

  constructor() {
    this.mockAdapter = new MockRobotAdapter();
    this.bleAdapter = new BleRobotAdapter();
    this.legoAdapter = new LegoRobotAdapter();
    this.activeAdapter = this.mockAdapter;

    this.activeAdapter.onTelemetry((t) => {
      this.telemetryListeners.forEach(listener => listener(t));
    });
  }

  setAdapterMode(mode: "mock_simulator" | "lego_spike" | "real_ble"): void {
    if (this.currentMode === mode) return;
    this.stopMission().catch(() => {});
    this.currentMode = mode;
    if (mode === "lego_spike") {
      this.activeAdapter = this.legoAdapter;
    } else if (mode === "real_ble") {
      this.activeAdapter = this.bleAdapter;
    } else {
      this.activeAdapter = this.mockAdapter;
    }
    this.activeAdapter.onTelemetry((t) => {
      this.telemetryListeners.forEach(listener => listener(t));
    });
  }

  getAdapterMode(): "mock_simulator" | "lego_spike" | "real_ble" {
    return this.currentMode;
  }

  getAdapter(): IRobotAdapter {
    return this.activeAdapter;
  }

  getActiveBuild(): RobotBuild | null {
    return this.activeBuild;
  }

  setActiveBuild(build: RobotBuild): void {
    this.activeBuild = build;
  }

  async startMission(build: RobotBuild): Promise<boolean> {
    this.activeBuild = build;
    const ok = await this.activeAdapter.connect();
    if (ok) {
      soundService.playHappyFanfare();
    }
    return ok;
  }

  async stopMission(): Promise<void> {
    this.stopAutonomousLoop();
    await this.activeAdapter.stopAll();
    await this.activeAdapter.disconnect();
  }

  isSessionActive(): boolean {
    return this.activeAdapter.isConnected();
  }

  getTelemetry(): RobotTelemetry {
    return this.activeAdapter.getTelemetry();
  }

  subscribeTelemetry(cb: (t: RobotTelemetry) => void): () => void {
    this.telemetryListeners.add(cb);
    return () => this.telemetryListeners.delete(cb);
  }

  subscribeCognitive(cb: (step: AICognitiveStep) => void): () => void {
    this.cognitiveListeners.add(cb);
    return () => this.cognitiveListeners.delete(cb);
  }

  // ─── Direct Teleoperation Override ───
  async manualDrive(leftSpeed: number, rightSpeed: number, durationMs: number = 400): Promise<void> {
    if (!this.activeAdapter.isConnected()) return;
    soundService.playMotorClick();
    await this.activeAdapter.sendMotorCommand("A", leftSpeed, durationMs);
    await this.activeAdapter.sendMotorCommand("B", rightSpeed, durationMs);
  }

  async emergencyHalt(): Promise<void> {
    soundService.playAlertAlarm();
    this.stopAutonomousLoop();
    await this.activeAdapter.stopAll();
  }

  // ─── Autonomous AI Execution Loop ───
  startAutonomousLoop(): void {
    if (this.isAutonomousLoopActive) return;
    this.isAutonomousLoopActive = true;

    this.autonomousTimer = setInterval(async () => {
      if (!this.activeBuild || !this.activeAdapter.isConnected()) return;
      await this.executeCognitiveCycle();
    }, 1800);
  }

  stopAutonomousLoop(): void {
    this.isAutonomousLoopActive = false;
    if (this.autonomousTimer) {
      clearInterval(this.autonomousTimer);
      this.autonomousTimer = undefined;
    }
  }

  isAutonomousActive(): boolean {
    return this.isAutonomousLoopActive;
  }

  async executeCognitiveCycle(customInstruction?: string): Promise<AICognitiveStep | null> {
    if (!this.activeBuild) return null;
    const telem = this.activeAdapter.getTelemetry();

    const step = await aiAgent.reasonPerceptionStep(this.activeBuild, telem, customInstruction);

    // Execute planned tool calls
    if (step.toolCalls && step.toolCalls.length > 0) {
      for (const call of step.toolCalls) {
        try {
          const res = await mcpRegistry.execute(call.toolName, call.params, this.activeAdapter);
          call.status = "success";
          call.result = res;
          soundService.playRobotChirp();
        } catch (e: any) {
          call.status = "error";
          call.result = e.message;
        }
      }
    }

    this.cognitiveListeners.forEach(listener => listener(step));
    return step;
  }
}

export const robotEngine = new RobotEngine();
