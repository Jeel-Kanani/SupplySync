import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { Navbar } from '../components/Navbar.jsx';
import { Sidebar } from '../components/Sidebar.jsx';

const routeMeta = {
  '/': {
    title: 'Dashboard',
    subtitle: 'Operational overview for reseller catalog health'
  },
  '/products': {
    title: 'Products',
    subtitle: 'Manage supplier-backed products and lifecycle status'
  },
  '/suppliers': {
    title: 'Suppliers',
    subtitle: 'Track supplier reliability and product coverage'
  },
  '/listings': {
    title: 'Listings',
    subtitle: 'Connect products to marketplace listings'
  }
};

export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const meta = routeMeta[location.pathname] || routeMeta['/'];

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="min-w-0 flex-1">
        <Navbar
          title={meta.title}
          subtitle={meta.subtitle}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
