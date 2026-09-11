# Brain Brick — End-to-End Master Plan: Mobile Registration to BLE & AI Tool-Using

**Author**: Beknur (15 y.o., Astana, Kazakhstan)  
**Project**: Brain Brick (AI-First Robotics Platform) for **RevenueCat Shipathon 2026** (Next Gen Award)  
**Stack**: React 19 + TypeScript + Vite + Tailwind CSS v4 + Capacitor + RevenueCat + ESP32 C++ BLE Firmware + Multimodal Gemini Vision + MCP (Model Context Protocol)

---

## 1. System Architecture

```mermaid
flowchart TD
    subgraph MobileApp ["Mobile Device (User's Phone mounted on Robot)"]
        UI["Brain Brick Web / Capacitor App"]
        Cam["Mobile Phone Camera (Front/Rear Eye)"]
        RC["RevenueCat SDK (Pro Tier Entitlements)"]
        Engine["RobotEngine + IRobotAdapter"]
        LLM["Multimodal Vision Agent (Gemini Flash)"]
        MCP["MCP Tool Registry (robot_move, look_at, etc.)"]
    end

    subgraph Microcontroller ["Physical Robot Hardware (~$25 BOM)"]
        ESP32["ESP32 Microcontroller (BLE GATT Server)"]
        MotorDriver["TB6612FNG / L298N Motor Driver"]
        Motors["2x TT DC Motors (Differential Drive)"]
        Sonar["HC-SR04 Sonar (Obstacle Reflex Auto-Brake)"]
        Batt["2x 18650 Li-ion Batteries (7.4V)"]
    end

    Cam -->|RGB Video Stream 3 FPS| LLM
    LLM -->|MCP Tool Invocations| Engine
    Engine -->|Web Bluetooth / BLE GATT Command Char| ESP32
    ESP32 -->|PWM Duty Cycle| MotorDriver --> Motors
    Sonar -->|<18cm Hardware Reflex (0ms latency)| ESP32
    ESP32 -->|20Hz Telemetry GATT Notify: Bat, Sonar, PWM| Engine
    Engine --> UI
    RC -.->|Unlocks BLE & Vision Modes| UI
```

---

## 2. Five-Stage Implementation Breakdown

### Stage 1: Mobile App Registration & RevenueCat Monetization
1. **Onboarding & Auth**:
   - Clean dark-mode UI with fast guest access to 2D simulator arena.
   - Cloud profile sync for saving custom Robot Builds and sharing to the Community Hub.
2. **RevenueCat Subscriptions**:
   - **Free Tier**: 2D Simulator Arena, 3 default builds (Explorer, Sentry, Cube Hunter), manual D-pad controls.
   - **Pro Tier ($4.99/mo or $39.99/yr)**:
     - Real ESP32 BLE hardware pairing.
     - Live Camera Eye vision reasoning.
     - Custom MCP tool code creation & schema definition.
     - Unlimited AI prompt persona customization.

### Stage 2: Hardware Bill of Materials & Circuit Assembly
A complete, autonomous AI physical rover for **under $25**:
- **Microcontroller**: ESP32-WROOM-32 (30 pins, built-in BLE 4.2/5.0).
- **Driver**: TB6612FNG or L298N Dual H-Bridge motor driver.
- **Chassis**: 2WD differential drive chassis with two TT gearmotors and caster wheel.
- **Sensor**: HC-SR04 ultrasonic distance sensor with 1kΩ / 2kΩ voltage divider on ECHO.
- **Power**: 2x 18650 Li-ion batteries (7.4V nominal) + 5V buck converter / LDO for ESP32 logic.
- **Phone Mount**: Gooseneck or 3D-printed clip to fix the smartphone onto the chassis as the robot's primary camera eye and neural computer.

### Stage 3: Bluetooth BLE Protocol & GATT Architecture
- **Service UUID**: `19b10000-e8f2-537e-4f6c-d104768a1214`
- **Command Characteristic (WRITE)**: `19b10001-e8f2-537e-4f6c-d104768a1214`
  - Compact JSON / binary payload: `{"t":"DRV","l":180,"r":180,"d":250}`
  - Zero-overhead parsing on ESP32 in $< 8\text{ms}$.
- **Telemetry Characteristic (NOTIFY)**: `19b10002-e8f2-537e-4f6c-d104768a1214`
  - 20Hz continuous push: `{"bat":85,"sonar":42.1,"m1":180,"m2":180,"obs":false,"uptime":5420}`
  - Auto-updates app state without polling.

### Stage 4: AI Tool Using & Multimodal Vision Ingestion
The **Cognitive Loop**:
1. User gives high-level intent via voice or text:
   > *"Find the red cube, approach it, and stop 20 cm away."*
2. Phone camera captures live frame and submits it with system prompt and MCP tools (`robot_move_direction`, `robot_turn_to_heading`, `robot_stop`, `look_at_object`).
3. Model assesses the bounding box of the target in camera coordinates and calls `robot_move_direction(direction="forward", speed=160, durationMs=350)`.
4. `BleRobotAdapter` writes the motor pulse to ESP32.
5. Sonar telemetry and new camera perspective feed back into the next AI step.

### Stage 5: Dual-Layer Safety (Microcontroller Reflex + Watchdog)
Physical robots cannot rely exclusively on cloud AI when driving toward a wall or a staircase:
1. **Layer 1 (0ms Reflex)**: The ESP32's background timer task monitors sonar. If distance $< 18\text{cm}$, the firmware directly overrides PWM to 0, halts motors, and sets `obstacle_detected = true`.
2. **Layer 2 (1500ms Watchdog)**: If Bluetooth disconnects or the phone locks, the ESP32 safety timer auto-stops both motors after 1.5s with no received heartbeat command.

---

## 3. Project Deliverables in Repository

| File Path | Description |
| :--- | :--- |
| `firmware/esp32_brain_brick.ino` | Production Arduino/ESP32 C++ firmware with BLE GATT Server, L298N/TB6612 driver, HC-SR04 sonar reflex, and 1500ms safety watchdog. |
| `src/engine/bleAdapter.ts` | Complete `BleRobotAdapter` implementing `IRobotAdapter` with Web Bluetooth API & GATT subscriptions. |
| `src/engine/robotEngine.ts` | Hot-swap adapter engine supporting both `mock_simulator` and `real_ble`. |
| `src/context/RobotContext.tsx` | Global React state for mission control, telemetry, cognitive log, and live transcripts. |
| `src/pages/RunPage.tsx` | Mission control dashboard with HUD, D-Pad, live transcripts, camera feed, and Simulation/BLE toggle. |
| `src/components/Editor/MCPToolEditor.tsx` | Live schema editor and sandbox for building and executing custom robot tools. |
| `src/components/Editor/PromptBuildEditor.tsx` | Natural language persona & prompt engineering editor with simulated reasoning preview. |
