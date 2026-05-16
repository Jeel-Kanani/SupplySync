import { NavLink } from 'react-router-dom';
import {
  FiActivity,
  FiAlertTriangle,
  FiBox,
  FiCheckSquare,
  FiFileText,
  FiGrid,
  FiGlobe,
  FiLayers,
  FiRadio,
  FiSend,
  FiTruck
} from 'react-icons/fi';

const navItems = [
  { label: 'Dashboard', path: '/', icon: FiGrid },
  { label: 'Products', path: '/products', icon: FiBox },
  { label: 'Suppliers', path: '/suppliers', icon: FiTruck },
  { label: 'Listings', path: '/listings', icon: FiLayers },
  { label: 'Automation', path: '/automation', icon: FiActivity },
  { label: 'Websites', path: '/automation/websites', icon: FiGlobe },
  { label: 'Telegram', path: '/automation/telegram', icon: FiSend },
  { label: 'Logs', path: '/automation/logs', icon: FiFileText },
  { label: 'OpenClaw', path: '/telegram-intelligence', icon: FiRadio },
  { label: 'Live Feed', path: '/telegram-intelligence/feed', icon: FiSend },
  { label: 'Review Queue', path: '/telegram-intelligence/review', icon: FiCheckSquare },
  { label: 'Activity', path: '/telegram-intelligence/activity', icon: FiActivity },
  { label: 'Alerts', path: '/telegram-intelligence/alerts', icon: FiAlertTriangle }
];

export const Sidebar = ({ open, onClose }) => (
  <>
    <div
      className={`fixed inset-0 z-30 bg-gray-950/40 transition lg:hidden ${open ? 'block' : 'hidden'}`}
      onClick={onClose}
      aria-hidden="true"
    />
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-72 transform flex-col border-r border-gray-800 bg-gray-950 px-4 py-5 text-white transition-transform lg:static lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center gap-3 px-2">
        <img src="/supplysync.svg" alt="" className="h-9 w-9" />
        <div>
          <p className="text-lg font-semibold">SupplySync</p>
          <p className="text-xs text-gray-400">Reseller operations</p>
        </div>
      </div>

      <nav className="mt-8 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-white text-gray-950'
                    : 'text-gray-300 hover:bg-gray-900 hover:text-white'
                }`
              }
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto rounded-lg border border-gray-800 bg-gray-900 p-4">
        <p className="text-sm font-medium text-white">Week 4 Scope</p>
        <p className="mt-1 text-xs leading-5 text-gray-400">
          Human-in-the-loop source monitoring with confidence scoring and review.
        </p>
      </div>
    </aside>
  </>
);
