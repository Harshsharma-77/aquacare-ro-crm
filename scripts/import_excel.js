const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/Admin/Desktop/Alakh_Kirpa_Customers_and_Services.xlsx';
if (!fs.existsSync(filePath)) {
  console.error('File not found at', filePath);
  process.exit(1);
}

const wb = XLSX.readFile(filePath);
const rawCustomers = XLSX.utils.sheet_to_json(wb.Sheets['All Customers'] || wb.Sheets[wb.SheetNames[0]]);
const rawServices = XLSX.utils.sheet_to_json(wb.Sheets['Service History'] || wb.Sheets[wb.SheetNames[1]]);

console.log(`Read ${rawCustomers.length} customers and ${rawServices.length} services.`);

function mapServiceType(raw) {
  const str = String(raw || '').toLowerCase().trim();
  if (str.includes('half')) return 'small';
  if (str.includes('year')) return 'major';
  if (str.includes('install')) return 'installation';
  return 'repair';
}

function cleanPhone(raw) {
  return String(raw || '').replace(/[^0-9]/g, '');
}

// 1. Map Customers
const customerMap = new Map();
const customers = rawCustomers.map((row, idx) => {
  const phone = cleanPhone(row['Phone Number']);
  const id = `cust-ak-${String(idx + 1).padStart(3, '0')}`;
  const name = String(row['Customer Name'] || '').trim();
  const address = String(row['Address'] || '').trim();
  const roModel = String(row['Filter Model'] || 'Standard RO').trim();
  const lastServiceDate = row['Last Service Date'] ? String(row['Last Service Date']).trim() : undefined;
  const nextServiceDueDate = row['Next Due Date'] ? String(row['Next Due Date']).trim() : undefined;
  const lastServiceType = mapServiceType(row['Last Service Type']);

  const customerObj = {
    id,
    name,
    phone,
    alternatePhone: '',
    address,
    area: address.includes(',') ? address.split(',').pop().trim() : 'Ludhiana',
    googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(address)}`,
    roBrand: roModel.includes('Kent') ? 'Kent' : roModel.includes('Aquaguard') ? 'Aquaguard' : roModel.includes('Pureit') ? 'Pureit' : 'Standard RO',
    roModel,
    installationDate: lastServiceDate || '2025-01-01',
    status: 'active',
    createdAt: lastServiceDate || '2025-01-01',
    updatedAt: new Date().toISOString().split('T')[0],
    lastServiceDate,
    nextServiceDueDate,
    lastServiceType
  };

  customerMap.set(phone, customerObj);
  return customerObj;
});

// 2. Map Services
const services = rawServices.map((row, idx) => {
  const phone = cleanPhone(row['Phone Number']);
  const cust = customerMap.get(phone);
  const serviceDate = String(row['Service Date'] || '2026-01-01').trim();
  const srvType = mapServiceType(row['Service Type']);
  const cost = Number(row['Cost (Rs.)']) || 0;
  const partsStr = String(row['Parts Replaced'] || '').trim();
  const paymentMode = String(row['Payment Mode'] || '').toLowerCase().includes('online') ? 'upi' : 'cash';

  const partsUsed = partsStr ? partsStr.split(/[,/]+/).map((p, pIdx) => ({
    id: `part-${idx}-${pIdx}`,
    name: p.trim(),
    category: p.toLowerCase().includes('filter') ? 'filter' : p.toLowerCase().includes('membrane') ? 'membrane' : p.toLowerCase().includes('tap') ? 'fittings' : 'general',
    quantity: 1,
    unitPrice: cost,
    totalPrice: cost
  })) : [];

  return {
    id: `srv-ak-${String(idx + 1).padStart(3, '0')}`,
    customerId: cust ? cust.id : `cust-ak-unknown`,
    customerName: String(row['Customer Name'] || (cust ? cust.name : 'Customer')).trim(),
    customerPhone: phone,
    customerAddress: String(row['Address'] || (cust ? cust.address : '')).trim(),
    roBrand: cust ? cust.roBrand : 'Standard RO',
    roModel: cust ? cust.roModel : 'Standard RO',
    serviceType: srvType,
    serviceDate,
    nextDueDate: cust && cust.nextServiceDueDate ? cust.nextServiceDueDate : '2026-10-21',
    technicianName: 'Technician',
    partsUsed,
    partsCost: cost > 250 ? cost - 250 : 0,
    serviceCharge: cost > 250 ? 250 : cost,
    discount: 0,
    totalAmount: cost,
    paymentStatus: 'paid',
    paymentMode,
    remarks: String(row['Notes / Remarks'] || partsStr).trim(),
    createdAt: serviceDate
  };
});

console.log(`Generated ${customers.length} customer records & ${services.length} service records.`);

// Write JSON backup file so user can also use Backup & Restore in Settings
const backupPayload = {
  version: '1.0',
  exportedAt: new Date().toISOString(),
  customers,
  services,
  settings: {
    shopName: "Alakh Kirpa RO Service & Solutions",
    tagline: "Pure Water, Healthy Life • Reliable RO Service in Ludhiana",
    phone: "+91 98765 43210",
    whatsappNumber: "+919876543210",
    email: "alakhkirpa.ro@gmail.com",
    address: "Ludhiana, Punjab",
    city: "Ludhiana",
    gstNumber: "",
    upiId: "alakhkirpa@upi",
    smallServiceIntervalMonths: 6,
    majorServiceIntervalMonths: 12,
    reminderTemplate: "Hello {customer_name}, your {ro_brand} ({ro_model}) water purifier service ({service_type}) is due on {due_date}. Call/WhatsApp us at {shop_phone} whenever convenient to schedule a visit. Thank you - {shop_name}.",
    completedTemplate: "Dear {customer_name}, thank you for choosing {shop_name}. Your RO service has been completed. Next service due: {next_due_date}. Call {shop_phone} for any queries.",
    promoTemplate: "Greetings from {shop_name}! Get pure & safe drinking water with our special seasonal discount on RO Membrane & Filter change. Call {shop_phone} to book today!"
  }
};

fs.writeFileSync(
  path.join(__dirname, '../public/alakh_kirpa_backup.json'),
  JSON.stringify(backupPayload, null, 2)
);

// Also generate Neon SQL insert script
let sqlContent = `-- Alakh Kirpa Real Customers & Services Seed for Neon / Postgres\n\n`;

// Insert Customers
sqlContent += `INSERT INTO customers (id, name, phone, address, area, ro_brand, ro_model, installation_date, last_service_date, next_service_due_date, last_service_type, status) VALUES\n`;
const customerSqlRows = customers.map(c => 
  `('${c.id}', '${c.name.replace(/'/g, "''")}', '${c.phone}', '${c.address.replace(/'/g, "''")}', '${c.area.replace(/'/g, "''")}', '${c.roBrand.replace(/'/g, "''")}', '${c.roModel.replace(/'/g, "''")}', '${c.installationDate}', '${c.lastServiceDate}', '${c.nextServiceDueDate}', '${c.lastServiceType}', 'active')`
);
sqlContent += customerSqlRows.join(',\n') + `\nON CONFLICT (id) DO NOTHING;\n\n`;

// Insert Services
sqlContent += `INSERT INTO services (id, customer_id, customer_name, customer_phone, customer_address, ro_brand, ro_model, service_type, service_date, next_due_date, technician_name, total_amount, payment_status, payment_mode, remarks) VALUES\n`;
const serviceSqlRows = services.map(s =>
  `('${s.id}', '${s.customerId}', '${s.customerName.replace(/'/g, "''")}', '${s.customerPhone}', '${s.customerAddress.replace(/'/g, "''")}', '${s.roBrand.replace(/'/g, "''")}', '${s.roModel.replace(/'/g, "''")}', '${s.serviceType}', '${s.serviceDate}', '${s.nextDueDate}', '${s.technicianName}', ${s.totalAmount}, '${s.paymentStatus}', '${s.paymentMode}', '${s.remarks.replace(/'/g, "''")}')`
);
sqlContent += serviceSqlRows.join(',\n') + `\nON CONFLICT (id) DO NOTHING;\n`;

fs.writeFileSync(path.join(__dirname, '../neon_alakh_kirpa_seed.sql'), sqlContent);

console.log('Successfully generated public/alakh_kirpa_backup.json and neon_alakh_kirpa_seed.sql!');
