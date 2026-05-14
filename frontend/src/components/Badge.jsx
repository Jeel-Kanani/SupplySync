import { getStatusStyle } from '../utils/status.js';

export const Badge = ({ children }) => (
  <span
    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusStyle(children)}`}
  >
    {String(children || 'N/A').replace('_', ' ')}
  </span>
);
