import type { IRobotAdapter } from "./types";
import type { RobotTelemetry, RobotOperationalState } from "../types";

// Web Bluetooth Ambient Types for browser compatibility
type BluetoothDevice = any;
type BluetoothRemoteGATTServer = any;
type BluetoothRemoteGATTCharacteristic = any;

// Brain Brick Standard BLE GATT UUIDs
export const BRAIN_BRICK_SERVICE_UUID = "19b10000-e8f2-537e-4f6c-d104768a1214";
export const BRAIN_BRICK_COMMAND_CHAR_UUID = "19b10001-e8f2-537e-4f6c-d104768a1214";
export const BRAIN_BRICK_TELEMETRY_CHAR_UUID = "19b10002-e8f2-537e-4f6c-d104768a1214";

export class BleRobotAdapter implements IRobotAdapter {
  id: string = "ble-esp32-robot";
  name: string = "Physical BLE Robot (ESP32 / Arduino)";
  
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private commandChar: BluetoothRemoteGATTCharacteristic | null = null;
  private telemetryChar: BluetoothRemoteGATTCharacteristic | null = null;

  private connected: boolean = false;
  private telemetryCallback?: (t: RobotTelemetry) => void;

  private latestTelemetry: RobotTelemetry = {
    robotId: "ble-esp32-robot",
    timestamp: Date.now(),
    operationalState: "offline",
    adapterMode: "real_ble",
    batteryLevel: 100,
    currentTask: "Standby",
    currentAction: "Awaiting BLE pairing",
    pose: { x: 0, y: 0, heading: 0 },
    motors: {
      A: { speed: 0, position: 0 },
      B: { speed: 0, position: 0 },
    },
    sensors: {
      distanceToWallCm: 999,
      opticalTargetDetected: false,
      gyro: { yaw: 0, pitch: 0, roll: 0 },
    },
  };

  async connect(): Promise<boolean> {
    const nav = navigator as any;
    if (typeof navigator === "undefined" || !nav.bluetooth) {
      throw new Error(
        "Web Bluetooth is not supported in this browser. Please use Chrome on Android/Desktop or package the app with Capacitor BLE."
      );
    }

    try {
      // 1. Scan and request pairing
      this.device = await nav.bluetooth.requestDevice({
        filters: [{ namePrefix: "BrainBrick" }],
        optionalServices: [BRAIN_BRICK_SERVICE_UUID],
      });

      this.device.addEventListener("gattserverdisconnected", () => {
        this.connected = false;
        this.latestTelemetry.operationalState = "offline";
        if (this.telemetryCallback) this.telemetryCallback(this.getTelemetry());
      });

      // 2. Connect GATT Server
      if (!this.device.gatt) throw new Error("GATT Server not available on device");
      this.server = await this.device.gatt.connect();

      // 3. Obtain Service & Characteristics
      const service = await this.server.getPrimaryService(BRAIN_BRICK_SERVICE_UUID);
      this.commandChar = await service.getCharacteristic(BRAIN_BRICK_COMMAND_CHAR_UUID);
      this.telemetryChar = await service.getCharacteristic(BRAIN_BRICK_TELEMETRY_CHAR_UUID);

      // 4. Subscribe to Telemetry Notifications from ESP32
      await this.telemetryChar.startNotifications();
      this.telemetryChar.addEventListener("characteristicvaluechanged", (event: any) => {
        this.handleIncomingTelemetry(event.target.value);
      });

      this.connected = true;
      this.latestTelemetry.operationalState = "connected";
      this.latestTelemetry.currentAction = "BLE Link Established";
      if (this.telemetryCallback) this.telemetryCallback(this.getTelemetry());

      return true;
    } catch (err: any) {
      this.connected = false;
      throw new Error(`Bluetooth connection failed: ${err.message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.stopAll().catch(() => {});
    }
    if (this.server && this.server.connected) {
      this.server.disconnect();
    }
    this.connected = false;
    this.latestTelemetry.operationalState = "offline";
    if (this.telemetryCallback) this.telemetryCallback(this.getTelemetry());
  }

  isConnected(): boolean {
    return this.connected && (this.server?.connected ?? false);
  }

  async sendMotorCommand(port: string, speed: number, durationMs: number = 500): Promise<void> {
    if (!this.isConnected() || !this.commandChar) {
      throw new Error("Cannot send command: Robot not connected over BLE.");
    }

    const payload = JSON.stringify({
      cmd: "DRIVE_PORT",
      port,
      speed: Math.round(speed),
      time: durationMs,
    });

    await this.writeRawCommand(payload);
  }

  async stopAll(): Promise<void> {
    if (!this.isConnected() || !this.commandChar) return;
    const payload = JSON.stringify({ cmd: "HALT" });
    await this.writeRawCommand(payload);
    this.latestTelemetry.motors.A.speed = 0;
    this.latestTelemetry.motors.B.speed = 0;
    this.latestTelemetry.currentAction = "EMERGENCY HALT SENT";
    if (this.telemetryCallback) this.telemetryCallback(this.getTelemetry());
  }

  getTelemetry(): RobotTelemetry {
    return { ...this.latestTelemetry };
  }

  async executeTool(toolName: string, params: Record<string, any>): Promise<any> {
    if (!this.isConnected() || !this.commandChar) {
      throw new Error(`Cannot execute '${toolName}': BLE Robot is disconnected.`);
    }

    switch (toolName) {
      case "robot_move_direction":
      case "drive_motors": {
        let leftSpeed = params.leftSpeed ?? 50;
        let rightSpeed = params.rightSpeed ?? 50;
        const durationMs = params.durationMs ?? 1000;
        if (params.direction === "forward") {
          const spd = params.speed ?? 60;
          leftSpeed = spd;
          rightSpeed = spd;
        } else if (params.direction === "backward") {
          const spd = params.speed ?? 60;
          leftSpeed = -spd;
          rightSpeed = -spd;
        }
        const payload = JSON.stringify({
          cmd: "DIFF_DRIVE",
          m1: Math.round(leftSpeed),
          m2: Math.round(rightSpeed),
          time: durationMs,
        });
        await this.writeRawCommand(payload);
        return { success: true, dispatched: payload };
      }

      case "robot_turn_to_heading":
      case "turn_robot": {
        const degrees = params.degrees ?? Math.abs(params.target_heading_deg ?? 45);
        const direction = params.direction ?? (params.target_heading_deg < 0 ? "left" : "right");
        const payload = JSON.stringify({
          cmd: "TURN",
          deg: degrees,
          dir: direction,
        });
        await this.writeRawCommand(payload);
        return { success: true, dispatched: payload };
      }

      case "robot_stop":
      case "stop_robot": {
        await this.stopAll();
        return { success: true, message: "Actuators halted." };
      }

      case "speak_voice": {
        const message = params.message || "";
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(message);
          window.speechSynthesis.speak(utterance);
        }
        return { success: true, vocalized: message };
      }

      default:
        throw new Error(`MCP Tool '${toolName}' not supported by BLE adapter.`);
    }
  }

  onTelemetry(callback: (telemetry: RobotTelemetry) => void): void {
    this.telemetryCallback = callback;
  }

  private async writeRawCommand(jsonString: string): Promise<void> {
    if (!this.commandChar) return;
    const encoder = new TextEncoder();
    const data = encoder.encode(jsonString + "\n");
    await this.commandChar.writeValueWithoutResponse(data);
  }

  private handleIncomingTelemetry(dataView: DataView): void {
    try {
      const decoder = new TextDecoder();
      const rawText = decoder.decode(dataView);
      const parsed = JSON.parse(rawText);

      // Map incoming ESP32 packet into RobotTelemetry
      this.latestTelemetry = {
        ...this.latestTelemetry,
        timestamp: Date.now(),
        batteryLevel: parsed.battery ?? this.latestTelemetry.batteryLevel,
        sensors: {
          ...this.latestTelemetry.sensors,
          distanceToWallCm: parsed.sonar ?? this.latestTelemetry.sensors.distanceToWallCm,
          gyro: parsed.gyro ?? this.latestTelemetry.sensors.gyro,
        },
        motors: {
          A: { speed: parsed.m1_spd ?? 0, position: 0 },
          B: { speed: parsed.m2_spd ?? 0, position: 0 },
        },
        operationalState: (parsed.m1_spd !== 0 || parsed.m2_spd !== 0) ? "running" : "connected",
      };

      if (this.telemetryCallback) {
        this.telemetryCallback(this.getTelemetry());
      }
    } catch {
      // Non-JSON or fragmented packet, ignore
    }
  }
}
