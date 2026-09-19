const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const uri = 'mongodb://xianelweibdeh_db_user:M0I6w6uB2mYnYzve@ac-4mgjq0k-shard-00-00.r4ukz73.mongodb.net:27017,ac-4mgjq0k-shard-00-01.r4ukz73.mongodb.net:27017,ac-4mgjq0k-shard-00-02.r4ukz73.mongodb.net:27017/xian_loyalty?ssl=true&replicaSet=atlas-803sle-shard-0&authSource=admin&retryWrites=true&w=majority';

async function wipeDatabase() {
  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log("Connected to MongoDB Atlas successfully!");

  const db = mongoose.connection.db;

  // 1. Get all collections in the database
  const collections = await db.listCollections().toArray();
  console.log("Found collections:", collections.map(c => c.name));

  // 2. Wipe every collection completely
  for (const col of collections) {
    const colName = col.name;
    const deleteResult = await db.collection(colName).deleteMany({});
    console.log(`Cleared collection [${colName}]: deleted ${deleteResult.deletedCount} documents.`);
  }

  // 3. Define schemas for fresh initial setup
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

  const TenantConfig = mongoose.models.TenantConfig || mongoose.model('TenantConfig', TenantConfigSchema);
  const User = mongoose.models.User || mongoose.model('User', UserSchema);

  // 4. Seed fresh brand configuration
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
  await TenantConfig.create(configData);
  console.log("Re-seeded fresh clean config:", configData.storeName);

  // 5. Seed pristine Admin account
  const adminHash = bcrypt.hashSync("xian@2026", 10);
  await User.create({
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
  console.log("Re-seeded Admin: username=xian-admin, password=xian@2026");

  // 6. Seed pristine Cashier account
  await User.create({
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
  console.log("Re-seeded Cashier: username=salah, PIN=salah2026");

  // 7. Final Verification
  const userCount = await User.countDocuments();
  const configCount = await TenantConfig.countDocuments();
  console.log(`Database is completely wiped clean! Current users: ${userCount}, configs: ${configCount}. Customers: 0, Transactions: 0, Rewards: 0.`);

  await mongoose.disconnect();
  console.log("Done!");
  process.exit(0);
}

wipeDatabase().catch(err => {
  console.error("Wipe error:", err);
  process.exit(1);
});
