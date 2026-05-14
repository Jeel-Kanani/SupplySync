import { useEffect, useState } from 'react';

import { Alert } from '../components/Alert.jsx';
import { Badge } from '../components/Badge.jsx';
import { Loader } from '../components/Loader.jsx';
import { Table } from '../components/Table.jsx';
import { automationService } from '../services/automationService.js';
import { formatCurrency, formatDateTime } from '../utils/formatters.js';

export const AutomationLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [history, setHistory] = useState([]);
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    setError('');

    try {
      const [logResponse, historyResponse] = await Promise.all([
        automationService.logs({ limit: 50 }),
        automationService.history({ limit: 50 })
      ]);
      setLogs(logResponse.items || []);
      setHistory(historyResponse.checks || []);
      setPrices(historyResponse.priceHistory || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const logColumns = [
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge>{row.status}</Badge>
    },
    {
      key: 'actionType',
      header: 'Action',
      render: (row) => row.actionType
    },
    {
      key: 'sourceType',
      header: 'Source',
      render: (row) => <Badge>{row.sourceType}</Badge>
    },
    { key: 'message', header: 'Message' },
    {
      key: 'executionTime',
      header: 'Time',
      render: (row) => `${row.executionTime || 0} ms`
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row) => formatDateTime(row.createdAt)
    }
  ];

  const historyColumns = [
    {
      key: 'sourceType',
      header: 'Source',
      render: (row) => <Badge>{row.sourceType}</Badge>
    },
    {
      key: 'productName',
      header: 'Product',
      render: (row) => row.extractedData?.productName || 'None'
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
      header: 'Checked',
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
      <Alert message={error} onClose={() => setError('')} />

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white py-16">
          <Loader label="Loading automation logs" />
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <div>
              <h2 className="text-base font-semibold text-gray-950">Automation Logs</h2>
              <p className="text-sm text-gray-500">Job execution status and failure details.</p>
            </div>
            <Table
              columns={logColumns}
              data={logs}
              emptyTitle="No automation logs"
              emptyDescription="Logs appear after automation runs."
            />
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="space-y-3">
              <div>
                <h2 className="text-base font-semibold text-gray-950">Source History</h2>
                <p className="text-sm text-gray-500">Saved extraction history from websites and Telegram.</p>
              </div>
              <Table
                columns={historyColumns}
                data={history}
                emptyTitle="No source checks"
                emptyDescription="Source checks appear after monitoring runs."
              />
            </section>

            <section className="space-y-3">
              <div>
                <h2 className="text-base font-semibold text-gray-950">Price History</h2>
                <p className="text-sm text-gray-500">Product buy-price changes detected by automation.</p>
              </div>
              <Table
                columns={priceColumns}
                data={prices}
                emptyTitle="No price history"
                emptyDescription="Price history is written when matched supplier prices change."
              />
            </section>
          </div>
        </>
      )}
    </div>
  );
};
