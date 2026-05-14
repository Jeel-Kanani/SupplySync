import { useEffect, useMemo, useState } from 'react';
import { FiExternalLink, FiRefreshCw } from 'react-icons/fi';

import { Alert } from '../components/Alert.jsx';
import { Badge } from '../components/Badge.jsx';
import { Button } from '../components/Button.jsx';
import { Loader } from '../components/Loader.jsx';
import { Table } from '../components/Table.jsx';
import { automationService } from '../services/automationService.js';
import { supplierService } from '../services/supplierService.js';
import { formatCurrency, formatDateTime } from '../utils/formatters.js';

const websiteSourceTypes = ['WEBSITE', 'INDIAMART'];

export const WebsiteMonitoringPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadPage = async () => {
    setLoading(true);
    setError('');

    try {
      const [supplierResponse, historyResponse] = await Promise.all([
        supplierService.list({ limit: 100 }),
        automationService.history({ limit: 100 })
      ]);
      setSuppliers((supplierResponse.items || []).filter((supplier) => supplier.website));
      setHistory(
        (historyResponse.checks || []).filter((item) => websiteSourceTypes.includes(item.sourceType))
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  const latestByUrl = useMemo(() => {
    const map = new Map();

    history.forEach((item) => {
      if (!map.has(item.sourceUrl)) {
        map.set(item.sourceUrl, item);
      }
    });

    return map;
  }, [history]);

  const runAll = async () => {
    setRunning('all');
    setError('');
    setSuccess('');

    try {
      const result = await automationService.runWebsites();
      setSuccess(`Website check finished: ${result.succeeded} succeeded, ${result.failed} failed`);
      await loadPage();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setRunning('');
    }
  };

  const runSingle = async (supplier) => {
    setRunning(supplier._id);
    setError('');
    setSuccess('');

    try {
      await automationService.runWebsites({
        sources: [
          {
            url: supplier.website,
            supplierName: supplier.name,
            supplierId: supplier._id
          }
        ]
      });
      setSuccess(`${supplier.name} checked successfully`);
      await loadPage();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setRunning('');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Supplier'
    },
    {
      key: 'website',
      header: 'URL',
      render: (supplier) => (
        <a
          href={supplier.website}
          target="_blank"
          rel="noreferrer"
          className="inline-flex max-w-xs items-center gap-1 truncate text-gray-900 hover:text-gray-600"
        >
          {supplier.website}
          <FiExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        </a>
      )
    },
    {
      key: 'sourceType',
      header: 'Source',
      render: (supplier) => (
        <Badge>{supplier.website?.toLowerCase().includes('indiamart') ? 'INDIAMART' : 'WEBSITE'}</Badge>
      )
    },
    {
      key: 'lastStatus',
      header: 'Last Status',
      render: (supplier) => <Badge>{latestByUrl.get(supplier.website)?.status || 'PENDING'}</Badge>
    },
    {
      key: 'price',
      header: 'Extracted Price',
      render: (supplier) => formatCurrency(latestByUrl.get(supplier.website)?.extractedData?.price)
    },
    {
      key: 'availability',
      header: 'Availability',
      render: (supplier) =>
        latestByUrl.get(supplier.website)?.extractedData?.availability === false ? 'Unavailable' : 'Available'
    },
    {
      key: 'checkedAt',
      header: 'Last Check',
      render: (supplier) => formatDateTime(latestByUrl.get(supplier.website)?.checkedAt)
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (supplier) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => runSingle(supplier)}
          disabled={Boolean(running)}
        >
          <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
          {running === supplier._id ? 'Checking...' : 'Check'}
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-950">Supplier Websites</h2>
          <p className="text-sm text-gray-500">Active suppliers with website URLs are checked by Playwright.</p>
        </div>
        <Button onClick={runAll} disabled={Boolean(running)}>
          <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
          {running === 'all' ? 'Checking...' : 'Run All'}
        </Button>
      </div>

      <Alert type="success" message={success} onClose={() => setSuccess('')} />
      <Alert message={error} onClose={() => setError('')} />

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white py-16">
          <Loader label="Loading website monitoring" />
        </div>
      ) : (
        <Table
          columns={columns}
          data={suppliers}
          emptyTitle="No website sources"
          emptyDescription="Add supplier website URLs to enable monitoring."
        />
      )}
    </div>
  );
};
