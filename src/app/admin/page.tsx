"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useBrand } from "@/components/BrandProvider";
import {
  LayoutDashboard,
  Gift,
  Users,
  User,
  Send,
  Store,
  TrendingUp,
  Award,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ShieldCheck,
  RefreshCw,
  X,
  Search,
  Upload,
  Camera,
  Smartphone,
  LifeBuoy,
  Ticket,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import confetti from "canvas-confetti";
import { IReward, IUser, ITransaction } from "@/lib/types";
import CustomGlassSelect from "@/components/CustomGlassSelect";

// Bilingual Dictionary for Admin Console
const i18n = {
  en: {
    langToggle: "English",
    superAdmin: "Super Admin",
    portalSubtitle: "Executive Portal",
    adminEmail: "Administrator Username",
    password: "Password",
    signIn: "Sign In to Admin",
    authenticating: "Authenticating...",
    defaultCredentials: "Administrator Credentials:",
    openCashier: "Cashier POS Terminal",
    openCustomer: "Customer Pass",
    returnHome: "Open Cashier Terminal",
    navAnalytics: "Analytics & KPIs",
    navCustomers: "Customers",
    navRewards: "Rewards Catalogue",
    navCashiers: "POS Cashiers",
    navBroadcast: "Notifications",
    navSupport: "Support Ticket",
    signOut: "Sign Out",
    home: "Cashier POS",
    analyticsTitle: "Executive Analytics & Metrics",
    analyticsSubtitle: "Real-time overview of loyalty performance, financial volume, and member activity.",
    refreshData: "Refresh Data",
    cardRevenue: "Total Revenue Volume",
    cardRevenueSub: (txs: number) => `From ${txs} total transactions`,
    cardIssued: "Points Issued",
    cardIssuedSub: "Credited for store purchases",
    cardRedeemed: "Points Redeemed",
    cardRedeemedSub: "Claimed for rewards & perks",
    cardMembers: "Active Members",
    cardMembersSub: "Registered loyalty customers",
    topCustomers: "Top Loyal Members",
    byLifetime: "Ranked by Lifetime Points",
    liveActivity: "Recent Activity Log",
    auditTrail: "Financial & Loyalty Audit",
    noTransactions: "No recorded transactions yet.",
    pts: "pts",
    bal: "Bal",
    customersTitle: "Customer Directory",
    customersSubtitle: "Complete overview of all registered members, points balances, and quick actions.",
    searchPlaceholder: "Search...",
    totalCustomers: "Total Registered Members",
    totalPointsHeld: "Points in Circulation",
    tblCustomer: "Member",
    tblPhoneEmail: "Contact",
    tblTier: "Tier",
    tblBalance: "Current Balance",
    tblLifetime: "Lifetime Points",
    tblJoined: "Joined Date",
    tblSendNotif: "Send Notice",
    rewardsTitle: "Rewards Catalogue",
    rewardsSubtitle: "Manage redeemable items, images, and point costs.",
    addReward: "Add New Reward",
    tblRewardTitle: "Reward Title",
    tblCategory: "Category",
    tblPointsCost: "Points Cost",
    tblRedemptions: "Redemptions",
    tblStatus: "Status",
    tblActions: "Actions",
    active: "Active",
    disabled: "Disabled",
    addRewardModalTitle: "Add New Reward",
    titleLabel: "Reward Title",
    descriptionLabel: "Description",
    rewardImage: "Image URL",
    rewardImageHelp: "Paste an image URL or choose a preset below",
    presets: "Quick Presets:",
    cancel: "Cancel",
    createReward: "Save Reward",
    deleteConfirm: "Are you sure you want to remove this reward?",
    cashiersTitle: "Cashier Accounts & POS Terminals",
    cashiersSubtitle: "Manage authorized staff and POS access PINs.",
    addCashier: "Add Cashier",
    tblStaffMember: "Staff Name",
    tblUsername: "Username",
    tblBranch: "Branch",
    tblPin: "PIN",
    authorized: "Active",
    suspended: "Suspended",
    deactivate: "Deactivate",
    reactivate: "Activate",
    addCashierModalTitle: "Create Cashier Account",
    fullName: "Full Name",
    usernameForPOS: "Username",
    createAccount: "Create Account",
    broadcastTitle: "Customer Broadcast & Notification Center",
    broadcastSubtitle: "Dispatch in-app notifications and promotional loyalty points boosts.",
    announcementTitle: "Announcement Title",
    notificationMessage: "Notification Message",
    optionalBonus: "Optional Bonus Points Gift",
    bonusHelp: "Set to 0 for a standard notification without a points grant.",
    audienceLabel: "Target Audience",
    audienceAll: "All Members",
    audienceGold: "VIP / Gold Tier",
    audienceSilver: "Silver Tier",
    audienceInactive: "Inactive Members",
    audienceSingle: "Specific Member",
    selectCustomer: "Select Customer",
    noCustomersFound: "No registered customers found",
    sendBroadcast: "Send Broadcast to All Members",
    sendToSingle: "Send Direct Notification",
    sendingBroadcast: "Dispatching Notification...",
    broadcastSuccessMsg: (bonusCount?: number, bonus?: string, recipientName?: string, pushDevices?: number) => {
      const pushNote = pushDevices && pushDevices > 0 ? ` (Real push delivered to ${pushDevices} device${pushDevices > 1 ? "s" : ""})` : "";
      return recipientName
        ? `Notification sent to ${recipientName}! ${bonusCount ? `+${bonus} bonus points credited.` : ""}${pushNote}`
        : `Broadcast sent successfully! ${bonusCount ? `+${bonus} points credited to ${bonusCount} members.` : ""}${pushNote}`;
    },
  },
  ar: {
    langToggle: "English",
    superAdmin: "Super Admin",
    portalSubtitle: "Executive Portal",
    adminEmail: "Administrator Email",
    password: "Password",
    signIn: "Sign In to Admin",
    authenticating: "Authenticating...",
    defaultCredentials: "Administrator Credentials:",
    openCashier: "Cashier POS Terminal",
    openCustomer: "Customer Pass",
    returnHome: "Open Cashier Terminal",
    navAnalytics: "Analytics & KPIs",
    navCustomers: "Customers",
    navRewards: "Rewards Catalogue",
    navCashiers: "POS Cashiers",
    navBroadcast: "Notifications",
    navSupport: "Support Ticket",
    signOut: "Sign Out",
    home: "Cashier POS",
    analyticsTitle: "Executive Analytics & Metrics",
    analyticsSubtitle: "Real-time overview of loyalty performance, financial volume, and member activity.",
    refreshData: "Refresh Data",
    cardRevenue: "Total Revenue Volume",
    cardRevenueSub: (txs: number) => `From ${txs} total transactions`,
    cardIssued: "Points Issued",
    cardIssuedSub: "Credited for store purchases",
    cardRedeemed: "Points Redeemed",
    cardRedeemedSub: "Claimed for rewards & perks",
    cardMembers: "Active Members",
    cardMembersSub: "Registered loyalty customers",
    topCustomers: "Top Loyal Members",
    byLifetime: "Ranked by Lifetime Points",
    liveActivity: "Recent Activity Log",
    auditTrail: "Financial & Loyalty Audit",
    noTransactions: "No recorded transactions yet.",
    pts: "pts",
    bal: "Bal",
    customersTitle: "Customer Directory",
    customersSubtitle: "Complete overview of all registered members, points balances, and quick actions.",
    searchPlaceholder: "Search...",
    totalCustomers: "Total Registered Members",
    totalPointsHeld: "Points in Circulation",
    tblCustomer: "Member",
    tblPhoneEmail: "Contact",
    tblTier: "Tier",
    tblBalance: "Current Balance",
    tblLifetime: "Lifetime Points",
    tblJoined: "Joined Date",
    tblSendNotif: "Send Notice",
    rewardsTitle: "Rewards Catalogue",
    rewardsSubtitle: "Manage redeemable items, images, and point costs.",
    addReward: "Add New Reward",
    tblRewardTitle: "Reward Title",
    tblCategory: "Category",
    tblPointsCost: "Points Cost",
    tblRedemptions: "Redemptions",
    tblStatus: "Status",
    tblActions: "Actions",
    active: "Active",
    disabled: "Disabled",
    addRewardModalTitle: "Add New Reward",
    titleLabel: "Reward Title",
    descriptionLabel: "Description",
    rewardImage: "Image URL",
    rewardImageHelp: "Paste an image URL or choose a preset below",
    presets: "Quick Presets:",
    cancel: "Cancel",
    createReward: "Save Reward",
    deleteConfirm: "Are you sure you want to remove this reward?",
    cashiersTitle: "Cashier Accounts & POS Terminals",
    cashiersSubtitle: "Manage authorized staff and POS access PINs.",
    addCashier: "Add Cashier",
    tblStaffMember: "Staff Name",
    tblUsername: "Username",
    tblBranch: "Branch",
    tblPin: "PIN",
    authorized: "Active",
    suspended: "Suspended",
    deactivate: "Deactivate",
    reactivate: "Activate",
    addCashierModalTitle: "Create Cashier Account",
    fullName: "Full Name",
    usernameForPOS: "Username",
    createAccount: "Create Account",
    broadcastTitle: "Customer Broadcast & Notification Center",
    broadcastSubtitle: "Dispatch in-app notifications and promotional loyalty points boosts.",
    announcementTitle: "Announcement Title",
    notificationMessage: "Notification Message",
    optionalBonus: "Optional Bonus Points Gift",
    bonusHelp: "Set to 0 for a standard notification without a points grant.",
    audienceLabel: "Target Audience",
    audienceAll: "All Members",
    audienceGold: "VIP / Gold Tier",
    audienceSilver: "Silver Tier",
    audienceInactive: "Inactive Members",
    audienceSingle: "Specific Member",
    selectCustomer: "Select Customer",
    noCustomersFound: "No registered customers found",
    sendBroadcast: "Send Broadcast to All Members",
    sendToSingle: "Send Direct Notification",
    sendingBroadcast: "Dispatching Notification...",
    broadcastSuccessMsg: (bonusCount?: number, bonus?: string, recipientName?: string, pushDevices?: number) => {
      const pushNote = pushDevices && pushDevices > 0 ? ` (Real push delivered to ${pushDevices} device${pushDevices > 1 ? "s" : ""})` : "";
      return recipientName
        ? `Notification sent to ${recipientName}! ${bonusCount ? `+${bonus} bonus points credited.` : ""}${pushNote}`
        : `Broadcast sent successfully! ${bonusCount ? `+${bonus} points credited to ${bonusCount} members.` : ""}${pushNote}`;
    },
  },
};

interface MetricsData {
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  activeCustomerCount: number;
  totalRevenueVolume: number;
  totalTransactions: number;
  cashierCount: number;
  rewardsCount: number;
  topCustomers: IUser[];
  recentTransactions: ITransaction[];
}

const ticketCategories = [
  {
    title: "Bug / System Glitch",
    desc: "Software errors, crashes, or glitches",
  },
  {
    title: "POS & Cashier",
    desc: "PIN, numpad, scanner, or counter issues",
  },
  {
    title: "Customer Pass & QR",
    desc: "Pass display, QR scanner, or points balance",
  },
  {
    title: "Rewards Catalogue",
    desc: "Claim codes, reward redemption, or images",
  },
  {
    title: "Notifications & Push",
    desc: "Web push, alerts, or broadcasts",
  },
  {
    title: "Other Technical Request",
    desc: "Customizations or general inquiries",
  },
];

export default function AdminPage() {
  const { config, formatCurrency } = useBrand();

  // Language State: English by default
  const [lang, setLang] = useState<"en" | "ar">("en");

  // Authentication State with permanent dual persistence
  const ADMIN_CACHE_KEY = "xian_admin_cached";
  const ADMIN_TOKEN_KEY = "xian_admin_token";
  const [admin, setAdmin] = useState<{ id: string; name: string; email: string } | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Login Form State
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"analytics" | "customers" | "rewards" | "cashiers" | "broadcast" | "support">("analytics");

  // Customer Directory State
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");

  // Analytics State
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Rewards State
  const [rewardsList, setRewardsList] = useState<IReward[]>([]);
  const [showAddRewardModal, setShowAddRewardModal] = useState(false);
  const [newReward, setNewReward] = useState({
    title: "",
    description: "",
    pointsRequired: 100,
    category: "Drinks",
    imageUrl: "",
    stock: 999,
    claimCode: "",
  });
  const [createRewardLoading, setCreateRewardLoading] = useState(false);
  const [createRewardError, setCreateRewardError] = useState<string | null>(null);

  // Cashiers State
  const [cashiersList, setCashiersList] = useState<any[]>([]);
  const [showAddCashierModal, setShowAddCashierModal] = useState(false);
  const [newCashier, setNewCashier] = useState({
    name: "",
    username: "",
    branchName: "Main Branch",
    staffPin: "",
  });

  // Customer List for Targeted Notifications
  const [customersList, setCustomersList] = useState<{ id: string; name: string; email?: string; phone?: string; pointsBalance: number; tier?: string; lifetimePoints?: number; createdAt?: string }[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Broadcast & Targeted Notification State
  const [broadcastAudience, setBroadcastAudience] = useState<"all" | "single">("all");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastBonus, setBroadcastBonus] = useState<string>("0");
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);

  // Support Ticket State (Web3Forms to info@weblix-jo.com)
  const [ticketCategory, setTicketCategory] = useState("Bug / System Glitch");
  const [ticketCategoryDesc, setTicketCategoryDesc] = useState("Software errors, crashes, or glitches");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketPhone, setTicketPhone] = useState("");
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [ticketRefNumber, setTicketRefNumber] = useState<string | null>(null);

  // Admin PWA Installation States
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandaloneApp, setIsStandaloneApp] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  // Admin Console is 100% English
  useEffect(() => {
    setLang("en");
    if (typeof window !== "undefined") {
      localStorage.setItem("xian_admin_lang", "en");
    }
  }, []);

  // Admin PWA Install Detection
  useEffect(() => {
    if (typeof window === "undefined") return;
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
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setDeferredPrompt(null);
    } else {
      setShowInstallGuide(true);
    }
  };

  const t = i18n.en;

  // Check Admin Session with dual persistence
  const checkAdminSession = async () => {
    try {
      setLoadingSession(true);
      const headers: Record<string, string> = {};
      if (typeof window !== "undefined") {
        const savedToken = localStorage.getItem(ADMIN_TOKEN_KEY);
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
      if (res.ok && data.authenticated && data.user.role === "super_admin") {
        setAdmin(data.user);
        if (typeof window !== "undefined") {
          localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(data.user));
          if (data.token) localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
        }
      } else {
        if (typeof window !== "undefined" && !localStorage.getItem(ADMIN_TOKEN_KEY)) {
          setAdmin(null);
        }
      }
    } catch {
      // Keep cached session on connection glitch
    } finally {
      setLoadingSession(false);
    }
  };

  // Load Analytics
  const loadMetrics = async () => {
    try {
      setLoadingMetrics(true);
      const res = await fetch("/api/admin/analytics");
      const data = await res.json();
      if (data.success) {
        setMetrics(data.metrics);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMetrics(false);
    }
  };

  // Load Rewards
  const loadRewards = async () => {
    try {
      const res = await fetch("/api/admin/rewards");
      const data = await res.json();
      if (data.success) setRewardsList(data.rewards);
    } catch (e) {
      console.error(e);
    }
  };

  // Load Cashiers
  const loadCashiers = async () => {
    try {
      const res = await fetch("/api/admin/cashiers");
      const data = await res.json();
      if (data.success) setCashiersList(data.cashiers);
    } catch (e) {
      console.error(e);
    }
  };

  // Load Customers for targeted broadcast
  const loadCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const res = await fetch("/api/admin/customers");
      const data = await res.json();
      if (data.success) setCustomersList(data.customers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCustomers(false);
    }
  };

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const cachedAdmin = localStorage.getItem(ADMIN_CACHE_KEY);
        if (cachedAdmin) {
          setAdmin(JSON.parse(cachedAdmin));
          setLoadingSession(false);
        }
      }
    } catch (e) {
      console.warn("Admin cache read error:", e);
    }
    checkAdminSession();
  }, []);

  useEffect(() => {
    if (admin) {
      loadMetrics();
      loadRewards();
      loadCashiers();
      loadCustomers();
    }
  }, [admin]);

  // Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await fetch("/api/auth/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          role: "super_admin",
          username: emailInput.trim(),
          email: emailInput.trim(),
          password: passwordInput,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdmin(data.user);
        if (typeof window !== "undefined") {
          localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(data.user));
          if (data.token) localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
        }
      } else {
        setLoginError(data.error || "Invalid administrator credentials");
      }
    } catch (err: any) {
      setLoginError(err.message || "Network error");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    if (typeof window !== "undefined") {
      localStorage.removeItem(ADMIN_CACHE_KEY);
      localStorage.removeItem(ADMIN_TOKEN_KEY);
    }
    setAdmin(null);
  };



  // Helper for direct device image file upload & client-side compression to lightweight crisp JPEG (~40-60KB)
  const handleRewardImageUpload = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setCreateRewardError("Please select a valid image file (JPG, PNG, WebP).");
      return;
    }
    setCreateRewardError(null);
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 800;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.82);
        setNewReward((prev) => ({ ...prev, imageUrl: compressedBase64 }));
      };
      img.onerror = () => {
        setCreateRewardError("Unable to read selected image file. Please try another photo.");
      };
      img.src = readerEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Add Reward
  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateRewardLoading(true);
    setCreateRewardError(null);
    try {
      const res = await fetch("/api/admin/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReward),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowAddRewardModal(false);
        setNewReward({ title: "", description: "", pointsRequired: 100, category: "Drinks", imageUrl: "", stock: 999, claimCode: "" });
        await loadRewards();
      } else {
        setCreateRewardError(data.error || "Failed to save reward. Please check required fields.");
      }
    } catch (e: any) {
      console.error(e);
      setCreateRewardError(e.message || "Server connection error");
    } finally {
      setCreateRewardLoading(false);
    }
  };

  // Delete Reward
  const handleDeleteReward = async (id: string) => {
    if (!confirm(t.deleteConfirm)) return;
    try {
      await fetch(`/api/admin/rewards?id=${id}`, { method: "DELETE" });
      await loadRewards();
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle Reward Active State
  const handleToggleReward = async (id: string, current: boolean) => {
    try {
      await fetch("/api/admin/rewards", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !current }),
      });
      await loadRewards();
    } catch (e) {
      console.error(e);
    }
  };

  // Create Cashier
  const handleCreateCashier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/cashiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCashier),
      });
      if (res.ok) {
        setShowAddCashierModal(false);
        setNewCashier({ name: "", username: "", branchName: "Downtown Flagship", staffPin: "1234" });
        await loadCashiers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle Cashier Active State
  const handleToggleCashier = async (id: string, current: boolean) => {
    try {
      await fetch("/api/admin/cashiers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !current }),
      });
      await loadCashiers();
    } catch (e) {
      console.error(e);
    }
  };

  // Send Broadcast / Targeted Notification
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (broadcastAudience === "single" && !selectedCustomerId) {
      setBroadcastError("Please select a target customer");
      return;
    }

    setBroadcastSending(true);
    setBroadcastSuccess(null);
    setBroadcastError(null);

    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: broadcastTitle,
          message: broadcastMessage,
          bonusPoints: parseInt(broadcastBonus) || 0,
          audience: broadcastAudience,
          targetCustomerId: broadcastAudience === "single" ? selectedCustomerId : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBroadcastSuccess(
          t.broadcastSuccessMsg(data.bonusCreditedTo, broadcastBonus, data.recipientName, data.pushDevicesSent)
        );
        setBroadcastTitle("");
        setBroadcastMessage("");
        setBroadcastBonus("0");
        await loadMetrics();
        await loadCustomers();
      } else {
        setBroadcastError(data.error || "Failed to send notification");
      }
    } catch (e: any) {
      setBroadcastError(e.message || "Network error");
    } finally {
      setBroadcastSending(false);
    }
  };

  // Submit Support Ticket to Weblix (Web3Forms to info@weblix-jo.com)
  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketTitle.trim() || !ticketMessage.trim()) return;

    setTicketSubmitting(true);
    setTicketSuccess(null);
    setTicketError(null);

    const systemInfo =
      typeof window !== "undefined"
        ? `OS: ${navigator.platform} | Browser: ${navigator.userAgent.slice(0, 120)} | Screen: ${screen.width}x${screen.height} | Viewport: ${window.innerWidth}x${window.innerHeight} | URL: ${window.location.href} | Time: ${new Date().toISOString()}`
        : "N/A";
    const ticketId = `XIAN-TK-${Math.floor(1000 + Math.random() * 9000)}`;
    const payload = {
      title: ticketTitle.trim(),
      category: `${ticketCategory} (${ticketCategoryDesc})`,
      urgency: "Medium",
      message: ticketMessage.trim(),
      reporterName: admin?.name || "Store Admin",
      reporterContact: ticketPhone.trim() || admin?.email || "info@weblix-jo.com",
      systemInfo,
      ticketId,
    };

    let succeeded = false;

    // Primary: internal API route
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (typeof window !== "undefined") {
        const savedToken = localStorage.getItem(ADMIN_TOKEN_KEY);
        if (savedToken) {
          headers["x-staff-auth"] = savedToken;
          headers["Authorization"] = `Bearer ${savedToken}`;
        }
      }
      const res = await fetch("/api/admin/ticket", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        succeeded = true;
        setTicketRefNumber(data.ticketId || ticketId);
      }
    } catch (_) {
      // fall through to client-side fallback
    }

    // Fallback: direct Web3Forms submission
    if (!succeeded) {
      try {
        const w3Res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_key: "7f0e27f4-7df7-4105-af7a-985d05cc02d1",
            subject: `[${ticketId}] ${payload.title}`,
            from_name: payload.reporterName,
            message: `Category: ${payload.category}\n\nDescription:\n${payload.message}\n\nContact: ${payload.reporterContact}\n\nSystem:\n${systemInfo}`,
          }),
        });
        const w3Data = await w3Res.json();
        if (w3Data.success) {
          succeeded = true;
          setTicketRefNumber(ticketId);
        }
      } catch (_) {
        // both paths failed
      }
    }

    if (succeeded) {
      setTicketSuccess("dispatched");
      confetti({ particleCount: 45, spread: 65 });
      setTicketTitle("");
      setTicketMessage("");
      setTicketPhone("");
    } else {
      setTicketError("Unable to send ticket. Please check your connection and try again.");
    }
    setTicketSubmitting(false);
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-300 border-t-neutral-900 animate-spin" />
      </div>
    );
  }

  // Admin Login Screen with Language Switcher
  if (!admin) {
    return (
      <>
      <div
        dir="ltr"
        className="min-h-screen bg-[#FAF5F2] flex flex-col justify-between p-4 sm:p-6 transition-all"
      >
        <div className="max-w-sm w-full mx-auto my-auto py-4">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4 shadow-md overflow-hidden p-1.5 border border-neutral-200">
              <img src="/logo.png" alt="xian" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-bold font-sans text-neutral-900 mb-1">
              {config.storeName}
            </h1>
            <p className="text-xs text-neutral-500">{t.portalSubtitle}</p>
          </div>

          <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-xl border border-neutral-200/80">
            {loginError && (
              <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  {t.adminEmail}
                </label>
                <input
                  type="text"
                  autoCapitalize="none"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder=""
                  className="glass-input w-full px-4 py-3 rounded-2xl text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  {t.password}
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder=""
                  className="glass-input w-full px-4 py-3 rounded-2xl text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3.5 rounded-2xl bg-[#cb202d] hover:bg-[#b51a25] text-white text-sm font-bold transition-all disabled:opacity-50 mt-2 cursor-pointer shadow-md hover:shadow-lg active:scale-98"
              >
                {loginLoading ? t.authenticating : t.signIn}
              </button>
            </form>
          </div>
        </div>

        <div className="text-center text-xs text-neutral-500 py-4 flex items-center justify-center gap-4">
          <Link href="/cashier" className="hover:text-[#cb202d] underline flex items-center gap-1 font-medium transition-colors">
            <Store className="w-3.5 h-3.5 text-[#cb202d]" />
            {t.openCashier}
          </Link>
          <span className="text-neutral-300">•</span>
          <Link href="/customer" className="hover:text-[#cb202d] underline font-medium transition-colors">
            {t.openCustomer}
          </Link>
        </div>
      </div>

      {/* Install Guide Modal */}
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

            <h3 className="text-base font-bold text-center text-neutral-900 mb-1">
              Install Admin Dashboard
            </h3>
            <p className="text-xs text-neutral-500 text-center mb-4">
              Add a dedicated Admin icon that opens this dashboard directly:
            </p>

            <div className="space-y-3 glass-panel-subtle rounded-2xl p-4 text-xs text-neutral-800">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#cb202d] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <span>Tap the <strong>Share</strong> button in Safari or <strong>Menu (⋮)</strong> in Chrome.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#cb202d] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <span>Select <strong>&quot;Add to Home Screen&quot;</strong>.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#cb202d] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                <span>Tap <strong>Add</strong>. The icon will be named <strong>xian Admin</strong> and will open the dashboard directly.</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowInstallGuide(false)}
              className="w-full mt-4 py-2.5 rounded-xl bg-[#cb202d] hover:bg-[#b51a25] text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
            >
              Got It
            </button>
          </div>
        </div>
      )}
      </>
    );
  }

  const navTabs = [
    { id: "analytics", label: t.navAnalytics, icon: LayoutDashboard },
    { id: "customers", label: t.navCustomers, icon: Users },
    { id: "rewards", label: t.navRewards, icon: Gift },
    { id: "cashiers", label: t.navCashiers, icon: ShieldCheck },
    { id: "broadcast", label: t.navBroadcast, icon: Send },
    { id: "support", label: t.navSupport, icon: LifeBuoy },
  ] as const;

  // Super Admin Layout (100% English, Centered & Balanced Layout)
  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-[#FAF5F2] flex flex-col lg:flex-row transition-all text-neutral-900"
    >
      {/* MOBILE & IPAD PORTRAIT TOP HEADER (< lg: 1024px) */}
      <div className="lg:hidden bg-white/95 backdrop-blur-md border-b border-[#EBD3C8] sticky top-0 z-30">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 overflow-hidden p-1 border border-neutral-200 shadow-xs">
              <img src="/logo.png" alt="xian" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-sm text-neutral-900 block leading-tight truncate font-sans">
                {config.storeName}
              </span>
              <span className="text-[10px] text-[#cb202d] uppercase font-bold tracking-normal font-sans block mt-0.5">
                {t.superAdmin}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              href="/cashier"
              title={t.openCashier}
              className="px-2.5 py-1.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-medium text-neutral-800 transition-colors flex items-center gap-1 shadow-2xs"
            >
              <Store className="w-3.5 h-3.5 text-[#cb202d]" />
              <span className="hidden sm:inline">{t.openCashier}</span>
            </Link>

            {!isStandaloneApp && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="px-2.5 py-1.5 rounded-xl border border-red-200 bg-red-50/70 hover:bg-red-50 text-xs font-semibold text-[#cb202d] flex items-center gap-1 transition-colors cursor-pointer"
                title="Install Admin Dashboard"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Install</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              title={t.signOut}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Horizontal Navigation Pills (Touch-Optimized for Mobile & iPad Portrait) */}
        <div className="px-3 py-2 border-t border-[#EBD3C8]/60 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 rounded-xl text-xs font-medium shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#cb202d] text-white shadow-xs font-semibold"
                    : "bg-white/80 text-neutral-700 hover:bg-white border border-neutral-200/80"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-[#cb202d]"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* DESKTOP & IPAD LANDSCAPE SIDEBAR (>= lg: 1024px) */}
      <aside className="hidden lg:flex w-64 xl:w-72 bg-white/70 backdrop-blur-2xl border-e border-white/60 shadow-xs flex-col justify-between p-5 min-h-screen shrink-0 sticky top-0 h-screen">
        <div>
          {/* Brand header */}
          <div className="flex items-center gap-3 px-2 py-3 mb-5 border-b border-[#EBD3C8]/60">
            <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center flex-shrink-0 overflow-hidden p-1 border border-neutral-200 shadow-xs">
              <img src="/logo.png" alt="xian" className="w-full h-full object-contain" />
            </div>
            <div className="truncate">
              <span className="font-bold text-base text-neutral-900 block leading-tight truncate font-sans">
                {config.storeName}
              </span>
              <span className="text-[11px] text-[#cb202d] uppercase font-bold tracking-normal font-sans block mt-0.5">
                {t.superAdmin}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#cb202d] text-white shadow-sm font-semibold"
                      : "text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100/70"
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-white" : "text-[#cb202d]"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-[#EBD3C8]/60 space-y-3">
          <div className="px-2">
            <span className="text-xs font-semibold text-neutral-900 block truncate">
              {admin.name}
            </span>
            <span className="text-[11px] text-neutral-400 font-mono block truncate" dir="ltr">
              {admin.email}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <Link
              href="/cashier"
              className="text-xs text-[#cb202d] hover:text-[#b51a25] font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Store className="w-3.5 h-3.5 text-[#cb202d]" />
              {t.openCashier}
            </Link>
            <div className="flex items-center gap-2">
              {!isStandaloneApp && (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="text-xs text-[#cb202d] hover:text-[#b51a25] flex items-center gap-1 cursor-pointer font-semibold"
                  title="Install Admin App"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Install
                </button>
              )}
              <button
                onClick={handleLogout}
                className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                {t.signOut}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-10 max-w-6xl w-full mx-auto overflow-y-auto">
        {/* TAB 1: EXECUTIVE ANALYTICS & METRICS */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold font-sans text-neutral-900 tracking-tight">
                  {t.analyticsTitle}
                </h1>
                <p className="text-xs text-neutral-500 mt-0.5 font-sans">
                  {t.analyticsSubtitle}
                </p>
              </div>

              <button
                onClick={loadMetrics}
                disabled={loadingMetrics}
                className="px-4 py-2.5 rounded-2xl glass-panel hover:bg-white text-xs font-semibold text-[#cb202d] flex items-center gap-2 self-start transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingMetrics ? "animate-spin" : ""}`} />
                <span>{t.refreshData}</span>
              </button>
            </div>

            {/* Metrics Cards Grid - Clean Minimalist Luxury Glass */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              {/* Card 2: Points Issued */}
              <div className="glass-panel rounded-3xl p-5 sm:p-6 transition-all hover:shadow-md hover:border-[#cb202d]/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold text-neutral-500">{t.cardIssued}</span>
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#cb202d] flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-[#cb202d] font-sans" dir="ltr">
                  +{metrics?.totalPointsIssued.toLocaleString() || 0}
                </div>
                <span className="text-[11px] text-neutral-400 mt-1 block font-sans">
                  {t.cardIssuedSub}
                </span>
              </div>

              {/* Card 3: Points Redeemed */}
              <div className="glass-panel rounded-3xl p-5 sm:p-6 transition-all hover:shadow-md hover:border-[#cb202d]/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold text-neutral-500">{t.cardRedeemed}</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-neutral-800 font-sans" dir="ltr">
                  -{metrics?.totalPointsRedeemed.toLocaleString() || 0}
                </div>
                <span className="text-[11px] text-neutral-400 mt-1 block font-sans">
                  {t.cardRedeemedSub}
                </span>
              </div>

              {/* Card 4: Active Customer Base */}
              <div className="glass-panel rounded-3xl p-5 sm:p-6 transition-all hover:shadow-md hover:border-[#cb202d]/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold text-neutral-500">{t.cardMembers}</span>
                  <div className="w-8 h-8 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-neutral-900" dir="ltr">
                  {metrics?.activeCustomerCount || 0}
                </div>
                <span className="text-[11px] text-neutral-400 mt-1 block">
                  {t.cardMembersSub}
                </span>
              </div>
            </div>

            {/* Clean Recent Activity & Top Customer Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Customers summary */}
              <div className="glass-panel rounded-3xl p-6 sm:p-7 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#EBD3C8]/60">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#cb202d]" />
                    <h3 className="text-sm font-bold text-neutral-900 font-sans">{t.topCustomers}</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab("customers")}
                    className="text-xs text-[#cb202d] hover:underline font-semibold cursor-pointer"
                  >
                    View All Members →
                  </button>
                </div>

                <div className="divide-y divide-[#EBD3C8]/40">
                  {metrics?.topCustomers.slice(0, 5).map((cust, idx) => (
                    <div key={cust._id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-neutral-100 text-neutral-800 text-xs font-mono font-semibold flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-neutral-900">{cust.name}</span>
                            <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold bg-rose-50 text-[#cb202d] border border-rose-100">
                              {cust.tier}
                            </span>
                          </div>
                          <span className="text-[11px] text-neutral-400 font-mono block" dir="ltr">
                            {cust.phone || cust.email}
                          </span>
                        </div>
                      </div>

                      <div className={lang === "ar" ? "text-left" : "text-right"}>
                        <span className="text-xs font-bold font-mono text-[#cb202d] block" dir="ltr">
                          {cust.lifetimePoints} {t.pts}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono" dir="ltr">
                          {t.bal}: {cust.pointsBalance}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity Feed */}
              <div className="glass-panel rounded-3xl p-6 sm:p-7 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#EBD3C8]/60">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-600" />
                    <h3 className="text-sm font-bold text-neutral-900 font-sans">{t.liveActivity}</h3>
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400">{t.auditTrail}</span>
                </div>

                {metrics?.recentTransactions.length === 0 ? (
                  <p className="text-xs text-neutral-400 py-8 text-center">{t.noTransactions}</p>
                ) : (
                  <div className="divide-y divide-[#EBD3C8]/40">
                    {metrics?.recentTransactions.slice(0, 5).map((tx) => (
                      <div key={tx._id} className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${
                                tx.type === "EARN"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : "bg-amber-50 text-amber-800 border-amber-200"
                              }`}
                            >
                              {tx.type === "EARN" ? "Earned" : "Redeemed"}
                            </span>
                            <span className="font-semibold text-neutral-900">{tx.customerName}</span>
                          </div>
                          <span className="text-[10px] text-neutral-400 font-mono block">
                            {tx.referenceCode} • {tx.branchName || "Main"}
                          </span>
                        </div>

                        <div className={lang === "ar" ? "text-left" : "text-right"}>
                          <span
                            dir="ltr"
                            className={`font-mono font-bold block ${
                              tx.points > 0 ? "text-emerald-700" : "text-[#cb202d]"
                            }`}
                          >
                            {tx.points > 0 ? `+${tx.points}` : tx.points} {t.pts}
                          </span>
                          {tx.billAmount && (
                            <span className="text-[10px] text-neutral-400 font-mono block" dir="ltr">
                              {tx.billAmount.toFixed(3)} {config.currency}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CUSTOMERS DIRECTORY */}
        {activeTab === "customers" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold font-sans text-neutral-900 tracking-tight">
                  {t.customersTitle}
                </h1>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {t.customersSubtitle}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3.5 py-1.5 rounded-xl bg-white border border-neutral-200 shadow-2xs text-xs">
                  <span className="text-neutral-500 font-sans text-[11px] me-1.5">{t.totalCustomers}:</span>
                  <span className="font-bold text-[#cb202d]">{customersList.length}</span>
                </div>
                <button
                  onClick={loadCustomers}
                  disabled={loadingCustomers}
                  className="px-3.5 py-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-semibold text-[#cb202d] flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingCustomers ? "animate-spin" : ""}`} />
                  <span>{t.refreshData}</span>
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="glass-panel-subtle rounded-2xl p-3 shadow-xs flex items-center gap-2.5">
              <Search className="w-4 h-4 text-neutral-400 flex-shrink-0" />
              <input
                type="text"
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full text-xs bg-transparent focus:outline-none text-neutral-900 placeholder-neutral-400 font-sans"
              />
              {customerSearchQuery && (
                <button
                  onClick={() => setCustomerSearchQuery("")}
                  className="text-neutral-400 hover:text-neutral-700 text-xs px-2 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Customers Table */}
            <div className="glass-panel rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-800 font-semibold">
                      <th className="py-3.5 px-5 text-start">{t.tblCustomer}</th>
                      <th className="py-3.5 px-4 text-start">{t.tblPhoneEmail}</th>
                      <th className="py-3.5 px-4 text-start">{t.tblTier}</th>
                      <th className="py-3.5 px-4 text-start">{t.tblBalance}</th>
                      <th className="py-3.5 px-5 text-end">{t.tblActions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200/60">
                    {customersList
                      .filter((c) => {
                        if (!customerSearchQuery.trim()) return true;
                        const q = customerSearchQuery.toLowerCase().trim();
                        return (
                          (c.name && c.name.toLowerCase().includes(q)) ||
                          (c.phone && c.phone.includes(q)) ||
                          (c.email && c.email.toLowerCase().includes(q))
                        );
                      })
                      .map((c) => (
                        <tr key={c.id} className="hover:bg-neutral-50/80 transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-[#cb202d] text-white font-semibold text-xs flex items-center justify-center flex-shrink-0 shadow-2xs">
                                {c.name ? c.name.charAt(0).toUpperCase() : "C"}
                              </div>
                              <div>
                                <span className="font-semibold text-neutral-900 block">{c.name}</span>
                                {c.email && (
                                  <span className="text-[11px] text-neutral-400 font-mono block" dir="ltr">
                                    {c.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-neutral-600" dir="ltr">
                            {c.phone || "—"}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border bg-rose-50 text-[#cb202d] border-rose-100">
                              {c.tier || "Member"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-neutral-900 font-sans">
                            {c.pointsBalance.toLocaleString()} {t.pts}
                          </td>
                          <td className="py-3.5 px-5 text-end">
                            <button
                              onClick={() => {
                                setSelectedCustomerId(c.id);
                                setBroadcastAudience("single");
                                setActiveTab("broadcast");
                              }}
                              className="px-3 py-1.5 rounded-xl bg-neutral-50 hover:bg-[#cb202d] text-neutral-700 hover:text-white border border-neutral-200 text-[11px] font-semibold transition-all flex items-center gap-1.5 ms-auto cursor-pointer shadow-2xs"
                            >
                              <Send className="w-3 h-3" />
                              <span>{t.tblSendNotif}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    {customersList.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs text-neutral-400">
                          {t.noCustomersFound}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: REWARDS CATALOGUE MANAGEMENT */}
        {activeTab === "rewards" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold font-sans text-neutral-900 tracking-tight">
                  {t.rewardsTitle}
                </h1>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {t.rewardsSubtitle}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddRewardModal(true)}
                className="px-4 py-2.5 rounded-xl bg-[#cb202d] text-white text-xs font-bold hover:bg-[#b51a25] transition-all flex items-center gap-2 shadow-xs cursor-pointer self-start sm:self-auto shrink-0 active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>{t.addReward}</span>
              </button>
            </div>

            {rewardsList.length === 0 ? (
              <div className="bg-white border border-neutral-200 rounded-3xl p-10 text-center shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 text-[#cb202d] flex items-center justify-center mx-auto mb-3 border border-rose-100">
                  <Gift className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-neutral-900 mb-1">No Rewards Created Yet</h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-4">
                  Add items customers can redeem with their loyalty points using photos directly from your device.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddRewardModal(true)}
                  className="px-4 py-2 rounded-xl bg-[#cb202d] text-white text-xs font-bold hover:bg-[#b51a25] transition-colors cursor-pointer"
                >
                  Create First Reward
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {rewardsList.map((reward) => (
                  <div
                    key={reward._id}
                    className="glass-panel rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Image Thumbnail Banner */}
                      <div className="relative h-44 sm:h-48 w-full bg-[#FAF5F2] overflow-hidden border-b border-[#EBD3C8]/60">
                        {reward.imageUrl ? (
                          <img
                            src={reward.imageUrl}
                            alt={reward.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-300">
                            <Gift className="w-12 h-12" />
                          </div>
                        )}

                        {/* Points Cost Floating Badge */}
                        <div className="absolute top-3 end-3 px-3 py-1 rounded-full bg-[#cb202d] text-white shadow-sm flex items-center gap-1 font-mono text-xs font-bold">
                          <span>{reward.pointsRequired}</span>
                          <span className="text-[10px] opacity-90 uppercase font-sans">pts</span>
                        </div>

                        {/* Category & Claim Code Floating Badges */}
                        <div className="absolute top-3 start-3 flex items-center gap-1.5">
                          <div className="px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-xs text-neutral-900 border border-neutral-200 text-[10px] font-semibold shadow-2xs">
                            {reward.category}
                          </div>
                          <div className="px-2.5 py-1 rounded-full bg-[#0A52A9] text-[#F4EECF] font-mono text-[10px] font-black shadow-2xs">
                            CODE: {reward.claimCode || "10"}
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 sm:p-5">
                        <h3 className="text-sm sm:text-base font-bold text-neutral-900 leading-snug line-clamp-1 mb-1 font-sans">
                          {reward.title}
                        </h3>
                        <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed min-h-[2rem] font-sans">
                          {reward.description || "Specialty loyalty catalogue item."}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Controls Bar */}
                    <div className="px-4 py-3 bg-neutral-50/50 border-t border-neutral-200/60 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleReward(reward._id, reward.isActive)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all cursor-pointer ${
                            reward.isActive
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                              : "bg-neutral-100 text-neutral-500 border-neutral-200 hover:bg-neutral-200"
                          }`}
                        >
                          {reward.isActive ? "● Active" : "○ Disabled"}
                        </button>

                        <span className="text-[11px] text-neutral-400 font-sans" title="Total redemptions">
                          {reward.redemptionCount || 0} claimed
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteReward(reward._id)}
                        className="p-1.5 rounded-xl text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete Reward"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CASHIER STAFF ACCOUNTS */}
        {activeTab === "cashiers" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold font-sans text-neutral-900 tracking-tight">
                  {t.cashiersTitle}
                </h1>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {t.cashiersSubtitle}
                </p>
              </div>

              <button
                onClick={() => setShowAddCashierModal(true)}
                className="px-4 py-2 rounded-xl bg-[#cb202d] text-white text-xs font-semibold hover:bg-[#b51a25] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0 active:scale-98"
              >
                <Plus className="w-3.5 h-3.5" />
                {t.addCashier}
              </button>
            </div>

            <div className="glass-panel rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-[620px] w-full text-start text-xs">
                  <thead className="bg-neutral-50/80 border-b border-neutral-200 font-semibold text-neutral-800 font-sans">
                    <tr>
                      <th className="py-3 px-5 text-start">{t.tblStaffMember}</th>
                      <th className="py-3 px-4 text-start">{t.tblUsername}</th>
                      <th className="py-3 px-4 text-start">{t.tblBranch}</th>
                      <th className="py-3 px-4 text-start">{t.tblPin}</th>
                      <th className="py-3 px-4 text-start">{t.tblStatus}</th>
                      <th className="py-3 px-5 text-end">{t.tblActions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200/60">
                    {cashiersList.map((c) => (
                      <tr key={c.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="py-3.5 px-5 font-semibold text-neutral-900">{c.name}</td>
                        <td className="py-3.5 px-4 font-mono text-neutral-600" dir="ltr">{c.username}</td>
                        <td className="py-3.5 px-4 text-neutral-600">{c.branchName}</td>
                        <td className="py-3.5 px-4 font-mono tracking-wider font-bold text-neutral-900" dir="ltr">
                          {c.staffPin}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                              c.isActive
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-neutral-100 text-neutral-500 border-neutral-200"
                            }`}
                          >
                            {c.isActive ? t.authorized : t.suspended}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-end">
                          <button
                            onClick={() => handleToggleCashier(c.id, c.isActive)}
                            className="text-[#cb202d] hover:text-[#b51a25] text-xs underline font-semibold cursor-pointer"
                          >
                            {c.isActive ? t.deactivate : t.reactivate}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: BROADCAST / NOTIFICATION CENTER */}
        {activeTab === "broadcast" && (
          <div className="max-w-xl space-y-6">
            <div>
              <h1 className="text-2xl font-bold font-sans text-neutral-900 tracking-tight">
                {t.broadcastTitle}
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5 font-sans">
                {t.broadcastSubtitle}
              </p>
            </div>

            <form onSubmit={handleSendBroadcast} className="glass-panel rounded-3xl p-6 sm:p-8 space-y-5">
              {broadcastSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{broadcastSuccess}</span>
                </div>
              )}

              {broadcastError && (
                <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{broadcastError}</span>
                </div>
              )}

              {/* Audience Selector with Modern Glass Pills */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-2 font-sans">
                  {t.audienceLabel}
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  <button
                    type="button"
                    onClick={() => setBroadcastAudience("all")}
                    className={`py-3 px-4 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                      broadcastAudience === "all"
                        ? "bg-[#cb202d] text-white border-[#cb202d] shadow-md shadow-[#cb202d]/25"
                        : "bg-white/80 hover:bg-white text-neutral-700 border-neutral-200/90 shadow-2xs hover:border-[#cb202d]/40"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>{t.audienceAll}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBroadcastAudience("single")}
                    className={`py-3 px-4 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                      broadcastAudience === "single"
                        ? "bg-[#cb202d] text-white border-[#cb202d] shadow-md shadow-[#cb202d]/25"
                        : "bg-white/80 hover:bg-white text-neutral-700 border-neutral-200/90 shadow-2xs hover:border-[#cb202d]/40"
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>{t.audienceSingle}</span>
                  </button>
                </div>
              </div>

              {/* Single Customer Selection Dropdown */}
              {broadcastAudience === "single" && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1.5 font-sans">
                    {t.selectCustomer}
                  </label>
                  {loadingCustomers ? (
                    <div className="p-3 text-xs text-neutral-400 font-sans">Loading customers directory...</div>
                  ) : customersList.length === 0 ? (
                    <div className="p-3 text-xs text-amber-800 bg-amber-50/80 rounded-xl border border-amber-200">
                      {t.noCustomersFound}
                    </div>
                  ) : (
                    <CustomGlassSelect
                      value={selectedCustomerId}
                      onChange={setSelectedCustomerId}
                      placeholder={`${t.selectCustomer}...`}
                      searchable={true}
                      options={customersList.map((c) => ({
                        value: c.id,
                        label: c.name,
                        subtitle: c.phone || c.email || undefined,
                        badge: `${c.pointsBalance} pts`,
                      }))}
                    />
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1.5 font-sans">
                  {t.announcementTitle}
                </label>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. Special Weekend Promotion or News"
                  className="glass-input w-full font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1.5 font-sans">
                  {t.notificationMessage}
                </label>
                <textarea
                  rows={4}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Write your announcement or notification message details here..."
                  className="glass-input w-full resize-none leading-relaxed"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1.5 font-sans">
                  {t.optionalBonus}
                </label>
                <input
                  type="number"
                  min="0"
                  value={broadcastBonus}
                  onChange={(e) => setBroadcastBonus(e.target.value)}
                  placeholder="0"
                  className="glass-input w-full max-w-xs font-mono font-bold text-sm"
                />
                <span className="text-[11px] text-neutral-500 mt-1.5 block font-sans">
                  {t.bonusHelp}
                </span>
              </div>

              <div className="pt-4 border-t border-neutral-200/80 flex justify-end">
                <button
                  type="submit"
                  disabled={broadcastSending}
                  className="px-6 py-3 rounded-2xl bg-[#cb202d] hover:bg-[#b51a25] text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-md shadow-[#cb202d]/25 cursor-pointer active:scale-98 font-sans"
                >
                  <Send className="w-3.5 h-3.5" />
                  {broadcastSending
                    ? t.sendingBroadcast
                    : broadcastAudience === "single"
                    ? t.sendToSingle
                    : t.sendBroadcast}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 6: SUPPORT TICKET & ISSUE TRACKER (Web3Forms to info@weblix-jo.com) */}
        {activeTab === "support" && (
          <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-300">

            {/* ── HEADER ── */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#cb202d] text-white flex items-center justify-center shadow-lg shadow-[#cb202d]/30 shrink-0">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 font-sans tracking-tight leading-tight">
                    Technical Support
                  </h2>
                  <p className="text-xs text-neutral-500 font-sans mt-0.5">
                    Report bugs, POS issues, or technical requests to the engineering team.
                  </p>
                </div>
              </div>
              <div className="self-start sm:self-auto shrink-0">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-mono tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Direct Line: info@weblix-jo.com
                </span>
              </div>
            </div>

            {/* ── SUCCESS SCREEN ── */}
            {ticketSuccess && (
              <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-[#EBD3C8] animate-in zoom-in-95 duration-300">
                <div className="flex flex-col items-center text-center max-w-sm mx-auto space-y-5">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-[#cb202d] text-white flex items-center justify-center shadow-xl shadow-[#cb202d]/30">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div className="absolute -inset-1 rounded-2xl bg-[#cb202d]/10 -z-10 blur-md" />
                  </div>
                  <div className="space-y-2">
                    <span className="inline-block px-4 py-1 rounded-full bg-[#cb202d]/10 border border-[#cb202d]/25 text-[#cb202d] text-[11px] font-mono font-bold tracking-widest uppercase">
                      {ticketRefNumber}
                    </span>
                    <h3 className="text-xl font-bold text-neutral-900 font-sans">
                      Ticket Dispatched!
                    </h3>
                    <p className="text-xs text-neutral-500 font-sans leading-relaxed">
                      Your report has been sent to <strong className="text-neutral-700">info@weblix-jo.com</strong>.<br />
                      The engineering team will review and respond promptly.
                    </p>
                  </div>
                  <div className="pt-2 w-full flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => { setTicketSuccess(null); setTicketRefNumber(null); }}
                      className="flex-1 py-3 rounded-2xl bg-[#cb202d] hover:bg-[#b51a25] text-white text-xs font-bold transition-all shadow-md shadow-[#cb202d]/25 cursor-pointer active:scale-[0.98] font-sans"
                    >
                      Submit Another Ticket
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("analytics")}
                      className="flex-1 py-3 rounded-2xl bg-white/70 hover:bg-white border border-[#EBD3C8] text-neutral-700 text-xs font-semibold transition-all cursor-pointer font-sans backdrop-blur-sm"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── MAIN FORM CARD ── */}
            {!ticketSuccess && (
              <div className="glass-panel rounded-3xl border border-[#EBD3C8] shadow-xl shadow-black/[0.04] relative overflow-visible">
                <div className="h-1 w-full rounded-t-3xl bg-gradient-to-r from-[#cb202d] via-[#e8505a] to-[#cb202d]/40" />
                <div className="p-6 sm:p-8">
                  {ticketError && (
                    <div className="mb-6 p-4 rounded-2xl bg-rose-50/80 border border-rose-200 text-xs text-rose-800 flex items-center gap-3 font-sans backdrop-blur-sm">
                      <AlertCircle className="w-4 h-4 shrink-0 text-[#cb202d]" />
                      <span>{ticketError}</span>
                    </div>
                  )}

                  <form onSubmit={handleTicketSubmit} className="space-y-5">

                    {/* ISSUE CATEGORY */}
                    <div
                      className="relative"
                      onBlur={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node))
                          setShowCategoryDropdown(false);
                      }}
                    >
                      <label className="block text-[10px] font-bold text-neutral-500 tracking-widest font-mono uppercase mb-2 px-1">
                        Issue Category
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                        className={`w-full glass-input flex items-center justify-between px-4 py-3.5 rounded-2xl text-left transition-all cursor-pointer ${showCategoryDropdown ? "border-[#cb202d]/60 ring-4 ring-[#cb202d]/10" : "hover:border-[#cb202d]/30"}`}
                      >
                        <div className="min-w-0">
                          <span className="block font-semibold text-sm text-neutral-900 font-sans truncate">
                            {ticketCategory}
                          </span>
                          <span className="block text-[11px] text-neutral-400 font-mono truncate mt-0.5">
                            {ticketCategoryDesc}
                          </span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 shrink-0 ml-3 transition-transform duration-200 ${showCategoryDropdown ? "rotate-180 text-[#cb202d]" : "text-neutral-400"}`}
                        />
                      </button>
                      {showCategoryDropdown && (
                        <div className="absolute top-full start-0 end-0 mt-2 rounded-2xl border border-[#EBD3C8] bg-white/90 backdrop-blur-xl shadow-2xl z-40 overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-150">
                          {ticketCategories.map((cat) => {
                            const isSelected = ticketCategory === cat.title;
                            return (
                              <button
                                key={cat.title}
                                type="button"
                                tabIndex={0}
                                onClick={() => {
                                  setTicketCategory(cat.title);
                                  setTicketCategoryDesc(cat.desc);
                                  setShowCategoryDropdown(false);
                                }}
                                className={`w-full px-4 py-3 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer font-sans ${isSelected ? "bg-rose-50/60" : "hover:bg-[#FAF5F2]"}`}
                              >
                                <div className="min-w-0">
                                  <span className={`block font-bold text-sm ${isSelected ? "text-[#cb202d]" : "text-neutral-800"}`}>
                                    {cat.title}
                                  </span>
                                  <span className="block text-[11px] text-neutral-400 font-mono mt-0.5 truncate">
                                    {cat.desc}
                                  </span>
                                </div>
                                {isSelected && (
                                  <CheckCircle2 className="w-4 h-4 text-[#cb202d] shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* ── SUBJECT ── */}
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-500 tracking-widest font-mono uppercase mb-2 px-1">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={ticketTitle}
                        onChange={(e) => setTicketTitle(e.target.value)}
                        placeholder="Brief summary of the issue..."
                        className="glass-input w-full px-4 py-3.5 rounded-2xl text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-all focus:border-[#cb202d]/60 focus:ring-4 focus:ring-[#cb202d]/10"
                        required
                      />
                    </div>

                    {/* ── DESCRIPTION ── */}
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-500 tracking-widest font-mono uppercase mb-2 px-1">
                        Detailed Description
                      </label>
                      <textarea
                        rows={5}
                        value={ticketMessage}
                        onChange={(e) => setTicketMessage(e.target.value)}
                        placeholder="Describe the issue in detail — steps to reproduce, error messages, or what needs fixing..."
                        className="glass-input w-full px-4 py-3.5 rounded-2xl text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-all focus:border-[#cb202d]/60 focus:ring-4 focus:ring-[#cb202d]/10 resize-none leading-relaxed"
                        required
                      />
                    </div>

                    {/* ── PHONE / WHATSAPP ── */}
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-500 tracking-widest font-mono uppercase mb-2 px-1">
                        Phone / WhatsApp{" "}
                        <span className="text-neutral-400 normal-case font-sans font-normal">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={ticketPhone}
                        onChange={(e) => setTicketPhone(e.target.value)}
                        placeholder="+962 7X XXX XXXX"
                        className="glass-input w-full px-4 py-3.5 rounded-2xl text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-all focus:border-[#cb202d]/60 focus:ring-4 focus:ring-[#cb202d]/10 font-mono"
                      />
                    </div>

                    {/* ── FOOTER ── */}
                    <div className="pt-1 border-t border-[#EBD3C8]/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <span className="text-[11px] text-neutral-400 font-sans order-2 sm:order-1">
                        Dispatched to engineering team via Web3Forms.
                      </span>
                      <button
                        type="submit"
                        disabled={ticketSubmitting}
                        className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#cb202d] hover:bg-[#b51a25] text-white text-sm font-bold transition-all shadow-lg shadow-[#cb202d]/30 disabled:opacity-60 flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.98] font-sans order-1 sm:order-2 min-w-[200px]"
                      >
                        {ticketSubmitting ? (
                          <span className="flex items-center gap-1.5 py-0.5">
                            <span className="xian-dot xian-dot-1 !bg-white" />
                            <span className="xian-dot xian-dot-2 !bg-white" />
                            <span className="xian-dot xian-dot-3 !bg-white" />
                          </span>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            Submit Support Ticket
                          </>
                        )}
                      </button>
                    </div>

                  </form>
                </div>
              </div>
            )}

          </div>
        )}
      </main>

      {/* MODAL: ADD NEW REWARD */}
      {showAddRewardModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div
            dir="ltr"
            className="glass-panel rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#cb202d] text-white flex items-center justify-center shadow-xs">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 font-sans">Add New Reward</h3>
                  <p className="text-[11px] text-neutral-500 font-sans">Create a reward with photo directly from your device</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddRewardModal(false)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100/50 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createRewardError && (
              <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200 text-xs text-rose-800 flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createRewardError}</span>
              </div>
            )}

            <form onSubmit={handleCreateReward} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-900 mb-1.5 font-sans">
                  {t.titleLabel} *
                </label>
                <input
                  type="text"
                  value={newReward.title}
                  onChange={(e) => setNewReward({ ...newReward, title: e.target.value })}
                  placeholder=""
                  className="glass-input w-full font-sans"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-900 mb-1.5 font-sans">
                  {t.descriptionLabel} (Optional)
                </label>
                <input
                  type="text"
                  value={newReward.description}
                  onChange={(e) => setNewReward({ ...newReward, description: e.target.value })}
                  placeholder=""
                  className="glass-input w-full font-sans"
                />
              </div>

              {/* Device-Only Image Upload */}
              <div>
                <label className="block text-xs font-semibold text-neutral-900 mb-1.5 font-sans">
                  Reward Photo (Direct Device Upload)
                </label>

                {newReward.imageUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border-2 border-neutral-200 bg-neutral-50 h-48 w-full group shadow-xs">
                    <img
                      src={newReward.imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />

                    {/* Desktop Hover Controls Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center gap-2.5">
                      <label className="px-3.5 py-2 rounded-xl bg-white text-neutral-900 text-xs font-bold shadow-md cursor-pointer hover:bg-neutral-50 flex items-center gap-1.5 transition-all">
                        <Camera className="w-3.5 h-3.5 text-[#cb202d]" />
                        <span>Change Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleRewardImageUpload(file);
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setNewReward({ ...newReward, imageUrl: "" })}
                        className="px-3.5 py-2 rounded-xl bg-red-600 text-white text-xs font-bold shadow-md cursor-pointer hover:bg-red-700 flex items-center gap-1.5 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>

                    {/* Mobile & Touch Controls */}
                    <div className="sm:hidden absolute bottom-2 end-2 flex items-center gap-1.5">
                      <label className="px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-xs text-white text-xs font-semibold cursor-pointer shadow-md flex items-center gap-1">
                        <Camera className="w-3 h-3" />
                        <span>Change</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleRewardImageUpload(file);
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setNewReward({ ...newReward, imageUrl: "" })}
                        className="px-3 py-1.5 rounded-xl bg-red-600/90 backdrop-blur-xs text-white text-xs font-semibold cursor-pointer shadow-md flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>

                    <div className="absolute top-2.5 start-2.5 px-2.5 py-1 rounded-full bg-emerald-700/90 text-white text-[10px] font-semibold backdrop-blur-xs shadow-xs flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Photo Attached</span>
                    </div>
                  </div>
                ) : (
                  <label className="w-full py-8 px-4 rounded-2xl border-2 border-dashed border-neutral-200 hover:border-[#cb202d] bg-neutral-50/60 hover:bg-neutral-50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] text-center">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#cb202d] flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-neutral-900 block font-sans">
                        Tap to select photo from device
                      </span>
                      <span className="text-[11px] text-neutral-500 block mt-0.5 font-sans">
                        Camera, Photo Library, or Files (JPG, PNG, WebP)
                      </span>
                    </div>
                    <span className="text-[10px] font-sans text-[#cb202d] bg-rose-50 px-2.5 py-0.5 rounded-full mt-1 font-medium">
                      Auto-compressed on device for instant loading
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleRewardImageUpload(file);
                      }}
                    />
                  </label>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-neutral-900 mb-1 font-sans">
                    {t.tblPointsCost} *
                  </label>
                  <input
                    type="number"
                    value={newReward.pointsRequired}
                    onChange={(e) =>
                      setNewReward({ ...newReward, pointsRequired: parseInt(e.target.value) || 0 })
                    }
                    className="glass-input w-full font-sans font-semibold"
                    required
                    min={1}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-900 mb-1 font-sans">
                    {t.tblCategory} *
                  </label>
                  <CustomGlassSelect
                    value={newReward.category}
                    onChange={(cat) => setNewReward({ ...newReward, category: cat })}
                    options={[
                      { value: "Drinks", label: "Beverages" },
                      { value: "Food", label: "Food & Pastries" },
                      { value: "Beans", label: "Specialty Beans" },
                      { value: "Merchandise", label: "Merchandise" },
                      { value: "Special", label: "Special Offers" },
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-900 mb-1 font-sans">
                  Claim Code (2 Digits: 10 - 99)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={2}
                  value={newReward.claimCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                    setNewReward({ ...newReward, claimCode: val });
                  }}
                  placeholder="Auto (e.g. 25)"
                  className="glass-input w-full font-mono font-bold"
                />
                <span className="text-[11px] text-neutral-400 mt-1 block font-sans">
                  Leave blank to auto-generate an unused 2-digit number (10-99).
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-neutral-200/60">
                <button
                  type="button"
                  onClick={() => setShowAddRewardModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors cursor-pointer font-sans"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={createRewardLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#cb202d] text-white text-xs font-bold hover:bg-[#b51a25] transition-all cursor-pointer shadow-xs disabled:opacity-50 active:scale-98 flex items-center gap-1.5"
                >
                  {createRewardLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Saving Reward...</span>
                    </>
                  ) : (
                    <span>{t.createReward}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW CASHIER */}
      {showAddCashierModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="glass-panel rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200 mb-5">
              <h3 className="text-base font-bold text-neutral-900 font-sans">{t.addCashierModalTitle}</h3>
              <button onClick={() => setShowAddCashierModal(false)} className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100/50 cursor-pointer transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCashier} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-900 mb-1 font-sans">{t.fullName}</label>
                <input
                  type="text"
                  value={newCashier.name}
                  onChange={(e) => setNewCashier({ ...newCashier, name: e.target.value })}
                  placeholder=""
                  className="glass-input w-full font-sans"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-900 mb-1 font-sans">{t.usernameForPOS}</label>
                <input
                  type="text"
                  value={newCashier.username}
                  onChange={(e) => setNewCashier({ ...newCashier, username: e.target.value })}
                  placeholder=""
                  className="glass-input w-full font-mono"
                  dir="ltr"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-900 mb-1 font-sans">{t.tblBranch}</label>
                  <input
                    type="text"
                    value={newCashier.branchName}
                    onChange={(e) => setNewCashier({ ...newCashier, branchName: e.target.value })}
                    className="glass-input w-full font-sans"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-900 mb-1 font-sans">{t.tblPin}</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={newCashier.staffPin}
                    onChange={(e) => setNewCashier({ ...newCashier, staffPin: e.target.value })}
                    placeholder=""
                    className="glass-input w-full font-mono text-center tracking-widest"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-200/60 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddCashierModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 cursor-pointer font-sans"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#cb202d] text-white text-xs font-bold hover:bg-[#b51a25] transition-colors shadow-xs cursor-pointer active:scale-98"
                >
                  {t.createAccount}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
