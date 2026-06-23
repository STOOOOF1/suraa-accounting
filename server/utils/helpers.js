/**
 * دوال مساعدة لنظام سفراء المحاسبي
 */

/**
 * توليد رقم مرجعي لسند مالي
 * @param {string} prefix - بادئة السند (REC=قبض, PAY=صرف)
 * @returns {string} - رقم مرجعي بالتنسيق: PREFIX-YYYYMMDD-XXXX
 */
const generateReferenceNo = (prefix = 'REF') => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${dateStr}-${random}`;
};

/**
 * تنسيق المبلغ بالريال السعودي
 * @param {number} amount
 * @returns {string}
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
  }).format(amount);
};

/**
 * التحقق من صحة البريد الإلكتروني
 * @param {string} email
 * @returns {boolean}
 */
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

module.exports = { generateReferenceNo, formatCurrency, isValidEmail };
