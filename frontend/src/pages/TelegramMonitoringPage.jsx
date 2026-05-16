import { useEffect, useState } from 'react';
import { FiKey, FiPlay, FiPlus } from 'react-icons/fi';

import { Alert } from '../components/Alert.jsx';
import { Badge } from '../components/Badge.jsx';
import { Button } from '../components/Button.jsx';
import { FormInput } from '../components/FormInput.jsx';
import { Loader } from '../components/Loader.jsx';
import { Table } from '../components/Table.jsx';
import { automationService } from '../services/automationService.js';
import { telegramService } from '../services/telegramService.js';
import { telegramIntelligenceService } from '../services/telegramIntelligenceService.js';
import { formatCurrency, formatDateTime } from '../utils/formatters.js';
import {
  emptyTelegramCredentials,
  loadTelegramCredentials,
  normalizeTelegramCredentials,
  saveTelegramCredentials
} from '../utils/telegramCredentialsStorage.js';

const emptyChannelForm = {
  username: '',
  supplierName: '',
  title: ''
};

export const TelegramMonitoringPage = () => {
  const [channels, setChannels] = useState([]);
  const [extractions, setExtractions] = useState([]);
  const [form, setForm] = useState(emptyChannelForm);
  const [credentials, setCredentials] = useState(emptyTelegramCredentials());
  const [sampleMessage, setSampleMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [runtime, setRuntime] = useState(null);

  const loadPage = async () => {
    setLoading(true);
    setError('');

    try {
      const [channelResponse, extractionResponse, dashboardResponse] = await Promise.all([
        telegramService.channels(),
        telegramService.extractions({ limit: 30 }),
        telegramIntelligenceService.dashboard()
      ]);
      setChannels(channelResponse || []);
      setExtractions(extractionResponse || []);
      setRuntime(dashboardResponse?.runtime || null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCredentials(loadTelegramCredentials());
    loadPage();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleCredentialChange = (event) => {
    const { name, value } = event.target;
    setCredentials((current) => {
      const updated = { ...current, [name]: value };
      saveTelegramCredentials(updated);
      return updated;
    });
  };

  const addChannel = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await telegramService.addChannel({
        username: form.username.trim(),
        supplierName: form.supplierName.trim(),
        title: form.title.trim()
      });
      setSuccess('Telegram channel saved');
      setForm(emptyChannelForm);
      await loadPage();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const connectTelegram = async () => {
    setRunning('connect');
    setError('');
    setSuccess('');

    try {
      const result = await telegramService.connect(buildCredentialPayload(credentials));
      setSuccess(result.connected ? 'Telegram client connected' : 'Telegram connection checked');
      saveTelegramCredentials(credentials);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setRunning('');
    }
  };

  const startListener = async () => {
    setRunning('listener');
    setError('');
    setSuccess('');

    try {
      const result = await telegramIntelligenceService.startRuntime();
      setSuccess(result.listener?.active ? 'Telegram listener started' : result.message || 'Telegram listener skipped');
      await loadPage();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setRunning('');
    }
  };

  const parseSample = async (event) => {
    event.preventDefault();
    setRunning('sample');
    setError('');
    setSuccess('');

    try {
      await automationService.runTelegram({
        message: sampleMessage,
        supplierName: channels[0]?.supplierName || 'Telegram Supplier',
        username: channels[0]?.username || ''
      });
      setSuccess('Telegram message processed');
      setSampleMessage('');
      await loadPage();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setRunning('');
    }
  };

  const channelColumns = [
    { key: 'username', header: 'Channel' },
    { key: 'supplierName', header: 'Supplier' },
    {
      key: 'isActive',
      header: 'Status',
      render: (channel) => <Badge>{channel.isActive ? 'ACTIVE' : 'INACTIVE'}</Badge>
    },
    {
      key: 'lastMessageId',
      header: 'Last Message',
      render: (channel) => channel.lastMessageId || 0
    },
    {
      key: 'lastCheckedAt',
      header: 'Last Check',
      render: (channel) => formatDateTime(channel.lastCheckedAt)
    }
  ];

  const extractionColumns = [
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
      key: 'availability',
      header: 'Availability',
      render: (row) => (row.extractedData?.availability === false ? 'Unavailable' : 'Available')
    },
    {
      key: 'checkedAt',
      header: 'Detected',
      render: (row) => formatDateTime(row.checkedAt)
    }
  ];

  return (
    <div className="space-y-6">
      <Alert type="success" message={success} onClose={() => setSuccess('')} />
      <Alert message={error} onClose={() => setError('')} />

      <div className="grid gap-5 xl:grid-cols-2">
        <form onSubmit={addChannel} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-3">
            <FormInput
              label="Channel"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="@supplierDeals"
              required
            />
            <FormInput
              label="Supplier"
              name="supplierName"
              value={form.supplierName}
              onChange={handleChange}
              placeholder="Supplier name"
            />
            <FormInput
              label="Title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Optional display name"
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="submit" disabled={saving}>
              <FiPlus className="h-4 w-4" aria-hidden="true" />
              {saving ? 'Saving...' : 'Add Channel'}
            </Button>
          </div>
        </form>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div>
            <h2 className="text-base font-semibold text-gray-950">Telegram Connection</h2>
            <p className="text-sm text-gray-500">
              GramJS needs API ID, API hash, and either a saved user session or bot token.
            </p>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FormInput
              label="API ID"
              name="apiId"
              type="number"
              value={credentials.apiId}
              onChange={handleCredentialChange}
              placeholder="123456"
              disabled={Boolean(runtime?.client?.hasSession || runtime?.listener?.active)}
            />
            <FormInput
              label="API Hash"
              name="apiHash"
              value={credentials.apiHash}
              onChange={handleCredentialChange}
              placeholder="Telegram API hash"
              disabled={Boolean(runtime?.client?.hasSession || runtime?.listener?.active)}
            />
            <FormInput
              label="Session String"
              name="sessionString"
              value={credentials.sessionString}
              onChange={handleCredentialChange}
              placeholder="Preferred for channel/group monitoring"
              disabled={Boolean(runtime?.client?.hasSession || runtime?.listener?.active)}
            />
            <FormInput
              label="Bot Token"
              name="botToken"
              value={credentials.botToken}
              onChange={handleCredentialChange}
              placeholder="Optional bot-accessible channels"
              disabled={Boolean(runtime?.client?.hasSession || runtime?.listener?.active)}
            />
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={connectTelegram} disabled={Boolean(running) || Boolean(runtime?.client?.hasSession)}>
              <FiKey className="h-4 w-4" aria-hidden="true" />
              {running === 'connect' ? 'Connecting...' : 'Connect'}
            </Button>
            <Button onClick={startListener} disabled={Boolean(running) || Boolean(runtime?.listener?.active)}>
              <FiPlay className="h-4 w-4" aria-hidden="true" />
              {running === 'listener' ? 'Starting...' : 'Start Listener'}
            </Button>
          </div>
          <form onSubmit={parseSample} className="mt-4 space-y-3">
            <FormInput
              label="Message Parser"
              name="sampleMessage"
              as="textarea"
              value={sampleMessage}
              onChange={(event) => setSampleMessage(event.target.value)}
              placeholder="Spider Web Shooter INR 120&#10;Stock Available"
            />
            <div className="flex justify-end">
              <Button type="submit" variant="secondary" disabled={!sampleMessage.trim() || Boolean(running)}>
                {running === 'sample' ? 'Processing...' : 'Process Message'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white py-16">
          <Loader label="Loading Telegram monitoring" />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="space-y-3">
            <div>
              <h2 className="text-base font-semibold text-gray-950">Monitored Channels</h2>
              <p className="text-sm text-gray-500">Configured Telegram groups and channels.</p>
            </div>
            <Table
              columns={channelColumns}
              data={channels}
              emptyTitle="No Telegram channels"
              emptyDescription="Add a channel to enable monitoring."
            />
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-base font-semibold text-gray-950">Detected Products</h2>
              <p className="text-sm text-gray-500">Latest normalized Telegram product messages.</p>
            </div>
            <Table
              columns={extractionColumns}
              data={extractions}
              emptyTitle="No Telegram extractions"
              emptyDescription="Processed messages will appear here."
            />
          </section>
        </div>
      )}
    </div>
  );
};

const buildCredentialPayload = (credentials) =>
  Object.fromEntries(Object.entries(normalizeTelegramCredentials(credentials)).filter(([, value]) => value));
