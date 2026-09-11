# 🧱 OmniBrick — Embodied AI Robot Brain for LEGO Mindstorms 51515

> **RevenueCat Shipathon 2026 Submission** • **Category:** *Next Gen Award (Student Track)*  
> **Solo Creator:** Beknur (15 y.o., Astana, Kazakhstan)  
> **Live Demo:** [https://7ac7091aac6aad.lhr.life](https://7ac7091aac6aad.lhr.life)  
> **Repository:** [GitHub](https://github.com/Beknur/omnibrick)

[![RevenueCat SDK](https://img.shields.io/badge/Monetization-RevenueCat%20SDK-orange.svg)](https://www.revenuecat.com/)
[![Shipathon 2026](https://img.shields.io/badge/Shipathon-2026%20Contender-purple.svg)](https://shipaton.com/)
[![Capacitor Android](https://img.shields.io/badge/Platform-Capacitor%20Android-3880ff.svg)](https://capacitorjs.com/)
[![LEGO 51515 BLE](https://img.shields.io/badge/Hardware-LEGO%20Mindstorms%2051515-yellow.svg)](https://lego.com/)
[![Google Gemini & Gemma 4](https://img.shields.io/badge/AI%20Brain-Gemini%20Robotics%20%2B%20Gemma%204-cyan.svg)](https://ai.google.dev/)

---

## 🌟 The Vision: Turning Any Smartphone into an Embodied AI Robot

Educational robotics kits like **LEGO® Mindstorms 51515**, **SPIKE™ Prime**, and **VEX** have inspired millions of students. But for the past decade, they have been trapped in 2010: primitive Scratch-based state machines, zero computer vision, deaf/mute robots, and dedicated robotics AI boards costing **$300+**.

Meanwhile, almost every student or household has an old Android smartphone sitting in a drawer — equipped with an **ultra-fast NPU, high-res camera, sensitive microphone, loud speaker, and high-DPI display**.

**OmniBrick** transforms that smartphone into the autonomous head, cognitive brain, voice, and emotive face of a LEGO robot. With **$0 extra hardware**, students can build and command conversational, vision-guided rovers that see their environment, calculate differential kinematics, and talk back.

---

## 🏗️ System Architecture & Data Flow

```mermaid
graph TD
    Pilot[👤 Human Pilot (Voice / Mic / UI)] -->|Speech-to-Text / Commands| Brain[📱 Smartphone Head (Android / Chrome)]
    
    subgraph "OmniBrick Cognitive Core"
        Brain --> Vision[👁️ Camera & Optical Track]
        Brain --> Telemetry[📊 Live Sensor Telemetry (IMU, Battery, Sonar)]
        Vision --> LLM[🧠 LLM Cognitive Engine]
        Telemetry --> LLM
        
        subgraph "AI Tiers (RevenueCat SDK)"
            LLM -->|Free Tier| Gemma[Gemma 4 31B (14,400 RPD)]
            LLM -->|👑 Pro Subscription| Gemini[Gemini Robotics-ER 2 & 3.8 Flash]
        end
        
        LLM --> ToolCall[🛠️ Multi-Tool Dispatcher]
    end
    
    subgraph "Physical & Emotive Actuation"
        ToolCall -->|speak_voice| TTS[🗣️ Phone Speaker (TTS Synthesizer)]
        ToolCall -->|set_robot_eyes| Eyes[👀 Screen Face + LEGO 5x5 LED Matrix]
        ToolCall -->|execute_code| Sandbox[⚡ Kinematics JS Sandbox]
        ToolCall -->|drive_motors / turn_robot| LWP3[📡 Web Bluetooth LWP3 Protocol]
    end
    
    LWP3 --> Hub[🧱 LEGO Mindstorms 51515 Hub]
    Hub --> MotorA[⚙️ Motor A: Left Wheel]
    Hub --> MotorB[⚙️ Motor B: Right Wheel]
    Hub --> Sonar[📡 Ultrasonic Proximity Sonar]
```

---

## 💰 RevenueCat Monetization & Business Model

OmniBrick is natively architected around the **RevenueCat SDK** (`@revenuecat/purchases-capacitor`) with a high-conversion freemium model:

### 1. Subscription Tiers (Powered by RevenueCat)
| Plan | Price | Included Features & Models |
| :--- | :--- | :--- |
| **Free Explorer** | **$0 / mo** | • Local & Cloud **Gemma 4 31B** (14,400 RPD)<br>• 2D Virtual Arena Simulation (20Hz)<br>• Web Bluetooth LWP3 LEGO pairing<br>• Standard visual search and voice tools |
| **👑 Neural Nexus Pro** | **$9.99 / mo** (or 1,900 🧱) | • **Gemini Robotics-ER 2** (Google Embodied AI & Spatial Perception)<br>• **Gemini 3.8 Flash** (Ultra-fast reasoning engine)<br>• High-priority actuator queue with zero latency<br>• Full Marketplace MCP Tool synthesizer<br>• **+500 Welcome Bonus Bricks** |

### 2. The Bricks Virtual Economy (Creator Royalties)
* Students and robotics enthusiasts can publish their robot builds and custom prompt behaviors to the **Marketplace**.
* Users purchase Bricks credit packs ($2.99 for 500 🧱, $6.99 for 1,500 🧱, $19.99 for 5,000 🧱).
* Blueprint creators earn a **70% royalty** in Bricks on every download, redeemable for subscription extensions or marketplace upgrades.

---

## 🛠️ Key Technical Innovations

### 1. Embodied Multi-Tool Chaining (Tool Calling)
Unlike basic chat assistants, OmniBrick coordinates multi-tool actions simultaneously. When given a compound voice command:
> *"Say hello happily, calculate an arc turn, rotate left 90 degrees, and check your sensors"*
The model outputs **3–4 tools in a single cycle**:
1. `set_robot_eyes({ mood: "happy", color: "cyan" })`
2. `speak_voice({ message: "Hello pilot! Executing 90° heading shift.", mood: "happy" })`
3. `execute_code({ code: "calcArcDrive(30, 65, 14)", purpose: "Differential wheel velocities" })`
4. `turn_robot({ degrees: 90, direction: "left" })`

### 2. Live Telemetry Injection
Before every decision, real-time hardware status is injected into the cognitive prompt:
```
[ROBOT PHYSICAL HARDWARE & EMBODIED TELEMETRY]:
- Chassis Architecture: LEGO Mindstorms 51515 (2-Wheel Differential Drive, Track 14cm)
- Battery Level: 94%
- Compass Heading (IMU Gyro Yaw): 45°
- Forward Ultrasonic Sensor: 18 cm to nearest obstacle
- Current Pose: X=120cm, Y=85cm
- Optical Target: red_cube (Distance: 65cm, Bearing: +12°)
```

### 3. Emergency Obstacle Avoidance Reflex
If the ultrasonic sensor detects an obstacle closer than **25 cm**, an onboard hardware reflex preempts the AI loop:
* Changes eyes to flashing red alert (`rose`).
* Immediately halts forward thrust and steers $60^\circ$ to the side.
* Emits a warning alarm and voice notification: *"Obstacle detected! Adjusting course."*

### 4. Interactive LEGO 51515 Assembly Guide
Integrated 4-step hardware assembly modal directly in the web app:
* **Step 1**: Dual differential drive motor setup (Port A = Left, Port B = Right, 14cm track).
* **Step 2**: Technic beam cradle mount for the smartphone.
* **Step 3**: Ultrasonic distance sensor (Port C) and 5x5 LED matrix face.
* **Step 4**: One-tap Web Bluetooth LWP3 wireless pairing.

---

## 🚀 Quick Start & Development

### Prerequisites
* Node.js v20+
* (Optional) LEGO Mindstorms 51515 Hub or SPIKE Prime (or use built-in 20Hz Simulator)

### Installation
```bash
git clone https://github.com/Beknur/omnibrick.git
cd omnibrick

# Install dependencies
npm install

# Run local development server
npm run dev
```

### Production Build & Android Capacitor Sync
```bash
# Build production bundle (0 errors)
npm run build

# Sync with native Android Capacitor project
npm run build:android
```

---

## 📱 Supported Hardware & Ecosystem

* **LEGO Mindstorms 51515 Hub**: LEGO Wireless Protocol 3 (LWP3) over Web Bluetooth.
* **LEGO SPIKE Prime Hub**: Identical LWP3 architecture.
* **ESP32 BLE Custom Chassis**: Generic differential drive UART/BLE service.
* **Built-in 2D Virtual Arena**: Complete physics simulation for users without physical hardware.

---

## 🏆 Shipathon 2026 Next Gen Submission Info

* **Participant:** Beknur (15 y.o., 10th Grade, Astana, Kazakhstan)
* **Track:** Next Gen Award
* **RevenueCat SDK Version:** `@revenuecat/purchases-capacitor` v13.4.0
* **Entitlement ID:** `OmniBricks Pro`

*Built with passion, curiosity, and LEGO bricks.*
