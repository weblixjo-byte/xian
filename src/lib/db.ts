import mongoose from "mongoose";
import TenantConfig from "@/models/TenantConfig";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import Reward from "@/models/Reward";
import Notification from "@/models/Notification";
import PushSubscription from "@/models/PushSubscription";
import { ITenantConfig, IUser, ITransaction, IReward, INotification, IPushSubscription } from "./types";
import { seedInitialData } from "./seed-data";



interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  isFallback: boolean;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
  isFallback: false,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

// In-memory fallback data store if MongoDB server is offline
class MemoryStore {
  config: ITenantConfig;
  users: IUser[] = [];
  transactions: ITransaction[] = [];
  rewards: IReward[] = [];
  notifications: INotification[] = [];
  pushSubscriptions: IPushSubscription[] = [];
  seeded: boolean = false;

  constructor() {
    const seed = seedInitialData();
    this.config = seed.config;
    this.users = seed.users;
    this.transactions = seed.transactions;
    this.rewards = seed.rewards;
    this.notifications = seed.notifications;
    this.seeded = true;
  }
}

const memoryStore = new MemoryStore();

export async function connectDB(): Promise<{ isMongoose: boolean }> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    cached.isFallback = true;
    return { isMongoose: false };
  }

  if (cached.conn) {
    return { isMongoose: !cached.isFallback };
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 6000, // Balanced timeout for Atlas cloud connection
    };

    cached.promise = mongoose
      .connect(uri, opts)
      .then((mongooseInstance) => {
        cached.isFallback = false;
        // Check if DB needs seeding
        initMongoData();
        return mongooseInstance;
      })
      .catch((err) => {
        console.warn(
          "MongoDB connection unavailable. Using high-fidelity resilient in-memory data store:",
          err.message
        );
        cached.isFallback = true;
        return mongoose;
      });
  }

  try {
    cached.conn = await cached.promise;
    return { isMongoose: !cached.isFallback };
  } catch {
    cached.isFallback = true;
    return { isMongoose: false };
  }
}

async function initMongoData() {
  try {
    // Ensure deleted cashier Ahmad is removed from MongoDB
    await User.deleteMany({ username: "ahmad" });



    const configCount = await TenantConfig.countDocuments();
    if (configCount === 0) {
      const seed = seedInitialData();
      await TenantConfig.create(seed.config);
      await User.insertMany(seed.users);
      await Transaction.insertMany(seed.transactions);
      await Reward.insertMany(seed.rewards);
      await Notification.insertMany(seed.notifications);
      console.log("MongoDB seeded with initial Xian data.");
    }
  } catch (err) {
    console.warn("MongoDB auto-seed error:", err);
  }
}

// Unified Data Access Layer (DAL) seamlessly delegating to Mongoose or Memory Store
export function normalizeJordanPhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("00962")) cleaned = cleaned.slice(5);
  else if (cleaned.startsWith("962")) cleaned = cleaned.slice(3);

  if ((cleaned.startsWith("77") || cleaned.startsWith("78") || cleaned.startsWith("79")) && cleaned.length === 9) {
    cleaned = "0" + cleaned;
  }
  return cleaned;
}

export const dbService = {
  // Store Config
  async getConfig(): Promise<ITenantConfig> {
    const { isMongoose } = await connectDB();
    if (isMongoose) {
      try {
        const doc = await TenantConfig.findOne().lean();
        if (doc) return JSON.parse(JSON.stringify(doc));
      } catch (err) {
        console.warn("Mongo query failed, falling back to memory:", err);
      }
    }
    return memoryStore.config;
  },

  async updateConfig(data: Partial<ITenantConfig>): Promise<ITenantConfig> {
    const { isMongoose } = await connectDB();
    if (isMongoose) {
      try {
        const updated = await TenantConfig.findOneAndUpdate({}, { $set: data }, { new: true, upsert: true }).lean();
        if (updated) return JSON.parse(JSON.stringify(updated));
      } catch (err) {
        console.warn("Mongo update failed, falling back to memory:", err);
      }
    }
    memoryStore.config = { ...memoryStore.config, ...data, updatedAt: new Date() };
    return memoryStore.config;
  },

  // Users
  async findUserById(id: string): Promise<IUser | null> {
    const { isMongoose } = await connectDB();
    if (isMongoose) {
      try {
        const user = await User.findById(id).lean();
        if (user) return JSON.parse(JSON.stringify(user));
      } catch (e) {
        console.warn(e);
      }
    }
    const found = memoryStore.users.find((u) => u._id === id);
    return found ? { ...found } : null;
  },

  async findUserByPhone(phone: string): Promise<IUser | null> {
    const rawClean = phone.replace(/\D/g, "");
    const normalized = normalizeJordanPhone(phone);
    const searchPart = normalized.startsWith("0") ? normalized.slice(1) : normalized;
    const { isMongoose } = await connectDB();
    if (isMongoose) {
      try {
        const user = await User.findOne({
          $or: [
            { phone: normalized },
            { phone: rawClean },
            { phone: { $regex: searchPart } },
          ],
        }).lean();
        if (user) return JSON.parse(JSON.stringify(user));
      } catch (e) {
        console.warn(e);
      }
    }
    const found = memoryStore.users.find(
      (u) =>
        u.phone &&
        (u.phone === normalized ||
          u.phone.replace(/\D/g, "") === rawClean ||
          u.phone.replace(/\D/g, "").includes(searchPart))
    );
    return found ? { ...found } : null;
  },

  async findUserByPin(pin: string): Promise<IUser | null> {
    const cleanPin = pin.replace(/\D/g, "");
    const { isMongoose } = await connectDB();
    if (isMongoose) {
      try {
        const user = await User.findOne({ pin: cleanPin }).lean();
        if (user) return JSON.parse(JSON.stringify(user));
      } catch (e) {
        console.warn(e);
      }
    }
    const found = memoryStore.users.find((u) => u.pin === cleanPin);
    return found ? { ...found } : null;
  },

  async findUserByQrSecret(secret: string): Promise<IUser | null> {
    const { isMongoose } = await connectDB();
    if (isMongoose) {
      try {
        const user = await User.findOne({ qrSecret: secret }).lean();
        if (user) return JSON.parse(JSON.stringify(user));
      } catch (e) {
        console.warn(e);
      }
    }
    const found = memoryStore.users.find((u) => u.qrSecret === secret || u._id === secret);
    return found ? { ...found } : null;
  },

  async findStaffByUsername(username: string): Promise<IUser | null> {
    const { isMongoose } = await connectDB();
    if (isMongoose) {
      try {
        const user = await User.findOne({ username: username.toLowerCase().trim() }).lean();
        if (user) return JSON.parse(JSON.stringify(user));
      } catch (e) {
        console.warn(e);
      }
    }
    const found = memoryStore.users.find(
      (u) => u.username && u.username.toLowerCase() === username.toLowerCase().trim()
    );
    return found ? { ...found } : null;
  },

  async findStaffByEmail(email: string): Promise<IUser | null> {
    return this.findUserByEmail(email);
  },

  async findSuperAdmin(identifier: string): Promise<IUser | null> {
    const clean = identifier.toLowerCase().trim();
    const { isMongoose } = await connectDB();
    if (isMongoose) {
      try {
        const user = await User.findOne({
          role: "super_admin",
          $or: [
            { username: clean },
            { email: clean },
          ],
        }).lean();
        if (user) return JSON.parse(JSON.stringify(user));
      } catch (e) {
        console.warn(e);
      }
    }
    const found = memoryStore.users.find(
      (u) =>
        u.role === "super_admin" &&
        ((u.username && u.username.toLowerCase() === clean) ||
          (u.email && u.email.toLowerCase() === clean))
    );
    return found ? { ...found } : null;
  },

  async findUserByEmail(email: string): Promise<IUser | null> {
    const cleanEmail = email.toLowerCase().trim();
    const { isMongoose } = await connectDB();
    if (isMongoose) {
      try {
        const user = await User.findOne({ email: cleanEmail }).lean();
        if (user) return JSON.parse(JSON.stringify(user));
      } catch (e) {
        console.warn(e);
      }
    }
    const found = memoryStore.users.find(
      (u) => u.email && u.email.toLowerCase() === cleanEmail
    );
    return found ? { ...found } : null;
  },

  async findUserByGoogleId(googleId: string): Promise<IUser | null> {
    const { isMongoose } = await connectDB();
    if (isMongoose) {
      try {
        const user = await User.findOne({ googleId }).lean();
        if (user) return JSON.parse(JSON.stringify(user));
      } catch (e) {
        console.warn(e);
      }
    }
    const found = memoryStore.users.find((u) => u.googleId === googleId);
    return found ? { ...found } : null;
  },

  async createUser(userData: Partial<IUser>): Promise<IUser> {
    const { isMongoose } = await connectDB();
    if (isMongoose) {
      try {
        const created = await User.create(userData);
        return JSON.parse(JSON.stringify(created.toObject()));
      } catch (e) {
        console.warn(e);
      }
    }
    const newUser: IUser = {
      _id: "user_" + Math.random().toString(36).substring(2, 9),
      role: userData.role || "customer",
      name: userData.name || "Loyal Guest",
      phone: userData.phone,
      pin: userData.pin || Math.floor(100000 + Math.random() * 900000).toString(),
      qrSecret: userData.qrSecret || "xian_qr_" + Math.random().toString(36).substring(2, 10),
      pointsBalance: userData.pointsBalance || 0,
      lifetimePoints: userData.lifetimePoints || 0,
      tier: userData.tier || "Member",
      username: userData.username,
      branchName: userData.branchName,
      staffPin: userData.staffPin,
      passwordHash: userData.passwordHash,
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      email: userData.email,
      googleId: userData.googleId,
      avatarUrl: userData.avatarUrl,
      createdAt: new Date().toISOString(),
    };
    memoryStore.users.push(newUser);
    return { ...newUser };
  },

  async updateUser(id: string, updates: Partial<IUser>): Promise<IUser | null> {
    const { isMongoose } = await connectDB();
    if (isMongoose) {
      try {
        const updated = await User.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
        if (updated) return JSON.parse(JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
    }
    const idx = memoryStore.users.findIndex((u) => u._id === id);
    if (idx !== -1) {
      memoryStore.users[idx] = { ...memoryStore.users[idx], ...updates };
      return { ...memoryStore.users[idx] };
    }
    return null;
  },

  async getAllCashiers(): Promise<IUser[]> {
    const { isMongoose } = await connectDB();
    if (isMongoose) {
      try {
        const list = await User.find({ role: "cashier" }).sort({ createdAt: -1 }).lean();
        return JSON.parse(JSON.stringify(list));
      } catch (e) {
        console.warn(e);
      }
    }
    return memoryStore.users.filter((u) => u.role === "cashier");
  },

  async getTopCustomers(limit: number = 10): Promise<IUser[]> {
    const { isMongoose } = await connectDB();
    if (isMongoose) {
      try {
        const list = await User.find({ role: "customer" })
          .sort({ lifetimePoints: -1 })
          .limit(limit)
          .lean();
        return JSON.parse(JSON.stringify(list));
      } catch (e) {
        console.warn(e);
      }
    }
    return [...memoryStore.users.filter((u) => u.role === "customer")]
      .sort((a, b) => b.lifetimePoints - a.lifetimePoints)
      .slice(0, limit);
  },

  async getAllCustomers(limit: number = 200): Promise<IUser[]> {
    const { isMongoose } = await connectDB();
    if (isMongoose) {
      try {
        const list = await User.find({ role: "customer" })
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean();
        return JSON.parse(JSON.stringify(list));
      } catch (e) {
        console.warn(e);
      }
    }
    return [...memoryStore.users.filter((u) => u.role === "customer")]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, limit);
  },

  // Transactions
  async createTransaction(data: Omit<ITransaction, "_id" | "createdAt">): Promise<ITransaction> {
    const { isMongoose } = await connectDB();
    if (isMongoose) {
      try {
        const tx = await Transaction.create(data);
        return JSON.parse(JSON.stringify(tx.toObject()));
      } catch (e) {
        console.warn(e);
      }
    }
    const newTx: ITransaction = {
      _id: "tx_" + Math.random().toString(36).substring(2, 9),
      ...data,
      createdAt: new Date().toISOString(),
    };
    memoryStore.transactions.unshift(newTx);
    return { ...newTx };
  },

  async getCustomerTransactions(customerId: string): Promise<ITransaction[]> {
    const { isMongoose } = await connectDB();
    if (isMongoose) {
      try {
        const list = await Transaction.find({ customerId })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();
        return JSON.parse(JSON.stringify(list));
      } catch (e) {
        console.warn(e);
      }
    }
    return memoryStore.transactions
      .filter((t) => t.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getAllTransactions(limit: number = 100): Promise<ITransaction[]> {
    const { isMongoose } = await connectDB();
    if (isMongoose) {
      try {
        const list = await Transaction.find()
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean();
        return JSON.parse(JSON.stringify(list));
      } catch (e) {
        console.warn(e);
      }
    }
    return memoryStore.transactions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  },

  // Rewards
  async getRewards(activeOnly: boolean = true): Promise<IReward[]> {
    let list: IReward[] = [];
    const { isMongoose } = await connectDB();
    if (isMongoose) {
      try {
        const filter = activeOnly ? { isActive: true } : {};
        const docs = await Reward.find(filter).sort({ pointsRequired: 1 }).lean();
        list = JSON.parse(JSON.stringify(docs));
      } catch (e) {
        console.warn(e);
      }
    } else {
      list = memoryStore.rewards
        .filter((r) => (!activeOnly || r.isActive));
    }

    // Ensure strict ascending sorting by pointsRequired
    list.sort((a, b) => a.pointsRequired - b.pointsRequired);

    // Fallback dynamic calculation for legacy rewards missing claimCode
    return list.map((r, idx) => {
      if (!r.claimCode || !r.claimCode.trim()) {
        return {
          ...r,
          claimCode: String(((idx * 7 + 11) % 90) + 10),
        };
      }
      return r;
    });
  },

  async findRewardById(id: string): Promise<IReward | null> {
    const { isMongoose } = await connectDB();
    if (isMongoose) {
      try {
        const r = await Reward.findById(id).lean();
        if (r) return JSON.parse(JSON.stringify(r));
      } catch (e) {
        console.warn(e);
      }
    }
    const found = memoryStore.rewards.find((r) => r._id === id);
    return found ? { ...found } : null;
  },

  async findRewardByClaimCode(code: string, activeOnly: boolean = true): Promise<IReward | null> {
    const trimmed = (code || "").trim();
    if (!trimmed) return null;
    const all = await this.getRewards(activeOnly);
    return all.find((r) => r.claimCode === trimmed) || null;
  },

  async createReward(data: Partial<IReward>): Promise<IReward> {
    // Generate or validate 2-digit numeric claim code (10-99)
    const existingRewards = await this.getRewards(false);
    const usedCodes = new Set(existingRewards.map((r) => r.claimCode).filter(Boolean));
    let assignedCode = "";
    const candidateInput = (data.claimCode || "").trim();

    if (/^\d{2}$/.test(candidateInput) && !usedCodes.has(candidateInput)) {
      assignedCode = candidateInput;
    } else {
      // Find lowest unused 2-digit number between 10 and 99
      for (let i = 10; i <= 99; i++) {
        const c = String(i);
        if (!usedCodes.has(c)) {
          assignedCode = c;
          break;
        }
      }
      if (!assignedCode) {
        assignedCode = "10";
      }
    }

    const { isMongoose } = await connectDB();
    if (isMongoose) {
      try {
        const r = await Reward.create({
          title: data.title,
          description: data.description || "",
          pointsRequired: Number(data.pointsRequired) || 100,
          category: data.category || "Drinks",
          imageUrl: data.imageUrl || "",
          stock: data.stock !== undefined ? Number(data.stock) : 999,
          isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
          claimCode: assignedCode,
          redemptionCount: 0,
        });
        return JSON.parse(JSON.stringify(r.toObject()));
      } catch (e: any) {
        console.error("Mongoose createReward error:", e);
        throw new Error(e.message || "Failed to create reward in database");
      }
    }
    const newReward: IReward = {
      _id: "reward_" + Math.random().toString(36).substring(2, 9),
      title: data.title || "Special Reward",
      description: data.description || "",
      pointsRequired: data.pointsRequired || 100,
      category: data.category || "Drinks",
      imageUrl: data.imageUrl || "",
      isActive: data.isActive !== undefined ? data.isActive : true,
      stock: data.stock !== undefined ? data.stock : 999,
      claimCode: assignedCode,
      redemptionCount: 0,
      createdAt: new Date().toISOString(),
    };
    memoryStore.rewards.push(newReward);
    return { ...newReward };
  },

  async updateReward(id: string, data: Partial<IReward>): Promise<IReward | null> {
    const { isMongoose } = await connectDB();
    if (isMongoose) {
      try {
        const r = await Reward.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
        if (r) return JSON.parse(JSON.stringify(r));
      } catch (e) {
        console.warn(e);
      }
    }
    const idx = memoryStore.rewards.findIndex((r) => r._id === id);
    if (idx !== -1) {
      memoryStore.rewards[idx] = { ...memoryStore.rewards[idx], ...data };
      return { ...memoryStore.rewards[idx] };
    }
    return null;
  },

  async deleteReward(id: string): Promise<boolean> {
    const { isMongoose } = await connectDB();
    if (isMongoose) {
      try {
        await Reward.findByIdAndDelete(id);
        return true;
      } catch (e) {
        console.warn(e);
      }
    }
    const idx = memoryStore.rewards.findIndex((r) => r._id === id);
    if (idx !== -1) {
      memoryStore.rewards.splice(idx, 1);
      return true;
    }
    return false;
  },

  // Notifications
  async getNotifications(customerId: string): Promise<INotification[]> {
    const { isMongoose } = await connectDB();
    if (isMongoose) {
      try {
        const list = await Notification.find({
          $or: [{ customerId }, { customerId: "all" }],
        })
          .sort({ createdAt: -1 })
          .limit(30)
          .lean();
        return JSON.parse(JSON.stringify(list));
      } catch (e) {
        console.warn(e);
      }
    }
    return memoryStore.notifications
      .filter((n) => n.customerId === customerId || n.customerId === "all")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async createNotification(data: Omit<INotification, "_id" | "createdAt" | "isRead">): Promise<INotification> {
    const { isMongoose } = await connectDB();
    if (isMongoose) {
      try {
        const n = await Notification.create({ ...data, isRead: false });
        return JSON.parse(JSON.stringify(n.toObject()));
      } catch (e) {
        console.warn(e);
      }
    }
    const newNotif: INotification = {
      _id: "notif_" + Math.random().toString(36).substring(2, 9),
      ...data,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    memoryStore.notifications.unshift(newNotif);
    return { ...newNotif };
  },

  async markNotificationsRead(customerId: string): Promise<void> {
    const { isMongoose } = await connectDB();
    if (isMongoose) {
      try {
        await Notification.updateMany(
          { $or: [{ customerId }, { customerId: "all" }] },
          { $set: { isRead: true } }
        );
        return;
      } catch (e) {
        console.warn(e);
      }
    }
    memoryStore.notifications.forEach((n) => {
      if (n.customerId === customerId || n.customerId === "all") {
        n.isRead = true;
      }
    });
  },

  // Aggregate Metrics for Super Admin
  async getAdminMetrics() {
    const txs = await this.getAllTransactions(500);
    const topUsers = await this.getTopCustomers(10);
    const cashiers = await this.getAllCashiers();
    const rewards = await this.getRewards(false);

    let totalPointsIssued = 0;
    let totalPointsRedeemed = 0;
    let totalRevenue = 0;

    txs.forEach((t) => {
      if (t.type === "EARN") {
        totalPointsIssued += t.points;
        if (t.billAmount) totalRevenue += t.billAmount;
      } else if (t.type === "REDEEM") {
        totalPointsRedeemed += Math.abs(t.points);
      }
    });

    const customerCount = (await this.getTopCustomers(1000)).length;

    return {
      totalPointsIssued,
      totalPointsRedeemed,
      activeCustomerCount: customerCount,
      totalRevenueVolume: Number(totalRevenue.toFixed(2)),
      totalTransactions: txs.length,
      cashierCount: cashiers.length,
      rewardsCount: rewards.length,
      topCustomers: topUsers,
      recentTransactions: txs.slice(0, 10),
    };
  },

  // Web Push Subscriptions
  async savePushSubscription(data: {
    userId: string;
    endpoint: string;
    keys: { p256dh: string; auth: string };
    userAgent?: string;
  }): Promise<IPushSubscription> {
    const { isMongoose } = await connectDB();
    if (isMongoose) {
      try {
        const doc = await PushSubscription.findOneAndUpdate(
          { endpoint: data.endpoint },
          { ...data },
          { upsert: true, new: true }
        ).lean();
        return JSON.parse(JSON.stringify(doc));
      } catch (e) {
        console.warn("Mongo savePushSubscription error:", e);
      }
    }
    const idx = memoryStore.pushSubscriptions.findIndex((s) => s.endpoint === data.endpoint);
    const sub: IPushSubscription = { ...data, _id: "push_" + Date.now() };
    if (idx >= 0) {
      memoryStore.pushSubscriptions[idx] = sub;
    } else {
      memoryStore.pushSubscriptions.push(sub);
    }
    return sub;
  },

  async getPushSubscriptionsForUser(userId: string): Promise<IPushSubscription[]> {
    const { isMongoose } = await connectDB();
    if (isMongoose) {
      try {
        const docs = await PushSubscription.find({ userId }).lean();
        return JSON.parse(JSON.stringify(docs));
      } catch (e) {
        console.warn("Mongo getPushSubscriptionsForUser error:", e);
      }
    }
    return memoryStore.pushSubscriptions.filter((s) => s.userId === userId);
  },

  async getAllPushSubscriptions(): Promise<IPushSubscription[]> {
    const { isMongoose } = await connectDB();
    if (isMongoose) {
      try {
        const docs = await PushSubscription.find().lean();
        return JSON.parse(JSON.stringify(docs));
      } catch (e) {
        console.warn("Mongo getAllPushSubscriptions error:", e);
      }
    }
    return [...memoryStore.pushSubscriptions];
  },

  async deletePushSubscription(endpoint: string): Promise<void> {
    const { isMongoose } = await connectDB();
    if (isMongoose) {
      try {
        await PushSubscription.deleteOne({ endpoint });
      } catch (e) {
        console.warn("Mongo deletePushSubscription error:", e);
      }
    }
    const idx = memoryStore.pushSubscriptions.findIndex((s) => s.endpoint === endpoint);
    if (idx >= 0) {
      memoryStore.pushSubscriptions.splice(idx, 1);
    }
  },
};
