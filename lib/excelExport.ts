import * as XLSX from 'xlsx';
import { Customer, ServiceRecord, InventoryItem } from '@/types';
import { formatDateSafe } from './utils';

export function exportCustomersToExcel(customers: Customer[], filename: string = 'RO_Customers_List.xlsx') {
  const data = customers.map((c, index) => ({
    'S.No': index + 1,
    'Customer Name': c.name,
    'Primary Phone': c.phone,
    'Alternate Phone': c.alternatePhone || '',
    'Address': c.address,
    'Area': c.area || '',
    'RO Brand': c.roBrand,
    'RO Model': c.roModel,
    'Installation Date': formatDateSafe(c.installationDate),
    'Raw Water TDS (ppm)': c.rawWaterTds || 'N/A',
    'Pure Water TDS (ppm)': c.outputTds || 'N/A',
    'Status': c.status.toUpperCase(),
    'Last Service Date': formatDateSafe(c.lastServiceDate),
    'Next Due Date': formatDateSafe(c.nextServiceDueDate),
    'Notes': c.notes || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
  XLSX.writeFile(workbook, filename);
}

export function exportServicesToExcel(services: ServiceRecord[], filename: string = 'RO_Service_History.xlsx') {
  const data = services.map((s, index) => ({
    'Service ID': s.id,
    'Date': formatDateSafe(s.serviceDate),
    'Customer Name': s.customerName,
    'Phone': s.customerPhone,
    'RO Brand & Model': `${s.roBrand || ''} ${s.roModel || ''}`.trim(),
    'Service Type': s.serviceType.toUpperCase(),
    'Technician': s.technicianName,
    'Parts Replaced': s.partsUsed.map(p => `${p.name} (x${p.quantity})`).join(', ') || 'None',
    'Parts Cost (Rs)': s.partsCost,
    'Service Charge (Rs)': s.serviceCharge,
    'Discount (Rs)': s.discount || 0,
    'Total Amount (Rs)': s.totalAmount,
    'Payment Status': s.paymentStatus.toUpperCase(),
    'Payment Mode': (s.paymentMode || 'cash').toUpperCase(),
    'Raw TDS': s.rawWaterTds || 'N/A',
    'Output TDS': s.outputTds || 'N/A',
    'Next Due Date': formatDateSafe(s.nextDueDate),
    'Remarks': s.remarks || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Service Logs');
  XLSX.writeFile(workbook, filename);
}

export function exportInventoryToExcel(inventory: InventoryItem[], filename: string = 'RO_Spare_Parts_Inventory.xlsx') {
  const data = inventory.map((item, index) => ({
    'Item Name': item.name,
    'Category': item.category.toUpperCase(),
    'SKU': item.sku,
    'Current Stock': item.currentStock,
    'Min Threshold': item.minStockLevel,
    'Stock Status': item.currentStock <= item.minStockLevel ? 'LOW STOCK' : 'IN STOCK',
    'Purchase Cost (Rs)': item.costPrice,
    'Selling Price (Rs)': item.unitPrice,
    'Stock Value (Rs)': item.currentStock * item.costPrice,
    'Description': item.description || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
  XLSX.writeFile(workbook, filename);
}

// ================= CUSTOMER EXCEL IMPORT HELPERS =================

export function downloadCustomerTemplateExcel() {
  const templateRows = [
    {
      'Customer Name': 'Rajesh Sharma',
      'Primary Phone': '9876543210',
      'Alternate Phone': '9811122334',
      'Address': 'Flat 204, Royal Apartments, Civil Lines',
      'Area': 'Civil Lines',
      'RO Brand': 'Kent',
      'RO Model': 'Grand Plus RO+UV+UF',
      'Installation Date': '2025-06-15',
      'Next Due Date': '2026-11-20',
      'Raw Water TDS': 750,
      'Pure Water TDS': 45,
      'Status': 'active',
      'Notes': 'Prefers morning technician visits before 11 AM'
    },
    {
      'Customer Name': 'Pooja Verma',
      'Primary Phone': '9812345678',
      'Alternate Phone': '',
      'Address': 'House 45, Sector 14, Urban Estate',
      'Area': 'Sector 14',
      'RO Brand': 'Aquaguard',
      'RO Model': 'Enhance RO+UV',
      'Installation Date': '2025-08-10',
      'Next Due Date': '2026-12-05',
      'Raw Water TDS': 620,
      'Pure Water TDS': 38,
      'Status': 'active',
      'Notes': 'Needs outer spun candle checked regularly'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers_Template');
  XLSX.writeFile(workbook, 'Customer_Import_Template.xlsx');
}

function parseExcelDate(val: any): string {
  if (!val) return '';
  if (typeof val === 'number') {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.includes('/')) {
      const parts = trimmed.split('/');
      if (parts.length === 3 && parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    return trimmed;
  }
  return '';
}

export async function parseCustomersFromExcelFile(file: File): Promise<{
  valid: (Partial<Customer> & { name: string; phone: string })[];
  invalid: { rowNumber: number; reason: string; raw: any }[];
}> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const valid: (Partial<Customer> & { name: string; phone: string })[] = [];
  const invalid: { rowNumber: number; reason: string; raw: any }[] = [];

  rawRows.forEach((row, idx) => {
    const rowNumber = idx + 2; // header is row 1

    // Normalize keys
    const normalized: Record<string, any> = {};
    Object.keys(row).forEach((k) => {
      normalized[k.toLowerCase().trim().replace(/[\s_-]+/g, '')] = row[k];
    });

    const name =
      normalized['customername'] ||
      normalized['name'] ||
      normalized['fullname'] ||
      normalized['clientname'] ||
      '';

    let phone =
      normalized['primaryphone'] ||
      normalized['phone'] ||
      normalized['phonenumber'] ||
      normalized['mobile'] ||
      normalized['mobilenumber'] ||
      normalized['contact'] ||
      '';

    phone = String(phone).replace(/[^0-9]/g, '');

    if (!name.toString().trim()) {
      invalid.push({ rowNumber, reason: 'Missing Customer Name', raw: row });
      return;
    }

    if (!phone || phone.length < 7) {
      invalid.push({ rowNumber, reason: 'Invalid or missing Phone Number', raw: row });
      return;
    }

    const alternatePhone = String(
      normalized['alternatephone'] ||
      normalized['altphone'] ||
      normalized['secondaryphone'] ||
      ''
    ).replace(/[^0-9]/g, '');

    const address = String(
      normalized['address'] ||
      normalized['fulladdress'] ||
      normalized['location'] ||
      normalized['street'] ||
      ''
    ).trim();

    const area = String(
      normalized['area'] ||
      normalized['locality'] ||
      normalized['sector'] ||
      normalized['colony'] ||
      ''
    ).trim();

    const roBrand = String(
      normalized['robrand'] ||
      normalized['brand'] ||
      normalized['purifierbrand'] ||
      'Kent'
    ).trim();

    const roModel = String(
      normalized['romodel'] ||
      normalized['model'] ||
      normalized['purifiermodel'] ||
      `${roBrand} RO System`
    ).trim();

    const installationDate = parseExcelDate(
      normalized['installationdate'] ||
      normalized['installdate'] ||
      normalized['installedon']
    );

    const nextServiceDueDate = parseExcelDate(
      normalized['nextduedate'] ||
      normalized['serviceduedate'] ||
      normalized['nextservice'] ||
      normalized['duedate']
    );

    const rawWaterTds = normalized['rawwatertds'] || normalized['rawtds'] || normalized['inputtds'];
    const outputTds = normalized['purewatertds'] || normalized['outputtds'] || normalized['puretds'];
    const notes = String(normalized['notes'] || normalized['remarks'] || normalized['comment'] || '').trim();
    const statusVal = String(normalized['status'] || 'active').toLowerCase().trim();
    const status = statusVal === 'inactive' ? 'inactive' : 'active';

    valid.push({
      name: name.toString().trim(),
      phone,
      alternatePhone,
      address: address || area || 'Customer Address',
      area,
      roBrand: roBrand || 'Kent',
      roModel: roModel || 'RO Purifier',
      installationDate: installationDate || new Date().toISOString().split('T')[0],
      nextServiceDueDate: nextServiceDueDate || new Date().toISOString().split('T')[0],
      rawWaterTds: rawWaterTds !== '' && !isNaN(Number(rawWaterTds)) ? Number(rawWaterTds) : undefined,
      outputTds: outputTds !== '' && !isNaN(Number(outputTds)) ? Number(outputTds) : undefined,
      notes,
      status
    });
  });

  return { valid, invalid };
}
