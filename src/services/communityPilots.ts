export interface PilotGearItem {
  id: string;
  name: string;
  type: "hub" | "sensor" | "actuator" | "vision";
  rarity: "legendary" | "epic" | "rare" | "common";
  icon: string;
}

export interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4; // 0 = empty, 4 = max activity
}

export interface CommunityPilot {
  username: string;
  callsign: string;
  bio: string;
  avatar: string;
  level: number;
  rank: string;
  affiliation: string;
  location: string;
  joinedDate: string;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  liveStatus: {
    activity: "Testing in 2D Arena" | "Synthesizing AI Manifest" | "Operating LEGO 51515" | "Idle in Cockpit";
    isOnline: boolean;
    currentBuildName?: string;
  };
  gearInventory: PilotGearItem[];
  huggingFaceStats: {
    robotModels: number;
    promptBehaviors: number;
    mcpTools: number;
    totalForks: number;
    totalStars: number;
  };
  contributions: ContributionDay[];
  publishedBuildIds: string[];
}

// Generate realistic GitHub-style contribution squares for the last 14 weeks (98 days)
function generateHeatmap(seedMultiplier: number): ContributionDay[] {
  const days: ContributionDay[] = [];
  const now = new Date();
  
  for (let i = 97; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    
    // Pseudo-random pseudo-deterministic distribution
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseVal = Math.sin(i * 0.4 + seedMultiplier) * 0.5 + 0.5;
    const rand = (baseVal + (isWeekend ? 0.2 : 0.4)) % 1;
    
    let count = 0;
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    
    if (rand > 0.75) {
      count = Math.floor(rand * 8) + 1;
      level = count > 5 ? 4 : count > 3 ? 3 : count > 1 ? 2 : 1;
    } else if (rand > 0.5) {
      count = Math.floor(rand * 3) + 1;
      level = 1;
    }
    
    days.push({ date: dateStr, count, level });
  }
  return days;
}

const INITIAL_PILOTS: Record<string, CommunityPilot> = {
  Beknur: {
    username: "Beknur",
    callsign: "Founder-01",
    bio: "15 y.o. Robotics creator from Astana • LEGO 51515 + Android AI brain • Building Brain Brick for RevenueCat Shipathon 2026",
    avatar: "🤖",
    level: 8,
    rank: "Grandmaster Engineer",
    affiliation: "Brain Brick Labs",
    location: "Astana, Kazakhstan",
    joinedDate: "Sept 2026",
    followersCount: 142,
    followingCount: 19,
    isFollowing: false,
    liveStatus: {
      activity: "Operating LEGO 51515",
      isOnline: true,
      currentBuildName: "Red Cube Hunter",
    },
    gearInventory: [
      { id: "g-1", name: "LEGO Mindstorms 51515 Hub", type: "hub", rarity: "legendary", icon: "🤖" },
      { id: "g-2", name: "Snapdragon NPU Vision Suite", type: "vision", rarity: "legendary", icon: "👁️" },
      { id: "g-3", name: "Ultrasonic Sonar Sensor (S1)", type: "sensor", rarity: "epic", icon: "📡" },
      { id: "g-4", name: "Dual Optical Differential Motors", type: "actuator", rarity: "rare", icon: "⚙️" },
    ],
    huggingFaceStats: {
      robotModels: 4,
      promptBehaviors: 3,
      mcpTools: 2,
      totalForks: 384,
      totalStars: 412,
    },
    contributions: generateHeatmap(1.5),
    publishedBuildIds: ["build-red-cube-hunter", "prompt-red-hunter-vision", "mcp-differential-drive"],
  },
  Elena_Robo: {
    username: "Elena_Robo",
    callsign: "SensorWiz",
    bio: "Autonomous perception engineer • Specializing in ultrasonic perimeter guards & cautious navigation prompts",
    avatar: "🧠",
    level: 7,
    rank: "Perception Specialist",
    affiliation: "CyberPerception Guild",
    location: "Zurich, Switzerland",
    joinedDate: "Aug 2026",
    followersCount: 98,
    followingCount: 34,
    isFollowing: false,
    liveStatus: {
      activity: "Testing in 2D Arena",
      isOnline: true,
      currentBuildName: "Cautious Explorer",
    },
    gearInventory: [
      { id: "g-5", name: "ESP32-S3 Dual-Core MCU", type: "hub", rarity: "epic", icon: "⚡" },
      { id: "g-6", name: "Omni LiDAR 360 Scanner", type: "sensor", rarity: "legendary", icon: "🌐" },
      { id: "g-7", name: "Stereo Depth Camera", type: "vision", rarity: "rare", icon: "📷" },
    ],
    huggingFaceStats: {
      robotModels: 2,
      promptBehaviors: 5,
      mcpTools: 1,
      totalForks: 219,
      totalStars: 285,
    },
    contributions: generateHeatmap(2.3),
    publishedBuildIds: ["prompt-cautious-explorer"],
  },
  TokyoMech: {
    username: "TokyoMech",
    callsign: "KinematicKing",
    bio: "Industrial robotic arms & inverse kinematics solver • MicroPython firmware enthusiast",
    avatar: "🏎️",
    level: 9,
    rank: "Kinematics Architect",
    affiliation: "Tokyo Mech Labs",
    location: "Tokyo, Japan",
    joinedDate: "July 2026",
    followersCount: 312,
    followingCount: 42,
    isFollowing: true,
    liveStatus: {
      activity: "Synthesizing AI Manifest",
      isOnline: true,
      currentBuildName: "Titan Claw Manipulator",
    },
    gearInventory: [
      { id: "g-8", name: "Custom 3-DOF Arm Chassis", type: "actuator", rarity: "legendary", icon: "🦾" },
      { id: "g-9", name: "Torque Feedback Servo Bus", type: "actuator", rarity: "epic", icon: "⚡" },
      { id: "g-10", name: "High-Speed MicroPython Core", type: "hub", rarity: "rare", icon: "💻" },
    ],
    huggingFaceStats: {
      robotModels: 5,
      promptBehaviors: 2,
      mcpTools: 4,
      totalForks: 540,
      totalStars: 680,
    },
    contributions: generateHeatmap(3.7),
    publishedBuildIds: ["build-titan-claw", "mcp-titan-gripper"],
  },
  Alex_Builder: {
    username: "Alex_Builder",
    callsign: "HardwareMod",
    bio: "Hardware hacker • Custom 3D printed rover bodies & cheap Bluetooth microcontroller integration",
    avatar: "⚡",
    level: 5,
    rank: "Junior Fabricator",
    affiliation: "OpenRobotics Community",
    location: "Austin, Texas",
    joinedDate: "Aug 2026",
    followersCount: 45,
    followingCount: 52,
    isFollowing: false,
    liveStatus: {
      activity: "Idle in Cockpit",
      isOnline: false,
    },
    gearInventory: [
      { id: "g-11", name: "Arduino Nano BLE Sense", type: "hub", rarity: "common", icon: "🔌" },
      { id: "g-12", name: "Infrared Line Tracker Bar", type: "sensor", rarity: "common", icon: "〰️" },
    ],
    huggingFaceStats: {
      robotModels: 1,
      promptBehaviors: 1,
      mcpTools: 0,
      totalForks: 42,
      totalStars: 67,
    },
    contributions: generateHeatmap(0.9),
    publishedBuildIds: [],
  },
  CyberMeow: {
    username: "CyberMeow",
    callsign: "NeuralCat",
    bio: "Building cute autonomous pet robots with emotive animated screen eyes & purr frequencies",
    avatar: "🐱",
    level: 6,
    rank: "Bionic Designer",
    affiliation: "Kawaiibotics",
    location: "Seoul, South Korea",
    joinedDate: "Sept 2026",
    followersCount: 88,
    followingCount: 20,
    isFollowing: false,
    liveStatus: {
      activity: "Testing in 2D Arena",
      isOnline: true,
      currentBuildName: "Cyber Cat Patrol",
    },
    gearInventory: [
      { id: "g-13", name: "OLED Cybernetic Eye Display", type: "vision", rarity: "epic", icon: "👀" },
      { id: "g-14", name: "Stereo Purr Audio Actuator", type: "actuator", rarity: "rare", icon: "🔊" },
    ],
    huggingFaceStats: {
      robotModels: 3,
      promptBehaviors: 2,
      mcpTools: 1,
      totalForks: 175,
      totalStars: 230,
    },
    contributions: generateHeatmap(4.2),
    publishedBuildIds: [],
  },
};

const STORAGE_KEY = "brainbrick_community_pilots_v1";

export const pilotDirectory = {
  getAllPilots(): CommunityPilot[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return Object.values(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
    return Object.values(INITIAL_PILOTS);
  },

  getPilot(username: string): CommunityPilot {
    const all = this.getAllPilots();
    const found = all.find(
      (p) => p.username.toLowerCase() === username.toLowerCase()
    );
    if (found) return found;

    // Dynamically generate a placeholder profile for any custom handle
    return {
      username: username,
      callsign: `${username}-Pilot`,
      bio: `Autonomous robotics enthusiast and Brain Brick community member.`,
      avatar: "🤖",
      level: 3,
      rank: "Autonomous Pilot",
      affiliation: "Robotics Network",
      location: "Earth Orbit",
      joinedDate: "Sept 2026",
      followersCount: 12,
      followingCount: 8,
      isFollowing: false,
      liveStatus: {
        activity: "Idle in Cockpit",
        isOnline: false,
      },
      gearInventory: [
        { id: `g-${username}-1`, name: "Standard Microcontroller Hub", type: "hub", rarity: "common", icon: "⚡" },
        { id: `g-${username}-2`, name: "Camera Vision Sensor", type: "vision", rarity: "rare", icon: "📷" },
      ],
      huggingFaceStats: {
        robotModels: 1,
        promptBehaviors: 1,
        mcpTools: 0,
        totalForks: 5,
        totalStars: 9,
      },
      contributions: generateHeatmap(username.length),
      publishedBuildIds: [],
    };
  },

  toggleFollow(username: string): boolean {
    const pilotsMap: Record<string, CommunityPilot> = {};
    this.getAllPilots().forEach((p) => {
      pilotsMap[p.username] = p;
    });

    let target = pilotsMap[username];
    if (!target) {
      target = this.getPilot(username);
      pilotsMap[username] = target;
    }

    target.isFollowing = !target.isFollowing;
    target.followersCount = target.isFollowing 
      ? target.followersCount + 1 
      : Math.max(0, target.followersCount - 1);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pilotsMap));
    } catch {
      // ignore
    }

    return target.isFollowing;
  },

  syncUserPilot(pilotData: { username: string; callsign: string; email: string; bricks: number }): void {
    const pilotsMap: Record<string, CommunityPilot> = {};
    this.getAllPilots().forEach((p) => {
      pilotsMap[p.username] = p;
    });

    if (pilotsMap[pilotData.username]) {
      pilotsMap[pilotData.username].callsign = pilotData.callsign;
    } else {
      pilotsMap[pilotData.username] = {
        ...INITIAL_PILOTS.Beknur,
        username: pilotData.username,
        callsign: pilotData.callsign,
      };
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pilotsMap));
    } catch {
      // ignore
    }
  }
};
