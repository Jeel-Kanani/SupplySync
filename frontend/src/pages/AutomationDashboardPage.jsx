import { useEffect, useState } from 'react';
import { FiAlertTriangle, FiClock, FiGlobe, FiRefreshCw, FiSend } from 'react-icons/fi';

import { Alert } from '../components/Alert.jsx';
import { Badge } from '../components/Badge.jsx';
import { Button } from '../components/Button.jsx';
import { Card } from '../components/Card.jsx';
import { Loader } from '../components/Loader.jsx';
import { Table } from '../components/Table.jsx';
import { automationService } from '../services/automationService.js';
import {
  formatCount,
  formatCurrency,
  formatDateTime
} from '../utils/formatters.js';

export const AutomationDashboardPage = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      setDashboard(await automationService.dashboard());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const runWebsites = async () => {
    setRunning('websites');
    setError('');
    setSuccess('');

    try {
      const result = await automationService.runWebsites();
      setSuccess(`Website check finished: ${result.succeeded} succeeded, ${result.failed} failed`);
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setRunning('');
    }
  };

  const startTelegram = async () => {
    setRunning('telegram');
    setError('');
    setSuccess('');

    try {
      const result = await automationService.runTelegram();
      setSuccess(result.active ? 'Telegram listener started' : result.message || 'Telegram check skipped');
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setRunning('');
    }
  };

  const extractionColumns = [
    {
      key: 'sourceType',
      header: 'Source',
      render: (row) => <Badge>{row.sourceType}</Badge>
    },
    {
      key: 'productName',
      header: 'Product',
      render: (row) => row.extractedData?.productName || 'Unmatched'
    },
    {
      key: 'supplierName',
      header: 'Supplier',
      render: (row) => row.extractedData?.supplierName || row.sourceName || 'Unknown'
    },
    {
      key: 'price',
      header: 'Price',
      render: (row) => formatCurrency(row.extractedData?.price)
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge>{row.status}</Badge>
    },
    {
      key: 'checkedAt',
      header: 'Detected',
      render: (row) => formatDateTime(row.checkedAt)
    }
  ];

  const priceColumns = [
    {
      key: 'product',
      header: 'Product',
      render: (row) => row.product?.name || 'Unknown'
    },
    {
      key: 'supplier',
      header: 'Supplier',
      render: (row) => row.supplier?.name || 'Unknown'
    },
    {
      key: 'oldPrice',
      header: 'Old',
      render: (row) => formatCurrency(row.oldPrice)
    },
    {
      key: 'newPrice',
      header: 'New',
      render: (row) => formatCurrency(row.newPrice)
    },
    {
      key: 'changedAt',
      header: 'Changed',
      render: (row) => formatDateTime(row.changedAt)
    }
  ];

  return (
    <div className="space-y-6">
      <Alert type="success" message={success} onClose={() => setSuccess('')} />
      <Alert message={error} onClose={() => setError('')} />

      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-950">Automation Controls</h2>
          <p className="text-sm text-gray-500">Run supplier website checks or start Telegram monitoring.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={runWebsites} disabled={Boolean(running)}>
            <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
            {running === 'websites' ? 'Checking...' : 'Run Websites'}
          </Button>
          <Button variant="secondary" onClick={startTelegram} disabled={Boolean(running)}>
            <FiSend className="h-4 w-4" aria-hidden="true" />
            {running === 'telegram' ? 'Starting...' : 'Start Telegram'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white py-16">
          <Loader label="Loading automation dashboard" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card title="Websites" value={formatCount(dashboard?.monitoredWebsites)} icon={FiGlobe} />
            <Card title="Telegram Channels" value={formatCount(dashboard?.monitoredTelegramChannels)} icon={FiSend} />
            <Card title="Failed Jobs" value={formatCount(dashboard?.failedJobs)} icon={FiAlertTriangle} />
            <Card
              title="Last Run"
              value={dashboard?.lastRun ? dashboard.lastRun.status : 'Never'}
              subtitle={formatDateTime(dashboard?.lastRun?.createdAt)}
              icon={FiClock}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="space-y-3">
              <div>
                <h2 className="text-base font-semibold text-gray-950">Recent Extractions</h2>
                <p className="text-sm text-gray-500">Latest normalized product data from all sources.</p>
              </div>
              <Table
                columns={extractionColumns}
                data={dashboard?.recentExtractions || []}
                emptyTitle="No extractions yet"
                emptyDescription="Run automation to populate source history."
              />
            </section>

            <section className="space-y-3">
              <div>
                <h2 className="text-base font-semibold text-gray-950">Recent Price Changes</h2>
                <p className="text-sm text-gray-500">Detected buy-price changes that updated products.</p>
              </div>
              <Table
                columns={priceColumns}
                data={dashboard?.recentPriceChanges || []}
                emptyTitle="No price changes"
                emptyDescription="Price changes appear after matching products are updated."
              />
            </section>
          </div>
        </>
      )}
    </div>
  );
};
