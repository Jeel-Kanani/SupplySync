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
  },
  '/automation': {
    title: 'Automation',
    subtitle: 'Monitor supplier sources and product changes'
  },
  '/automation/websites': {
    title: 'Website Monitoring',
    subtitle: 'Run Playwright checks against supplier URLs'
  },
  '/automation/telegram': {
    title: 'Telegram Monitoring',
    subtitle: 'Track supplier channels and extracted messages'
  },
  '/automation/logs': {
    title: 'Automation Logs',
    subtitle: 'Inspect source checks, price history, and failures'
  },
  '/telegram-intelligence': {
    title: 'Telegram Intelligence',
    subtitle: 'Human-assisted supplier crawling and confidence review'
  },
  '/telegram-intelligence/feed': {
    title: 'Live Message Feed',
    subtitle: 'Raw Telegram supplier messages before interpretation'
  },
  '/telegram-intelligence/review': {
    title: 'Extraction Review',
    subtitle: 'Verify uncertain candidates before business data changes'
  },
  '/telegram-intelligence/activity': {
    title: 'Supplier Activity',
    subtitle: 'Channel activity and recent detected supplier events'
  },
  '/telegram-intelligence/alerts': {
    title: 'Low Confidence Alerts',
    subtitle: 'Ambiguous extractions that need attention'
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
