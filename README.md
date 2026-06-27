# AutoSpares Pro 🚗
### GST Billing & Inventory Management for Auto Spare Parts Shops

A full-featured cloud SaaS built with React + Supabase, designed to replace desktop software like Optech for small auto spare parts businesses in India.

---

## ✅ Features

### 💰 Billing & Invoicing
- GST Invoice, Quotation, Credit Note
- Intrastate (CGST+SGST) and Interstate (IGST)
- Part search by name, code, brand, vehicle make/model
- Item-wise discount + invoice-level discount
- 5 payment modes: Cash, UPI, Credit, Cheque, NEFT
- PDF invoice generation (jsPDF)
- WhatsApp bill sharing
- Print support

### 📦 Inventory Management
- Part master: code, name, brand, make/model/year, HSN, GST%
- OEM vs Aftermarket tracking
- Purchase price, selling price, MRP
- Stock levels with low stock alerts
- Rack/location tracking
- 13 categories + all-vehicle filter
- Export to Excel

### 👥 Customers & Suppliers
- Full contact details + GSTIN
- Retail / Wholesale classification
- Credit limit & outstanding balance
- Supplier bank details for payments

### 🛒 Purchases
- Purchase orders with supplier invoice tracking
- Auto stock update on purchase
- Input Tax Credit tracking (for GSTR-3B)

### 🔧 Job Cards
- Vehicle-wise service orders
- KM in / KM out tracking
- Complaints, diagnosis, work done
- Labour + parts charge
- Status: Open → In Progress → Done → Delivered

### 💸 Expenses
- Category-wise expense tracking (Rent, Salary, Electricity...)
- Payment mode tracking
- Monthly chart visualization

### 📊 Reports
- Sales Report (invoice-wise)
- Purchase Report
- GSTR-1 Export (Excel + JSON)
- GSTR-3B Summary (tax payable calculation)
- Stock Report (with value)
- Profit & Loss Statement
- Day Book (cash in/out)
- Outstanding Report (customer dues + supplier payables)
- Expense Report

### ⚙️ Settings
- Shop details, GSTIN, PAN
- Bank details for invoice
- Invoice/Purchase number prefixes
- Language: English + Tamil (more coming)
- Supabase connection setup
- Toggle alerts (low stock, GST reminder, WhatsApp)
- Tally XML export

---

## 🚀 Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Setup Supabase (free)
1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to SQL Editor and run `supabase_schema.sql`
4. Copy your Project URL and anon key

### 3. Create .env file
```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run locally
```bash
npm start
```

### 5. Deploy to Netlify
1. Push to GitHub
2. Connect repo in Netlify
3. Add environment variables in Netlify dashboard
4. Deploy!

---

## 🛠 Tech Stack
- **Frontend**: React 18, Tailwind CSS, Lucide Icons
- **Charts**: Recharts
- **Database**: Supabase (PostgreSQL)
- **PDF**: jsPDF + jspdf-autotable
- **Excel**: XLSX (SheetJS)
- **Hosting**: Netlify
- **State**: React Context

---

## 📁 Project Structure
```
src/
├── App.jsx                    # Main router
├── lib/
│   ├── AppContext.js           # Global state (demo mode)
│   ├── supabase.js             # DB helpers
│   └── mockData.js             # Demo data
├── utils/helpers.js            # GST calc, PDF, Excel, WhatsApp
├── translations/index.js       # EN + Tamil
└── components/
    ├── shared/
    │   ├── UI.jsx              # Reusable components
    │   └── Nav.jsx             # Sidebar + TopBar
    ├── dashboard/Dashboard.jsx
    ├── billing/Billing.jsx
    ├── inventory/Inventory.jsx
    ├── customers/Customers.jsx
    ├── suppliers/Suppliers.jsx
    ├── purchases/Purchases.jsx
    ├── jobcards/JobCards.jsx
    ├── expenses/Expenses.jsx
    ├── reports/Reports.jsx
    └── settings/Settings.jsx
```

---

## 💡 Future Features (Roadmap)
- [ ] SMS integration (MSG91)
- [ ] Barcode scanner support
- [ ] Multi-branch / multi-user
- [ ] WhatsApp Business API
- [ ] Payment gateway (Razorpay)
- [ ] Customer loyalty points
- [ ] Vehicle service history
- [ ] Mechanic performance report
- [ ] Auto reorder via WhatsApp to supplier
- [ ] Mobile PWA (installable on phone)

---

## 📞 Support
Built for small auto spare parts shops in India.
Competing with Optech Software at half the price, cloud-based.

**Pricing (SaaS)**
- Basic (1 user): ₹499/month
- Standard (3 users): ₹899/month  
- Pro (5 users + multi-branch): ₹1,499/month
