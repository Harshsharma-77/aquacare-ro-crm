const fs = require('fs');
const path = require('path');

const backup = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/alakh_kirpa_backup.json'), 'utf8'));

const tsContent = `import { Customer, ServiceRecord, InventoryItem, Technician, AppSettings } from '@/types';
import { addDays, subDays, subMonths, format } from 'date-fns';

const today = new Date();
const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');

export const defaultSettings: AppSettings = {
  shopName: "Alakh Kirpa RO Service & Solutions",
  tagline: "Pure Water, Healthy Life • Reliable Multi-Brand RO Service in Ludhiana",
  phone: "+91 98765 43210",
  whatsappNumber: "+919876543210",
  email: "alakhkirpa.ro@gmail.com",
  address: "Civil Lines / Salem Tabri",
  city: "Ludhiana - 141001",
  gstNumber: "",
  upiId: "alakhkirpa@upi",
  smallServiceIntervalMonths: 6,
  majorServiceIntervalMonths: 12,
  reminderTemplate: "Hello {customer_name}, your {ro_brand} ({ro_model}) water purifier service ({service_type}) is due on {due_date}. Call/WhatsApp us at {shop_phone} whenever convenient to schedule a technician visit. Thank you - {shop_name}.",
  completedTemplate: "Dear {customer_name}, thank you for choosing {shop_name}. Your RO service has been successfully completed by technician {technician_name}. Parts: {parts_summary}. Next service due: {next_due_date}. For queries, call {shop_phone}.",
  promoTemplate: "Greetings from {shop_name}! Get pure & safe drinking water with our special seasonal discount on RO Membrane & Filter change. Call {shop_phone} to book today!"
};

export const defaultTechnicians: Technician[] = [
  { id: 'tech-1', name: 'Ramesh Sharma', phone: '+91 98111 22334', specialty: 'Membrane & Booster Pump Specialist', active: true },
  { id: 'tech-2', name: 'Vikram Singh', phone: '+91 98222 33445', specialty: 'Electrical, SMPS & Solenoid Valves', active: true },
  { id: 'tech-3', name: 'Amit Kumar', phone: '+91 98333 44556', specialty: 'Domestic & Commercial RO Installation', active: true },
  { id: 'tech-4', name: 'Suresh Patel', phone: '+91 98444 55667', specialty: 'Preventive Filter Maintenance & Sanitize', active: true },
];

export const defaultInventory: InventoryItem[] = [
  {
    id: 'inv-1',
    name: 'PP Spun Candle Filter (5 Micron 10")',
    category: 'filter',
    sku: 'FLT-PP-10',
    currentStock: 48,
    minStockLevel: 15,
    costPrice: 65,
    unitPrice: 200,
    description: 'Pre-filter outer spun cartridge for high silt/turbidity protection',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'inv-2',
    name: 'Sediment Filter (Inline 10")',
    category: 'filter',
    sku: 'FLT-SED-INL',
    currentStock: 24,
    minStockLevel: 10,
    costPrice: 140,
    unitPrice: 400,
    description: 'High-density sediment inline filter for particles above 5 microns',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'inv-3',
    name: 'Pre-Carbon Block Filter (Inline 10")',
    category: 'filter',
    sku: 'FLT-CARB-PRE',
    currentStock: 22,
    minStockLevel: 10,
    costPrice: 160,
    unitPrice: 450,
    description: 'Coconut shell activated carbon block filter for chlorine & odor removal',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'inv-4',
    name: 'Post-Carbon / Mineral Inline Cartridge',
    category: 'filter',
    sku: 'FLT-CARB-POST',
    currentStock: 18,
    minStockLevel: 8,
    costPrice: 180,
    unitPrice: 500,
    description: 'Taste enhancer and mineralizer cartridge for pH balance',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'inv-5',
    name: 'RO Membrane 75 GPD (Vontron / Dow Filmtec)',
    category: 'membrane',
    sku: 'MBR-75G-STD',
    currentStock: 14,
    minStockLevel: 6,
    costPrice: 850,
    unitPrice: 1800,
    description: 'High rejection 75 GPD TFC RO membrane sheet up to 2000 ppm TDS',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'inv-6',
    name: 'RO Membrane 100 GPD (High Flow)',
    category: 'membrane',
    sku: 'MBR-100G-HF',
    currentStock: 4,
    minStockLevel: 5,
    costPrice: 1150,
    unitPrice: 2400,
    description: '100 GPD high-flow membrane for heavy water usage',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'inv-7',
    name: 'Booster Pump 100 GPD (Copper Winding 24V)',
    category: 'electrical',
    sku: 'ELE-PMP-100G',
    currentStock: 8,
    minStockLevel: 4,
    costPrice: 1200,
    unitPrice: 2200,
    description: 'Heavy duty booster pump with steel diaphragm and low noise operation',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'inv-8',
    name: 'SMPS Power Adapter (24V 2.5A)',
    category: 'electrical',
    sku: 'ELE-SMPS-24V',
    currentStock: 12,
    minStockLevel: 5,
    costPrice: 320,
    unitPrice: 750,
    description: 'Regulated switch mode power supply with auto cut-off surge protection',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'inv-9',
    name: 'Solenoid Valve (SV 24V DC)',
    category: 'electrical',
    sku: 'ELE-SV-24V',
    currentStock: 15,
    minStockLevel: 6,
    costPrice: 180,
    unitPrice: 450,
    description: 'Automatic water inlet shut-off valve to prevent overflow & dry run',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'inv-10',
    name: 'RO Stainless Steel / Brass Faucet Tap',
    category: 'fittings',
    sku: 'FIT-TAP-SS',
    currentStock: 11,
    minStockLevel: 5,
    costPrice: 150,
    unitPrice: 350,
    description: 'Designer heavy brass spindle RO water dispensing tap',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'inv-11',
    name: 'Hydrostatic Storage Tank 8 Liters',
    category: 'body',
    sku: 'BDY-TNK-8L',
    currentStock: 3,
    minStockLevel: 3,
    costPrice: 650,
    unitPrice: 1350,
    description: 'Food grade pressure storage tank with butyl bladder',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'inv-12',
    name: 'Flow Restrictor (FR 450 / FR 550)',
    category: 'fittings',
    sku: 'FIT-FR-450',
    currentStock: 30,
    minStockLevel: 10,
    costPrice: 35,
    unitPrice: 120,
    description: 'Waste water flow restrictor to maintain optimum membrane backpressure',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'inv-13',
    name: 'TDS Controller Valve & Push-Fit Connectors',
    category: 'fittings',
    sku: 'FIT-TDS-VLV',
    currentStock: 25,
    minStockLevel: 10,
    costPrice: 40,
    unitPrice: 150,
    description: 'Precision needle valve for mineral blending and TDS adjustment',
    updatedAt: new Date().toISOString()
  }
];

export const defaultCustomers: Customer[] = ${JSON.stringify(backup.customers, null, 2)};

export const defaultServices: ServiceRecord[] = ${JSON.stringify(backup.services, null, 2)};

export const defaultROBrands = [
  'Kent',
  'Aquaguard (Eureka Forbes)',
  'Pureit (HUL)',
  'Livpure',
  'Havells',
  'AO Smith',
  'Blue Star',
  'ZeroB',
  'V-Guard',
  'LG Puricare',
  'Panasonic',
  'Standard RO',
  'Cruze / Custom RO',
  'Other'
];
`;

fs.writeFileSync(path.join(__dirname, '../lib/defaultData.ts'), tsContent);
console.log('Successfully updated lib/defaultData.ts with Alakh Kirpa records!');
