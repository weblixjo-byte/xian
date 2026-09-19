const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const uri = 'mongodb://xianelweibdeh_db_user:M0I6w6uB2mYnYzve@ac-4mgjq0k-shard-00-00.r4ukz73.mongodb.net:27017,ac-4mgjq0k-shard-00-01.r4ukz73.mongodb.net:27017,ac-4mgjq0k-shard-00-02.r4ukz73.mongodb.net:27017/xian_loyalty?ssl=true&replicaSet=atlas-803sle-shard-0&authSource=admin&retryWrites=true&w=majority';

// Mongoose Schemas
const TenantConfigSchema = new mongoose.Schema({
  _id: { type: String, default: "config_xian_default" },
  storeName: { type: String, required: true },
  tagline: { type: String, default: "" },
  logoUrl: { type: String, default: "/logo.png" },
  primaryColor: { type: String, default: "#f7f2e4" },
  accentColor: { type: String, default: "#cb202d" },
  terracottaColor: { type: String, default: "#cb202d" },
  currency: { type: String, default: "JOD" },
  pointsPerUnit: { type: Number, default: 10 },
  discountPer100Pts: { type: Number, default: 1.0 },
  welcomeBonusPts: { type: Number, default: 50 },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  role: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String },
  pin: { type: String },
  qrSecret: { type: String },
  pointsBalance: { type: Number, default: 0 },
  lifetimePoints: { type: Number, default: 0 },
  tier: { type: String, default: "Member" },
  username: { type: String },
  branchName: { type: String },
  staffPin: { type: String },
  passwordHash: { type: String },
  isActive: { type: Boolean, default: true },
  email: { type: String },
  googleId: { type: String },
  avatarUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

async function runSeed() {
  console.log("Connecting to MongoDB Atlas for xian...");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log("Connected successfully to Atlas!");

  const TenantConfig = mongoose.models.TenantConfig || mongoose.model('TenantConfig', TenantConfigSchema);
  const User = mongoose.models.User || mongoose.model('User', UserSchema);

  // 1. Clean old test accounts if any
  await User.deleteMany({ username: { $in: ["cove", "sajji", "ahmad"] } });

  // 2. Upsert TenantConfig
  const configData = {
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
    updatedAt: new Date(),
  };
  await TenantConfig.deleteMany({});
  await TenantConfig.create(configData);
  console.log("Seeded TenantConfig:", configData.storeName);

  // 3. Upsert Super Admin
  const adminHash = bcrypt.hashSync("xian@2026", 10);
  await User.deleteOne({ username: "xian-admin" });
  await User.deleteOne({ _id: "admin_01" });
  const adminUser = await User.create({
    _id: "admin_01",
    role: "super_admin",
    name: "Xian Manager",
    username: "xian-admin",
    email: "admin@xian.com",
    passwordHash: adminHash,
    pointsBalance: 0,
    lifetimePoints: 0,
    tier: "Gold",
    isActive: true,
  });
  console.log("Seeded Super Admin: username=xian-admin, password=xian@2026");

  // 4. Upsert Cashier Salah
  await User.deleteOne({ username: "salah" });
  await User.deleteOne({ _id: "cashier_salah" });
  const cashierUser = await User.create({
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
  });
  console.log("Seeded Cashier: username=salah, PIN=salah2026");

  // 5. Verification queries
  const allUsers = await User.find({}).lean();
  console.log("Current Database Users count:", allUsers.length);
  for (const u of allUsers) {
    console.log(` - Role: ${u.role}, Username: ${u.username || 'N/A'}, Name: ${u.name}`);
  }

  console.log("ALL SEEDING COMPLETED SUCCESSFULLY!");
  process.exit(0);
}

runSeed().catch(err => {
  console.error("Seed error:", err);
  process.exit(1);
});
