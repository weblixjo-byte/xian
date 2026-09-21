"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useBrand } from "@/components/BrandProvider";
import confetti from "canvas-confetti";
import {
  ScanLine,
  Hash,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ArrowRight,
  Sparkles,
  CreditCard,
  Gift,
  RefreshCw,
  X,
  Camera,
  Delete,
  Check,
  Smartphone,
  Share2,
} from "lucide-react";
import QrCameraScanner from "@/components/QrCameraScanner";
import CustomGlassSelect from "@/components/CustomGlassSelect";

interface POSCustomer {
  id: string;
  name: string;
  phone: string;
  pin: string;
  tier: string;
  pointsBalance: number;
  lifetimePoints: number;
  currencyValue: number;
  currency: string;
  pointsPerUnit: number;
}

interface ReceiptData {
  referenceCode: string;
  customerName: string;
  pointsEarned?: number;
  pointsRedeemed?: number;
  oldBalance: number;
  newBalance: number;
  billAmount?: number;
  currency: string;
  tier: string;
  tierUpgraded?: boolean;
}

export default function CashierPage() {
  const { config, formatCurrency } = useBrand();

  // Cashier session state
  const [cashier, setCashier] = useState<{
    id: string;
    name: string;
    username: string;
    branchName: string;
  } | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Cashier login form state
  const [usernameInput, setUsernameInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // POS Workflow State
  const [activeMode, setActiveMode] = useState<"pin" | "phone" | "qr">("pin");
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [pinQuery, setPinQuery] = useState("");
  const [phoneQuery, setPhoneQuery] = useState("");
  const [qrQuery, setQrQuery] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [identifiedCustomer, setIdentifiedCustomer] = useState<POSCustomer | null>(null);

  // Active Transaction Tab: "credit" or "redeem"
  const [actionTab, setActionTab] = useState<"credit" | "redeem">("credit");

  // Bill & Transaction State
  const [billAmount, setBillAmount] = useState<string>("");
  const [transactLoading, setTransactLoading] = useState(false);
  const [transactError, setTransactError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  // Redemption State
  const [redeemPoints, setRedeemPoints] = useState<string>("");
  const [rewardTitle, setRewardTitle] = useState<string>("");
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [activeRewards, setActiveRewards] = useState<{ _id: string; title: string; pointsRequired: number; category: string }[]>([]);

  // Cashier PWA Installation States
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandaloneApp, setIsStandaloneApp] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  useEffect(() => {
    // Fetch active store rewards catalogue for POS redemption
    fetch("/api/customer/rewards")
      .then((res) => res.json())
      .then((data) => {
        if (data.rewards && data.rewards.length > 0) {
          const activeList = data.rewards.filter((r: any) => r.isActive !== false);
          setActiveRewards(activeList);
          if (activeList[0]) {
            setRewardTitle(activeList[0].title);
            setRedeemPoints(activeList[0].pointsRequired.toString());
          }
        }
      })
      .catch(() => {});

    if (typeof window !== "undefined") {
      const standalone =
        ("standalone" in window.navigator && (window.navigator as any).standalone) ||
        window.matchMedia("(display-mode: standalone)").matches;
      setIsStandaloneApp(Boolean(standalone));

      const handleBeforeInstall = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstall);
      return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else {
      setShowInstallGuide(true);
    }
  };

  const CASHIER_CACHE_KEY = "xian_cashier_cached";
  const CASHIER_TOKEN_KEY = "xian_cashier_token";

  // Check current session with dual persistence
  const checkSession = async () => {
    try {
      setLoadingSession(true);
      const headers: Record<string, string> = {};
      if (typeof window !== "undefined") {
        const savedToken = localStorage.getItem(CASHIER_TOKEN_KEY);
        if (savedToken) {
          headers["x-staff-auth"] = savedToken;
          headers["Authorization"] = `Bearer ${savedToken}`;
        }
      }
      const res = await fetch("/api/auth/me", {
        headers,
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.authenticated && (data.user.role === "cashier" || data.user.role === "super_admin")) {
        const cashierData = {
          id: data.user.id,
          name: data.user.name,
          username: data.user.username || "",
          branchName: data.user.branchName || "Main Branch",
        };
        setCashier(cashierData);
        if (typeof window !== "undefined") {
          localStorage.setItem(CASHIER_CACHE_KEY, JSON.stringify(cashierData));
          if (data.token) localStorage.setItem(CASHIER_TOKEN_KEY, data.token);
        }
      } else {
        if (typeof window !== "undefined" && !localStorage.getItem(CASHIER_TOKEN_KEY)) {
          setCashier(null);
        }
      }
    } catch {
      // Keep cached session on connection glitch
    } finally {
      setLoadingSession(false);
    }
  };

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const cachedCashier = localStorage.getItem(CASHIER_CACHE_KEY);
        if (cachedCashier) {
          setCashier(JSON.parse(cachedCashier));
          setLoadingSession(false);
        }
      }
    } catch (e) {
      console.warn("Cashier cache read error:", e);
    }
    checkSession();
  }, []);

  // Cashier Login
  const handleCashierLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await fetch("/api/auth/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          role: "cashier",
          username: usernameInput.trim(),
          staffPin: pinInput.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCashier(data.user);
        if (typeof window !== "undefined") {
          localStorage.setItem(CASHIER_CACHE_KEY, JSON.stringify(data.user));
          if (data.token) localStorage.setItem(CASHIER_TOKEN_KEY, data.token);
        }
      } else {
        setLoginError(data.error || "Invalid username or security PIN");
      }
    } catch (err: any) {
      setLoginError(err.message || "Server connection error");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    if (typeof window !== "undefined") {
      localStorage.removeItem(CASHIER_CACHE_KEY);
      localStorage.removeItem(CASHIER_TOKEN_KEY);
    }
    setCashier(null);
    resetPOS();
  };

  // Fast Customer Lookup
  const performLookup = async (query: string) => {
    if (!query || query.trim().length < 4) return;
    setLookupError(null);
    setLookupLoading(true);

    try {
      const res = await fetch("/api/pos/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIdentifiedCustomer(data.customer);
      } else {
        setLookupError(data.error || "Customer not found. Please verify PIN or QR.");
        setIdentifiedCustomer(null);
      }
    } catch (e: any) {
      setLookupError(e.message || "Error looking up customer");
      setIdentifiedCustomer(null);
    } finally {
      setLookupLoading(false);
    }
  };

  // Handle tactile on-screen keypad press
  const handleKeypadPress = (digit: string) => {
    if (pinQuery.length >= 6) return;
    const newPin = pinQuery + digit;
    setPinQuery(newPin);
    if (newPin.length === 6) {
      performLookup(newPin);
    }
  };

  const handleKeypadBackspace = () => {
    setPinQuery((prev) => prev.slice(0, -1));
  };

  const handleKeypadClear = () => {
    setPinQuery("");
    setLookupError(null);
  };

  // Handle scanned QR from live camera
  const handleQrScan = (decodedData: string) => {
    setShowCameraScanner(false);
    setQrQuery(decodedData);
    performLookup(decodedData);
  };

  // Reset POS for next customer
  const resetPOS = () => {
    setIdentifiedCustomer(null);
    setBillAmount("");
    setPinQuery("");
    setPhoneQuery("");
    setQrQuery("");
    setLookupError(null);
    setTransactError(null);
    setRedeemError(null);
    setReceipt(null);
    setActionTab("credit");
  };

  // Credit Points on Bill
  const handleCreditPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifiedCustomer) return;

    const amount = parseFloat(billAmount);
    if (isNaN(amount) || amount <= 0) {
      setTransactError("Please enter a valid bill amount greater than 0");
      return;
    }

    setTransactLoading(true);
    setTransactError(null);

    try {
      const res = await fetch("/api/pos/transact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: identifiedCustomer.id,
          billAmount: amount,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReceipt(data.receipt);
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } else {
        setTransactError(data.error || "Failed to credit points");
      }
    } catch (err: any) {
      setTransactError(err.message || "Server connection error");
    } finally {
      setTransactLoading(false);
    }
  };

  // Redeem Points
  const handleRedeemPoints = async () => {
    if (!identifiedCustomer) return;
    const pts = parseInt(redeemPoints);
    if (isNaN(pts) || pts <= 0) {
      setRedeemError("Please enter a valid points amount to redeem");
      return;
    }

    if (pts > identifiedCustomer.pointsBalance) {
      setRedeemError(`Insufficient customer balance (${identifiedCustomer.pointsBalance} pts available)`);
      return;
    }

    setRedeemLoading(true);
    setRedeemError(null);

    try {
      const res = await fetch("/api/pos/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: identifiedCustomer.id,
          pointsToRedeem: pts,
          rewardTitle: rewardTitle || "Order Discount",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReceipt(data.receipt);
        confetti({ particleCount: 40, spread: 50 });
      } else {
        setRedeemError(data.error || "Failed to redeem reward");
      }
    } catch (e: any) {
      setRedeemError(e.message || "Server connection error");
    } finally {
      setRedeemLoading(false);
    }
  };

  // Calculate live preview of points for current bill
  const calculatedPoints =
    billAmount && !isNaN(parseFloat(billAmount))
      ? Math.floor(parseFloat(billAmount) * (config.pointsPerUnit || 10))
      : 0;

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-[#FAF5F2] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-300 border-t-[#cb202d] animate-spin" />
      </div>
    );
  }

  // ==========================================
  // Cashier Login View (Mobile-First Arabic)
  // ==========================================
  if (!cashier) {
    return (
      <div className="min-h-screen bg-[#FAF5F2] flex flex-col justify-between p-4 sm:p-6 select-none font-sans">
        <div className="max-w-sm w-full mx-auto my-auto py-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-3 shadow-md border border-neutral-200 overflow-hidden p-1">
              <img src="/logo.png" alt="xian" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-1 font-sans">
              Cashier Terminal
            </h1>
            <p className="text-xs text-neutral-500 font-medium font-sans">
              Point of Sale & Loyalty • xian POS
            </p>
          </div>

          <div className="glass-panel rounded-3xl p-6 sm:p-7 shadow-xl">
            {loginError && (
              <div className="mb-4 p-3 rounded-2xl bg-red-50/80 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleCashierLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-900 mb-1.5 font-sans">
                  Cashier Username
                </label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder=""
                  className="glass-input w-full font-sans"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-900 mb-1.5 font-sans">
                  Staff Security PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder=""
                  className="glass-input w-full text-center font-mono text-xl tracking-widest font-sans"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3.5 rounded-xl bg-[#cb202d] text-white text-sm font-bold hover:bg-[#b51a25] transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98 font-sans"
              >
                {loginLoading ? "Signing in..." : "Open POS Terminal"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Install Cashier App to Home Screen Banner */}
          {!isStandaloneApp && (
            <div className="mt-4 p-3.5 rounded-2xl glass-panel-subtle border border-neutral-200 shadow-2xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#cb202d] flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-neutral-900 truncate font-sans">Add Cashier to Home Screen</p>
                  <p className="text-[10px] text-neutral-500 truncate font-sans">Launches Cashier directly, never Customer</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleInstallClick}
                className="px-3 py-1.5 rounded-xl bg-[#cb202d] text-white text-xs font-bold shrink-0 hover:bg-[#b51a25] transition-all cursor-pointer shadow-2xs font-sans"
              >
                Install
              </button>
            </div>
          )}
        </div>

        {/* Install Guide Modal (Guest / Sign-in View) */}
        {showInstallGuide && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="glass-panel rounded-3xl p-6 max-w-sm w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
              <button
                type="button"
                onClick={() => setShowInstallGuide(false)}
                className="absolute top-4 end-4 p-1 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-[#cb202d] text-white flex items-center justify-center mx-auto mb-3 shadow-md">
                <Smartphone className="w-6 h-6" />
              </div>

              <h3 className="text-base font-bold text-center text-neutral-900 mb-1 font-sans">
                Install Cashier to Home Screen
              </h3>
              <p className="text-xs text-neutral-500 text-center mb-4 font-sans">
                Install a dedicated Cashier POS icon that opens this terminal directly:
              </p>

              <div className="space-y-3 glass-panel-subtle rounded-2xl p-4 text-xs text-neutral-800 font-sans">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#cb202d] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span>Tap the <strong>Share</strong> button <Share2 className="w-3.5 h-3.5 inline mx-0.5 text-[#cb202d]" /> in Safari or <strong>Menu (⋮)</strong> in Chrome.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#cb202d] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span>Select <strong>&quot;Add to Home Screen&quot;</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#cb202d] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span>Tap <strong>Add</strong>. The icon will be named <strong>xian Cashier</strong> and will open this Cashier POS terminal directly.</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowInstallGuide(false)}
                className="w-full mt-4 py-2.5 rounded-xl bg-[#cb202d] text-white text-xs font-bold hover:bg-[#b51a25] transition-colors cursor-pointer font-sans"
              >
                Got It
              </button>
            </div>
          </div>
        )}

        <div className="text-center text-xs text-neutral-500 py-4 flex items-center justify-center gap-4">
          <Link href="/admin" className="hover:text-[#cb202d] font-semibold transition-colors">
            Admin Console
          </Link>
          <span className="text-neutral-300">•</span>
          <Link href="/customer" className="hover:text-[#cb202d] font-semibold transition-colors">
            Customer Pass
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================
  // Cashier POS Checkout Interface (English)
  // ==========================================
  return (
    <div className="min-h-screen bg-[#FAF5F2]/80 backdrop-blur-md flex flex-col justify-between select-none font-sans">
      {/* Top Header - Super Compact & Clean on Mobile */}
      <header className="glass-panel border-x-0 border-t-0 rounded-none px-3.5 sm:px-6 py-2.5 sm:py-3 sticky top-0 z-20 shadow-xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          {/* Cashier Info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white flex items-center justify-center shrink-0 overflow-hidden p-1 border border-neutral-200 shadow-xs">
              <img src="/logo.png" alt="xian" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs sm:text-sm text-neutral-900 truncate font-sans">
                  {config.storeName} Cashier
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Online" />
              </div>
              <span className="text-[11px] text-neutral-500 block truncate font-sans">
                Cashier: {cashier.name}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {!isStandaloneApp && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-neutral-200 glass-panel-subtle hover:bg-white text-xs font-semibold text-[#cb202d] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs font-sans"
                title="Install Cashier POS App"
              >
                <Smartphone className="w-3.5 h-3.5 text-[#cb202d]" />
                <span className="text-xs">Install</span>
              </button>
            )}

            <button
              onClick={resetPOS}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-neutral-200 glass-panel-subtle hover:bg-white text-xs font-semibold text-neutral-800 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs font-sans"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#cb202d]" />
              <span className="text-xs">Reset</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-1.5 sm:p-2 rounded-xl text-neutral-500 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* POS Main Screen */}
      <main className="max-w-2xl mx-auto w-full px-3.5 sm:px-6 py-4 sm:py-6 flex-1 flex flex-col justify-start">
        {/* ============================================================== */}
        {/* STEP 1: Fast Customer Identification (Mobile Touch First)    */}
        {/* ============================================================== */}
        {!identifiedCustomer && (
          <div className="w-full max-w-md mx-auto space-y-3.5">
            {/* Mode Switcher Buttons */}
            <div className="grid grid-cols-3 gap-1.5 glass-panel-subtle p-1 rounded-2xl border border-neutral-200">
              <button
                type="button"
                onClick={() => {
                  setActiveMode("pin");
                  setLookupError(null);
                }}
                className={`py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer font-sans ${
                  activeMode === "pin"
                    ? "bg-[#cb202d] text-white shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <Hash className="w-3.5 h-3.5" />
                <span>PIN</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveMode("phone");
                  setLookupError(null);
                }}
                className={`py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer font-sans ${
                  activeMode === "phone"
                    ? "bg-[#cb202d] text-white shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Phone</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveMode("qr");
                  setShowCameraScanner(true);
                  setLookupError(null);
                }}
                className={`py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer font-sans ${
                  activeMode === "qr"
                    ? "bg-[#cb202d] text-white shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Scan QR</span>
              </button>
            </div>

            {/* Error Message */}
            {lookupError && (
              <div className="p-3 rounded-2xl bg-red-50/80 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span className="font-medium">{lookupError}</span>
              </div>
            )}

            {/* MODE 1: 6-DIGIT PIN WITH OPTIONAL TACTILE NUMPAD */}
            {activeMode === "pin" && (
              <div className="glass-panel rounded-3xl p-4 sm:p-5 shadow-lg space-y-4">
                <div className="text-center">
                  <span className="text-xs font-semibold text-neutral-500 block mb-1">
                    Enter Customer 6-Digit PIN
                  </span>

                  {/* 6 Digit Display Boxes */}
                  <div className="flex justify-center gap-2 my-2 dir-ltr">
                    {[0, 1, 2, 3, 4, 5].map((idx) => {
                      const char = pinQuery[idx];
                      return (
                        <div
                          key={idx}
                          className={`w-10 h-12 sm:w-12 sm:h-14 rounded-xl border-2 flex items-center justify-center text-xl font-bold font-mono transition-all ${
                            char
                              ? "border-[#cb202d] bg-rose-50 text-[#cb202d]"
                              : idx === pinQuery.length
                              ? "border-[#cb202d] bg-white animate-pulse"
                              : "border-neutral-200 bg-neutral-50/50 text-neutral-300"
                          }`}
                        >
                          {char || "•"}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tactile On-Screen Numpad for Mobile Fast Entry */}
                <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto pt-1">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleKeypadPress(num)}
                      disabled={lookupLoading}
                      className="h-12 sm:h-13 rounded-2xl glass-panel-subtle hover:bg-white/90 active:scale-95 text-neutral-900 font-bold text-lg font-mono flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleKeypadClear}
                    className="h-12 sm:h-13 rounded-2xl glass-panel-subtle hover:bg-neutral-200/50 active:scale-95 text-neutral-500 font-semibold text-xs flex items-center justify-center transition-all cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => handleKeypadPress("0")}
                    disabled={lookupLoading}
                    className="h-12 sm:h-13 rounded-2xl glass-panel-subtle hover:bg-white/90 active:scale-95 text-neutral-900 font-bold text-lg font-mono flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleKeypadBackspace}
                    className="h-12 sm:h-13 rounded-2xl glass-panel-subtle hover:bg-red-50/80 active:scale-95 text-neutral-600 hover:text-red-600 font-bold flex items-center justify-center transition-all cursor-pointer"
                  >
                    <Delete className="w-5 h-5" />
                  </button>
                </div>

                {/* Search Button */}
                <button
                  type="button"
                  onClick={() => performLookup(pinQuery)}
                  disabled={lookupLoading || pinQuery.length < 6}
                  className="w-full py-3.5 rounded-2xl bg-[#cb202d] text-white text-sm font-bold hover:bg-[#b51a25] transition-all disabled:opacity-40 cursor-pointer shadow-xs flex items-center justify-center gap-2 active:scale-98 font-sans"
                >
                  {lookupLoading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      <span>Searching customer...</span>
                    </>
                  ) : (
                    <>
                      <span>Search by PIN</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* MODE 2: 10-DIGIT JORDANIAN PHONE LOOKUP */}
            {activeMode === "phone" && (
              <div className="glass-panel rounded-3xl p-4 sm:p-5 shadow-lg space-y-4">
                <div className="text-center">
                  <span className="text-xs font-semibold text-neutral-500 block mb-2 font-sans">
                    Enter Customer Phone (079, 078, 077)
                  </span>

                  <div className="relative max-w-xs mx-auto">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-bold text-neutral-500 border-r border-neutral-200 pr-2 pointer-events-none">
                      <span>🇯🇴</span>
                      <span>+962</span>
                    </div>
                    <input
                      type="tel"
                      value={phoneQuery}
                      onChange={(e) => {
                        setPhoneQuery(e.target.value);
                        setLookupError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") performLookup(phoneQuery);
                      }}
                      placeholder="079 123 4567"
                      className="w-full pl-22 pr-4 py-3 rounded-2xl glass-input text-base font-mono font-bold text-neutral-900 tracking-wider text-center"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Tactile On-Screen Numpad for Phone Fast Entry */}
                <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto pt-1">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        if (phoneQuery.length < 10) {
                          const next = phoneQuery + num;
                          setPhoneQuery(next);
                          if (next.length === 10) performLookup(next);
                        }
                      }}
                      disabled={lookupLoading}
                      className="h-11 sm:h-12 rounded-2xl glass-panel-subtle hover:bg-white/90 active:scale-95 text-neutral-900 font-bold text-base font-mono flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPhoneQuery("")}
                    className="h-11 sm:h-12 rounded-2xl glass-panel-subtle hover:bg-neutral-200/50 active:scale-95 text-neutral-500 font-semibold text-xs flex items-center justify-center transition-all cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (phoneQuery.length < 10) {
                        const next = phoneQuery + "0";
                        setPhoneQuery(next);
                        if (next.length === 10) performLookup(next);
                      }
                    }}
                    disabled={lookupLoading}
                    className="h-11 sm:h-12 rounded-2xl glass-panel-subtle hover:bg-white/90 active:scale-95 text-neutral-900 font-bold text-base font-mono flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhoneQuery((prev) => prev.slice(0, -1))}
                    className="h-11 sm:h-12 rounded-2xl glass-panel-subtle hover:bg-red-50/80 active:scale-95 text-neutral-600 hover:text-red-600 font-bold flex items-center justify-center transition-all cursor-pointer"
                  >
                    <Delete className="w-4 h-4" />
                  </button>
                </div>

                {/* Search Button */}
                <button
                  type="button"
                  onClick={() => performLookup(phoneQuery)}
                  disabled={lookupLoading || phoneQuery.replace(/\D/g, "").length < 7}
                  className="w-full py-3.5 rounded-2xl bg-[#cb202d] text-white text-xs font-bold hover:bg-[#b51a25] transition-all disabled:opacity-40 cursor-pointer shadow-xs flex items-center justify-center gap-2 active:scale-98 font-sans"
                >
                  {lookupLoading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      <span>Searching customer...</span>
                    </>
                  ) : (
                    <>
                      <span>Search by Phone</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* MODE 3: QR SCANNER BUTTON & MANUAL TOKEN */}
            {activeMode === "qr" && (
              <div className="glass-panel rounded-3xl p-5 sm:p-6 shadow-lg space-y-4 text-center">
                <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 text-[#cb202d] flex items-center justify-center mx-auto">
                  <ScanLine className="w-8 h-8 animate-pulse" />
                </div>

                <div>
                  <h3 className="font-bold text-neutral-900 text-sm sm:text-base mb-1 font-sans">
                    Scan QR Code
                  </h3>
                  <p className="text-xs text-neutral-500 max-w-xs mx-auto font-sans">
                    Open camera to scan customer loyalty card directly or enter code manually.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCameraScanner(true)}
                  className="w-full py-4 px-4 rounded-2xl bg-[#cb202d] hover:bg-[#b51a25] text-white text-sm font-bold flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-98 cursor-pointer font-sans"
                >
                  <Camera className="w-5 h-5 text-white" />
                  <span>Open Camera for Live Scan</span>
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-neutral-200"></div>
                  <span className="shrink mx-3 text-neutral-400 text-[11px] font-sans">Or enter code manually</span>
                  <div className="flex-grow border-t border-neutral-200"></div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={qrQuery}
                    onChange={(e) => setQrQuery(e.target.value)}
                    placeholder=""
                    className="glass-input flex-1 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => performLookup(qrQuery)}
                    disabled={lookupLoading || !qrQuery}
                    className="px-4 py-2.5 rounded-xl bg-[#cb202d] text-white text-xs font-bold hover:bg-[#b51a25] transition-colors disabled:opacity-40 cursor-pointer shrink-0 font-sans"
                  >
                    {lookupLoading ? "Checking..." : "Confirm"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 2: Customer Identified - Mobile-Optimized Action Screen */}
        {/* ============================================================== */}
        {identifiedCustomer && !receipt && (
          <div className="w-full max-w-lg mx-auto space-y-4">
            {/* Customer Profile Card */}
            <div className="glass-panel rounded-3xl p-4 sm:p-5 shadow-lg">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#cb202d] text-xl font-bold shrink-0">
                    {identifiedCustomer.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-neutral-900 truncate font-sans">
                        {identifiedCustomer.name}
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 font-sans ${
                          identifiedCustomer.tier === "Gold"
                            ? "bg-amber-50 text-amber-900 border-amber-300"
                            : identifiedCustomer.tier === "Silver"
                            ? "bg-slate-100 text-slate-800 border-slate-300"
                            : "bg-rose-50 text-[#cb202d] border-rose-100"
                        }`}
                      >
                        {identifiedCustomer.tier}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 font-mono mt-0.5 truncate">
                      {identifiedCustomer.phone} • PIN: {identifiedCustomer.pin}
                    </p>
                  </div>
                </div>

                <button
                  onClick={resetPOS}
                  className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100/50 transition-colors shrink-0"
                  title="Change Customer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Balance Bar */}
              <div className="glass-panel-subtle rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-neutral-500 block font-sans">Current Points Balance</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-[#cb202d] font-sans">
                      {identifiedCustomer.pointsBalance}
                    </span>
                    <span className="text-xs text-neutral-500 font-semibold font-sans">pts</span>
                  </div>
                </div>
                <div className="text-right bg-white/80 px-3 py-1.5 rounded-xl border border-neutral-200 shadow-2xs">
                  <span className="text-[10px] text-neutral-400 block font-medium font-sans">Membership Tier</span>
                  <span className="text-xs font-bold text-[#cb202d] font-sans">
                    {identifiedCustomer.tier || "Member"}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Switcher: Credit Points vs. Redeem Reward */}
            <div className="grid grid-cols-2 gap-2 glass-panel-subtle p-1 rounded-2xl border border-neutral-200">
              <button
                type="button"
                onClick={() => {
                  setActionTab("credit");
                  setTransactError(null);
                }}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer font-sans ${
                  actionTab === "credit"
                    ? "bg-[#cb202d] text-white shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Credit Points (Bill)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActionTab("redeem");
                  setRedeemError(null);
                }}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer font-sans ${
                  actionTab === "redeem"
                    ? "bg-[#cb202d] text-white shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <Gift className="w-4 h-4" />
                <span>Redeem Reward</span>
              </button>
            </div>

            {/* TAB A: CREDIT POINTS ON BILL */}
            {actionTab === "credit" && (
              <div className="glass-panel rounded-3xl p-5 sm:p-6 shadow-lg space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 mb-1 font-sans">
                    Total Bill Amount
                  </h4>
                  <p className="text-[11px] text-neutral-500 font-sans">
                    Customer earns {config.pointsPerUnit || 10} points per 1.000 {config.currency}.
                  </p>
                </div>

                {transactError && (
                  <div className="p-3 rounded-2xl bg-red-50/80 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{transactError}</span>
                  </div>
                )}

                <form onSubmit={handleCreditPoints} className="space-y-4">
                  {/* Bill Amount Input with clean embedded currency */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5 font-sans">
                      Bill Amount ({config.currency})
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.05"
                        min="0.05"
                        value={billAmount}
                        onChange={(e) => setBillAmount(e.target.value)}
                        placeholder="0.000"
                        className="glass-input w-full pr-16 pl-4 py-3.5 text-2xl font-bold font-sans text-left"
                        autoFocus
                        required
                      />
                      <span className="absolute right-3 px-2.5 py-1 rounded-xl bg-neutral-100 border border-neutral-200 text-xs font-bold text-[#cb202d] font-sans pointer-events-none">
                        {config.currency}
                      </span>
                    </div>

                    {/* Quick Amount Add Chips for Mobile Cashier */}
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {[0.5, 1.0, 1.5, 2.0, 3.0, 5.0, 10.0].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => {
                            const current = parseFloat(billAmount) || 0;
                            setBillAmount((current + val).toFixed(3));
                          }}
                          className="px-2.5 py-1.5 rounded-xl glass-panel-subtle hover:bg-white active:scale-95 text-neutral-800 text-xs font-sans font-bold transition-all cursor-pointer"
                        >
                          +{val.toFixed(3)}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setBillAmount("")}
                        className="px-2.5 py-1.5 rounded-xl glass-panel-subtle hover:bg-red-50/80 text-neutral-600 hover:text-red-600 text-xs font-bold transition-all cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Real-time points preview */}
                  <div className="p-3.5 glass-panel-subtle rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 font-sans">
                      <Sparkles className="w-4 h-4 text-[#cb202d]" />
                      <span>Points to be Earned:</span>
                    </div>
                    <span className="text-base font-black font-sans text-[#cb202d]">
                      +{calculatedPoints} pts
                    </span>
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={resetPOS}
                      className="px-4 py-3 rounded-2xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 text-xs font-bold transition-colors cursor-pointer font-sans"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={transactLoading || !billAmount || parseFloat(billAmount) <= 0}
                      className="flex-1 py-3.5 rounded-2xl bg-[#cb202d] hover:bg-[#b51a25] text-white text-sm font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-98 font-sans"
                    >
                      {transactLoading ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                          <span>Processing transaction...</span>
                        </>
                      ) : (
                        <>
                          <span>Confirm & Credit Points</span>
                          <Check className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB B: REDEEM REWARD / DISCOUNT */}
            {actionTab === "redeem" && (
              <div className="glass-panel rounded-3xl p-5 sm:p-6 shadow-lg space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 mb-1 font-sans">
                    Redeem Reward
                  </h4>
                  <p className="text-[11px] text-neutral-500 font-sans">
                    Deduct points from customer balance to grant an authentic dish, treat, or reward item.
                  </p>
                </div>

                {redeemError && (
                  <div className="p-3 rounded-2xl bg-red-50/80 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{redeemError}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5 font-sans">
                      Select Reward Item
                    </label>
                    <CustomGlassSelect
                      value={rewardTitle}
                      onChange={(val) => {
                        setRewardTitle(val);
                        const matched = activeRewards.find((r) => r.title === val);
                        if (matched) {
                          setRedeemPoints(matched.pointsRequired.toString());
                        }
                      }}
                      placeholder="Select Reward..."
                      options={[
                        ...activeRewards.map((r) => ({
                          value: r.title,
                          label: r.title,
                          badge: `${r.pointsRequired} pts`,
                          subtitle: r.category,
                        })),
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5 font-sans">
                      Points to Deduct
                    </label>
                    <input
                      type="number"
                      value={redeemPoints}
                      onChange={(e) => setRedeemPoints(e.target.value)}
                      className="glass-input w-full text-lg font-sans font-bold"
                      required
                    />
                  </div>

                  <div className="flex gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={resetPOS}
                      className="px-4 py-3 rounded-2xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 text-xs font-bold transition-colors cursor-pointer font-sans"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleRedeemPoints}
                      disabled={
                        redeemLoading ||
                        !redeemPoints ||
                        parseInt(redeemPoints) <= 0 ||
                        parseInt(redeemPoints) > identifiedCustomer.pointsBalance
                      }
                      className="flex-1 py-3.5 rounded-2xl bg-[#cb202d] hover:bg-[#b51a25] text-white text-sm font-bold transition-all disabled:opacity-40 cursor-pointer shadow-sm active:scale-98 flex items-center justify-center gap-2 font-sans"
                    >
                      {redeemLoading ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                          <span>Deducting points...</span>
                        </>
                      ) : (
                        <>
                          <span>Confirm Reward Redemption</span>
                          <Gift className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 3: Transaction Success Receipt Modal                     */}
        {/* ============================================================== */}
        {receipt && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="glass-panel rounded-3xl p-5 sm:p-7 max-w-sm w-full shadow-2xl text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-rose-50 border-2 border-rose-100 text-[#cb202d] flex items-center justify-center mx-auto mb-3 shadow-xs">
                <CheckCircle2 className="w-8 h-8 text-[#cb202d]" />
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-neutral-900 mb-1 font-sans">
                Transaction Successful!
              </h3>
              <p className="text-xs text-neutral-500 mb-4 font-mono">
                Receipt #: #{receipt.referenceCode}
              </p>

              <div className="glass-panel-subtle rounded-2xl p-4 mb-5 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Customer:</span>
                  <span className="font-bold text-neutral-900">{receipt.customerName}</span>
                </div>

                {receipt.billAmount && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Bill Amount:</span>
                    <span className="font-mono font-bold text-neutral-900">
                      {receipt.billAmount.toFixed(3)} {receipt.currency}
                    </span>
                  </div>
                )}

                {receipt.pointsEarned ? (
                  <div className="flex justify-between text-emerald-800 font-bold bg-emerald-50/90 px-2 py-1 rounded-lg">
                    <span>Points Added:</span>
                    <span className="font-mono">+{receipt.pointsEarned} pts</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-neutral-800 font-bold bg-neutral-100/90 px-2 py-1 rounded-lg">
                    <span>Points Redeemed:</span>
                    <span className="font-mono">-{receipt.pointsRedeemed} pts</span>
                  </div>
                )}

                <div className="pt-2 border-t border-neutral-200 flex justify-between font-extrabold text-sm">
                  <span className="text-neutral-900">New Balance:</span>
                  <span className="font-sans font-bold text-[#cb202d]">{receipt.newBalance} pts</span>
                </div>

                {receipt.tierUpgraded && (
                  <div className="p-2.5 bg-amber-50/90 text-amber-900 border border-amber-200 rounded-xl text-center font-bold mt-2 flex items-center justify-center gap-1.5 text-xs font-sans">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Customer tier upgraded to {receipt.tier}!</span>
                  </div>
                )}
              </div>

              <button
                onClick={resetPOS}
                className="w-full py-3.5 rounded-2xl bg-[#cb202d] hover:bg-[#b51a25] text-white text-sm font-bold transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2 font-sans"
              >
                <span>Next Customer</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Live Mobile Camera QR Scanner Modal */}
        {showCameraScanner && (
          <QrCameraScanner
            onScan={handleQrScan}
            onClose={() => setShowCameraScanner(false)}
          />
        )}

        {/* Install Guide Modal (Authenticated View) */}
        {showInstallGuide && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="glass-panel rounded-3xl p-6 max-w-sm w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
              <button
                type="button"
                onClick={() => setShowInstallGuide(false)}
                className="absolute top-4 end-4 p-1 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-[#cb202d] text-white flex items-center justify-center mx-auto mb-3 shadow-md">
                <Smartphone className="w-6 h-6" />
              </div>

              <h3 className="text-base font-bold text-center text-neutral-900 mb-1 font-sans">
                Install Cashier to Home Screen
              </h3>
              <p className="text-xs text-neutral-500 text-center mb-4 font-sans">
                Install a dedicated Cashier POS icon that opens this terminal directly:
              </p>

              <div className="space-y-3 glass-panel-subtle rounded-2xl p-4 text-xs text-neutral-800 font-sans">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#cb202d] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span>Tap the <strong>Share</strong> button <Share2 className="w-3.5 h-3.5 inline mx-0.5 text-[#cb202d]" /> in Safari or <strong>Menu (⋮)</strong> in Chrome.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#cb202d] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span>Select <strong>&quot;Add to Home Screen&quot;</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#cb202d] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span>Tap <strong>Add</strong>. The icon will be named <strong>xian Cashier</strong> and will open this Cashier POS terminal directly.</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowInstallGuide(false)}
                className="w-full mt-4 py-2.5 rounded-xl bg-[#cb202d] text-white text-xs font-bold hover:bg-[#b51a25] transition-colors cursor-pointer font-sans"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Mobile-Friendly Footer */}
      <footer className="border-t border-neutral-200 bg-white py-2.5 px-4 text-center text-[11px] text-neutral-400 font-sans">
        xian POS Terminal • Real-Time Sync with Customer Pass
      </footer>
    </div>
  );
}
