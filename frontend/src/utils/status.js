export const PRODUCT_STATUSES = ['ACTIVE', 'DEAD', 'RISKY', 'LOW_PROFIT'];
export const LISTING_STATUSES = ['ACTIVE', 'INACTIVE', 'PAUSED', 'DELISTED'];
export const LISTING_HEALTHS = ['HEALTHY', 'RISKY', 'INACTIVE'];
export const PLATFORMS = ['MEESHO', 'AMAZON'];
export const SOURCE_TYPES = ['WEBSITE', 'INDIAMART', 'TELEGRAM'];
export const AUTOMATION_STATUSES = ['SUCCESS', 'FAILED', 'RUNNING', 'SKIPPED', 'PENDING'];
export const REVIEW_STATUSES = ['VERIFIED', 'NEEDS_REVIEW', 'LOW_CONFIDENCE', 'AUTO_CONFIRMED', 'REJECTED'];

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
  AMAZON: 'bg-orange-50 text-orange-700 ring-orange-200',
  WEBSITE: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  INDIAMART: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  TELEGRAM: 'bg-blue-50 text-blue-700 ring-blue-200',
  SUCCESS: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  FAILED: 'bg-rose-50 text-rose-700 ring-rose-200',
  RUNNING: 'bg-sky-50 text-sky-700 ring-sky-200',
  SKIPPED: 'bg-gray-100 text-gray-700 ring-gray-200',
  PENDING: 'bg-gray-100 text-gray-700 ring-gray-200',
  VERIFIED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  NEEDS_REVIEW: 'bg-amber-50 text-amber-700 ring-amber-200',
  LOW_CONFIDENCE: 'bg-rose-50 text-rose-700 ring-rose-200',
  AUTO_CONFIRMED: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  REJECTED: 'bg-gray-100 text-gray-700 ring-gray-200',
  HIGHLY_RELIABLE: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  LIKELY_CORRECT: 'bg-sky-50 text-sky-700 ring-sky-200'
};

export const getStatusStyle = (status) =>
  statusStyles[status] || 'bg-gray-100 text-gray-700 ring-gray-200';
