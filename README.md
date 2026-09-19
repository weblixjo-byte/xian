# xian Loyalty Platform (Restaurante Oriental)

White-label Progressive Web App (PWA) loyalty and rewards platform customized for **xian** (Restaurante Oriental).

## 🚀 Key Features

- **3 Dedicated PWA Web Apps**:
  - Customer Loyalty Pass: `/customer`
  - Cashier POS Terminal: `/cashier` (with custom POS badge)
  - Executive Admin Dashboard: `/admin`
- **Permanent Persistent Sessions**: 10-year session tokens (`3650d` / `315,360,000s`) ensuring staff and customers remain logged in until manual logout.
- **Brand Identity**:
  - Primary Color: `#f7f2e4`
  - Accent Color: `#cb202d`
  - Currency: `JOD`
  - Points: 10 pts per JOD | 1.00 JOD discount per 100 pts | 50 welcome bonus pts
- **Authentication**:
  - Admin: `xian-admin` / `xian@2026`
  - Cashier: `salah` / PIN `salah2026`
  - Customer: Phone OTP & Google One-Tap OAuth
- **Database**: MongoDB Atlas cloud cluster with direct ReplicaSet connection.

## 🛠️ Getting Started

```bash
# Install dependencies
npm install

# Run database seed
node scripts/seed-xian.js

# Start development server
npm run dev

# Build for production
npm run build
```

