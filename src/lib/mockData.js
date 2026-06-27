export const MOCK_PARTS = [
  { id: "p1", code: "BRK-001", name: "Brake Pad Set", brand: "TVS", make: "Maruti", model: "Swift", year_range: "2018-2023", category: "Brakes", hsn_code: "87083000", gst_rate: 28, purchase_price: 450, selling_price: 680, mrp: 750, stock: 24, reorder_level: 5, location: "A1", part_type: "Aftermarket", unit: "SET" },
  { id: "p2", code: "FLT-002", name: "Oil Filter", brand: "Bosch", make: "Hyundai", model: "i20", year_range: "2015-2022", category: "Filters", hsn_code: "84212300", gst_rate: 18, purchase_price: 180, selling_price: 280, mrp: 320, stock: 3, reorder_level: 10, location: "B2", part_type: "OEM", unit: "PCS" },
  { id: "p3", code: "SPK-003", name: "Spark Plug NGK", brand: "NGK", make: "Honda", model: "City", year_range: "2017-2023", category: "Electrical", hsn_code: "85113000", gst_rate: 18, purchase_price: 120, selling_price: 185, mrp: 210, stock: 45, reorder_level: 20, location: "C3", part_type: "OEM", unit: "PCS" },
  { id: "p4", code: "BLT-004", name: "Timing Belt", brand: "Gates", make: "Toyota", model: "Innova", year_range: "2016-2022", category: "Engine", hsn_code: "40103900", gst_rate: 28, purchase_price: 890, selling_price: 1350, mrp: 1500, stock: 8, reorder_level: 3, location: "D4", part_type: "Aftermarket", unit: "PCS" },
  { id: "p5", code: "CLT-005", name: "Clutch Plate", brand: "Valeo", make: "Tata", model: "Nexon", year_range: "2019-2023", category: "Transmission", hsn_code: "87084000", gst_rate: 28, purchase_price: 1200, selling_price: 1800, mrp: 2100, stock: 2, reorder_level: 4, location: "E5", part_type: "OEM", unit: "PCS" },
  { id: "p6", code: "WPM-006", name: "Water Pump", brand: "Minda", make: "Maruti", model: "Alto", year_range: "2010-2022", category: "Cooling", hsn_code: "84138200", gst_rate: 28, purchase_price: 650, selling_price: 980, mrp: 1100, stock: 6, reorder_level: 3, location: "F6", part_type: "Aftermarket", unit: "PCS" },
  { id: "p7", code: "HLB-007", name: "Headlight Bulb H4", brand: "Philips", make: "Universal", model: "All", year_range: "All", category: "Electrical", hsn_code: "85392990", gst_rate: 18, purchase_price: 95, selling_price: 145, mrp: 165, stock: 60, reorder_level: 20, location: "G7", part_type: "Aftermarket", unit: "PCS" },
  { id: "p8", code: "RAD-008", name: "Radiator Cap", brand: "Tata", make: "Mahindra", model: "Scorpio", year_range: "2014-2021", category: "Cooling", hsn_code: "84145100", gst_rate: 18, purchase_price: 85, selling_price: 140, mrp: 160, stock: 0, reorder_level: 10, location: "H8", part_type: "Aftermarket", unit: "PCS" },
  { id: "p9", code: "SUS-009", name: "Shock Absorber Front", brand: "Gabriel", make: "Maruti", model: "Dzire", year_range: "2017-2023", category: "Suspension", hsn_code: "87088000", gst_rate: 28, purchase_price: 1100, selling_price: 1650, mrp: 1900, stock: 5, reorder_level: 2, location: "I9", part_type: "OEM", unit: "PCS" },
  { id: "p10", code: "AIR-010", name: "Air Filter", brand: "Bosch", make: "Hyundai", model: "Creta", year_range: "2015-2023", category: "Filters", hsn_code: "84212300", gst_rate: 18, purchase_price: 220, selling_price: 340, mrp: 390, stock: 18, reorder_level: 8, location: "J10", part_type: "OEM", unit: "PCS" },
];

export const MOCK_CUSTOMERS = [
  { id: "c1", name: "Rajan Motors", phone: "9876543210", alt_phone: "", email: "rajan@motors.com", address: "12 Anna Salai, Chennai", city: "Chennai", gst_no: "33AABCR1234F1Z5", customer_type: "Wholesale", balance: 4500, credit_limit: 50000, discount_pct: 5 },
  { id: "c2", name: "Kumar Auto Works", phone: "9845612378", alt_phone: "9845612379", email: "kumar@auto.com", address: "45 GST Road, Tambaram", city: "Chennai", gst_no: "", customer_type: "Retail", balance: 0, credit_limit: 5000, discount_pct: 0 },
  { id: "c3", name: "Sri Murugan Garage", phone: "9962341234", alt_phone: "", email: "", address: "7 Main Road, Madurai", city: "Madurai", gst_no: "", customer_type: "Retail", balance: 1200, credit_limit: 10000, discount_pct: 2 },
  { id: "c4", name: "VK Automobiles", phone: "9751234567", alt_phone: "", email: "vk@autos.in", address: "88 NH47, Coimbatore", city: "Coimbatore", gst_no: "33AABCV5678G1Z2", customer_type: "Wholesale", balance: 8900, credit_limit: 100000, discount_pct: 8 },
];

export const MOCK_SUPPLIERS = [
  { id: "s1", name: "TVS Genuine Parts", contact_person: "Suresh", phone: "9044123456", email: "supply@tvs.com", address: "TVS Industrial Estate, Hosur", city: "Hosur", gst_no: "33AABCT9876H1Z1", balance: 12000 },
  { id: "s2", name: "Bosch India Ltd", contact_person: "Ramesh", phone: "9022345678", email: "orders@bosch.in", address: "Bosch Road, Bengaluru", city: "Bengaluru", gst_no: "29AABCB4567I1Z3", balance: 5500 },
  { id: "s3", name: "Minda Industries", contact_person: "Vijay", phone: "9911234567", email: "sales@minda.com", address: "Sector 44, Gurugram", city: "Gurugram", gst_no: "06AABCM3456J1Z4", balance: 3200 },
];

export const MOCK_INVOICES = [
  { id: "inv1", invoice_no: "INV-2024-001", invoice_type: "Invoice", invoice_date: "2024-01-15", customer_name: "Rajan Motors", customer_id: "c1", subtotal: 4280, discount_amt: 0, taxable_amt: 4280, cgst_amt: 385, sgst_amt: 385, igst_amt: 0, total_gst: 770, grand_total: 5050, paid_amount: 5050, balance_due: 0, payment_mode: "UPI", status: "paid", supply_type: "intrastate" },
  { id: "inv2", invoice_no: "INV-2024-002", invoice_type: "Invoice", invoice_date: "2024-01-16", customer_name: "Kumar Auto Works", customer_id: "c2", subtotal: 1830, discount_amt: 0, taxable_amt: 1830, cgst_amt: 165, sgst_amt: 165, igst_amt: 0, total_gst: 330, grand_total: 2160, paid_amount: 2160, balance_due: 0, payment_mode: "Cash", status: "paid", supply_type: "intrastate" },
  { id: "inv3", invoice_no: "INV-2024-003", invoice_type: "Invoice", invoice_date: "2024-01-17", customer_name: "Sri Murugan Garage", customer_id: "c3", subtotal: 980, discount_amt: 0, taxable_amt: 980, cgst_amt: 88, sgst_amt: 88, igst_amt: 0, total_gst: 176, grand_total: 1156, paid_amount: 0, balance_due: 1156, payment_mode: "Credit", status: "unpaid", supply_type: "intrastate" },
  { id: "inv4", invoice_no: "INV-2024-004", invoice_type: "Invoice", invoice_date: "2024-01-18", customer_name: "VK Automobiles", customer_id: "c4", subtotal: 8900, discount_amt: 712, taxable_amt: 8188, cgst_amt: 737, sgst_amt: 737, igst_amt: 0, total_gst: 1474, grand_total: 9662, paid_amount: 5000, balance_due: 4662, payment_mode: "Cheque", status: "partial", supply_type: "intrastate" },
  { id: "inv5", invoice_no: "INV-2024-005", invoice_type: "Invoice", invoice_date: "2024-01-18", customer_name: "Rajan Motors", customer_id: "c1", subtotal: 3250, discount_amt: 163, taxable_amt: 3087, cgst_amt: 278, sgst_amt: 278, igst_amt: 0, total_gst: 556, grand_total: 3643, paid_amount: 3643, balance_due: 0, payment_mode: "Cash", status: "paid", supply_type: "intrastate" },
];

export const MOCK_PURCHASES = [
  { id: "pur1", purchase_no: "PUR-2024-001", purchase_date: "2024-01-10", supplier_name: "TVS Genuine Parts", supplier_id: "s1", supplier_invoice: "TVS/JAN/4521", subtotal: 12000, total_gst: 2160, grand_total: 14160, paid_amount: 14160, balance_due: 0, payment_mode: "NEFT", status: "received" },
  { id: "pur2", purchase_no: "PUR-2024-002", purchase_date: "2024-01-12", supplier_name: "Bosch India Ltd", supplier_id: "s2", supplier_invoice: "BOSCH/5678", subtotal: 8500, total_gst: 1530, grand_total: 10030, paid_amount: 5000, balance_due: 5030, payment_mode: "Credit", status: "partial" },
];

export const MOCK_JOB_CARDS = [
  { id: "job1", job_no: "JOB-001", job_date: "2024-01-18", customer_name: "Walk-in Customer", phone: "9876543210", vehicle_no: "TN 37 AB 1234", vehicle_make: "Maruti", vehicle_model: "Swift", year: "2020", km_in: 45200, complaints: "Engine noise, AC not cooling", work_done: "Oil change, AC gas refill", labour_charge: 500, parts_charge: 1200, total_charge: 1700, mechanic_name: "Murugan", status: "done" },
  { id: "job2", job_no: "JOB-002", job_date: "2024-01-18", customer_name: "Kumar Auto Works", phone: "9845612378", vehicle_no: "TN 39 CD 5678", vehicle_make: "Hyundai", vehicle_model: "i20", year: "2019", km_in: 62000, complaints: "Brake noise", work_done: "Brake pad replacement", labour_charge: 300, parts_charge: 680, total_charge: 980, mechanic_name: "Selvam", status: "in-progress" },
];

export const MOCK_EXPENSES = [
  { id: "exp1", date: "2024-01-01", category: "Rent", description: "Shop rent January", amount: 15000, payment_mode: "Cheque" },
  { id: "exp2", date: "2024-01-05", category: "Electricity", description: "TNEB bill December", amount: 2400, payment_mode: "UPI" },
  { id: "exp3", date: "2024-01-10", category: "Salary", description: "Staff salary January", amount: 18000, payment_mode: "Cash" },
  { id: "exp4", date: "2024-01-15", category: "Transport", description: "Delivery charges", amount: 850, payment_mode: "Cash" },
];

export const MONTHLY_CHART = [
  { month: "Aug", sales: 82000, purchase: 54000, profit: 28000 },
  { month: "Sep", sales: 91000, purchase: 61000, profit: 30000 },
  { month: "Oct", sales: 78000, purchase: 52000, profit: 26000 },
  { month: "Nov", sales: 105000, purchase: 70000, profit: 35000 },
  { month: "Dec", sales: 118000, purchase: 79000, profit: 39000 },
  { month: "Jan", sales: 98000, purchase: 65000, profit: 33000 },
];

export const CATEGORY_CHART = [
  { name: "Brakes", value: 28, color: "#ef4444" },
  { name: "Filters", value: 22, color: "#f97316" },
  { name: "Electrical", value: 18, color: "#eab308" },
  { name: "Engine", value: 15, color: "#22c55e" },
  { name: "Cooling", value: 10, color: "#3b82f6" },
  { name: "Others", value: 7, color: "#8b5cf6" },
];
