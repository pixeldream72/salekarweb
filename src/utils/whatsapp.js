export function normalizeWhatsAppNumber(phone = '') {
  let number = String(phone).trim();

  // Remove spaces, brackets, dashes and plus sign
  number = number.replace(/[\s()+-]/g, '');

  // Pakistan local format:
  // 03001234567 -> 923001234567
  if (number.startsWith('0')) {
    number = `92${number.slice(1)}`;
  }

  // If someone stored 923001234567 already
  return number;
}

export function createWhatsAppQuotationLink({
  phone,
  customerName,
  quotationNo,
  totalAmount,
  quotationUrl,
  currencySymbol = 'Rs.',
}) {
  const whatsappNumber = normalizeWhatsAppNumber(phone);

  if (!whatsappNumber) {
    return '';
  }

  const message = [
    '🔔 *New Quotation - SaleKar*',
    '',
    `Customer: ${customerName || 'Customer'}`,
    `Quotation No: ${quotationNo || '-'}`,
    `Total: ${currencySymbol} ${Number(totalAmount || 0).toLocaleString()}`,
    '',
    'A new quotation has been submitted.',
    '',
    `View Quotation:`,
    quotationUrl,
  ].join('\n');

  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}