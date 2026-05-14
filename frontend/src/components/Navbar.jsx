import { FiMenu, FiRefreshCw } from 'react-icons/fi';

export const Navbar = ({ title, subtitle, onMenuClick, onRefresh }) => (
  <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
    <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="focus-ring rounded-md border border-gray-200 p-2 text-gray-700 lg:hidden"
          aria-label="Open navigation"
        >
          <FiMenu className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-gray-950 sm:text-xl">{title}</h1>
          {subtitle && <p className="truncate text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>

      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"
          aria-label="Refresh data"
        >
          <FiRefreshCw className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
    </div>
  </header>
);
