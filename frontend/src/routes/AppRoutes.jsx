import { Navigate, Route, Routes } from 'react-router-dom';

import { AppLayout } from '../layouts/AppLayout.jsx';
import { AutomationDashboardPage } from '../pages/AutomationDashboardPage.jsx';
import { AutomationLogsPage } from '../pages/AutomationLogsPage.jsx';
import { DashboardPage } from '../pages/DashboardPage.jsx';
import { ExtractionReviewQueuePage } from '../pages/ExtractionReviewQueuePage.jsx';
import { ListingsPage } from '../pages/ListingsPage.jsx';
import { LiveTelegramFeedPage } from '../pages/LiveTelegramFeedPage.jsx';
import { LowConfidenceAlertsPage } from '../pages/LowConfidenceAlertsPage.jsx';
import { ProductsPage } from '../pages/ProductsPage.jsx';
import { SupplierActivityTimelinePage } from '../pages/SupplierActivityTimelinePage.jsx';
import { SuppliersPage } from '../pages/SuppliersPage.jsx';
import { TelegramIntelligenceDashboardPage } from '../pages/TelegramIntelligenceDashboardPage.jsx';
import { TelegramMonitoringPage } from '../pages/TelegramMonitoringPage.jsx';
import { WebsiteMonitoringPage } from '../pages/WebsiteMonitoringPage.jsx';

export const AppRoutes = () => (
  <Routes>
    <Route element={<AppLayout />}>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/suppliers" element={<SuppliersPage />} />
      <Route path="/listings" element={<ListingsPage />} />
      <Route path="/automation" element={<AutomationDashboardPage />} />
      <Route path="/automation/websites" element={<WebsiteMonitoringPage />} />
      <Route path="/automation/telegram" element={<TelegramMonitoringPage />} />
      <Route path="/automation/logs" element={<AutomationLogsPage />} />
      <Route path="/telegram-intelligence" element={<TelegramIntelligenceDashboardPage />} />
      <Route path="/telegram-intelligence/feed" element={<LiveTelegramFeedPage />} />
      <Route path="/telegram-intelligence/review" element={<ExtractionReviewQueuePage />} />
      <Route path="/telegram-intelligence/activity" element={<SupplierActivityTimelinePage />} />
      <Route path="/telegram-intelligence/alerts" element={<LowConfidenceAlertsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
);
