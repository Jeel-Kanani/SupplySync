export const formatCurrency = (value) => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatCount = (value) => Number(value || 0).toLocaleString('en-IN');

export const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

export const formatProductName = (product) => {
  if (!product) return 'Not linked';
  return product.name || product.productId || 'Unnamed product';
};

export const formatSupplierName = (supplier) => {
  if (!supplier) return 'Not assigned';
  return supplier.name || supplier.supplierId || 'Unnamed supplier';
};
