import { Capacitor } from "@capacitor/core";
import { Purchases } from "@revenuecat/purchases-capacitor";
import type { UserSubscriptionState, SubscriptionTier, PilotProfile } from "../types";

const SUB_STORAGE_KEY = "brainbrick_subscription_v1";
const PROFILE_STORAGE_KEY = "brainbrick_pilot_profile_v1";

export const getRevenueCatApiKey = (): string => {
  if (Capacitor.getPlatform() === "android") {
    return import.meta.env.VITE_REVENUECAT_ANDROID_KEY || "goog_BrainBricksShipathon2026Key";
  }
  if (Capacitor.getPlatform() === "ios") {
    return import.meta.env.VITE_REVENUECAT_IOS_KEY || "appl_BrainBricksShipathon2026Key";
  }
  return import.meta.env.VITE_REVENUECAT_API_KEY || "test_JYKrCLHXORsLhlcsKDMeGdSdurN";
};

export const REVENUECAT_API_KEY = getRevenueCatApiKey();
export const PRO_ENTITLEMENT = "BrainBricks Pro";
export const HARDWARE_ENTITLEMENT = "hardware_unlocked";

export interface IAPProductPackage {
  id: string;
  name: string;
  price: string;
  priceNum: number;
  period?: "month" | "year" | "lifetime" | "consumable";
  category: "subscription" | "bricks" | "lifetime";
  badge?: string;
  description: string;
  bricksIncluded?: number;
  features: string[];
}

export const AVAILABLE_IAP_PACKAGES: IAPProductPackage[] = [
  // 1. Subscriptions
  {
    id: "monthly_pro",
    name: "Brain Brick PRO Monthly",
    price: "$9.99",
    priceNum: 9.99,
    period: "month",
    category: "subscription",
    description: "Полный доступ к премиальному NPU-интеллекту Gemini и облачной синхронизации.",
    bricksIncluded: 500,
    features: [
      "Gemini 2.5 Flash & Robotics-ER 2 без очередей",
      "Неограниченный синтез навыков Skill Forge",
      "Захват 3D/2D виртуальной арены для ИИ",
      "Облачная синхронизация между устройствами",
      "+500 🧱 Bricks бонус каждый месяц",
    ],
  },
  {
    id: "annual_pro",
    name: "Brain Brick PRO Annual",
    price: "$79.99",
    priceNum: 79.99,
    period: "year",
    category: "subscription",
    badge: "Экономия 33% • 7 Дней Триал",
    description: "Годовой флагманский доступ для активных робототехников и мейкеров.",
    bricksIncluded: 2000,
    features: [
      "Все возможности PRO на 12 месяцев",
      "7 дней бесплатного пробного периода",
      "Приоритетный доступ к новым моделям Google",
      "VIP статус в сообществе пилотов",
      "+2,000 🧱 Bricks бонус сразу при активации",
    ],
  },

  // 2. Consumable Bricks Packs
  {
    id: "bricks_500",
    name: "Starter Stash",
    price: "$2.99",
    priceNum: 2.99,
    period: "consumable",
    category: "bricks",
    description: "Хватит на покупку 2 готовых проверенных роботов на маркетплейсе.",
    bricksIncluded: 500,
    features: [
      "500 🧱 Bricks на баланс",
      "Покупка чертежей на Маркетплейсе",
      "Чаевые создателям крутых роботов",
    ],
  },
  {
    id: "bricks_1500",
    name: "Architect Vault",
    price: "$6.99",
    priceNum: 6.99,
    period: "consumable",
    category: "bricks",
    badge: "🔥 Самый популярный",
    description: "Оптимальный пакет для сборки собственного флота роботов.",
    bricksIncluded: 1700,
    features: [
      "1,500 + 200 Бонус 🧱 Bricks",
      "Покупка эксклюзивных моделей и промптов",
      "Публикация собственных сборок",
    ],
  },
  {
    id: "bricks_5000",
    name: "Cyber Fleet Hoard",
    price: "$19.99",
    priceNum: 19.99,
    period: "consumable",
    category: "bricks",
    badge: "Максимальная выгода",
    description: "Для хакатонов, команд, лабораторий и образовательных клубов.",
    bricksIncluded: 6000,
    features: [
      "5,000 + 1,000 Бонус 🧱 Bricks",
      "Неограниченные покупки на Маркетплейсе",
      "Финансирование открытых робо-проектов",
    ],
  },

  // 3. One-Time Lifetime Unlocks
  {
    id: "hardware_license",
    name: "LEGO LWP3 Hardware License",
    price: "$14.99",
    priceNum: 14.99,
    period: "lifetime",
    category: "lifetime",
    description: "Пожизненный Bluetooth LWP3-драйвер для реальных хабов без подписки.",
    features: [
      "Пожизненное BLE-управление LEGO 51515 и SPIKE Prime",
      "Поддержка микроконтроллеров ESP32 и Arduino",
      "Прямой опрос датчиков без ограничений",
      "Никаких ежемесячных списаний",
    ],
  },
  {
    id: "lifetime_founder",
    name: "Shipathon Founder Pass",
    price: "$99.99",
    priceNum: 99.99,
    period: "lifetime",
    category: "lifetime",
    badge: "👑 Limited Edition",
    description: "Все функции Brain Brick PRO и драйверы железа навсегда.",
    bricksIncluded: 3000,
    features: [
      "Все Pro-функции навсегда без подписок",
      "Пожизненный драйвер любого оборудования",
      "Золотой бейдж Founder в паспорте пилота",
      "+3,000 🧱 Bricks стартовый капитал",
    ],
  },
];

const DEFAULT_SUBSCRIPTION: UserSubscriptionState = {
  tier: "free",
  isProActive: false,
  expirationDate: null,
  entitlements: ["basic_builds", "mock_simulator", "standard_ai", "base_model_gemma_4_31b"],
};

const DEFAULT_PROFILE: PilotProfile = {
  id: "pilot-beknur-01",
  username: "Beknur",
  callsign: "Cortex Lead",
  email: "beknur@brainbrick.ai",
  bricksBalance: 750,
  missionsCompleted: 14,
  rank: "Master Architect",
};

export class SubscriptionService {
  private configured: boolean = false;

  async init(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    if (this.configured) return;
    try {
      const apiKey = getRevenueCatApiKey();
      await Purchases.configure({ apiKey });
      this.configured = true;
      console.log(`[RevenueCat] Real Native Purchases SDK initialized for ${Capacitor.getPlatform()}`);
    } catch (e) {
      console.warn("[RevenueCat] Configure error:", e);
    }
  }

  getSubscription(): UserSubscriptionState {
    try {
      const raw = localStorage.getItem(SUB_STORAGE_KEY);
      return raw ? JSON.parse(raw) : DEFAULT_SUBSCRIPTION;
    } catch {
      return DEFAULT_SUBSCRIPTION;
    }
  }

  getProfile(): PilotProfile {
    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  }

  saveProfile(profile: PilotProfile): void {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("brainbrick:profile_updated", { detail: profile }));
    }
  }

  updateProfile(partial: Partial<PilotProfile>): PilotProfile {
    const p = { ...this.getProfile(), ...partial };
    this.saveProfile(p);
    return p;
  }

  addBricks(amount: number): number {
    const p = this.getProfile();
    p.bricksBalance += amount;
    this.saveProfile(p);
    return p.bricksBalance;
  }

  spendBricks(amount: number): boolean {
    const p = this.getProfile();
    if (p.bricksBalance < amount) return false;
    p.bricksBalance -= amount;
    this.saveProfile(p);
    return true;
  }

  /**
   * Universal Package Purchase (Monthly, Annual, Bricks Packs, Lifetime)
   * Dispatches via RevenueCat on native iOS/Android, with clean Web sandbox fallback.
   */
  async purchasePackage(packageId: string): Promise<{ success: boolean; message: string; isPro?: boolean; bricksAdded?: number }> {
    const pkg = AVAILABLE_IAP_PACKAGES.find(p => p.id === packageId);
    if (!pkg) {
      return { success: false, message: `Package ${packageId} not found` };
    }

    // 1. Native RevenueCat Flow
    if (Capacitor.isNativePlatform()) {
      try {
        const { products } = await Purchases.getProducts({ productIdentifiers: [packageId] });
        if (products.length > 0) {
          const { customerInfo } = await Purchases.purchaseStoreProduct({ product: products[0] });
          const isPro = !!customerInfo.entitlements.active[PRO_ENTITLEMENT];
          
          if (pkg.category === "subscription" || pkg.category === "lifetime") {
            this.setTier(pkg.period === "lifetime" ? "lifetime" : "pro");
          }
          if (pkg.bricksIncluded) {
            this.addBricks(pkg.bricksIncluded);
          }
          return {
            success: true,
            message: `Покупка ${pkg.name} успешно завершена!`,
            isPro: isPro || pkg.category === "subscription",
            bricksAdded: pkg.bricksIncluded,
          };
        }
      } catch (err: any) {
        if (err?.userCancelled) {
          return { success: false, message: "Покупка отменена пользователем" };
        }
        console.warn("[RevenueCat] Native purchase error, using sandbox flow:", err);
      }
    }

    // 2. Web / Demo Sandbox Processing
    if (pkg.id === "monthly_pro") {
      this.setTier("pro", 30);
      this.addBricks(pkg.bricksIncluded || 500);
      return {
        success: true,
        message: "Brain Brick PRO (1 месяц) активирован! +500 🧱 начислено на баланс.",
        isPro: true,
        bricksAdded: 500,
      };
    }

    if (pkg.id === "annual_pro") {
      this.setTier("pro", 365);
      this.addBricks(pkg.bricksIncluded || 2000);
      return {
        success: true,
        message: "Brain Brick PRO (1 год) активирован! +2,000 🧱 начислено на баланс.",
        isPro: true,
        bricksAdded: 2000,
      };
    }

    if (pkg.id === "lifetime_founder") {
      this.setTier("lifetime");
      this.addBricks(pkg.bricksIncluded || 3000);
      return {
        success: true,
        message: "Shipathon Founder Pass навсегда разблокирован! +3,000 🧱 начислено.",
        isPro: true,
        bricksAdded: 3000,
      };
    }

    if (pkg.id === "hardware_license") {
      const sub = this.getSubscription();
      if (!sub.entitlements.includes(HARDWARE_ENTITLEMENT)) {
        sub.entitlements.push(HARDWARE_ENTITLEMENT);
        localStorage.setItem(SUB_STORAGE_KEY, JSON.stringify(sub));
      }
      return {
        success: true,
        message: "LEGO LWP3 Hardware License успешно активирована навсегда!",
        isPro: sub.isProActive,
      };
    }

    // Bricks consumable packs
    if (pkg.category === "bricks") {
      const added = pkg.bricksIncluded || 500;
      this.addBricks(added);
      return {
        success: true,
        message: `Пакет ${pkg.name} куплен! +${added} 🧱 зачислено на баланс.`,
        bricksAdded: added,
      };
    }

    return { success: true, message: "Покупка успешно завершена!" };
  }

  async purchaseProMonthly(): Promise<boolean> {
    const res = await this.purchasePackage("monthly_pro");
    return res.success;
  }

  async restorePurchases(): Promise<{ success: boolean; isPro: boolean }> {
    if (Capacitor.isNativePlatform()) {
      try {
        const { customerInfo } = await Purchases.restorePurchases();
        const isPro = !!customerInfo.entitlements.active[PRO_ENTITLEMENT];
        if (isPro) {
          this.setTier("pro");
          return { success: true, isPro: true };
        }
        return { success: true, isPro: false };
      } catch (err) {
        console.warn("[RevenueCat] Native restore failed:", err);
        return { success: false, isPro: false };
      }
    }

    // Web / Sandbox restore
    const sub = this.getSubscription();
    return { success: true, isPro: sub.isProActive };
  }

  setTier(tier: SubscriptionTier, days: number = 30): void {
    const state: UserSubscriptionState = {
      tier,
      isProActive: tier === "pro" || tier === "lifetime",
      expirationDate: tier === "lifetime" ? null : new Date(Date.now() + days * 86400000).toISOString(),
      entitlements: (tier === "pro" || tier === "lifetime")
        ? ["basic_builds", "mock_simulator", "pro_models", "cloud_sync", "advanced_mcp", "gemini_3.8_flash_pro", "gemini_robotics_er_2_pro", HARDWARE_ENTITLEMENT]
        : ["basic_builds", "mock_simulator", "standard_ai", "base_model_gemma_4_31b"],
    };
    localStorage.setItem(SUB_STORAGE_KEY, JSON.stringify(state));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("brainbrick:subscription_updated", { detail: state }));
    }
  }
}

export const subscriptionService = new SubscriptionService();
