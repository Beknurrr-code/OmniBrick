// LEGO Mindstorms Robot Inventor (51515) & SPIKE Prime Bluetooth Adapter
// Implements official LEGO Wireless Protocol v3.0 (LWP3) over Web Bluetooth
// Direct plug-and-play support: No custom firmware flashing required on the Hub!

import type { IRobotAdapter } from "./types";
import type { RobotTelemetry } from "../types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type BluetoothDevice = any;
type BluetoothRemoteGATTServer = any;
type BluetoothRemoteGATTCharacteristic = any;

// Official LEGO Wireless Protocol 3.0 (LWP3) GATT UUIDs
export const LEGO_HUB_SERVICE_UUID = "00001623-1212-efde-1623-785feabcd123";
export const LEGO_HUB_CHARACTERISTIC_UUID = "00001624-1212-efde-1623-785feabcd123";

// Port Mappings for Standard 51515 / SPIKE Driving Base
export const LEGO_PORT_MAP: Record<string, number> = {
  A: 0x00,
  B: 0x01,
  C: 0x02,
  D: 0x03,
  E: 0x04,
  F: 0x05,
};

export class LegoRobotAdapter implements IRobotAdapter {
  id: string = "lego-51515-robot";
  name: string = "LEGO Mindstorms 51515 / SPIKE Prime Hub";

  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;

  private connected: boolean = false;
  private telemetryCallback?: (t: RobotTelemetry) => void;

  private latestTelemetry: RobotTelemetry = {
    robotId: "lego-51515-robot",
    timestamp: Date.now(),
    operationalState: "offline",
    adapterMode: "lego_spike",
    batteryLevel: 100,
    currentTask: "Standby",
    currentAction: "Awaiting LEGO Hub connection",
    pose: { x: 0, y: 0, heading: 0 },
    motors: {
      A: { speed: 0, position: 0 },
      B: { speed: 0, position: 0 },
    },
    sensors: {
      distanceToWallCm: 150,
      opticalTargetDetected: false,
      gyro: { yaw: 0, pitch: 0, roll: 0 },
    },
  };

  async connect(): Promise<boolean> {
    const nav = navigator as any;
    if (typeof navigator === "undefined" || !nav.bluetooth) {
      throw new Error(
        "Web Bluetooth is required to connect to your LEGO 51515 Hub. Please use Chrome on Android/Desktop or open in Capacitor."
      );
    }

    try {
      // 1. Scan for LEGO Mindstorms / SPIKE Prime Hub
      this.device = await nav.bluetooth.requestDevice({
        filters: [
          { services: [LEGO_HUB_SERVICE_UUID] },
          { namePrefix: "LEGO" },
          { namePrefix: "Robot" },
          { namePrefix: "SPIKE" },
          { namePrefix: "Hub" },
        ],
        optionalServices: [LEGO_HUB_SERVICE_UUID],
      });

      this.device.addEventListener("gattserverdisconnected", () => {
        this.connected = false;
        this.latestTelemetry.operationalState = "offline";
        if (this.telemetryCallback) this.telemetryCallback(this.getTelemetry());
      });

      // 2. Connect GATT
      if (!this.device.gatt) throw new Error("GATT Server unavailable on LEGO Hub");
      this.server = await this.device.gatt.connect();

      // 3. Obtain LWP3 Service & Characteristic
      const service = await this.server.getPrimaryService(LEGO_HUB_SERVICE_UUID);
      this.characteristic = await service.getCharacteristic(LEGO_HUB_CHARACTERISTIC_UUID);

      // 4. Start Notifications for Telemetry / Sensor feedback
      await this.characteristic.startNotifications();
      this.characteristic.addEventListener("characteristicvaluechanged", (evt: any) => {
        this.handleIncomingLwp3Packet(evt.target.value);
      });

      this.connected = true;
      this.latestTelemetry.operationalState = "connected";
      this.latestTelemetry.currentAction = "Connected via LEGO Wireless Protocol v3";

      // Display a smiley face on the 5x5 Hub LED matrix to celebrate connection!
      await this.displayHappyFace();

      if (this.telemetryCallback) this.telemetryCallback(this.getTelemetry());
      return true;
    } catch (e: any) {
      this.connected = false;
      this.latestTelemetry.operationalState = "offline";
      console.warn("LEGO Hub connection error:", e);
      throw e;
    }
  }

  async disconnect(): Promise<void> {
    await this.stopAll();
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.connected = false;
    this.latestTelemetry.operationalState = "offline";
  }

  isConnected(): boolean {
    return this.connected && !!this.device?.gatt?.connected;
  }

  /**
   * LWP3 Command: Port Output Command (WriteDirectModeData)
   * Sends motor power (-100% to +100%) to a designated Port (A-F).
   */
  async sendMotorCommand(port: string, speed: number, durationMs: number = 1000): Promise<void> {
    if (!this.characteristic) return;

    const portId = LEGO_PORT_MAP[port.toUpperCase()] ?? 0x00;
    const clampedSpeed = Math.max(-100, Math.min(100, Math.round(speed)));

    // LWP3 Port Output Command packet
    // Length: 8 bytes (0x08)
    // Hub ID: 0x00
    // Message Type: 0x81 (Port Output)
    // Port ID: portId
    // Execution: 0x11 (Execute immediately)
    // Sub-command: 0x51 (WriteDirectModeData)
    // Mode: 0x00 (Speed)
    // Payload: clampedSpeed as signed 8-bit int
    const speedByte = clampedSpeed < 0 ? (256 + clampedSpeed) : clampedSpeed;
    const packet = new Uint8Array([0x08, 0x00, 0x81, portId, 0x11, 0x51, 0x00, speedByte]);

    await this.characteristic.writeValueWithoutResponse(packet);

    // Update internal state
    if (this.latestTelemetry.motors[port]) {
      this.latestTelemetry.motors[port].speed = clampedSpeed;
    }

    // Auto-timeout if specified
    if (durationMs > 0 && clampedSpeed !== 0) {
      setTimeout(async () => {
        if (this.isConnected()) {
          const stopPacket = new Uint8Array([0x08, 0x00, 0x81, portId, 0x11, 0x51, 0x00, 0x00]);
          await this.characteristic?.writeValueWithoutResponse(stopPacket);
          if (this.latestTelemetry.motors[port]) {
            this.latestTelemetry.motors[port].speed = 0;
          }
        }
      }, durationMs);
    }
  }

  async stopAll(): Promise<void> {
    if (!this.characteristic) return;
    // Stop Left Motor (A) and Right Motor (B)
    const stopA = new Uint8Array([0x08, 0x00, 0x81, 0x00, 0x11, 0x51, 0x00, 0x00]);
    const stopB = new Uint8Array([0x08, 0x00, 0x81, 0x01, 0x11, 0x51, 0x00, 0x00]);
    await this.characteristic.writeValueWithoutResponse(stopA);
    await this.characteristic.writeValueWithoutResponse(stopB);

    this.latestTelemetry.motors["A"] = { speed: 0, position: 0 };
    this.latestTelemetry.motors["B"] = { speed: 0, position: 0 };
    this.latestTelemetry.operationalState = "connected";
  }

  getTelemetry(): RobotTelemetry {
    return { ...this.latestTelemetry };
  }

  async executeTool(toolName: string, params: Record<string, any>): Promise<any> {
    if (!this.isConnected()) {
      throw new Error(`Cannot execute '${toolName}': LEGO 51515 Hub is disconnected.`);
    }

    switch (toolName) {
      case "robot_move_direction":
      case "drive_motors": {
        let leftSpeed = params.leftSpeed ?? 50;
        let rightSpeed = params.rightSpeed ?? 50;
        const durationMs = params.durationMs ?? 1000;

        if (params.direction === "forward") {
          const spd = params.speed ?? 50;
          // In LEGO driving bases, Port A is left, Port B is right (or reversed depending on gear orientation)
          leftSpeed = -spd; // LEGO standard driving base inversion
          rightSpeed = spd;
        } else if (params.direction === "backward") {
          const spd = params.speed ?? 50;
          leftSpeed = spd;
          rightSpeed = -spd;
        }

        await this.sendMotorCommand("A", leftSpeed, durationMs);
        await this.sendMotorCommand("B", rightSpeed, durationMs);

        return {
          success: true,
          message: `LEGO 51515 Actuators engaged: Port A=${leftSpeed}%, Port B=${rightSpeed}% (${durationMs}ms)`
        };
      }

      case "robot_turn_to_heading":
      case "turn_robot": {
        const degrees = params.degrees ?? Math.abs(params.target_heading_deg ?? 45);
        const direction = params.direction ?? (params.target_heading_deg < 0 ? "left" : "right");
        const turnSpeed = 45;
        // Turn in place: opposite motor directions
        const left = direction === "right" ? turnSpeed : -turnSpeed;
        const right = direction === "right" ? turnSpeed : -turnSpeed;
        const durationMs = Math.round((degrees / 90) * 650);

        await this.sendMotorCommand("A", left, durationMs);
        await this.sendMotorCommand("B", right, durationMs);

        return { success: true, rotatedDeg: degrees, direction };
      }

      case "robot_stop":
      case "stop_robot": {
        await this.stopAll();
        return { success: true, message: "LEGO Hub motors disengaged. Full stop." };
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
        throw new Error(`Tool '${toolName}' not handled by LEGO adapter.`);
    }
  }

  onTelemetry(callback: (telemetry: RobotTelemetry) => void): void {
    this.telemetryCallback = callback;
  }

  /**
   * Display icon on 5x5 LED Matrix (Port 0x10 virtual light matrix)
   */
  private async displayHappyFace(): Promise<void> {
    if (!this.characteristic) return;
    try {
      // 5x5 LED pixel pattern for smiling face
      // Row 1: . X . X .
      // Row 2: . X . X .
      // Row 3: . . . . .
      // Row 4: X . . . X
      // Row 5: . X X X .
      const pixels = new Uint8Array([
        0x00, 0x64, 0x00, 0x64, 0x00,
        0x00, 0x64, 0x00, 0x64, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00,
        0x64, 0x00, 0x00, 0x00, 0x64,
        0x00, 0x64, 0x64, 0x64, 0x00,
      ]);

      const packet = new Uint8Array(8 + pixels.length);
      packet[0] = packet.length;
      packet[1] = 0x00;
      packet[2] = 0x81;
      packet[3] = 0x10; // Virtual port 16 = 5x5 LED matrix
      packet[4] = 0x11;
      packet[5] = 0x51;
      packet[6] = 0x02; // Bitmap mode
      packet.set(pixels, 7);

      await this.characteristic.writeValueWithoutResponse(packet);
    } catch (e) {
      // Non-critical, ignore display error
    }
  }

  /**
   * Parses incoming LWP3 feedback (battery level, sensor updates)
   */
  private handleIncomingLwp3Packet(dataView: DataView): void {
    if (!dataView || dataView.byteLength < 3) return;

    const msgType = dataView.getUint8(2);

    // Hub Attached I/O or Sensor update (0x45)
    // Battery Status report (0x01 Hub Property)
    if (msgType === 0x01 && dataView.byteLength >= 6) {
      const property = dataView.getUint8(3);
      if (property === 0x06) {
        // Battery level (0-100%)
        const battery = dataView.getUint8(5);
        this.latestTelemetry.batteryLevel = battery;
        if (this.telemetryCallback) this.telemetryCallback(this.getTelemetry());
      }
    }
  }
}

export const legoRobotAdapter = new LegoRobotAdapter();
