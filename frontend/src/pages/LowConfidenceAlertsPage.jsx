import { useEffect, useState } from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

import { Alert } from '../components/Alert.jsx';
import { Badge } from '../components/Badge.jsx';
import { Button } from '../components/Button.jsx';
import { Loader } from '../components/Loader.jsx';
import { Table } from '../components/Table.jsx';
import { telegramIntelligenceService } from '../services/telegramIntelligenceService.js';
import { formatCurrency, formatDateTime } from '../utils/formatters.js';

export const LowConfidenceAlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAlerts = async () => {
    setLoading(true);
    setError('');

    try {
      setAlerts(await telegramIntelligenceService.lowConfidenceAlerts({ limit: 100 }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const columns = [
    { key: 'sourceChannel', header: 'Channel' },
    { key: 'normalizedName', header: 'Candidate' },
    {
      key: 'confidence',
      header: 'Confidence',
      render: (row) => `${row.confidence}%`
    },
    {
      key: 'price',
      header: 'Price',
      render: (row) => row.detectedPriceRange?.length ? row.detectedPriceRange.join(' - ') : formatCurrency(row.normalizedPrice || row.detectedPrice)
    },
    {
      key: 'flags',
      header: 'Flags',
      render: (row) => (
        <span className="block max-w-sm whitespace-normal">{(row.uncertaintyFlags || []).join(', ') || 'None'}</span>
      )
    },
    {
      key: 'reviewStatus',
      header: 'Review',
      render: (row) => <Badge>{row.reviewStatus}</Badge>
    },
    {
      key: 'extractedAt',
      header: 'Detected',
      render: (row) => formatDateTime(row.extractedAt)
    }
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-amber-200 bg-amber-50 text-amber-700">
            <FiAlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-950">Low Confidence Alerts</h2>
            <p className="text-sm text-gray-500">Ambiguous, partial, or suspicious Telegram extractions.</p>
          </div>
        </div>
        <Button variant="secondary" onClick={loadAlerts}>
          <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
          Refresh
        </Button>
      </div>

      <Alert message={error} onClose={() => setError('')} />
      {loading ? <div className="rounded-lg border border-gray-200 bg-white py-16"><Loader label="Loading alerts" /></div> : (
        <Table columns={columns} data={alerts} emptyTitle="No low confidence alerts" emptyDescription="Uncertain detections will appear here." />
      )}
    </div>
  );
};
