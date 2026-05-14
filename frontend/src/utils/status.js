export const PRODUCT_STATUSES = ['ACTIVE', 'DEAD', 'RISKY', 'LOW_PROFIT'];
export const LISTING_STATUSES = ['ACTIVE', 'INACTIVE', 'PAUSED', 'DELISTED'];
export const LISTING_HEALTHS = ['HEALTHY', 'RISKY', 'INACTIVE'];
export const PLATFORMS = ['MEESHO', 'AMAZON'];

const statusStyles = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  HEALTHY: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  DEAD: 'bg-rose-50 text-rose-700 ring-rose-200',
  RISKY: 'bg-amber-50 text-amber-700 ring-amber-200',
  LOW_PROFIT: 'bg-sky-50 text-sky-700 ring-sky-200',
  INACTIVE: 'bg-gray-100 text-gray-700 ring-gray-200',
  PAUSED: 'bg-amber-50 text-amber-700 ring-amber-200',
  DELISTED: 'bg-rose-50 text-rose-700 ring-rose-200',
  MEESHO: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200',
  AMAZON: 'bg-orange-50 text-orange-700 ring-orange-200'
};

export const getStatusStyle = (status) =>
  statusStyles[status] || 'bg-gray-100 text-gray-700 ring-gray-200';
