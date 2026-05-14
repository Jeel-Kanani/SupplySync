import { useEffect, useState } from 'react';

import { Alert } from '../components/Alert.jsx';
import { Badge } from '../components/Badge.jsx';
import { Loader } from '../components/Loader.jsx';
import { Table } from '../components/Table.jsx';
import { telegramIntelligenceService } from '../services/telegramIntelligenceService.js';
import { formatCurrency, formatDateTime } from '../utils/formatters.js';

export const SupplierActivityTimelinePage = () => {
  const [activity, setActivity] = useState({ channelActivity: [], recentEvents: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadActivity = async () => {
      setLoading(true);
      setError('');

      try {
        setActivity(await telegramIntelligenceService.supplierActivity());
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };

    loadActivity();
  }, []);

  const channelColumns = [
    { key: '_id', header: 'Channel' },
    { key: 'messages', header: 'Messages' },
    { key: 'extractedMessages', header: 'Extracted' },
    {
      key: 'latestMessageAt',
      header: 'Latest',
      render: (row) => formatDateTime(row.latestMessageAt)
    }
  ];

  const eventColumns = [
    { key: 'sourceChannel', header: 'Channel' },
    { key: 'normalizedName', header: 'Candidate' },
    {
      key: 'price',
      header: 'Price',
      render: (row) => row.detectedPriceRange?.length ? row.detectedPriceRange.join(' - ') : formatCurrency(row.normalizedPrice || row.detectedPrice)
    },
    {
      key: 'confidence',
      header: 'Confidence',
      render: (row) => `${row.confidence}%`
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
    <div className="space-y-6">
      <Alert message={error} onClose={() => setError('')} />
      {loading ? <div className="rounded-lg border border-gray-200 bg-white py-16"><Loader label="Loading supplier activity" /></div> : (
        <>
          <section className="space-y-3">
            <div>
              <h2 className="text-base font-semibold text-gray-950">Supplier Activity</h2>
              <p className="text-sm text-gray-500">Channel volume and extraction activity by Telegram source.</p>
            </div>
            <Table columns={channelColumns} data={activity.channelActivity || []} />
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-base font-semibold text-gray-950">Recent Intelligence Events</h2>
              <p className="text-sm text-gray-500">Possible price, stock, and product updates detected from messages.</p>
            </div>
            <Table columns={eventColumns} data={activity.recentEvents || []} />
          </section>
        </>
      )}
    </div>
  );
};
