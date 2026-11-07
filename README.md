# 💧 AquaCare RO Pro - Water Purifier Service & CRM System

A modern, full-stack, production-ready web application designed for **Multi-Brand RO (Reverse Osmosis) Water Purifier Service, Maintenance & Spare Parts Businesses**.

Built with **Next.js (App Router)**, **React**, **TypeScript**, **Tailwind CSS**, **Supabase PostgreSQL & Auth**, and **Excel/PDF Exporters**.

---

## 🌟 Key Features & Capabilities

### 1. 📊 Executive Operations Dashboard
- **Real-Time KPIs**: Total active customers, services due today (with badge), services due this week, completed services this month, monthly & lifetime revenue.
- **Urgent Due Reminders Banner**: Automatic notification strip for overdue and today's due services with 1-click WhatsApp messaging.
- **Visual Analytics**: Service type distribution (Small vs Major vs Repairs), top replaced spare parts, and live activity stream of recent repairs.

### 2. 👥 Customer Management Directory
- **Customer Fields**: Name, Primary WhatsApp Phone, Alternate Phone, Address, Area/Colony, Google Maps navigation link/coordinates, RO Brand (*Kent, Aquaguard, Pureit, Livpure, Havells, AO Smith, Blue Star, ZeroB, Custom*), RO Model, Installation Date, Raw Water TDS, Purified Water TDS, Special Notes, and Active/Inactive status.
- **Customer 360° Profile Modal**: Direct Call (`tel:`), WhatsApp (`wa.me`), Google Maps directions, complete service timeline history, and printable QR machine tags.
- **Smart Search & Filters**: Multi-parameter search by Name, Phone, Area, Brand, or Model with quick filters for Due Today, Due This Week, Due This Month, Overdue, Small Service Track, and Major Service Track.

### 3. 🔧 Service History & Smart Logging Engine
- **Service Types with Auto-Scheduling**:
  - **Small Service**: Replaces PP Spun Candle filter $\rightarrow$ Automatically calculates & sets next service due date to **+6 Months**.
  - **Major Service**: Replaces Sediment + Pre-Carbon + Post-Carbon + Spun filters $\rightarrow$ Automatically calculates next service due date to **+12 Months**.
  - **Repairs / Parts Replacement**: Booster Pump (100 GPD), RO Membrane (75/80/100 GPD), SMPS Adapter (24V/36V), Solenoid Valve (SV), Float Valve, Faucet Tap, Storage Tank, Flow Restrictor (FR), TDS Controller, Connectors, and Custom items.
  - **New Installation**: Machine commissioning & raw/output TDS calibration.
- **Itemized Billing**: Parts cost, technician labor charge, discount, and grand total auto-summation.
- **Inventory Auto-Deduction**: Spare parts used are automatically subtracted from stock upon saving!
- **Digital Customer Signature**: HTML5 Canvas signature pad for customer sign-off on technician visits.
- **Water Quality Tracking**: Raw Input TDS (ppm) vs Purified Output TDS (ppm) purity verification.

### 4. 💬 WhatsApp Automation & Due Date Reminders Hub
- **1-Click WhatsApp Messages**: Deep-link generation (`https://wa.me/{phone}?text=...`) for instant communication via WhatsApp Web or mobile app.
- **Personalized Variable Templates**:
  - *"Hello {customer_name}, your {ro_brand} ({ro_model}) water purifier service ({service_type}) is due on {due_date}. Call/WhatsApp us at {shop_phone} whenever convenient to schedule a technician visit. Thank you - {shop_name}."*
- **Bulk & Individual Dispatch**: Filter queue by Due Today, Due This Week, Overdue, or Due This Month with sent status tracking and message copy tools.

### 5. 📅 Interactive Service Calendar
- Monthly and weekly grid view color-coded by visit urgency.
- Day click agenda: View all scheduled appointments and due visits for that date with quick Call and WhatsApp buttons.

### 6. 📦 Spare Parts Inventory & Stock Management
- Track stock counts, minimum thresholds, purchase costs, and retail selling prices.
- Low stock indicators with quick restock buttons (`+1`, `+10`).
- Inventory valuation summary.

### 7. 📈 Business Reports & Export Center
- Financial breakdown: Gross revenue, technician service fees, parts revenue, and average ticket size.
- Technician leaderboard and performance tracker.
- Most replaced spare parts analysis.
- One-click export of Customers, Service Logs, and Inventory to **Excel (.xlsx)** and **CSV**.
- Printable tax invoice & service receipt with **PDF download** (via jsPDF).

### 8. 🏷️ RO Purifier Machine QR Sticker Tags
- Generates printable sticker labels to stick on customer purifiers.
- Includes customer ID, RO machine model, emergency service helpline, and scannable QR code.

### 9. ☁️ Supabase Cloud Synchronization & Dual Mode
- **Zero-Setup Out-of-the-Box Mode**: Comes with pre-seeded sample data stored locally so the app is instantly usable without database configuration.
- **Production Supabase Integration**: Run `supabase_schema.sql` in your Supabase SQL Editor and enter your Supabase URL & Anon Key in Settings for automatic PostgreSQL cloud sync.
- **Backup & Restore**: Export full database to JSON and import backups anytime.

---

## 🚀 Getting Started

### 1. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Build for Production
```bash
npm run build
npm run start
```

### 3. Deploy to Vercel
1. Push this repository to GitHub.
2. Import repository into [Vercel](https://vercel.com).
3. (Optional) Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to Vercel Environment Variables.
4. Click **Deploy**.

---

## 📂 Project Structure
```
├── app/
│   ├── globals.css          # Tailwind directives & print styling
│   ├── layout.tsx           # Metadata & responsive layout shell
│   └── page.tsx             # Main container, routing, modals & state
├── components/
│   ├── Navbar.tsx           # Header, quick search, and notification popover
│   ├── Sidebar.tsx          # Navigation menu with badge indicators
│   ├── DashboardOverview.tsx# KPI metrics, urgent due banner, charts & feed
│   ├── CustomerList.tsx     # Customer directory, filters & action triggers
│   ├── CustomerModal.tsx    # Add / Edit customer form & GPS maps link
│   ├── CustomerDetailModal.tsx # 360° customer profile & service timeline
│   ├── ServiceLogModal.tsx  # Service logging, auto +6M/+12M due date & signature
│   ├── ServiceInvoiceModal.tsx # Printable tax invoice & WhatsApp bill sender
│   ├── WhatsAppRemindersHub.tsx# Bulk & individual WhatsApp due reminders
│   ├── ServiceCalendar.tsx  # Interactive monthly schedule calendar
│   ├── InventoryManager.tsx # Spare parts inventory & low-stock alerts
│   ├── ReportsAnalytics.tsx # Revenue reports & technician leaderboard
│   ├── MachineQRStickerModal.tsx # Printable machine QR sticker tags
│   └── SettingsModal.tsx    # Business profile, Supabase sync & JSON backup
├── lib/
│   ├── defaultData.ts       # Realistic seed data (Kent, Aquaguard, Pureit, etc.)
│   ├── excelExport.ts       # XLSX workbook generator
│   ├── pdfGenerator.ts      # jsPDF service invoice generator
│   ├── storage.ts           # Multi-tier LocalStorage & Supabase sync engine
│   ├── supabaseClient.ts    # Supabase client initializer
│   ├── utils.ts             # Urgency categorizer, currency & date formatting
│   └── whatsapp.ts          # WhatsApp deep-link & message template formatter
├── types/
│   └── index.ts             # TypeScript data contracts & interfaces
├── supabase_schema.sql      # Production PostgreSQL DDL with RLS policies
└── package.json             # Next.js 14, React 18, TypeScript, Tailwind, jsPDF, XLSX
```
