import { Customer, ServiceRecord, AppSettings } from '@/types';
import { format } from 'date-fns';

/**
 * Clean phone number to WhatsApp international format (e.g. 919876543210)
 */
export function formatWhatsAppPhone(phone: string): string {
  if (!phone) return '';
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '');
  
  // If 10 digits (standard Indian number), prefix with 91
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
}

/**
 * Generate interpolated WhatsApp message
 */
export function buildDueServiceMessage(
  customer: Customer,
  settings: AppSettings,
  serviceType: string = 'Routine Filter Service'
): string {
  const template = settings.reminderTemplate || 
    "Hello {customer_name}, your {ro_brand} ({ro_model}) water purifier service ({service_type}) is due on {due_date}. Call/WhatsApp us at {shop_phone} whenever convenient to schedule a technician visit. Thank you - {shop_name}.";

  const dueDateFormatted = customer.nextServiceDueDate
    ? format(new Date(customer.nextServiceDueDate), 'dd MMM yyyy')
    : 'this week';

  let text = template
    .replace(/\{customer_name\}/g, customer.name)
    .replace(/\{ro_brand\}/g, customer.roBrand || 'RO')
    .replace(/\{ro_model\}/g, customer.roModel || 'Purifier')
    .replace(/\{service_type\}/g, serviceType)
    .replace(/\{due_date\}/g, dueDateFormatted)
    .replace(/\{shop_name\}/g, settings.shopName)
    .replace(/\{shop_phone\}/g, settings.phone);

  return text;
}

/**
 * Generate WhatsApp message for completed service invoice
 */
export function buildCompletedServiceMessage(
  service: ServiceRecord,
  settings: AppSettings
): string {
  const template = settings.completedTemplate ||
    "Dear {customer_name}, thank you for choosing {shop_name}. Your RO service has been successfully completed by technician {technician_name}. Parts: {parts_summary}. Total: Rs. {total_amount}. Next service due: {next_due_date}. Call {shop_phone} for any assistance.";

  const partsSummary = service.partsUsed && service.partsUsed.length > 0
    ? service.partsUsed.map(p => `${p.name} (x${p.quantity})`).join(', ')
    : 'Routine inspection & sanitization';

  const nextDueFormatted = service.nextDueDate
    ? format(new Date(service.nextDueDate), 'dd MMM yyyy')
    : 'in 6 months';

  let text = template
    .replace(/\{customer_name\}/g, service.customerName)
    .replace(/\{technician_name\}/g, service.technicianName)
    .replace(/\{parts_summary\}/g, partsSummary)
    .replace(/\{total_amount\}/g, service.totalAmount.toString())
    .replace(/\{next_due_date\}/g, nextDueFormatted)
    .replace(/\{shop_name\}/g, settings.shopName)
    .replace(/\{shop_phone\}/g, settings.phone);

  return text;
}

/**
 * Direct WhatsApp URL launcher
 */
export function getWhatsAppUrl(phone: string, message: string): string {
  const formattedPhone = formatWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedText}`;
}

/**
 * Open WhatsApp directly in new tab
 */
export function openWhatsApp(phone: string, message: string): void {
  const url = getWhatsAppUrl(phone, message);
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
