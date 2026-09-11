// Universal AI Vision & Cognitive Service
// Supports: Google Gemini Flash, Ollama Cloud, OpenAI-compatible APIs (OpenRouter, Groq, vLLM), and Offline Agentic Simulator

import type { RobotTelemetry } from "../types";
import { trySolveMath } from "./mathSolver";
import { calculateSafeDriveTrajectory } from "./kinematicsSafety";

export interface AIProviderConfig {
  provider: "ollama" | "openai_compatible" | "gemini" | "simulator";
  endpoint: string; // e.g., "http://localhost:11434/v1" or custom Ollama Cloud URL
  apiKey: string;
  model: string; // e.g., "llama3.2-vision", "gemini-2.5-flash", "qwen2-vl", "gpt-4o-mini"
}

export interface StructuredToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface VisionDetectionResult {
  thought: string;
  targetDetected: boolean;
  targetLabel?: string;
  distanceEstimateCm?: number;
  bearingDeg?: number;
  toolCall?: StructuredToolCall;
  toolCalls?: StructuredToolCall[];
}

export interface PingResult {
  success: boolean;
  message: string;
  latencyMs: number;
}

const STORAGE_KEY = "brainbrick_ai_provider_config";

export function getEnvDefaults(): AIProviderConfig {
  const env = (import.meta as any).env || {};
  const geminiKey = env.VITE_GEMINI_API_KEY || "";
  const ollamaEndpoint = env.VITE_OLLAMA_ENDPOINT || "http://localhost:11434/v1";
  const ollamaKey = env.VITE_OLLAMA_API_KEY || "";
  const ollamaModel = env.VITE_OLLAMA_MODEL || "gemma4:31b-cloud";
  const geminiModel = env.VITE_GEMINI_MODEL || "gemma-4-31b-it";
  const preferredProvider = env.VITE_DEFAULT_AI_PROVIDER || (geminiKey ? "gemini" : "simulator");

  if (preferredProvider === "gemini" && geminiKey) {
    return {
      provider: "gemini",
      endpoint: "https://generativelanguage.googleapis.com",
      apiKey: geminiKey,
      model: geminiModel,
    };
  }

  if (preferredProvider === "ollama") {
    return {
      provider: "ollama",
      endpoint: ollamaEndpoint,
      apiKey: ollamaKey,
      model: ollamaModel,
    };
  }

  return {
    provider: (preferredProvider as any) || "simulator",
    endpoint: ollamaEndpoint,
    apiKey: geminiKey || ollamaKey || "",
    model: preferredProvider === "gemini" ? geminiModel : ollamaModel,
  };
}

export const defaultAIConfig: AIProviderConfig = getEnvDefaults();

let latestCameraFrame: string | null = null;
export function setLatestCameraFrame(frameBase64: string | null): void {
  latestCameraFrame = frameBase64;
}
export function getLatestCameraFrame(): string | null {
  return latestCameraFrame;
}

export class AIVisionService {
  private config: AIProviderConfig = this.loadConfig();

  public getConfig(): AIProviderConfig {
    return { ...this.config };
  }

  public setConfig(newConfig: Partial<AIProviderConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
  }

  public resetToEnvDefaults(): AIProviderConfig {
    const defaults = getEnvDefaults();
    this.config = { ...defaults };
    this.saveConfig();
    return { ...this.config };
  }

  private loadConfig(): AIProviderConfig {
    const envDefaults = getEnvDefaults();
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        let model = parsed.model || envDefaults.model;
        if (model === "gemini-robotics-er-2-preview") {
          model = "gemini-2.5-flash";
        }
        return {
          ...envDefaults,
          ...parsed,
          apiKey: parsed.apiKey || envDefaults.apiKey,
          endpoint: parsed.endpoint || envDefaults.endpoint,
          model,
        };
      }
    } catch (e) {
      console.warn("Failed to load AI config from storage:", e);
    }
    return envDefaults;
  }

  private saveConfig(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.warn("Failed to save AI config:", e);
    }
  }

  /**
   * Ping / Test Connection to configured provider
   */
  public async testConnection(): Promise<PingResult> {
    const start = performance.now();

    if (this.config.provider === "simulator") {
      return {
        success: true,
        message: "Built-in Autonomous Edge Simulator is active and instant.",
        latencyMs: 0,
      };
    }

    try {
      // 1. Google Gemini Flash Ping
      if (this.config.provider === "gemini") {
        if (!this.config.apiKey.trim()) {
          return { success: false, message: "Gemini API key is required.", latencyMs: 0 };
        }
        const model = this.config.model || "gemini-2.5-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.config.apiKey.trim()}`;
        
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "ping" }] }],
            generationConfig: { maxOutputTokens: 5 },
          }),
        });

        const elapsed = Math.round(performance.now() - start);
        if (!res.ok) {
          const err = await res.text();
          return { success: false, message: `Gemini Error (${res.status}): ${err.slice(0, 100)}`, latencyMs: elapsed };
        }
        return { success: true, message: `Connected to Google ${model}!`, latencyMs: elapsed };
      }

      // 2. Ollama / OpenAI-compatible endpoint ping
      const baseUrl = this.config.endpoint.replace(/\/+$/, "");
      const chatUrl = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`;

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (this.config.apiKey) headers["Authorization"] = `Bearer ${this.config.apiKey.trim()}`;

      const res = await fetch(chatUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: this.config.model || "llama3.2-vision",
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 5,
        }),
      });

      const elapsed = Math.round(performance.now() - start);
      if (!res.ok) {
        const err = await res.text();
        return { success: false, message: `Endpoint returned ${res.status}: ${err.slice(0, 100)}`, latencyMs: elapsed };
      }
      return { success: true, message: `Connected to ${this.config.model}!`, latencyMs: elapsed };
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - start);
      return {
        success: false,
        message: `Network failure: ${err.message || "Could not reach endpoint"}`,
        latencyMs: elapsed,
      };
    }
  }

  /**
   * Main cognitive loop method:
   * Takes a captured frame (base64 data URL) or video snapshot,
   * runs visual reasoning through Ollama/Gemini/OpenAI/Simulator,
   * with live telemetry context and multi-tool calling capabilities.
   */
  public async analyzeFrame(
    imageBase64: string | null,
    userIntent: string,
    systemPrompt: string,
    availableTools: Array<{ name: string; description: string; parameters: any }>,
    telemetryContext?: RobotTelemetry
  ): Promise<VisionDetectionResult> {
    // Build live telemetry block for deep spatial & hardware awareness
    const telemetryBlock = telemetryContext ? `
[ROBOT PHYSICAL HARDWARE & EMBODIED TELEMETRY]:
- Chassis Architecture: LEGO Mindstorms 51515 / SPIKE Prime (2-Wheel Differential Drive, Track 14cm)
- Active Adapter Mode: ${telemetryContext.adapterMode}
- Battery Level: ${telemetryContext.batteryLevel}%
- Compass Heading (IMU Gyro Yaw): ${telemetryContext.sensors?.gyro?.yaw ?? telemetryContext.pose?.heading ?? 0}°
- Forward Ultrasonic Sensor: ${telemetryContext.sensors?.distanceToWallCm ?? 999} cm to nearest obstacle
- Current Pose: X=${telemetryContext.pose?.x ?? 0}cm, Y=${telemetryContext.pose?.y ?? 0}cm
- Optical Target in View: ${telemetryContext.lastDetectedObject ? `${telemetryContext.lastDetectedObject.label} (Distance: ${telemetryContext.lastDetectedObject.distanceCm}cm, Bearing: ${telemetryContext.lastDetectedObject.bearingDeg ?? 0}°)` : "None"}
` : "";

    const fullSystemPrompt = `You are Brain Brick Robot Cognitive Core — an advanced autonomous Embodied AI robot brain. You control a physical robotic rover built with LEGO Mindstorms 51515 / SPIKE Prime actuators, with an Android smartphone functioning as your head, eyes, speaker, and camera.

${systemPrompt}
${telemetryBlock}

[COGNITIVE OPERATING PRINCIPLES & MULTI-TOOL CALLING]:
1. CRITICAL SAFETY: VOICE & CONVERSATION vs PHYSICAL MOTORS:
   - When the user asks a question, conversational greeting, math problem (e.g. 2+2), or asks for information, YOU MUST USE 'speak_voice' TO ANSWER VERBALLY!
   - NEVER call 'drive_motors' or 'turn_robot' on general questions, dialogue, or math problems! Only actuate motors when the human explicitly asks to move, drive, rotate, patrol, or stop!
   - Combine 'speak_voice' with 'set_robot_eyes' (e.g. happy/focused) for lively robotic presence.
2. MULTI-TOOL EXECUTION: When given compound commands (e.g. "Say hello, calculate turn and rotate 90 degrees left, and look happy"), call ALL relevant tools in logical sequence in a single response turn!
   Tool Roles:
   - Facial Emotion: set_robot_eyes({ mood: "happy"|"focused"|"alert"|"curious"|"neutral", color: "cyan"|"purple"|"emerald"|"amber"|"rose" })
   - Voice Vocalization: speak_voice({ message: string, mood: string })
   - Hardware Sensor Status: query_robot_status({ reason: string })
   - Code & Kinematics Math: execute_code({ code: string, purpose: string })
   - Movement: turn_robot({ degrees: number, direction: "left"|"right" }) or drive_motors({ leftSpeed: number, rightSpeed: number, durationMs: number })
   - Emergency Stop: stop_robot({ reason: string })
3. KINEMATICS SANDBOX: When differential wheel speeds or turning arcs are requested, use execute_code with functions like:
   - calcDifferentialKinematics(linearVelocity, angularVelocityRad, trackWidth)
   - calcArcDrive(radiusCm, speedPercent, trackWidth)
   - calcHeadingDiff(targetDeg, currentDeg)
   - degToRad(degrees)
4. SPATIAL SAFETY: Notice live telemetry: battery (${telemetryContext?.batteryLevel ?? 100}%) and obstacle distance (${telemetryContext?.sensors?.distanceToWallCm ?? 999}cm). If forward distance < 25cm, prioritize warning or obstacle avoidance.
5. TACTICAL REASONING: Provide concise, tactical robotic thoughts.`;

    // 1. If provider is simulator or offline, use deterministic robotics perception
    if (this.config.provider === "simulator" || (!this.config.endpoint && this.config.provider !== "gemini")) {
      return this.simulateVisualReasoning(userIntent, undefined, telemetryContext);
    }

    // 2. Google Gemini API with Native Function Declarations
    if (this.config.provider === "gemini" && this.config.apiKey) {
      try {
        const model = this.config.model || "gemini-2.5-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.config.apiKey.trim()}`;

        const functionDeclarations = availableTools.map((t) => ({
          name: t.name,
          description: t.description,
          parameters: {
            type: "object",
            properties: t.parameters || {},
          },
        }));

        const userParts: any[] = [{ 
          text: `Human Pilot Directive: "${userIntent}". Evaluate the command, live telemetry, and dispatch all necessary tool calls in order.` 
        }];

        if (imageBase64) {
          const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
          userParts.push({
            inline_data: {
              mime_type: "image/jpeg",
              data: cleanBase64,
            },
          });
        }

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: fullSystemPrompt }] },
            contents: [{ role: "user", parts: userParts }],
            tools: [{ function_declarations: functionDeclarations }],
            tool_config: { function_calling_config: { mode: "AUTO" } },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const candidate = data.candidates?.[0];
          const parts = candidate?.content?.parts || [];

          let thought = "";
          const foundToolCalls: StructuredToolCall[] = [];

          for (const p of parts) {
            if (p.text) thought += p.text + " ";
            if (p.functionCall) {
              foundToolCalls.push({
                name: p.functionCall.name,
                arguments: p.functionCall.args || {},
              });
            }
          }

          if (foundToolCalls.length > 0) {
            const toolNames = foundToolCalls.map(t => t.name).join(", ");
            return {
              thought: thought.trim() || `Gemini selected ${foundToolCalls.length} tool(s): [${toolNames}]`,
              targetDetected: true,
              toolCall: foundToolCalls[0],
              toolCalls: foundToolCalls,
            };
          }

          if (thought) {
            return this.parseTextToToolCall(thought, userIntent, telemetryContext);
          }
        } else {
          console.warn(`Gemini HTTP Error ${res.status}:`, await res.text());
        }
      } catch (err: any) {
        console.warn("Gemini reasoning failed, falling back to agentic simulator:", err);
      }
    }

    // 3. Format request for OpenAI-compatible endpoint (Ollama Cloud / OpenRouter / Groq / Local Ollama)
    try {
      const baseUrl = this.config.endpoint.replace(/\/+$/, "");
      const endpointUrl = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`;

      const toolsDefinition = availableTools.map((t) => ({
        type: "function",
        function: {
          name: t.name,
          description: t.description,
          parameters: {
            type: "object",
            properties: t.parameters || {},
          },
        },
      }));

      const contentParts: any[] = [
        {
          type: "text",
          text: `Human Pilot Instruction: "${userIntent}".
You are Brain Brick Robot Cognitive Core.
Execute all necessary tool calls in order (e.g. greeting + turn + face expression).`,
        },
      ];

      // Add image if available
      if (imageBase64) {
        contentParts.push({
          type: "image_url",
          image_url: {
            url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
          },
        });
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (this.config.apiKey) {
        headers["Authorization"] = `Bearer ${this.config.apiKey.trim()}`;
      }

      const response = await fetch(endpointUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: this.config.model || "gemma4:31b-cloud",
          messages: [
            { role: "system", content: fullSystemPrompt },
            { role: "user", content: contentParts },
          ],
          tools: toolsDefinition.length > 0 ? toolsDefinition : undefined,
          tool_choice: toolsDefinition.length > 0 ? "auto" : undefined,
          temperature: 0.2,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`AI Provider Error (${response.status}):`, errorText);
        return this.simulateVisualReasoning(userIntent, `API returned ${response.status}. Using onboard agentic reflex.`, telemetryContext);
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      const message = choice?.message;

      // Check if tool calls were generated
      if (message?.tool_calls && message.tool_calls.length > 0) {
        const allCalls: StructuredToolCall[] = message.tool_calls.map((tc: any) => {
          let args = {};
          try {
            args = typeof tc.function.arguments === "string" ? JSON.parse(tc.function.arguments) : tc.function.arguments;
          } catch {
            args = {};
          }
          return {
            name: tc.function.name,
            arguments: args,
          };
        });

        const firstCall = allCalls[0];
        const toolNames = allCalls.map(t => t.name).join(", ");
        return {
          thought: message.content || `Dispatched ${allCalls.length} tool(s): [${toolNames}]`,
          targetDetected: true,
          targetLabel: (firstCall.arguments as any).target_name || "target_object",
          distanceEstimateCm: (firstCall.arguments as any).distance || 80,
          toolCall: firstCall,
          toolCalls: allCalls,
        };
      }

      // If text only output, parse intent or embedded JSON
      const content = message?.content || "";
      return this.parseTextToToolCall(content, userIntent, telemetryContext);
    } catch (err: any) {
      console.warn("AI Visual inference network failure:", err);
      return this.simulateVisualReasoning(userIntent, `Network error (${err.message || 'offline'}). Simulating reflex.`, telemetryContext);
    }
  }

  /**
   * Enhanced text & JSON parser when model outputs text or structured markdown
   */
  private parseTextToToolCall(content: string, userIntent: string, telemetryContext?: RobotTelemetry): VisionDetectionResult {
    // 1. Try to extract and parse JSON embedded in code blocks or curly braces
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || content.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        let extractedCalls: StructuredToolCall[] = [];

        if (Array.isArray(parsed)) {
          extractedCalls = parsed.filter(item => item.name).map(item => ({
            name: item.name,
            arguments: item.arguments || item.params || item.args || {},
          }));
        } else if (parsed.tool_calls && Array.isArray(parsed.tool_calls)) {
          extractedCalls = parsed.tool_calls.map((tc: any) => ({
            name: tc.function?.name || tc.name,
            arguments: typeof tc.function?.arguments === "string" 
              ? JSON.parse(tc.function.arguments) 
              : tc.function?.arguments || tc.arguments || {},
          }));
        } else if (parsed.tools && Array.isArray(parsed.tools)) {
          extractedCalls = parsed.tools.map((t: any) => ({
            name: t.name,
            arguments: t.arguments || t.args || {},
          }));
        } else if (parsed.name) {
          extractedCalls = [{
            name: parsed.name,
            arguments: parsed.arguments || parsed.args || {},
          }];
        }

        if (extractedCalls.length > 0) {
          return {
            thought: content.replace(/```[\s\S]*?```/g, "").trim() || "Structured JSON tool execution",
            targetDetected: true,
            toolCall: extractedCalls[0],
            toolCalls: extractedCalls,
          };
        }
      } catch {
        // Fall through to heuristic multi-intent parsing
      }
    }

    // 2. Advanced Multi-Intent Heuristic Parsing
    const combined = (content + " " + userIntent).toLowerCase();
    const collectedTools: StructuredToolCall[] = [];

    // Check Eyes / Mood intent
    if (combined.includes("глаз") || combined.includes("eye") || combined.includes("улыб") || combined.includes("счастлив") || combined.includes("happy")) {
      collectedTools.push({
        name: "set_robot_eyes",
        arguments: { mood: "happy", color: "cyan" },
      });
    } else if (combined.includes("злой") || combined.includes("алерт") || combined.includes("alert") || combined.includes("тревог")) {
      collectedTools.push({
        name: "set_robot_eyes",
        arguments: { mood: "alert", color: "rose" },
      });
    }

    // Check Voice / Speech intent
    if (combined.includes("скажи") || combined.includes("speak") || combined.includes("say") || combined.includes("привет") || combined.includes("hello") || combined.includes("поздоровайся") || combined.includes("голос")) {
      let voiceMsg = "Привет, пилот! Я автономный робот Brain Brick, готов к миссиям.";
      if (content && content.length > 0 && content.length < 150 && !content.includes("{")) {
        voiceMsg = content.trim();
      }
      collectedTools.push({
        name: "speak_voice",
        arguments: {
          message: voiceMsg,
          mood: "happy",
        },
      });
    }

    // Check Hardware Telemetry Status query
    if (combined.includes("статус") || combined.includes("сенсор") || combined.includes("батаре") || combined.includes("battery") || combined.includes("status") || combined.includes("telemetry") || combined.includes("проверь")) {
      collectedTools.push({
        name: "query_robot_status",
        arguments: { reason: "Pilot telemetry inspection" },
      });
    }

    // Check Math / Kinematics Code intent
    if (combined.includes("кинематик") || combined.includes("kinematic") || combined.includes("посчитай") || combined.includes("вычисли") || combined.includes("код") || combined.includes("calculate") || combined.includes("math")) {
      collectedTools.push({
        name: "execute_code",
        arguments: {
          code: "calcDifferentialKinematics(65, degToRad(45), 14)",
          purpose: "Evaluate left and right differential wheel speeds for 45° rotation vector",
        },
      });
    }

    // Check Turning / Heading rotation intent
    if (combined.includes("left") || combined.includes("налево") || combined.includes("влево")) {
      const degMatch = combined.match(/(\d+)\s*(?:град|deg|°)?/);
      const deg = degMatch ? parseInt(degMatch[1], 10) : 45;
      collectedTools.push({
        name: "turn_robot",
        arguments: { degrees: deg, direction: "left" },
      });
    } else if (combined.includes("right") || combined.includes("направо") || combined.includes("вправо")) {
      const degMatch = combined.match(/(\d+)\s*(?:град|deg|°)?/);
      const deg = degMatch ? parseInt(degMatch[1], 10) : 45;
      collectedTools.push({
        name: "turn_robot",
        arguments: { degrees: deg, direction: "right" },
      });
    }

    // Check Emergency Stop intent
    if (combined.includes("стоп") || combined.includes("stop") || combined.includes("halt") || combined.includes("остановись")) {
      collectedTools.push({
        name: "stop_robot",
        arguments: { reason: "Pilot emergency halt command" },
      });
    }

    // Check Forward / Drive intent with pre-acceleration distance check
    if (combined.includes("вперед") || combined.includes("forward") || combined.includes("drive") || combined.includes("едь") || combined.includes("поехали")) {
      const clearance = telemetryContext?.sensors?.distanceToWallCm ?? 999;
      const trajectory = calculateSafeDriveTrajectory(55, 50, clearance);
      if (!trajectory.isSafe) {
        collectedTools.push({
          name: "set_robot_eyes",
          arguments: { mood: "alert", color: "rose" },
        });
        collectedTools.push({
          name: "speak_voice",
          arguments: { message: trajectory.spokenAnnouncement, mood: "alert" },
        });
      } else {
        collectedTools.push({
          name: "set_robot_eyes",
          arguments: { mood: "focused", color: "cyan" },
        });
        collectedTools.push({
          name: "drive_motors",
          arguments: { leftSpeed: trajectory.safeSpeedPercent, rightSpeed: trajectory.safeSpeedPercent, durationMs: trajectory.durationMs, reason: trajectory.reason },
        });
        collectedTools.push({
          name: "speak_voice",
          arguments: { message: trajectory.spokenAnnouncement, mood: "focused" },
        });
      }
    }

    if (collectedTools.length > 0) {
      return {
        thought: content || `Cognitive heuristic identified ${collectedTools.length} action(s).`,
        targetDetected: true,
        toolCall: collectedTools[0],
        toolCalls: collectedTools,
      };
    }

    // Default Fallback: If model returned text/thought, SPEAK IT! DO NOT ACTUATE MOTORS!
    if (content && content.trim()) {
      return {
        thought: content.trim(),
        targetDetected: false,
        toolCall: {
          name: "speak_voice",
          arguments: { message: content.trim(), mood: "happy" },
        },
        toolCalls: [
          { name: "set_robot_eyes", arguments: { mood: "happy", color: "cyan" } },
          { name: "speak_voice", arguments: { message: content.trim(), mood: "happy" } },
        ],
      };
    }

    // Default Fallback: Safe standby
    return {
      thought: "Cognitive core standing by safely. No motor movement requested.",
      targetDetected: false,
      toolCall: {
        name: "speak_voice",
        arguments: { message: "Команду принял, нахожусь в режиме ожидания.", mood: "neutral" },
      },
      toolCalls: [
        { name: "set_robot_eyes", arguments: { mood: "focused", color: "cyan" } },
        { name: "speak_voice", arguments: { message: "Команду принял, нахожусь в режиме ожидания.", mood: "neutral" } },
      ],
    };
  }

  /**
   * Deterministic local agentic simulator when no external API or offline
   */
  public simulateVisualReasoning(userIntent: string, note?: string, telemetryContext?: RobotTelemetry): VisionDetectionResult {
    const lower = userIntent.toLowerCase();
    const collectedTools: StructuredToolCall[] = [];

    // 0. Fast Arithmetic / Math Check (e.g. 2 + 2, два плюс два)
    const mathSol = trySolveMath(userIntent);
    if (mathSol) {
      return {
        thought: `Calculated arithmetic: ${mathSol.expression} = ${mathSol.result}`,
        targetDetected: false,
        toolCall: { name: "speak_voice", arguments: { message: mathSol.spoken, mood: "happy" } },
        toolCalls: [
          { name: "set_robot_eyes", arguments: { mood: "happy", color: "emerald" } },
          { name: "speak_voice", arguments: { message: mathSol.spoken, mood: "happy" } },
        ],
      };
    }

    // 1. Compound / Multi-tool Greetings
    const isGreeting = lower.includes("привет") || lower.includes("hello") || lower.includes("поздоровайся") || lower.includes("голос") || lower.includes("speak") || lower.includes("say");
    const isEyes = lower.includes("глаз") || lower.includes("улыб") || lower.includes("счастлив") || lower.includes("happy");
    const isTurnLeft = lower.includes("left") || lower.includes("налево") || lower.includes("влево");
    const isTurnRight = lower.includes("right") || lower.includes("направо") || lower.includes("вправо");
    const isStatus = lower.includes("статус") || lower.includes("сенсор") || lower.includes("батаре") || lower.includes("status");
    const isMath = lower.includes("кинематик") || lower.includes("kinematic") || lower.includes("посчитай") || lower.includes("вычисли") || lower.includes("код");

    if (isEyes) {
      collectedTools.push({
        name: "set_robot_eyes",
        arguments: { mood: "happy", color: "cyan" },
      });
    }

    if (isGreeting) {
      const messages = [
        "Привет, пилот! Я робот Brain Brick с искусственным интеллектом. Готов исследовать пространство!",
        "Система на связи! Моторы сопряжены, камера калибрована, готов принимать команды.",
        "Приветствую! Все когнитивные контуры в норме. Какой сектор исследуем?",
      ];
      collectedTools.push({
        name: "speak_voice",
        arguments: {
          message: messages[Math.floor(Math.random() * messages.length)],
          mood: "happy",
        },
      });
    }

    if (isStatus) {
      collectedTools.push({
        name: "query_robot_status",
        arguments: { reason: "Pilot inspection query" },
      });
    }

    if (isMath) {
      collectedTools.push({
        name: "execute_code",
        arguments: {
          code: "calcDifferentialKinematics(70, degToRad(45), 14)",
          purpose: "Differential drive kinematics: track width 14cm, linear velocity 70%, angular velocity 45°/s",
        },
      });
    }

    if (isTurnLeft) {
      const degMatch = lower.match(/(\d+)\s*(?:град|deg|°)?/);
      const deg = degMatch ? parseInt(degMatch[1], 10) : 45;
      collectedTools.push({
        name: "turn_robot",
        arguments: { degrees: deg, direction: "left" },
      });
    } else if (isTurnRight) {
      const degMatch = lower.match(/(\d+)\s*(?:град|deg|°)?/);
      const deg = degMatch ? parseInt(degMatch[1], 10) : 45;
      collectedTools.push({
        name: "turn_robot",
        arguments: { degrees: deg, direction: "right" },
      });
    }

    // Emergency Stop
    if (lower.includes("стоп") || lower.includes("stop") || lower.includes("halt")) {
      return {
        thought: "Emergency halt order received. Cutting actuator power.",
        targetDetected: false,
        toolCall: { name: "stop_robot", arguments: { reason: "Pilot voice order" } },
        toolCalls: [
          { name: "stop_robot", arguments: { reason: "Pilot voice order" } },
          { name: "speak_voice", arguments: { message: "Полная остановка моторов выполнена.", mood: "alert" } },
        ],
      };
    }

    if (collectedTools.length > 0) {
      return {
        thought: note 
          ? `${note} Onboard reflex triggered ${collectedTools.length} tool(s).`
          : `Dispatched multi-tool sequence: [${collectedTools.map(t => t.name).join(", ")}].`,
        targetDetected: false,
        toolCall: collectedTools[0],
        toolCalls: collectedTools,
      };
    }

    // Conversational questions (DO NOT ACTUATE MOTORS!)
    const isQuestion = lower.includes("?") || lower.includes("что") || lower.includes("кто") || lower.includes("как") || lower.includes("почему") || lower.includes("сколько") || lower.includes("где") || lower.includes("шутк") || lower.includes("анекдот");
    const isMovementExplicit = lower.includes("вперед") || lower.includes("назад") || lower.includes("влево") || lower.includes("вправо") || lower.includes("едь") || lower.includes("поехали") || lower.includes("кружись") || lower.includes("найди") || lower.includes("ищи") || lower.includes("поиск");

    if (isQuestion && !isMovementExplicit) {
      let reply = "Все системы в порядке! Батарея заряжена, сенсоры откалиброваны.";
      if (lower.includes("кто ты")) reply = "Я бортовой интеллект Brain Brick. Мой телефон видит и думает, а шасси слушает команды!";
      else if (lower.includes("что ты умеешь")) reply = "Я умею перемещаться, распознавать предметы через камеру, говорить и решать математику.";
      else if (lower.includes("шутк") || lower.includes("анекдот")) reply = "Шутка: Спросили у робота, почему он не спит. Он ответил: Боюсь пропустить обновление прошивки!";
      else if (lower.includes("как дела")) reply = "Отлично! Все сенсоры в зеленой зоне, готов к новым миссиям.";

      return {
        thought: `Answered conversational pilot inquiry: "${userIntent}"`,
        targetDetected: false,
        toolCall: { name: "speak_voice", arguments: { message: reply, mood: "happy" } },
        toolCalls: [
          { name: "set_robot_eyes", arguments: { mood: "happy", color: "cyan" } },
          { name: "speak_voice", arguments: { message: reply, mood: "happy" } },
        ],
      };
    }

    // Red Cube / Optical Tracking ONLY when user explicitly asks for search/patrol
    if (isMovementExplicit) {
      const clearance = telemetryContext?.sensors?.distanceToWallCm ?? 999;
      const trajectory = calculateSafeDriveTrajectory(55, 50, clearance);

      if (!trajectory.isSafe) {
        return {
          thought: `EMBODIED SAFETY: Clearance hazard (${clearance}cm). Pre-acceleration calculation halted forward thrust.`,
          targetDetected: false,
          toolCall: { name: "speak_voice", arguments: { message: trajectory.spokenAnnouncement, mood: "alert" } },
          toolCalls: [
            { name: "set_robot_eyes", arguments: { mood: "alert", color: "rose" } },
            { name: "speak_voice", arguments: { message: trajectory.spokenAnnouncement, mood: "alert" } },
          ],
        };
      }

      const isCubeHunt = lower.includes("cube") || lower.includes("куб") || lower.includes("find") || lower.includes("найди") || lower.includes("ищи");
      const bearing = Math.round((Math.random() * 20 - 10) * 10) / 10;

      return {
        thought: note 
          ? `${note} Onboard vision tracker detected optical centroid at bearing ${bearing}°. Safe trajectory calculated: ${trajectory.safeDistanceCm}cm.`
          : `Optical centroid acquired in central camera quadrant. Target bearing: ${bearing}°. Safe trajectory calculated: ${trajectory.safeDistanceCm}cm clearance.`,
        targetDetected: true,
        targetLabel: isCubeHunt ? "red_cube" : "target_marker",
        distanceEstimateCm: trajectory.safeDistanceCm,
        bearingDeg: bearing,
        toolCall: {
          name: "drive_motors",
          arguments: { leftSpeed: trajectory.safeSpeedPercent, rightSpeed: trajectory.safeSpeedPercent, durationMs: trajectory.durationMs, reason: trajectory.reason },
        },
        toolCalls: [
          { name: "set_robot_eyes", arguments: { mood: "focused", color: "cyan" } },
          { name: "scan_visual_environment", arguments: { targetObject: isCubeHunt ? "red cube" : "marker" } },
          { name: "drive_motors", arguments: { leftSpeed: trajectory.safeSpeedPercent, rightSpeed: trajectory.safeSpeedPercent, durationMs: trajectory.durationMs, reason: trajectory.reason } },
          { name: "speak_voice", arguments: { message: trajectory.spokenAnnouncement, mood: "focused" } },
        ],
      };
    }

    // Default safe standing by (DO NOT DRIVE MOTORS!)
    return {
      thought: `Received directive: "${userIntent}". Standing by safely without motor actuation.`,
      targetDetected: false,
      toolCall: {
        name: "speak_voice",
        arguments: { message: "Команду принял, ожидаю указаний.", mood: "neutral" },
      },
      toolCalls: [
        { name: "set_robot_eyes", arguments: { mood: "focused", color: "cyan" } },
        { name: "speak_voice", arguments: { message: "Команду принял, ожидаю указаний.", mood: "neutral" } },
      ],
    };
  }
}

export const aiVisionService = new AIVisionService();
