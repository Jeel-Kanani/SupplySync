import { useEffect, useState } from 'react';
import { FiAlertTriangle, FiCheckCircle, FiCpu, FiInbox, FiKey, FiPlay, FiSend } from 'react-icons/fi';

import { Alert } from '../components/Alert.jsx';
import { Badge } from '../components/Badge.jsx';
import { Button } from '../components/Button.jsx';
import { Card } from '../components/Card.jsx';
import { FormInput } from '../components/FormInput.jsx';
import { Loader } from '../components/Loader.jsx';
import { Table } from '../components/Table.jsx';
import { telegramIntelligenceService } from '../services/telegramIntelligenceService.js';
import { formatCount, formatCurrency, formatDateTime } from '../utils/formatters.js';

const emptyCredentialForm = {
  apiId: '',
  apiHash: '',
  sessionString: '',
  botToken: ''
};

export const TelegramIntelligenceDashboardPage = () => {
  const [dashboard, setDashboard] = useState(null);
  const [credentials, setCredentials] = useState(emptyCredentialForm);
  const [sampleMessage, setSampleMessage] = useState('Spider shooter 120-180\nStock Available');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      setDashboard(await telegramIntelligenceService.dashboard());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleCredentialChange = (event) => {
    const { name, value } = event.target;
    setCredentials((current) => ({ ...current, [name]: value }));
  };

  const connectTelegram = async () => {
    setRunning('connect');
    setError('');
    setSuccess('');

    try {
      const result = await telegramIntelligenceService.connect(buildCredentialPayload(credentials));
      setSuccess(result.connected ? 'OpenClaw Bot connected' : 'OpenClaw Bot connection checked');
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setRunning('');
    }
  };

  const startRuntime = async () => {
    setRunning('runtime');
    setError('');
    setSuccess('');

    try {
      const result = await telegramIntelligenceService.startRuntime();
      setSuccess(result.listener?.active ? 'OpenClaw Bot listener started' : result.listener?.message || 'Runtime checked');
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setRunning('');
    }
  };

  const processSample = async (event) => {
    event.preventDefault();
    setRunning('sample');
    setError('');
    setSuccess('');

    try {
      await telegramIntelligenceService.processMessageNow({
        messageId: Date.now(),
        channelId: 'manual-review-lab',
        channelName: 'Manual Review Lab',
        rawText: sampleMessage,
        receivedAt: new Date().toISOString()
      });
      setSuccess('Message processed into the intelligence pipeline');
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setRunning('');
    }
  };

  const messageColumns = [
    { key: 'channelName', header: 'Channel' },
    {
      key: 'rawText',
      header: 'Message',
      render: (row) => <span className="block max-w-md truncate">{row.rawText || row.media?.mediaType || 'Media message'}</span>
    },
    {
      key: 'extractionStatus',
      header: 'Status',
      render: (row) => <Badge>{row.extractionStatus}</Badge>
    },
    {
      key: 'receivedAt',
      header: 'Received',
      render: (row) => formatDateTime(row.receivedAt)
    }
  ];

  const candidateColumns = [
    { key: 'normalizedName', header: 'Candidate' },
    {
      key: 'confidence',
      header: 'Confidence',
      render: (row) => `${row.confidence}%`
    },
    {
      key: 'normalizedPrice',
      header: 'Price',
      render: (row) => row.detectedPriceRange?.length ? row.detectedPriceRange.join(' - ') : formatCurrency(row.normalizedPrice || row.detectedPrice)
    },
    {
      key: 'reviewStatus',
      header: 'Review',
      render: (row) => <Badge>{row.reviewStatus}</Badge>
    }
  ];

  return (
    <div className="space-y-6">
      <Alert type="success" message={success} onClose={() => setSuccess('')} />
      <Alert message={error} onClose={() => setError('')} />

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-950">OpenClaw Bot Runtime</h2>
              <p className="text-sm text-gray-500">Human-in-the-loop supplier intelligence for Telegram sources.</p>
            </div>
            <Button onClick={startRuntime} disabled={Boolean(running)}>
              <FiPlay className="h-4 w-4" aria-hidden="true" />
              {running === 'runtime' ? 'Starting...' : 'Start Runtime'}
            </Button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FormInput
              label="API ID"
              name="apiId"
              type="number"
              value={credentials.apiId}
              onChange={handleCredentialChange}
              placeholder="123456"
            />
            <FormInput
              label="API Hash"
              name="apiHash"
              value={credentials.apiHash}
              onChange={handleCredentialChange}
              placeholder="Telegram API hash"
            />
            <FormInput
              label="Session String"
              name="sessionString"
              value={credentials.sessionString}
              onChange={handleCredentialChange}
              placeholder="Preferred for supplier channels/groups"
            />
            <FormInput
              label="Bot Token"
              name="botToken"
              value={credentials.botToken}
              onChange={handleCredentialChange}
              placeholder="Optional bot-accessible channels"
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="secondary" onClick={connectTelegram} disabled={Boolean(running)}>
              <FiKey className="h-4 w-4" aria-hidden="true" />
              {running === 'connect' ? 'Connecting...' : 'Connect'}
            </Button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-gray-200 p-3">
              <p className="text-xs font-medium uppercase text-gray-500">Client</p>
              <p className="mt-1 text-sm font-semibold text-gray-950">
                {dashboard?.runtime?.client?.connected ? 'Connected' : 'Disconnected'}
              </p>
            </div>
            <div className="rounded-md border border-gray-200 p-3">
              <p className="text-xs font-medium uppercase text-gray-500">Listener</p>
              <p className="mt-1 text-sm font-semibold text-gray-950">
                {dashboard?.runtime?.listener?.active ? 'Active' : 'Idle'}
              </p>
            </div>
            <div className="rounded-md border border-gray-200 p-3">
              <p className="text-xs font-medium uppercase text-gray-500">Redis</p>
              <p className="mt-1 text-sm font-semibold text-gray-950">
                {dashboard?.queueHealth?.redisConnected ? 'Connected' : 'Fallback'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={processSample} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <FormInput
            label="Parser Lab"
            name="sampleMessage"
            as="textarea"
            value={sampleMessage}
            onChange={(event) => setSampleMessage(event.target.value)}
          />
          <div className="mt-3 flex justify-end">
            <Button type="submit" variant="secondary" disabled={!sampleMessage.trim() || Boolean(running)}>
              <FiCpu className="h-4 w-4" aria-hidden="true" />
              {running === 'sample' ? 'Processing...' : 'Process'}
            </Button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white py-16">
          <Loader label="Loading Telegram intelligence" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Card title="Messages" value={formatCount(dashboard?.totals?.totalMessages)} icon={FiInbox} />
            <Card title="Candidates" value={formatCount(dashboard?.totals?.extractedCandidates)} icon={FiCpu} />
            <Card title="Review Tasks" value={formatCount(dashboard?.totals?.openReviewTasks)} icon={FiCheckCircle} />
            <Card title="Low Confidence" value={formatCount(dashboard?.totals?.lowConfidenceCandidates)} icon={FiAlertTriangle} />
            <Card title="Channels" value={formatCount(dashboard?.totals?.activeChannels)} icon={FiSend} />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="space-y-3">
              <div>
                <h2 className="text-base font-semibold text-gray-950">Latest Messages</h2>
                <p className="text-sm text-gray-500">Raw Telegram inputs before human verification.</p>
              </div>
              <Table columns={messageColumns} data={dashboard?.latestMessages || []} />
            </section>

            <section className="space-y-3">
              <div>
                <h2 className="text-base font-semibold text-gray-950">Latest Candidates</h2>
                <p className="text-sm text-gray-500">Possible product updates with confidence and review state.</p>
              </div>
              <Table columns={candidateColumns} data={dashboard?.latestCandidates || []} />
            </section>
          </div>
        </>
      )}
    </div>
  );
};

const buildCredentialPayload = (credentials) =>
  Object.fromEntries(
    Object.entries(credentials)
      .map(([key, value]) => [key, String(value || '').trim()])
      .filter(([, value]) => value)
  );
