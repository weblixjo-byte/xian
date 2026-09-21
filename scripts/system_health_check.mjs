import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import webpush from "web-push";

async function runComprehensiveHealthCheck() {
  console.log("==================================================");
  console.log("    XIAN SYSTEM COMPREHENSIVE HEALTH CHECK       ");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(name, condition, extra = "") {
    if (condition) {
      console.log(`[PASS] ${name} ${extra}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} ${extra}`);
      failed++;
    }
  }

  // 1. Check Environment Variables
  console.log("\n--- 1. Testing Environment Variables ---");
  assert("MONGODB_URI present", !!process.env.MONGODB_URI);
  assert("JWT_SECRET present", !!process.env.JWT_SECRET);
  assert("GOOGLE_CLIENT_ID present", !!process.env.GOOGLE_CLIENT_ID);
  assert("GOOGLE_CLIENT_SECRET present", !!process.env.GOOGLE_CLIENT_SECRET);
  assert("NEXT_PUBLIC_VAPID_PUBLIC_KEY present", !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
  assert("VAPID_PRIVATE_KEY present", !!process.env.VAPID_PRIVATE_KEY);
  assert("VAPID_SUBJECT present", !!process.env.VAPID_SUBJECT);
  assert("Store name is xian", process.env.NEXT_PUBLIC_DEFAULT_STORE_NAME === "xian");
  assert("Currency is JOD", process.env.NEXT_PUBLIC_DEFAULT_CURRENCY === "JOD");

  // 2. Test MongoDB Live Connection
  console.log("\n--- 2. Testing MongoDB Atlas Connectivity ---");
  const connStart = Date.now();
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  const latency = Date.now() - connStart;
  assert("MongoDB Connection Established", mongoose.connection.readyState === 1, `(Latency: ${latency}ms)`);

  const db = mongoose.connection.db;

  // 3. Test Collections and Data Integrity
  console.log("\n--- 3. Testing Database Collections & Schemas ---");
  const collections = await db.listCollections().toArray();
  const colNames = collections.map(c => c.name);
  assert("Collection 'users' exists", colNames.includes("users"));
  assert("Collection 'tenantconfigs' exists", colNames.includes("tenantconfigs"));
  assert("Collection 'rewards' exists", colNames.includes("rewards"));
  assert("Collection 'transactions' exists", colNames.includes("transactions"));
  assert("Collection 'notifications' exists", colNames.includes("notifications"));
  assert("Collection 'pushsubscriptions' exists", colNames.includes("pushsubscriptions"));

  // 4. Verify Tenant Configuration
  console.log("\n--- 4. Testing Brand Configuration ---");
  const tenantConfig = await db.collection("tenantconfigs").findOne({ _id: "config_xian_default" });
  assert("TenantConfig document exists", !!tenantConfig);
  assert("Store Name is 'xian'", tenantConfig?.storeName === "xian");
  assert("Tagline matches 'Restaurante Oriental'", tenantConfig?.tagline === "Restaurante Oriental");
  assert("Currency is 'JOD'", tenantConfig?.currency === "JOD");
  assert("Accent Color is '#cb202d'", tenantConfig?.accentColor === "#cb202d");
  assert("Primary Color is '#f7f2e4'", tenantConfig?.primaryColor === "#f7f2e4");

  // 5. Verify Staff Accounts
  console.log("\n--- 5. Testing Admin & Staff Authentication ---");
  const adminUser = await db.collection("users").findOne({ role: "super_admin", username: "xian-admin" });
  assert("Admin user 'xian-admin' exists", !!adminUser);
  if (adminUser) {
    const adminPassValid = bcrypt.compareSync("xian@2026", adminUser.passwordHash);
    assert("Admin password hash verifies correctly ('xian@2026')", adminPassValid);
  }

  const cashierUser = await db.collection("users").findOne({ role: "cashier", username: "salah" });
  assert("Cashier user 'salah' exists", !!cashierUser);
  if (cashierUser) {
    assert("Cashier staffPin is 'salah2026'", cashierUser.staffPin === "salah2026");
  }

  // 6. Test JWT Secret & Token Signing/Verification
  console.log("\n--- 6. Testing Cryptographic Token Generation ---");
  const testPayload = { id: "test_customer_id", role: "customer", phone: "0791234567" };
  const token = jwt.sign(testPayload, process.env.JWT_SECRET, { expiresIn: "3650d" });
  assert("JWT signing succeeded", !!token);
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  assert("JWT verification succeeded", decoded.id === "test_customer_id" && decoded.phone === "0791234567");

  // 7. Test Jordanian Phone Validation Logic
  console.log("\n--- 7. Testing Jordanian Phone Validation Engine ---");
  const jordanianRegex = /^07[789]\d{7}$/;
  function normalizeJordanPhone(raw) {
    let clean = (raw || "").replace(/\D/g, "");
    if (clean.startsWith("96207")) clean = clean.substring(3);
    else if (clean.startsWith("9627")) clean = "0" + clean.substring(3);
    else if (clean.startsWith("0096207")) clean = clean.substring(5);
    else if (clean.startsWith("009627")) clean = "0" + clean.substring(5);
    else if (clean.startsWith("7") && clean.length === 9) clean = "0" + clean;
    return clean;
  }

  assert("0791234567 is valid", jordanianRegex.test(normalizeJordanPhone("0791234567")));
  assert("0781234567 is valid", jordanianRegex.test(normalizeJordanPhone("0781234567")));
  assert("0771234567 is valid", jordanianRegex.test(normalizeJordanPhone("0771234567")));
  assert("+962 79 123 4567 normalizes to 0791234567", normalizeJordanPhone("+962 79 123 4567") === "0791234567");
  assert("0761234567 is rejected", !jordanianRegex.test(normalizeJordanPhone("0761234567")));
  assert("079123456 (9 digits) is rejected", !jordanianRegex.test(normalizeJordanPhone("079123456")));
  assert("07912345678 (11 digits) is rejected", !jordanianRegex.test(normalizeJordanPhone("07912345678")));

  // 8. Test Web Push VAPID Config
  console.log("\n--- 8. Testing Web Push VAPID Protocol ---");
  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    assert("Web Push VAPID initialized with valid keys", true);
  } catch (err) {
    assert("Web Push VAPID initialized with valid keys", false, err.message);
  }

  // 9. Scan DB for any legacy brand references
  console.log("\n--- 9. Database Audit for Residual Brand Mentions ---");
  const allUsers = await db.collection("users").find().toArray();
  let foundLegacy = false;
  for (const u of allUsers) {
    const str = JSON.stringify(u).toLowerCase();
    if (str.includes("cove") || str.includes("ciao")) {
      foundLegacy = true;
      console.warn(`[WARN] Found legacy reference in user: ${u._id} (${u.name})`);
    }
  }
  assert("No legacy 'cove' or 'ciao' in user records", !foundLegacy);

  await mongoose.disconnect();

  console.log("\n==================================================");
  console.log(`  RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runComprehensiveHealthCheck().catch(err => {
  console.error("FATAL ERROR in health check:", err);
  process.exit(1);
});
