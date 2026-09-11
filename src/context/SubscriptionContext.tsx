import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { UserSubscriptionState, SubscriptionTier, PilotProfile } from "../types";
import { subscriptionService } from "../services/subscriptionService";

interface SubscriptionContextType {
  subscription: UserSubscriptionState;
  profile: PilotProfile;
  pilot: PilotProfile;
  isPro: boolean;
  tier: SubscriptionTier;
  upgradeToPro: () => Promise<boolean>;
  purchasePackage: (packageId: string) => Promise<{ success: boolean; message: string; isPro?: boolean; bricksAdded?: number }>;
  restorePurchases: () => Promise<{ success: boolean; isPro: boolean }>;
  setTierOverride: (tier: SubscriptionTier) => void;
  addBricks: (amount: number) => void;
  spendBricks: (amount: number) => boolean;
  updateProfile: (updated: Partial<PilotProfile>) => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<UserSubscriptionState>(() =>
    subscriptionService.getSubscription()
  );
  const [profile, setProfile] = useState<PilotProfile>(() =>
    subscriptionService.getProfile()
  );

  useEffect(() => {
    subscriptionService.init().catch(console.warn);

    const handleSubUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<UserSubscriptionState>;
      if (customEvent.detail) {
        setSubscription(customEvent.detail);
      } else {
        setSubscription(subscriptionService.getSubscription());
      }
    };

    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<PilotProfile>;
      if (customEvent.detail) {
        setProfile(customEvent.detail);
      } else {
        setProfile(subscriptionService.getProfile());
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("omnibrick:subscription_updated", handleSubUpdate);
      window.addEventListener("omnibrick:profile_updated", handleProfileUpdate);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("omnibrick:subscription_updated", handleSubUpdate);
        window.removeEventListener("omnibrick:profile_updated", handleProfileUpdate);
      }
    };
  }, []);

  const purchasePackage = async (packageId: string) => {
    const res = await subscriptionService.purchasePackage(packageId);
    setSubscription(subscriptionService.getSubscription());
    setProfile(subscriptionService.getProfile());
    return res;
  };

  const upgradeToPro = async (): Promise<boolean> => {
    const res = await purchasePackage("monthly_pro");
    return res.success;
  };

  const restorePurchases = async (): Promise<{ success: boolean; isPro: boolean }> => {
    const res = await subscriptionService.restorePurchases();
    setSubscription(subscriptionService.getSubscription());
    setProfile(subscriptionService.getProfile());
    return res;
  };

  const setTierOverride = (tier: SubscriptionTier) => {
    subscriptionService.setTier(tier);
    setSubscription(subscriptionService.getSubscription());
  };

  const addBricks = (amount: number) => {
    subscriptionService.addBricks(amount);
    setProfile(subscriptionService.getProfile());
  };

  const spendBricks = (amount: number): boolean => {
    const ok = subscriptionService.spendBricks(amount);
    if (ok) {
      setProfile(subscriptionService.getProfile());
    }
    return ok;
  };

  const updateProfile = (updated: Partial<PilotProfile>) => {
    const newProfile = subscriptionService.updateProfile(updated);
    setProfile(newProfile);
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        profile,
        pilot: profile,
        isPro: subscription.isProActive,
        tier: subscription.tier,
        upgradeToPro,
        purchasePackage,
        restorePurchases,
        setTierOverride,
        addBricks,
        spendBricks,
        updateProfile,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextType {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider");
  return ctx;
}
