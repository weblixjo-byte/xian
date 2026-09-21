"use client";

import React, { useEffect, useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useBrand } from "@/components/BrandProvider";
import confetti from "canvas-confetti";
import {
  Copy,
  Check,
  Gift,
  History,
  Bell,
  LogOut,
  QrCode,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  X,
  AlertCircle,
  CheckCircle2,
  CheckCheck,
  Smartphone,
} from "lucide-react";

// Official Google Multi-Color Icon
function GoogleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

interface CustomerData {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  phone?: string;
  rawPin: string;
  formattedPin: string;
  qrSecret: string;
  pointsBalance: number;
  lifetimePoints: number;
  tier: "Member" | "Silver" | "Gold";
  currencyValue: number;
  currency: string;
}

interface TransactionItem {
  _id: string;
  type: "EARN" | "REDEEM" | "ADJUST";
  billAmount?: number;
  points: number;
  balanceAfter: number;
  rewardTitle?: string;
  referenceCode: string;
  branchName?: string;
  cashierName?: string;
  notes?: string;
  createdAt: string;
}

interface RewardItem {
  _id: string;
  title: string;
  description: string;
  pointsRequired: number;
  category: string;
  imageUrl?: string;
  canRedeem: boolean;
}

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const CUSTOMER_CACHE_KEY = "xian_customer_cached";
const CUSTOMER_ID_KEY = "xian_customer_id";
const CUSTOMER_TOKEN_KEY = "xian_customer_token";
const TRANSACTIONS_CACHE_KEY = "xian_transactions_cached";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const VAPID_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BHzh75OJaSOoRiQqAck0_0_j9bVyALf2Op7wUFKpQ8sAQgxI7yXnO8dQWf9ZOx6Fm3T3T9LFG34ovf2KC_gvdF0";

export default function CustomerPage() {
  const { config, formatCurrency } = useBrand();

  // State
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<"card" | "rewards" | "history" | "notifications">("card");
  const [copied, setCopied] = useState(false);

  // Web Push Notification State
  const [pushPermission, setPushPermission] = useState<"default" | "granted" | "denied" | "unsupported">("default");
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [showIosInstallModal, setShowIosInstallModal] = useState(false);
  const [pushSuccessToast, setPushSuccessToast] = useState<string | null>(null);

  // Ref to track last known points for real-time cashier credit detection
  const prevPointsRef = useRef<number | null>(null);

  // Google Authentication State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  // Custom Google Signup Form State (for signing up with any new Google email)
  const [customName, setCustomName] = useState("");
  const [customEmail, setCustomEmail] = useState("");

  // Redemption state
  const [redeemingReward, setRedeemingReward] = useState<RewardItem | null>(null);
  const [googleRedirecting, setGoogleRedirecting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Mandatory Jordanian Phone Onboarding State
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneSubmitting, setPhoneSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Android-Only PWA 1-Click Install Banner State
  const [showAndroidInstallBanner, setShowAndroidInstallBanner] = useState(false);
  const [androidDeferredPrompt, setAndroidDeferredPrompt] = useState<any>(null);

  // Helper for dual persistence headers (Bearer + x-customer-auth + x-customer-id)
  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {};
    if (typeof window !== "undefined") {
      const savedToken = localStorage.getItem(CUSTOMER_TOKEN_KEY);
      const savedId = localStorage.getItem(CUSTOMER_ID_KEY);
      if (savedToken) {
        headers["Authorization"] = `Bearer ${savedToken}`;
        headers["x-customer-auth"] = savedToken;
      }
      if (savedId) headers["x-customer-id"] = savedId;
    }
    return headers;
  };

  // Fetch Dashboard Data with dual persistence fallback
  const loadDashboard = async () => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch("/api/customer/dashboard", {
        headers,
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (prevPointsRef.current !== null && data.customer.pointsBalance > prevPointsRef.current) {
          const diff = data.customer.pointsBalance - prevPointsRef.current;
          confetti({ particleCount: 45, spread: 65 });
          setPushSuccessToast(`+${diff} points added to your balance!`);
          setTimeout(() => setPushSuccessToast(null), 5000);
        }
        prevPointsRef.current = data.customer.pointsBalance;
        setCustomer(data.customer);
        setTransactions(data.transactions || []);
        if (typeof window !== "undefined") {
          localStorage.setItem(CUSTOMER_CACHE_KEY, JSON.stringify(data.customer));
          localStorage.setItem(CUSTOMER_ID_KEY, data.customer.id);
          if (data.token) localStorage.setItem(CUSTOMER_TOKEN_KEY, data.token);
          if (data.transactions) {
            localStorage.setItem(TRANSACTIONS_CACHE_KEY, JSON.stringify(data.transactions));
          }
        }
      } else {
        if (
          typeof window !== "undefined" &&
          !localStorage.getItem(CUSTOMER_ID_KEY) &&
          !localStorage.getItem(CUSTOMER_TOKEN_KEY) &&
          !localStorage.getItem(CUSTOMER_CACHE_KEY)
        ) {
          setCustomer(null);
        }
      }
    } catch (e) {
      console.warn("Dashboard sync notice:", e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Rewards
  const loadRewards = async () => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch("/api/customer/rewards", {
        headers,
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setRewards(data.rewards || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Notifications
  const loadNotifications = async () => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch("/api/customer/notifications", {
        headers,
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Synchronize Push Subscription with backend and ensure valid keys
  const syncPushSubscription = async (
    reg: ServiceWorkerRegistration
  ): Promise<boolean> => {
    try {
      if (!("PushManager" in window)) return false;

      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
        });
      }

      if (!sub) return false;

      const subJson = sub.toJSON ? sub.toJSON() : ({} as any);
      const payload = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: subJson.keys?.p256dh || "",
          auth: subJson.keys?.auth || "",
        },
        customerId:
          customer?.id ||
          (typeof window !== "undefined" ? localStorage.getItem(CUSTOMER_ID_KEY) : undefined),
      };

      const headers = getAuthHeaders();
      headers["Content-Type"] = "application/json";

      const res = await fetch("/api/customer/push-subscription", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setPushSubscribed(true);
        if (typeof window !== "undefined") {
          localStorage.setItem("xian_push_subscribed", "true");
        }
        return true;
      }
      return false;
    } catch (err: any) {
      console.warn("syncPushSubscription notice:", err);
      if (err.name === "InvalidStateError" || err.message?.includes("key") || err.message?.includes("applicationServerKey")) {
        try {
          const oldSub = await reg.pushManager.getSubscription();
          if (oldSub) await oldSub.unsubscribe();
          const newSub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
          });
          if (newSub) {
            const subJson = newSub.toJSON ? newSub.toJSON() : ({} as any);
            await fetch("/api/customer/push-subscription", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                endpoint: newSub.endpoint,
                keys: subJson.keys,
                customerId: customer?.id || localStorage.getItem(CUSTOMER_ID_KEY),
              }),
            });
            setPushSubscribed(true);
            return true;
          }
        } catch (retryErr) {
          console.error("Retry subscription error:", retryErr);
        }
      }
      return false;
    }
  };

  useEffect(() => {
    // 0. Instant OAuth token capture if arriving from Google OAuth redirect
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const rawAuthToken = params.get("auth_token");
      const userId = params.get("user_id");
      if (rawAuthToken) {
        const authToken = decodeURIComponent(rawAuthToken);
        localStorage.setItem(CUSTOMER_TOKEN_KEY, authToken);
        if (userId) localStorage.setItem(CUSTOMER_ID_KEY, userId);
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }

    // 1. Instant Cache Retrieval for 0ms render & permanent login preservation
    try {
      if (typeof window !== "undefined") {
        const cachedCustomer = localStorage.getItem(CUSTOMER_CACHE_KEY);
        const cachedTxs = localStorage.getItem(TRANSACTIONS_CACHE_KEY);
        if (cachedCustomer) {
          setCustomer(JSON.parse(cachedCustomer));
          if (cachedTxs) setTransactions(JSON.parse(cachedTxs));
          setLoading(false);
        }
      }
    } catch (e) {
      console.warn("Cache load failed", e);
    }

    loadDashboard();
    loadRewards();
    loadNotifications();

    // Smart Visible-Only Polling (every 5s, strictly active only when tab/screen is visible)
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        loadDashboard();
      }
    }, 5000);

    // Instant refresh when user unlocks phone or switches back to tab
    const handleVisibilityChange = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        loadDashboard();
        loadNotifications();
        loadRewards();
      }
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("focus", handleVisibilityChange);
    }

    // Capture PWA install prompt event
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setAndroidDeferredPrompt(e);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    }

    // Check if redirected with OAuth error parameter
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const err = params.get("error");
      if (err) {
        if (err === "google_not_configured") {
          setAuthError("GOOGLE_CLIENT_ID is not configured in server environment variables. Please configure it or sign in directly below.");
        } else if (err === "token_exchange_failed") {
          setAuthError("Google token exchange failed. Please verify GOOGLE_CLIENT_SECRET and redirect URI match.");
        } else if (err === "missing_credentials") {
          setAuthError("Google OAuth configuration is incomplete (GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing).");
        } else if (err === "redirect_uri_mismatch") {
          setAuthError("Redirect URI is not registered in Google Cloud Console. Add your site URL + /api/auth/google/callback.");
        } else if (err === "access_denied") {
          setAuthError("Google sign-in was cancelled.");
        } else {
          setAuthError(`Google sign-in notice: ${err}`);
        }
      }
    }

    // Register Service Worker for PWA & Web Push with automatic synchronization
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(async (reg) => {
          if (!("Notification" in window) || !("PushManager" in window)) {
            setPushPermission("unsupported");
            return;
          }
          const perm = Notification.permission;
          setPushPermission(perm);

          // If permission is already granted, instantly switch UI to enabled and background sync with MongoDB
          if (perm === "granted") {
            setPushSubscribed(true);
            try {
              await syncPushSubscription(reg);
            } catch (e) {
              console.warn("Auto-sync error:", e);
            }
          }
        })
        .catch((err) => console.warn("SW register warning:", err));
    } else {
      setPushPermission("unsupported");
    }

    return () => {
      clearInterval(interval);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        window.removeEventListener("focus", handleVisibilityChange);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      }
    };
  }, []);

  const isIosDevice = (): boolean => {
    if (typeof window === "undefined") return false;
    const ua = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(ua);
  };

  const isStandalone = (): boolean => {
    if (typeof window === "undefined") return false;
    return (
      ("standalone" in window.navigator && (window.navigator as any).standalone) ||
      window.matchMedia("(display-mode: standalone)").matches
    );
  };

  // Android-Only PWA 1-Click Install Banner Trigger Logic
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isAndroid = /android/i.test(window.navigator.userAgent);
    const seen = localStorage.getItem("pwa_android_install_prompt_seen") === "true";
    const standalone = isStandalone();

    // Strictly Android, NOT iOS, NOT standalone, not previously seen, and ONLY after phone registration is complete
    if (isAndroid && !isIosDevice() && !standalone && !seen && customer && customer.phone) {
      const timer = setTimeout(() => {
        setShowAndroidInstallBanner(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [customer]);

  const handleDismissAndroidBanner = () => {
    setShowAndroidInstallBanner(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("pwa_android_install_prompt_seen", "true");
    }
  };

  const handleInstallAndroidApp = async () => {
    if (androidDeferredPrompt) {
      try {
        await androidDeferredPrompt.prompt();
        const choice = await androidDeferredPrompt.userChoice;
        if (choice && choice.outcome === "accepted") {
          confetti({ particleCount: 50, spread: 60 });
        }
      } catch (e) {
        console.warn("PWA install prompt error:", e);
      }
    }
    handleDismissAndroidBanner();
  };

  // Jordanian Mobile Normalization and Strict Validation
  const rawCleanPhone = phoneInput.replace(/\D/g, "");
  let normalizedJordanPhone = rawCleanPhone;
  if (normalizedJordanPhone.startsWith("00962")) normalizedJordanPhone = normalizedJordanPhone.slice(5);
  else if (normalizedJordanPhone.startsWith("962")) normalizedJordanPhone = normalizedJordanPhone.slice(3);
  if (
    (normalizedJordanPhone.startsWith("77") ||
      normalizedJordanPhone.startsWith("78") ||
      normalizedJordanPhone.startsWith("79")) &&
    normalizedJordanPhone.length === 9
  ) {
    normalizedJordanPhone = "0" + normalizedJordanPhone;
  }
  const isPhoneValid = /^07[789]\d{7}$/.test(normalizedJordanPhone);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPhoneValid) {
      setPhoneError(
        "Please enter a valid 10-digit Jordanian mobile number starting with 079, 078, or 077."
      );
      return;
    }

    setPhoneSubmitting(true);
    setPhoneError(null);

    try {
      const headers = getAuthHeaders();
      const res = await fetch("/api/customer/phone", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ phone: normalizedJordanPhone }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setPhoneError(data.error || "Failed to update phone number.");
        return;
      }

      // Celebrate onboarding completion with confetti
      confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
      setPushSuccessToast("Phone number registered successfully! Your pass is now active.");
      setTimeout(() => setPushSuccessToast(null), 4000);

      // Save token and update customer state
      if (data.token && typeof window !== "undefined") {
        localStorage.setItem(CUSTOMER_TOKEN_KEY, data.token);
      }
      if (customer) {
        const updated = { ...customer, phone: normalizedJordanPhone };
        setCustomer(updated);
        if (typeof window !== "undefined") {
          localStorage.setItem(CUSTOMER_CACHE_KEY, JSON.stringify(updated));
        }
      }
      setPhoneInput("");
    } catch (err: any) {
      setPhoneError(err.message || "A network error occurred. Please try again.");
    } finally {
      setPhoneSubmitting(false);
    }
  };


  const handleEnablePush = async () => {
    // If iOS and not running as standalone PWA on home screen, guide user first
    if (isIosDevice() && !isStandalone()) {
      setShowIosInstallModal(true);
      return;
    }

    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      alert("Your current browser does not support push notifications.");
      return;
    }

    try {
      setPushLoading(true);
      const permission = await Notification.requestPermission();
      setPushPermission(permission);

      if (permission === "granted") {
        // Immediately update state for instant responsive UI
        setPushSubscribed(true);
        if (typeof window !== "undefined") {
          localStorage.setItem("xian_push_subscribed", "true");
        }

        const reg = await navigator.serviceWorker.ready;
        await syncPushSubscription(reg);

        setPushSuccessToast("Notifications enabled successfully!");
        setTimeout(() => setPushSuccessToast(null), 4000);
      } else if (permission === "denied") {
        setPushSubscribed(false);
        alert("Notification permission was denied in browser settings. Please allow notifications in site settings.");
      }
    } catch (err: any) {
      console.error("Push subscription error:", err);
      alert("Unable to enable notifications: " + (err.message || "Unexpected error"));
    } finally {
      setPushLoading(false);
    }
  };

  const handleGoogleRedirect = () => {
    setGoogleRedirecting(true);
    setAuthError(null);
    window.location.href = "/api/auth/google/login";
  };

  // Copy 6-Digit PIN
  const handleCopyPin = () => {
    if (!customer?.rawPin) return;
    navigator.clipboard.writeText(customer.rawPin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle Google Sign-In & Sign-Up
  const handleGoogleAuth = async (profile: {
    name: string;
    email: string;
    avatarUrl?: string;
    googleId?: string;
  }) => {
    setGoogleError(null);
    setGoogleLoading(true);

    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(profile),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        if (typeof window !== "undefined") {
          if (data.token) localStorage.setItem(CUSTOMER_TOKEN_KEY, data.token);
          if (data.user?._id || data.user?.id) {
            localStorage.setItem(CUSTOMER_ID_KEY, data.user._id || data.user.id);
          }
        }
        setShowGoogleModal(false);
        if (data.isNewUser) {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        }
        await loadDashboard();
        await loadRewards();
        await loadNotifications();
      } else {
        setGoogleError(data.error || "Google authentication failed");
      }
    } catch (err: any) {
      setGoogleError(err.message || "Network error during Google sign-in");
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handle Custom Google Sign-Up Form Submit
  const handleCustomGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customName) return;
    handleGoogleAuth({
      name: customName.trim(),
      email: customEmail.toLowerCase().trim(),
      googleId: `google_${customEmail.replace(/[^a-z0-9]/g, "_")}`,
    });
  };

  // Logout
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    if (typeof window !== "undefined") {
      localStorage.removeItem(CUSTOMER_CACHE_KEY);
      localStorage.removeItem(CUSTOMER_ID_KEY);
      localStorage.removeItem(CUSTOMER_TOKEN_KEY);
      localStorage.removeItem(TRANSACTIONS_CACHE_KEY);
    }
    setCustomer(null);
    setActiveTab("card");
  };

  const markAllRead = async () => {
    try {
      const headers = getAuthHeaders();
      await fetch("/api/customer/notifications", { method: "POST", headers });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-neutral-300 border-t-[#2C221E] animate-spin" />
          <span className="text-xs font-mono text-neutral-500">Loading your loyalty pass...</span>
        </div>
      </div>
    );
  }

  // If Not Logged In, Show Google-Only Login & Sign-Up Screen
  if (!customer) {
    return (
      <div className="min-h-screen bg-[#FAF5F2]/80 backdrop-blur-md flex flex-col justify-between p-6">
        <div className="max-w-md w-full mx-auto my-auto">
          {/* Brand header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4 shadow-md overflow-hidden p-1 border border-neutral-200">
              <img src="/logo.png" alt="xian" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-bold font-sans text-neutral-900 mb-1">
              {config.storeName}
            </h1>
            <p className="text-sm text-neutral-500 font-sans">{config.tagline}</p>
          </div>

          {/* Login Card (Google Authentication Only) */}
          <div className="glass-panel rounded-3xl p-8 shadow-xl text-center">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-neutral-900 mb-2 font-sans">
                Digital Loyalty Pass
              </h2>
              <p className="text-xs text-neutral-500 leading-relaxed max-w-xs mx-auto font-sans">
                Sign in or create your instant digital member pass with your Google account in one tap.
              </p>
            </div>

            {authError && (
              <div className="mb-5 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex flex-col gap-1.5 text-start">
                <div className="flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  <span>Notice</span>
                </div>
                <p className="text-amber-800 leading-relaxed text-[11px]">{authError}</p>
              </div>
            )}

            {/* Prominent Google Sign-In Button (Official Google OAuth) */}
            <button
              type="button"
              onClick={handleGoogleRedirect}
              disabled={googleRedirecting}
              className="w-full py-3.5 px-4 rounded-2xl border border-neutral-300/80 bg-white/90 hover:bg-white active:scale-98 text-neutral-800 text-sm font-semibold flex items-center justify-center gap-3 transition-all shadow-xs disabled:opacity-70 cursor-pointer font-sans"
            >
              {googleRedirecting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-neutral-400 border-t-neutral-900 animate-spin" />
                  <span className="font-medium">Connecting to Google...</span>
                </>
              ) : (
                <>
                  <GoogleIcon className="w-5 h-5" />
                  <span className="font-medium">Sign in with Google</span>
                </>
              )}
            </button>

            <div className="mt-3.5">
              <button
                type="button"
                onClick={() => {
                  setShowGoogleModal(true);
                }}
                className="text-xs text-neutral-600 hover:text-neutral-900 underline font-semibold py-1 px-2 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer font-sans"
              >
                Or sign in with Name and Email directly
              </button>
            </div>

            <div className="mt-6 pt-5 border-t border-neutral-100 flex items-center justify-center gap-2 text-xs text-neutral-400 font-sans">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Secure Digital Pass Authentication</span>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-neutral-400 py-4 font-sans">
          © 2026 {config.storeName} • Digital Member Pass
        </div>

        {/* MODAL: Direct Account Sign-In / Registration */}
        {showGoogleModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="glass-panel rounded-3xl p-7 max-w-md w-full shadow-2xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-[#cb202d] flex items-center justify-center text-white text-[10px] font-bold">
                    X
                  </div>
                  <span className="text-sm font-semibold text-neutral-800 font-sans">
                    Digital Membership Pass
                  </span>
                </div>
                <button
                  onClick={() => {
                    setShowGoogleModal(false);
                    setGoogleError(null);
                  }}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-bold text-neutral-900 font-sans">
                  Sign In / Open Loyalty Pass
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5 font-sans">
                  Loyalty & Rewards Program <strong className="text-neutral-800">{config.storeName}</strong>
                </p>
              </div>

              {googleError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50/80 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{googleError}</span>
                </div>
              )}

              {/* Clean Account Form */}
              <form onSubmit={handleCustomGoogleSubmit} className="space-y-4 mb-4">
                <div className="p-3 rounded-2xl glass-panel-subtle text-xs text-neutral-700 mb-2 font-sans">
                  Enter your name and email to access your loyalty card instantly and save your points:
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1 font-sans">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder=""
                    className="glass-input w-full font-sans"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1 font-sans">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder=""
                    className="glass-input w-full font-sans"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowGoogleModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-neutral-200 text-xs text-neutral-600 hover:bg-neutral-50 cursor-pointer font-sans"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={googleLoading}
                    className="flex-1 py-2.5 rounded-xl bg-[#cb202d] hover:bg-[#b51a25] text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98 font-sans"
                  >
                    {googleLoading ? "Signing in..." : "Continue to Loyalty Pass"}
                  </button>
                </div>
              </form>

              <p className="text-center text-[11px] text-neutral-400">
                Your digital loyalty pass remains saved and registered permanently on this device.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Authenticated Mobile-First Customer View
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Mobile Bar */}
      <header className="glass-panel border-x-0 border-t-0 rounded-none sticky top-0 z-20 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center overflow-hidden p-1 border border-neutral-200 shadow-xs">
              <img src="/logo.png" alt="xian" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-bold text-xs tracking-tight text-neutral-900 block font-sans">
                {config.storeName}
              </span>
              <span className="text-[10px] text-neutral-500 font-sans">Digital Loyalty Member</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100/50 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto w-full px-4 pt-4 pb-32 flex-1">
        {/* Real-time Notification Banner */}
        {unreadCount > 0 && notifications.length > 0 && !notifications[0].isRead && activeTab !== "notifications" && (
          <div
            onClick={() => {
              setActiveTab("notifications");
              markAllRead();
            }}
            className="mb-4 bg-[#cb202d] text-white rounded-2xl p-3.5 shadow-md flex items-center justify-between gap-3 cursor-pointer hover:bg-[#b51a25] transition-all animate-in fade-in slide-in-from-top-2"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 text-white" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold truncate text-white font-sans">
                  {notifications[0].title}
                </p>
                <p className="text-[11px] text-white/90 truncate font-sans">
                  {notifications[0].message}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white/20 text-white shrink-0 font-sans">
              View
            </span>
          </div>
        )}

        {/* Web Push Notification Status & Prompts */}
        {/* State 1: Permission has NOT been granted yet -> Show Enable banner */}
        {pushPermission === "default" && !pushSubscribed && (
          <div className="mb-4 bg-gradient-to-r from-[#cb202d] to-[#b51a25] text-white rounded-3xl p-4 shadow-md border border-[#cb202d] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 text-white">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight font-sans">Enable Push Notifications</h4>
                <p className="text-[10px] text-white/90 mt-0.5 leading-snug font-sans">
                  Receive instant balance updates and rewards directly on your device
                </p>
              </div>
            </div>
            <button
              onClick={handleEnablePush}
              disabled={pushLoading}
              className="px-4 py-2 rounded-xl bg-white text-[#cb202d] text-xs font-bold hover:bg-rose-50 transition-all shadow-xs cursor-pointer active:scale-95 shrink-0 font-sans"
            >
              {pushLoading ? "Enabling..." : "Enable"}
            </button>
          </div>
        )}

        {/* State 3: Push Permission Denied Banner */}
        {pushPermission === "denied" && (
          <div className="mb-4 p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="text-[11px]">
              Notifications are blocked in your browser settings. Tap the lock icon in your address bar and allow notifications.
            </span>
          </div>
        )}

        {/* Push Activation Success Toast */}
        {pushSuccessToast && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{pushSuccessToast}</span>
          </div>
        )}

        {/* TAB 1: THE CENTRAL CARD (EDITORIAL MINIMALIST CARD LAYOUT) */}
        {activeTab === "card" && (
          <div className="space-y-4">
            {/* The Main Member Card */}
            <div className="glass-panel rounded-3xl p-6 shadow-xl relative overflow-hidden">
              {/* Card Header */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold font-sans text-neutral-500">
                      Member Pass
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border font-sans ${
                        customer.tier === "Gold"
                          ? "bg-amber-50 text-amber-900 border-amber-200"
                          : customer.tier === "Silver"
                          ? "bg-slate-100 text-slate-800 border-slate-300"
                          : "bg-rose-50 text-[#cb202d] border-rose-100"
                      }`}
                    >
                      {customer.tier} Tier
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-neutral-900 font-sans">
                    {customer.name}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <GoogleIcon className="w-3.5 h-3.5" />
                    <span className="text-xs text-neutral-500 font-sans">
                      {customer.email || customer.phone || "Google Member"}
                    </span>
                  </div>
                </div>

                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-xs overflow-hidden p-1 border border-neutral-200">
                  <img src="/logo.png" alt="xian" className="w-full h-full object-contain" />
                </div>
              </div>

              {/* QR Code Section: Pristine White Box with Subtle Shadow */}
              <div className="my-6 flex flex-col items-center justify-center">
                <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-center">
                  <QRCodeSVG
                    value={customer.qrSecret}
                    size={184}
                    level="H"
                    includeMargin={false}
                    fgColor="#1c1917"
                  />
                </div>
                <span className="text-[11px] text-neutral-500 font-sans mt-2 flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#cb202d]" />
                  Dynamic Encrypted QR
                </span>
              </div>

              {/* 6-Digit PIN: Bold Monospace with Quick Copy */}
              <div className="glass-panel-subtle rounded-2xl p-4 text-center">
                <span className="text-xs font-semibold text-neutral-600 block mb-1 font-sans">
                  Fallback 6-Digit Counter PIN
                </span>

                <div className="flex items-center justify-center gap-3">
                  <span className="font-pin text-2xl font-bold tracking-widest text-neutral-900 select-all">
                    {customer.formattedPin}
                  </span>

                  <button
                    onClick={handleCopyPin}
                    className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 transition-colors active:scale-95 cursor-pointer"
                    title="Copy PIN"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {copied && (
                  <span className="text-[10px] font-sans text-[#cb202d] font-semibold mt-1 block">
                    Copied to clipboard!
                  </span>
                )}
              </div>

              {/* Live Points Counter */}
              <div className="mt-6 pt-5 border-t border-neutral-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-neutral-500 block mb-0.5 font-sans">
                    Available Balance
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold tracking-tight text-[#cb202d] font-sans">
                      {customer.pointsBalance}
                    </span>
                    <span className="text-xs font-sans text-neutral-500 font-semibold">pts</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-semibold text-neutral-500 block mb-0.5 font-sans">
                    Cash Valuation
                  </span>
                  <span className="inline-block px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-100 text-xs font-bold text-[#cb202d] font-sans">
                    = {formatCurrency(customer.currencyValue)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action: Browse Rewards Shortcut */}
            <button
              onClick={() => setActiveTab("rewards")}
              className="w-full glass-panel hover:bg-white/80 rounded-2xl p-4 flex items-center justify-between text-left transition-all shadow-xs cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#C87D55] flex items-center justify-center">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-medium text-neutral-900 block">
                    Redeem Rewards & Treats
                  </span>
                  <span className="text-xs text-neutral-500">
                    {rewards.filter((r) => r.canRedeem).length} rewards currently available with your balance
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>
          </div>
        )}

        {/* TAB 2: REWARDS CATALOGUE */}
        {activeTab === "rewards" && (
          <div className="space-y-4">
            {/* Balance Overview Banner */}
            <div className="glass-panel rounded-3xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-neutral-500 font-semibold block font-sans">
                  Current Points Balance
                </span>
                <span className="text-2xl font-bold text-[#cb202d] font-sans" dir="ltr">
                  {customer.pointsBalance.toLocaleString()}{" "}
                  <span className="text-xs font-normal text-neutral-500 font-sans">pts</span>
                </span>
              </div>
              <div className="text-end">
                <span className="text-xs text-emerald-800 font-semibold bg-emerald-50/80 border border-emerald-200 px-3 py-1 rounded-full block font-sans">
                  = {formatCurrency(customer.currencyValue)} instant discount
                </span>
              </div>
            </div>

            {/* Rewards Cards Stack */}
            <div className="space-y-4">
              {rewards.map((reward) => {
                const canAfford = customer.pointsBalance >= reward.pointsRequired;
                const progressPercent = Math.min(
                  100,
                  Math.round((customer.pointsBalance / reward.pointsRequired) * 100)
                );
                return (
                  <div
                    key={reward._id}
                    className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all group"
                  >
                    {/* Top Hero Image Banner */}
                    <div className="relative h-48 sm:h-52 w-full bg-neutral-50 overflow-hidden">
                      {reward.imageUrl ? (
                        <img
                          src={reward.imageUrl}
                          alt={reward.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-300 bg-neutral-50">
                          <Gift className="w-12 h-12" />
                        </div>
                      )}

                      {/* Points Badge */}
                      <div className="absolute top-3.5 end-3.5 w-14 h-14 rounded-full bg-[#cb202d] text-white border-2 border-white shadow-lg flex flex-col items-center justify-center">
                        <span className="text-base font-extrabold font-mono leading-none">
                          {reward.pointsRequired}
                        </span>
                        <span className="text-[9px] font-semibold leading-none mt-0.5 opacity-90 font-sans">
                          pts
                        </span>
                      </div>

                      {/* Category Tag */}
                      <div className="absolute top-3.5 start-3.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/95 backdrop-blur-xs text-neutral-900 shadow-xs border border-neutral-200 font-sans">
                        {reward.category === "Drinks"
                          ? "Beverages"
                          : reward.category === "Food"
                          ? "Food & Pastries"
                          : reward.category === "Beans"
                          ? "Specialty Beans"
                          : reward.category === "Merchandise"
                          ? "Merchandise"
                          : reward.category}
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-4 sm:p-5">
                      <h4 className="text-base font-bold text-neutral-900 mb-1 leading-snug font-sans">
                        {reward.title}
                      </h4>
                      <p className="text-xs text-neutral-500 mb-4 line-clamp-2 leading-relaxed font-sans">
                        {reward.description}
                      </p>

                      <div className="pt-2 border-t border-neutral-200/60">
                        {canAfford ? (
                          <button
                            onClick={() => {
                              setRedeemingReward(reward);
                            }}
                            className="w-full py-2.5 rounded-2xl bg-[#cb202d] hover:bg-[#b51a25] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98 font-sans"
                          >
                            <Gift className="w-4 h-4" />
                            <span>Redeem Reward Now</span>
                          </button>
                        ) : (
                          <div className="space-y-1.5 py-1">
                            <div className="flex items-center justify-between text-[11px] text-neutral-500 font-sans">
                              <span>{reward.pointsRequired - customer.pointsBalance} pts needed to unlock</span>
                              <span className="font-semibold text-[#cb202d]">{progressPercent}%</span>
                            </div>
                            <div className="w-full h-2 bg-neutral-100 border border-neutral-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#cb202d] rounded-full transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: TRANSACTION LEDGER */}
        {activeTab === "history" && (
          <div className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-neutral-900 mb-4 pb-2 border-b border-neutral-200 font-sans">
              Loyalty Activity Log
            </h3>

            {transactions.length === 0 ? (
              <div className="text-center py-10 text-neutral-400 text-xs font-sans">
                No recorded transactions yet.
              </div>
            ) : (
              <div className="divide-y divide-neutral-200/60">
                {transactions.map((tx) => (
                  <div key={tx._id} className="py-3.5 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                            tx.type === "EARN"
                              ? "bg-rose-50 text-[#cb202d] border border-rose-100"
                              : "bg-amber-50 text-amber-900 border border-amber-200"
                          }`}
                        >
                          {tx.type}
                        </span>
                        <span className="text-xs font-mono text-neutral-400">{tx.referenceCode}</span>
                      </div>

                      <div className="text-xs font-semibold text-neutral-900 font-sans">
                        {tx.rewardTitle || tx.notes || "Store Purchase"}
                      </div>

                      <div className="text-[11px] text-neutral-400 mt-0.5 font-sans">
                        {new Date(tx.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        {tx.branchName && `• ${tx.branchName}`}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span
                        className={`text-sm font-bold font-sans ${
                          tx.points > 0 ? "text-[#cb202d]" : "text-neutral-800"
                        }`}
                      >
                        {tx.points > 0 ? `+${tx.points}` : tx.points} pts
                      </span>
                      <span className="text-[11px] text-neutral-400 block font-sans">
                        Bal: {tx.balanceAfter}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: IN-APP NOTIFICATIONS */}
        {activeTab === "notifications" && (
          <div className="space-y-3">
            <div className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 font-sans">Notification Center</h3>
                  <span className="text-[11px] text-neutral-400 font-sans">
                    {unreadCount > 0 ? `${unreadCount} unread update${unreadCount > 1 ? "s" : ""}` : "All caught up"}
                  </span>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs font-sans text-[#cb202d] hover:text-[#b51a25] font-semibold flex items-center gap-1 py-1 px-2.5 rounded-lg bg-rose-50 border border-rose-100 transition-colors cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-50 border border-neutral-200 text-neutral-400 flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-neutral-700 font-sans">No notifications yet</p>
                  <p className="text-[11px] text-neutral-400 font-sans mt-1">
                    You will receive real-time alerts for point credits, tier upgrades, and redeemed rewards.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 pt-3">
                  {notifications.map((n) => {
                    const isReward = n.title.toLowerCase().includes("reward") || n.message.toLowerCase().includes("reward");
                    const isPoints = n.title.toLowerCase().includes("point") || n.message.toLowerCase().includes("point");
                    return (
                      <div
                        key={n._id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          !n.isRead
                            ? "bg-rose-50/40 border-rose-200/80 shadow-2xs"
                            : "bg-white border-neutral-200"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            isReward
                              ? "bg-amber-50 text-amber-900 border border-amber-200"
                              : isPoints
                              ? "bg-rose-50 text-[#cb202d] border border-rose-100"
                              : "bg-neutral-100 text-neutral-600 border border-neutral-200"
                          }`}>
                            {isReward ? (
                              <Gift className="w-4 h-4" />
                            ) : isPoints ? (
                              <Sparkles className="w-4 h-4" />
                            ) : (
                              <Bell className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-xs font-bold text-neutral-900 truncate font-sans">
                                {n.title}
                              </span>
                              <span className="text-[10px] font-sans text-neutral-400 shrink-0">
                                {new Date(n.createdAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                              {n.message}
                            </p>
                          </div>
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-[#cb202d] shrink-0 mt-1.5" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Floating Semi-Rounded Glassmorphism Navigation Bar */}
      <nav className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-50 px-4 pointer-events-none flex justify-center">
        <div className="w-full max-w-sm glass-nav rounded-full p-1.5 shadow-[0_16px_40px_-8px_rgba(63,18,21,0.22),0_4px_16px_rgba(0,0,0,0.08)] border border-white/90 pointer-events-auto flex items-center justify-between gap-1">
          <button
            onClick={() => setActiveTab("card")}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-full transition-all duration-300 cursor-pointer ${
              activeTab === "card"
                ? "bg-[#cb202d] text-white shadow-sm font-semibold scale-102"
                : "text-neutral-500 hover:text-neutral-900 hover:bg-white/40"
            }`}
          >
            <QrCode className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] tracking-tight font-medium">Pass</span>
          </button>

          <button
            onClick={() => setActiveTab("rewards")}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-full transition-all duration-300 cursor-pointer ${
              activeTab === "rewards"
                ? "bg-[#cb202d] text-white shadow-sm font-semibold scale-102"
                : "text-neutral-500 hover:text-neutral-900 hover:bg-white/40"
            }`}
          >
            <Gift className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] tracking-tight font-medium">Rewards</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-full transition-all duration-300 cursor-pointer ${
              activeTab === "history"
                ? "bg-[#cb202d] text-white shadow-sm font-semibold scale-102"
                : "text-neutral-500 hover:text-neutral-900 hover:bg-white/40"
            }`}
          >
            <History className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] tracking-tight font-medium">Activity</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("notifications");
              markAllRead();
            }}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-full transition-all duration-300 cursor-pointer relative ${
              activeTab === "notifications"
                ? "bg-[#cb202d] text-white shadow-sm font-semibold scale-102"
                : "text-neutral-500 hover:text-neutral-900 hover:bg-white/40"
            }`}
          >
            <div className="relative">
              <Bell className="w-4 h-4 mb-0.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </div>
            <span className="text-[10px] tracking-tight font-medium">Alerts</span>
          </button>
        </div>
      </nav>

      {/* MODAL: REDEMPTION PASS & CASHIER CODE */}
      {redeemingReward && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-[#cb202d]">
                  <Gift className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-neutral-900 font-sans">Redeem Reward</h3>
              </div>
              <button
                onClick={() => setRedeemingReward(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Reward Card Summary */}
            <div className="glass-panel-subtle rounded-2xl overflow-hidden mb-4 border border-neutral-200">
              {redeemingReward.imageUrl && (
                <div className="w-full h-32 overflow-hidden border-b border-neutral-200">
                  <img
                    src={redeemingReward.imageUrl}
                    alt={redeemingReward.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-3.5">
                <span className="text-[10px] font-sans font-medium uppercase tracking-wide text-neutral-500 block mb-0.5">
                  {redeemingReward.category}
                </span>
                <h4 className="text-sm font-bold text-neutral-900">{redeemingReward.title}</h4>
                <div className="mt-2 pt-2 border-t border-neutral-200 flex justify-between items-center text-xs">
                  <span className="text-neutral-500 font-sans">Points Value:</span>
                  <span className="font-bold font-sans text-[#cb202d]">{redeemingReward.pointsRequired} pts</span>
                </div>
              </div>
            </div>

            {/* Prominent Counter Code Box */}
            <div className="glass-panel-subtle border-2 border-[#cb202d]/30 rounded-2xl p-4 mb-3 text-center shadow-xs">
              <span className="text-[10px] uppercase tracking-wide font-sans font-semibold text-neutral-500 block mb-1">
                Give this 6-Digit Code to Cashier
              </span>
              <div className="flex items-center justify-center gap-3">
                <span className="font-pin text-3xl font-bold tracking-widest text-[#cb202d] select-all">
                  {customer.formattedPin}
                </span>
                <button
                  onClick={handleCopyPin}
                  className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-rose-50 text-neutral-600 transition-colors active:scale-95 cursor-pointer"
                  title="Copy PIN"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              {copied && (
                <span className="text-[10px] font-sans font-medium text-[#cb202d] mt-1 block">
                  Copied to clipboard!
                </span>
              )}
            </div>

            {/* QR Code Presentation */}
            <div className="flex flex-col items-center justify-center mb-4">
              <div className="p-2.5 bg-white rounded-xl border border-neutral-200 shadow-2xs">
                <QRCodeSVG
                  value={customer.qrSecret}
                  size={120}
                  level="H"
                  includeMargin={false}
                  fgColor="#1c1917"
                />
              </div>
              <span className="text-[10px] text-neutral-500 font-sans mt-1.5">
                Or scan customer QR on POS terminal
              </span>
            </div>

            {/* Cashier-Only Activation Notice */}
            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 mb-4 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p className="leading-snug">
                Present this code to the cashier at the counter. The discount will only be applied and points deducted once confirmed by the cashier.
              </p>
            </div>

            <button
              onClick={() => setRedeemingReward(null)}
              className="w-full py-3 rounded-2xl bg-[#cb202d] hover:bg-[#b51a25] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer active:scale-98"
            >
              Done & Return to Pass
            </button>
          </div>
        </div>
      )}

      {/* MANDATORY NO-SKIP JORDANIAN PHONE ONBOARDING MODAL */}
      {!loading && customer && !customer.phone && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-white/90 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-[#cb202d] flex items-center justify-center mx-auto mb-3 shadow-xs">
                <Smartphone className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-neutral-900 font-sans tracking-tight">
                Register Mobile Number
              </h2>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto leading-relaxed">
                To activate your digital loyalty card and earn points at the cashier, please link your Jordanian mobile number.
              </p>
            </div>

            {phoneError && (
              <div className="mb-4 p-3.5 rounded-2xl bg-red-50/90 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span className="font-medium">{phoneError}</span>
              </div>
            )}

            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-neutral-700 font-sans">
                    Jordanian Mobile Number
                  </label>
                  <span
                    className={`text-xs font-mono font-bold transition-colors ${
                      isPhoneValid
                        ? "text-emerald-600"
                        : normalizedJordanPhone.length === 10
                        ? "text-red-600"
                        : "text-neutral-400"
                    }`}
                  >
                    {normalizedJordanPhone.length}/10 digits
                  </span>
                </div>

                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center gap-1.5 text-xs font-bold text-neutral-600 border-r border-neutral-200 pr-2.5 pointer-events-none">
                    <span className="text-neutral-400 text-sm">🇯🇴</span>
                    <span className="font-mono">+962</span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    value={phoneInput}
                    onChange={(e) => {
                      setPhoneInput(e.target.value);
                      setPhoneError(null);
                    }}
                    placeholder="079 123 4567"
                    className={`w-full pl-22 pr-10 py-3.5 rounded-2xl glass-input text-sm font-mono tracking-wider font-semibold text-neutral-900 ${
                      isPhoneValid
                        ? "border-emerald-500 focus:border-emerald-600"
                        : ""
                    }`}
                    autoFocus
                    required
                  />
                  <div className="absolute right-3.5">
                    {isPhoneValid ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : normalizedJordanPhone.length === 10 && !isPhoneValid ? (
                      <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                        <X className="w-3.5 h-3.5" />
                      </div>
                    ) : null}
                  </div>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1.5 font-sans">
                  Must start with <span className="font-semibold text-neutral-600">079</span>, <span className="font-semibold text-neutral-600">078</span>, or <span className="font-semibold text-neutral-600">077</span> (10 digits total).
                </p>
              </div>

              <button
                type="submit"
                disabled={phoneSubmitting || !isPhoneValid}
                className="w-full py-3.5 rounded-2xl bg-[#cb202d] hover:bg-[#b51a25] active:scale-98 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-sans"
              >
                {phoneSubmitting ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    <span>Verifying & Saving...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Activate Pass</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-neutral-100/80 flex items-center justify-center gap-2 text-[11px] text-neutral-400 font-sans">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Official Mobile Verification • No SMS required</span>
            </div>
          </div>
        </div>
      )}

      {/* 1-CLICK ANDROID-ONLY FLOATING PWA INSTALL BANNER */}
      {showAndroidInstallBanner && (
        <div className="fixed bottom-24 left-4 right-4 max-w-md mx-auto z-40 animate-in slide-in-from-bottom-5 duration-300">
          <div className="glass-panel rounded-2xl p-4 shadow-2xl border border-white/90 flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200/80 p-1 flex items-center justify-center shadow-xs overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="xian" className="w-full h-full object-contain" />
              </div>
              <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-[#cb202d] text-white text-[9px] font-extrabold uppercase tracking-wide shadow-2xs">
                1-Tap
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-neutral-900 truncate font-sans">
                Install {config.storeName} App
              </h4>
              <p className="text-[11px] text-neutral-500 leading-tight truncate font-sans">
                Fast 1-tap pass access & instant alerts
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleDismissAndroidBanner}
                className="px-2.5 py-2 rounded-xl text-neutral-400 hover:text-neutral-700 text-xs font-medium transition-colors cursor-pointer"
              >
                Not now
              </button>
              <button
                type="button"
                onClick={handleInstallAndroidApp}
                className="px-3.5 py-2 rounded-xl bg-[#cb202d] hover:bg-[#b51a25] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5 font-sans"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Install</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: iOS Add to Home Screen Guidance */}
      {showIosInstallModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-[#cb202d] flex items-center justify-center mx-auto mb-3">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 mb-1 font-sans">
              Enable Notifications on iPhone
            </h3>
            <p className="text-xs text-neutral-500 mb-5 leading-relaxed">
              Apple requires adding the app to your Home Screen first to receive lock screen notifications:
            </p>

            <div className="bg-[#FAF5F2] border border-neutral-200 rounded-2xl p-4 text-start space-y-3 mb-5 text-xs text-neutral-900">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#cb202d] text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </span>
                <span>Tap the Share button <strong>⎋ (Share)</strong> in Safari&apos;s bottom toolbar.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#cb202d] text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </span>
                <span>Choose <strong>&quot;Add to Home Screen&quot;</strong>.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#cb202d] text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </span>
                <span>Open <strong>xian</strong> from your home screen and tap &quot;Enable&quot;.</span>
              </div>
            </div>

            <button
              onClick={() => setShowIosInstallModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#cb202d] text-white text-xs font-semibold hover:bg-[#b51a25] transition-colors cursor-pointer"
            >
              Got it, thanks
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
