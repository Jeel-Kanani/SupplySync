import { useEffect, useState } from 'react';
import { FiRefreshCw } from 'react-icons/fi';

import { Alert } from '../components/Alert.jsx';
import { Badge } from '../components/Badge.jsx';
import { Button } from '../components/Button.jsx';
import { Loader } from '../components/Loader.jsx';
import { Table } from '../components/Table.jsx';
import { telegramIntelligenceService } from '../services/telegramIntelligenceService.js';
import { formatDateTime } from '../utils/formatters.js';

export const LiveTelegramFeedPage = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMessages = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await telegramIntelligenceService.feed({ limit: 75 });
      setMessages(response.items || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const columns = [
    { key: 'channelName', header: 'Channel' },
    {
      key: 'rawText',
      header: 'Raw Message',
      render: (row) => <span className="block max-w-2xl whitespace-normal">{row.rawText || row.media?.mediaType || 'Media message'}</span>
    },
    {
      key: 'media',
      header: 'Media',
      render: (row) => (row.media?.hasMedia ? row.media.mediaType || 'Media' : 'None')
    },
    {
      key: 'extractionStatus',
      header: 'Extraction',
      render: (row) => <Badge>{row.extractionStatus}</Badge>
    },
    {
      key: 'receivedAt',
      header: 'Received',
      render: (row) => formatDateTime(row.receivedAt)
    }
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div>
          <h2 className="text-base font-semibold text-gray-950">Live Message Feed</h2>
          <p className="text-sm text-gray-500">Raw supplier messages captured before interpretation.</p>
        </div>
        <Button variant="secondary" onClick={loadMessages}>
          <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
          Refresh
        </Button>
      </div>

      <Alert message={error} onClose={() => setError('')} />
      {loading ? <div className="rounded-lg border border-gray-200 bg-white py-16"><Loader label="Loading feed" /></div> : (
        <Table columns={columns} data={messages} emptyTitle="No messages captured" emptyDescription="Start OpenClaw Bot or process a sample message." />
      )}
    </div>
  );
};
