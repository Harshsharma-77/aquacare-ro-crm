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
