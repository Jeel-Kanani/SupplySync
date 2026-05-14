import { FiInbox } from 'react-icons/fi';

export const EmptyState = ({ title = 'No data', description = 'Records will appear here.' }) => (
  <div className="flex flex-col items-center justify-center text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-gray-500">
      <FiInbox className="h-6 w-6" aria-hidden="true" />
    </div>
    <p className="mt-4 text-sm font-semibold text-gray-900">{title}</p>
    <p className="mt-1 max-w-md text-sm text-gray-500">{description}</p>
  </div>
);
