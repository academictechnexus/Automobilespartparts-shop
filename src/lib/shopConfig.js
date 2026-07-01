/**
 * Shop Type Configuration
 * Customize the entire app behavior based on shop type
 * Admin picks their shop type → labels, fields, categories change automatically
 */

export const SHOP_TYPES = {
  auto_parts: {
    key:         'auto_parts',
    label:       'Auto Spare Parts',
    icon:        '🚗',
    desc:        'Vehicle spare parts, accessories, garage supplies',
    color:       'orange',
    // Inventory labels
    itemLabel:   'Part',
    itemsLabel:  'Parts',
    codeLabel:   'Part Code',
    brandLabel:  'Brand',
    // Extra inventory fields to show
    showFields:  ['make','model','year_range','oem_part_no','part_type','warranty_months','batch_no'],
    // Categories
    categories:  ['Brakes','Filters','Electrical','Engine','Cooling','Transmission','Suspension','Body','Tyres','Steering','Fuel System','Exhaust','Accessories','Others'],
    // Units
    units:       ['PCS','SET','KIT','LTR','MTR','KG','PAIR','BOX','NOS'],
    // HSN suggestion
    hsnSuggestion: '87083000',
    defaultGST:  28,
    // Job cards
    showJobCards: true,
    jobCardLabel: 'Job Card / Service Order',
    vehicleFields: true,
    // Customer fields
    customerExtraFields: ['vehicle_nos'],
    // Invoice terms
    defaultTerms: 'Goods once sold will not be taken back. Warranty as per manufacturer.',
    // GST rates commonly used
    commonGST:   [5, 12, 18, 28],
  },

  retail: {
    key:         'retail',
    label:       'Retail / General Store',
    icon:        '🛒',
    desc:        'Supermarket, grocery, FMCG, general merchandise',
    color:       'blue',
    itemLabel:   'Product',
    itemsLabel:  'Products',
    codeLabel:   'Product Code / Barcode',
    brandLabel:  'Brand / Company',
    showFields:  ['batch_no','expiry_date','weight','country_origin'],
    categories:  ['Grocery','Beverages','Personal Care','Household','Dairy','Snacks','Bakery','Frozen','Stationery','Clothing','Footwear','Electronics','Others'],
    units:       ['PCS','KG','GM','LTR','ML','PKT','BOX','DOZ','PAIR','MTR'],
    hsnSuggestion: '21069099',
    defaultGST:  5,
    showJobCards: false,
    jobCardLabel: '',
    vehicleFields: false,
    customerExtraFields: [],
    defaultTerms: 'No exchange or return on perishable goods.',
    commonGST:   [0, 5, 12, 18],
  },

  medical: {
    key:         'medical',
    label:       'Medical / Pharmacy',
    icon:        '💊',
    desc:        'Pharmacy, medical supplies, surgical equipment',
    color:       'green',
    itemLabel:   'Medicine / Product',
    itemsLabel:  'Medicines',
    codeLabel:   'Drug Code / SKU',
    brandLabel:  'Manufacturer',
    showFields:  ['batch_no','expiry_date','country_origin'],
    categories:  ['Tablets','Syrups','Injections','Capsules','Ointments','Drops','Surgical','Diagnostic','Vitamins','Ayurvedic','Homeopathy','Medical Equipment','Others'],
    units:       ['Strip','Bottle','Tube','Box','Vial','Sachet','Injection','PCS'],
    hsnSuggestion: '30049099',
    defaultGST:  12,
    showJobCards: false,
    jobCardLabel: 'Patient Record',
    vehicleFields: false,
    customerExtraFields: ['doctor_name','patient_id'],
    defaultTerms: 'Schedule H/H1 drugs sold only on prescription. Check expiry before use.',
    commonGST:   [0, 5, 12],
    // Extra fields specific to medical
    extraInventoryFields: [
      { name:'salt_composition', label:'Salt / Composition', type:'text', placeholder:'Paracetamol 500mg' },
      { name:'manufacturer',     label:'Manufacturer',       type:'text', placeholder:'Sun Pharma' },
      { name:'schedule',         label:'Schedule',           type:'select', options:'General,Schedule H,Schedule H1,Schedule X,OTC' },
      { name:'requires_prescription', label:'Requires Prescription', type:'checkbox' },
    ],
  },

  electronics: {
    key:         'electronics',
    label:       'Electronics / Mobile',
    icon:        '📱',
    desc:        'Mobile phones, laptops, accessories, repair shop',
    color:       'purple',
    itemLabel:   'Product',
    itemsLabel:  'Products',
    codeLabel:   'Model / IMEI Code',
    brandLabel:  'Brand',
    showFields:  ['batch_no','warranty_months','country_origin','oem_part_no'],
    categories:  ['Mobile Phones','Laptops','Tablets','Accessories','Cables','Chargers','Cases','Repair Parts','Audio','Cameras','TV & Display','Smart Home','Others'],
    units:       ['PCS','BOX','SET','PAIR'],
    hsnSuggestion: '85171200',
    defaultGST:  18,
    showJobCards: true,
    jobCardLabel: 'Repair Order',
    vehicleFields: false,
    customerExtraFields: [],
    defaultTerms: 'No cash refund. Exchange within 7 days with original bill. Warranty void if physically damaged.',
    commonGST:   [5, 12, 18, 28],
    extraInventoryFields: [
      { name:'model_no',    label:'Model Number',    type:'text', placeholder:'iPhone 15 Pro Max' },
      { name:'color',       label:'Color / Variant', type:'text', placeholder:'Black 256GB' },
      { name:'specs',       label:'Specifications',  type:'textarea', placeholder:'RAM, Storage, Display...' },
      { name:'imei_serial', label:'IMEI / Serial No',type:'text', placeholder:'For serialized items' },
    ],
  },

  hardware: {
    key:         'hardware',
    label:       'Hardware / Building Material',
    icon:        '🔨',
    desc:        'Tools, pipes, cement, electrical, plumbing',
    color:       'yellow',
    itemLabel:   'Item',
    itemsLabel:  'Items',
    codeLabel:   'Item Code',
    brandLabel:  'Brand / Make',
    showFields:  ['weight','country_origin','batch_no'],
    categories:  ['Cement & Concrete','Steel & Metal','Electrical','Plumbing','Tools','Paint','Tiles','Wood','Glass','Adhesives','Fasteners','Safety Equipment','Others'],
    units:       ['PCS','KG','MTR','SFT','CFT','LTR','BOX','BAG','TON','BUNDLE'],
    hsnSuggestion: '73269099',
    defaultGST:  18,
    showJobCards: false,
    vehicleFields: false,
    customerExtraFields: ['site_address'],
    defaultTerms: 'Material once sold is non-returnable. Check quality before acceptance.',
    commonGST:   [5, 12, 18, 28],
    extraInventoryFields: [
      { name:'size_dimension', label:'Size / Dimension', type:'text', placeholder:'6mm, 10x10ft, 1inch' },
      { name:'grade',          label:'Grade / Grade',    type:'text', placeholder:'Grade 43, IS 2062' },
      { name:'color',          label:'Color / Finish',   type:'text', placeholder:'White, Silver, Galvanized' },
    ],
  },

  textile: {
    key:         'textile',
    label:       'Textile / Clothing',
    icon:        '👕',
    desc:        'Clothing, fabric, sarees, garments, footwear',
    color:       'pink',
    itemLabel:   'Product',
    itemsLabel:  'Products',
    codeLabel:   'Style Code',
    brandLabel:  'Brand / Designer',
    showFields:  ['country_origin','batch_no'],
    categories:  ['Men\'s Wear','Women\'s Wear','Kids Wear','Sarees','Fabrics','Footwear','Accessories','Innerwear','Sportswear','Formal Wear','Ethnic Wear','Others'],
    units:       ['PCS','MTR','DOZ','PAIR','SET','BOX'],
    hsnSuggestion: '62099090',
    defaultGST:  5,
    showJobCards: false,
    vehicleFields: false,
    customerExtraFields: [],
    defaultTerms: 'Goods sold are non-returnable. Exchange only with original bill within 7 days.',
    commonGST:   [0, 5, 12],
    extraInventoryFields: [
      { name:'size',    label:'Size',          type:'text', placeholder:'S, M, L, XL, 28-36' },
      { name:'color',   label:'Color',         type:'text', placeholder:'Red, Blue, Multi' },
      { name:'material',label:'Material / Fabric', type:'text', placeholder:'Cotton, Silk, Polyester' },
      { name:'pattern', label:'Pattern',       type:'text', placeholder:'Solid, Printed, Checks' },
    ],
  },
};

// ─── GET CURRENT SHOP CONFIG ──────────────────────────────────────────────────
export const getShopConfig = () => {
  try {
    const type = localStorage.getItem('shop_type') || 'auto_parts';
    return SHOP_TYPES[type] || SHOP_TYPES.auto_parts;
  } catch {
    return SHOP_TYPES.auto_parts;
  }
};

export const setShopType = (type) => {
  localStorage.setItem('shop_type', type);
  window.location.reload(); // reload to apply everywhere
};

export const getCurrentShopType = () => localStorage.getItem('shop_type') || 'auto_parts';