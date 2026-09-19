import bcrypt from "bcryptjs";
import { ITenantConfig, IUser, ITransaction, IReward, INotification } from "./types";

export function seedInitialData() {
  const adminPasswordHash = bcrypt.hashSync("xian@2026", 10);

  const config: ITenantConfig = {
    _id: "config_xian_default",
    storeName: "xian",
    tagline: "Restaurante Oriental",
    logoUrl: "/logo.png",
    primaryColor: "#f7f2e4",
    accentColor: "#cb202d",
    terracottaColor: "#cb202d",
    currency: "JOD",
    pointsPerUnit: 10,
    discountPer100Pts: 1.0,
    welcomeBonusPts: 50,
    updatedAt: new Date().toISOString(),
  };

  const users: IUser[] = [
    // Super Admin
    {
      _id: "admin_01",
      role: "super_admin",
      name: "Xian Manager",
      username: "xian-admin",
      email: "admin@xian.com",
      passwordHash: adminPasswordHash,
      pointsBalance: 0,
      lifetimePoints: 0,
      tier: "Gold",
      createdAt: new Date().toISOString(),
    },
    // Cashier: Salah
    {
      _id: "cashier_salah",
      role: "cashier",
      name: "Salah",
      username: "salah",
      staffPin: "salah2026",
      branchName: "Main Branch",
      isActive: true,
      pointsBalance: 0,
      lifetimePoints: 0,
      tier: "Member",
      createdAt: new Date().toISOString(),
    },
  ];

  const transactions: ITransaction[] = [];

  const rewards: IReward[] = [];

  const notifications: INotification[] = [];

  return { config, users, transactions, rewards, notifications };
}

