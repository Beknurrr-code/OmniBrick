import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { RobotBuild, RobotTelemetry, AICognitiveStep, LiveTranscriptEntry } from "../types";
import { robotEngine } from "../engine/robotEngine";
import { buildStorage } from "../services/buildStorage";

interface RobotContextType {
  activeBuild: RobotBuild | null;
  sessionActive: boolean;
  isAutonomous: boolean;
  telemetry: RobotTelemetry;
  cognitiveLog: AICognitiveStep[];
  transcript: LiveTranscriptEntry[];
  adapterMode: "mock_simulator" | "lego_spike" | "real_ble";
  setAdapterMode: (mode: "mock_simulator" | "lego_spike" | "real_ble") => void;
  launchMission: (build: RobotBuild) => Promise<boolean>;
  stopMission: () => Promise<void>;
  toggleAutonomous: () => void;
  manualDrive: (left: number, right: number, durationMs?: number) => Promise<void>;
  emergencyHalt: () => Promise<void>;
  sendInstruction: (instruction: string) => Promise<void>;
  repositionTarget: (x: number, y: number) => void;
  selectBuild: (build: RobotBuild) => void;
  clearTranscript: () => void;
}

const RobotContext = createContext<RobotContextType | null>(null);

export function RobotProvider({ children }: { children: ReactNode }) {
  const [activeBuild, setActiveBuild] = useState<RobotBuild | null>(() => {
    const builds = buildStorage.getRobotBuilds();
    return builds[0] || null;
  });

  const [sessionActive, setSessionActive] = useState(false);
  const [isAutonomous, setIsAutonomous] = useState(false);
  const [telemetry, setTelemetry] = useState<RobotTelemetry>(() => robotEngine.getTelemetry());
  const [cognitiveLog, setCognitiveLog] = useState<AICognitiveStep[]>([]);
  const [adapterMode, setAdapterModeState] = useState<"mock_simulator" | "lego_spike" | "real_ble">(() => robotEngine.getAdapterMode());

  const setAdapterMode = (mode: "mock_simulator" | "lego_spike" | "real_ble") => {
    robotEngine.setAdapterMode(mode);
    setAdapterModeState(mode);
    setSessionActive(false);
    setIsAutonomous(false);
    setTelemetry(robotEngine.getTelemetry());
  };

  const [transcript, setTranscript] = useState<LiveTranscriptEntry[]>([
    {
      id: "tr-init",
      timestamp: Date.now(),
      role: "ai_thought",
      label: "AI Brain",
      content: "OmniBrick OS initialized. Red Cube Hunter stand-by. Connect or engage autonomous search.",
    },
  ]);

  useEffect(() => {
    const unsubTelem = robotEngine.subscribeTelemetry((t) => {
      setTelemetry({ ...t });
    });

    const unsubCognitive = robotEngine.subscribeCognitive((step) => {
      setCognitiveLog(prev => [step, ...prev].slice(0, 30));

      // Append structured Live Transcript entries (Section 15)
      const entries: LiveTranscriptEntry[] = [];
      const now = step.timestamp || Date.now();

      // 1. AI Reasoning Thought
      if (step.thought) {
        entries.push({
          id: `tr-thought-${now}-${Math.random()}`,
          timestamp: now,
          role: "ai_thought",
          label: "AI Brain",
          content: step.thought,
        });
      }

      // 2. Tool Calls & Results
      if (step.toolCalls && step.toolCalls.length > 0) {
        for (const call of step.toolCalls) {
          entries.push({
            id: `tr-call-${now}-${call.toolName}`,
            timestamp: now + 1,
            role: "tool_call",
            label: `Tool: ${call.toolName}()`,
            content: `Invoked with parameters: ${JSON.stringify(call.params)}`,
            payload: call.params,
          });

          if (call.result) {
            entries.push({
              id: `tr-res-${now}-${call.toolName}`,
              timestamp: now + 2,
              role: "tool_result",
              label: `Result: ${call.toolName}`,
              content: typeof call.result === "string" ? call.result : JSON.stringify(call.result),
              payload: call.result,
            });
          }

          // 3. Robot Actuation Actions (Voice, Motors, Code, MCP, Eyes)
          if (call.toolName === "drive_motors" || call.toolName === "turn_robot") {
            entries.push({
              id: `tr-act-${now}-${call.toolName}`,
              timestamp: now + 3,
              role: "robot_action",
              label: "🏎️ Motor Actuation",
              content: call.toolName === "drive_motors" 
                ? `Motors engaged: Left=${call.params.leftSpeed}%, Right=${call.params.rightSpeed}% (${call.params.durationMs}ms)`
                : `Chassis rotated ${call.params.degrees}° to ${call.params.direction}`,
            });
          } else if (call.toolName === "speak_voice") {
            entries.push({
              id: `tr-act-${now}-${call.toolName}`,
              timestamp: now + 3,
              role: "robot_action",
              label: "🗣️ Voice Vocalization",
              content: `"${call.params.message}" (${call.params.mood || "neutral"} mood)`,
            });
          } else if (call.toolName === "execute_code") {
            const outStr = call.result?.output !== undefined 
              ? JSON.stringify(call.result.output) 
              : JSON.stringify(call.result);
            entries.push({
              id: `tr-act-${now}-${call.toolName}`,
              timestamp: now + 3,
              role: "robot_action",
              label: "⚡ Code Sandbox Result",
              content: `${call.params.purpose || "Algorithm"}: ${outStr}`,
            });
          } else if (call.toolName === "call_mcp_tool") {
            entries.push({
              id: `tr-act-${now}-${call.toolName}`,
              timestamp: now + 3,
              role: "robot_action",
              label: "🔌 MCP Extension",
              content: `Server [${call.params.serverName}]: Tool '${call.params.toolName}' dispatched successfully`,
            });
          } else if (call.toolName === "set_robot_eyes") {
            entries.push({
              id: `tr-act-${now}-${call.toolName}`,
              timestamp: now + 3,
              role: "robot_action",
              label: "👀 Robot Face Eyes",
              content: `Emotive eyes shifted to '${call.params.mood}' expression in ${call.params.color} neon`,
            });
          } else if (call.toolName === "stop_robot") {
            entries.push({
              id: `tr-act-${now}-${call.toolName}`,
              timestamp: now + 3,
              role: "robot_action",
              label: "🛑 Emergency Halt",
              content: `Actuators cut. Position locked. Reason: ${call.params.reason || "Safety command"}`,
            });
          } else if (call.toolName === "query_robot_status") {
            const res = call.result || {};
            entries.push({
              id: `tr-act-${now}-${call.toolName}`,
              timestamp: now + 3,
              role: "robot_action",
              label: "📊 Telemetry Inspection",
              content: `Battery: ${res.batteryLevel ?? 100}% | Heading: ${res.headingDeg ?? 0}° | Obstacle: ${res.distanceToObstacleCm ?? "clear"}cm | Mode: ${res.adapterMode || "active"}`,
            });
          }
        }
      }

      setTranscript(prev => [...prev, ...entries].slice(-60));
    });

    return () => {
      unsubTelem();
      unsubCognitive();
    };
  }, []);

  const selectBuild = (b: RobotBuild) => {
    setActiveBuild(b);
    robotEngine.setActiveBuild(b);
  };

  const launchMission = async (build: RobotBuild): Promise<boolean> => {
    setActiveBuild(build);
    const ok = await robotEngine.startMission(build);
    setSessionActive(ok);
    return ok;
  };

  const stopMission = async (): Promise<void> => {
    await robotEngine.stopMission();
    setSessionActive(false);
    setIsAutonomous(false);
  };

  const toggleAutonomous = () => {
    if (robotEngine.isAutonomousActive()) {
      robotEngine.stopAutonomousLoop();
      setIsAutonomous(false);
    } else {
      robotEngine.startAutonomousLoop();
      setIsAutonomous(true);
    }
  };

  const manualDrive = async (left: number, right: number, durationMs?: number) => {
    await robotEngine.manualDrive(left, right, durationMs);
  };

  const emergencyHalt = async () => {
    await robotEngine.emergencyHalt();
    setIsAutonomous(false);
    setTranscript(prev => [
      ...prev,
      {
        id: `tr-halt-${Date.now()}`,
        timestamp: Date.now(),
        role: "robot_action",
        label: "EMERGENCY HALT",
        content: "Pilot triggered Emergency Stop (HALT). Power cut to all motors.",
      },
    ]);
  };

  const sendInstruction = async (instruction: string) => {
    // 1. Add user message to transcript
    setTranscript(prev => [
      ...prev,
      {
        id: `tr-user-${Date.now()}`,
        timestamp: Date.now(),
        role: "user",
        label: "You (Pilot)",
        content: instruction,
      },
    ]);

    // 2. Execute cognitive cycle
    await robotEngine.executeCognitiveCycle(instruction);
  };

  const repositionTarget = (x: number, y: number) => {
    robotEngine.getAdapter().setTargetPosition?.(x, y);
    setTelemetry({ ...robotEngine.getTelemetry() });
  };

  const clearTranscript = () => {
    setTranscript([]);
  };

  return (
    <RobotContext.Provider
      value={{
        activeBuild,
        sessionActive,
        isAutonomous,
        telemetry,
        cognitiveLog,
        transcript,
        adapterMode,
        setAdapterMode,
        launchMission,
        stopMission,
        toggleAutonomous,
        manualDrive,
        emergencyHalt,
        sendInstruction,
        repositionTarget,
        selectBuild,
        clearTranscript,
      }}
    >
      {children}
    </RobotContext.Provider>
  );
}

export function useRobot() {
  const ctx = useContext(RobotContext);
  if (!ctx) {
    throw new Error("useRobot must be used within a RobotProvider");
  }
  return ctx;
}
