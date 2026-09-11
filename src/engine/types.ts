import type { RobotTelemetry } from "../types";

export interface IRobotAdapter {
  id: string;
  name: string;
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  sendMotorCommand(port: string, speed: number, durationMs?: number): Promise<void>;
  stopAll(): Promise<void>;
  getTelemetry(): RobotTelemetry;
  executeTool(toolName: string, params: Record<string, any>): Promise<any>;
  onTelemetry(callback: (telemetry: RobotTelemetry) => void): void;
  setTargetPosition?(x: number, y: number): void;
  getTargetPosition?(): { x: number; y: number; label: string };
}
