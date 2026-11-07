import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ServiceRecord, AppSettings, Customer } from '@/types';
import { formatDateSafe } from './utils';

export function generateServiceInvoicePDF(service: ServiceRecord, settings: AppSettings) {
  const doc = new jsPDF();

  // Header / Brand Banner
  doc.setFillColor(15, 118, 110); // Teal 700
  doc.rect(0, 0, 210, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.shopName || 'AquaCare RO Service', 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(settings.tagline || 'Certified RO Purifier Sales & Service', 14, 25);
  doc.text(`Phone: ${settings.phone} | WhatsApp: ${settings.whatsappNumber}`, 14, 31);

  doc.text('TAX / SERVICE INVOICE', 196, 18, { align: 'right' });
  doc.setFontSize(8);
  doc.text(`Invoice ID: ${service.id}`, 196, 25, { align: 'right' });
  doc.text(`Date: ${formatDateSafe(service.serviceDate)}`, 196, 31, { align: 'right' });

  // Bill To & Machine Details Section
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Details:', 14, 48);
  doc.text('Purifier Details:', 110, 48);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${service.customerName}`, 14, 55);
  doc.text(`Phone: ${service.customerPhone}`, 14, 61);
  doc.text(`Address: ${service.customerAddress || 'N/A'}`, 14, 67, { maxWidth: 85 });

  doc.text(`RO Brand: ${service.roBrand || 'Multi-Brand'}`, 110, 55);
  doc.text(`RO Model: ${service.roModel || 'Purifier'}`, 110, 61);
  doc.text(`Service Type: ${service.serviceType.toUpperCase()}`, 110, 67);
  doc.text(`Technician: ${service.technicianName}`, 110, 73);
  doc.text(`Water TDS: In: ${service.rawWaterTds || '--'} ppm | Out: ${service.outputTds || '--'} ppm`, 110, 79);

  // Table of Parts & Service Charges
  const tableRows = [];
  if (service.partsUsed && service.partsUsed.length > 0) {
    service.partsUsed.forEach((part, index) => {
      tableRows.push([
        (index + 1).toString(),
        part.name,
        part.quantity.toString(),
        `Rs. ${part.unitPrice}`,
        `Rs. ${part.totalPrice}`
      ]);
    });
  } else {
    tableRows.push(['1', 'Routine Inspection & Filter Sanitization', '1', 'Rs. 0', 'Rs. 0']);
  }

  // Service Charge Row
  tableRows.push([
    (tableRows.length + 1).toString(),
    'Technician Service & Labor Charge',
    '1',
    `Rs. ${service.serviceCharge}`,
    `Rs. ${service.serviceCharge}`
  ]);

  if (service.discount && service.discount > 0) {
    tableRows.push([
      '',
      'Special Discount Applied',
      '-',
      `- Rs. ${service.discount}`,
      `- Rs. ${service.discount}`
    ]);
  }

  autoTable(doc, {
    startY: 88,
    head: [['#', 'Item / Service Description', 'Qty', 'Unit Price', 'Total']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 118, 110],
      textColor: 255,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 100 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // Total Summary Box
  doc.setFillColor(248, 250, 252);
  doc.rect(120, finalY, 76, 26, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(120, finalY, 76, 26, 'S');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Payment Status: ${service.paymentStatus.toUpperCase()}`, 124, finalY + 6);
  doc.text(`Payment Mode: ${(service.paymentMode || 'Cash').toUpperCase()}`, 124, finalY + 12);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 118, 110);
  doc.text(`Grand Total: Rs. ${service.totalAmount}`, 124, finalY + 20);

  // Next Service Notice
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Next Service Due Date: ${formatDateSafe(service.nextDueDate)}`, 14, finalY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Warranty Note: 6 Months replacement warranty on newly fitted electrical parts (Pump/SMPS).', 14, finalY + 12);
  doc.text('Genuine certified RO food-grade filters used.', 14, finalY + 17);

  // Signatures
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text("Customer's Acknowledgment", 14, finalY + 45);
  doc.line(14, finalY + 42, 65, finalY + 42);

  doc.text("Authorized Signatory (AquaCare)", 140, finalY + 45);
  doc.line(140, finalY + 42, 196, finalY + 42);

  // Save the PDF
  doc.save(`RO_Invoice_${service.id}_${service.customerName.replace(/\s+/g, '_')}.pdf`);
}
