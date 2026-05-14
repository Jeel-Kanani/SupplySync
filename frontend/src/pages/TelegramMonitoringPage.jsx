import { useEffect, useState } from 'react';
import { FiPlay, FiPlus, FiSend } from 'react-icons/fi';

import { Alert } from '../components/Alert.jsx';
import { Badge } from '../components/Badge.jsx';
import { Button } from '../components/Button.jsx';
import { FormInput } from '../components/FormInput.jsx';
import { Loader } from '../components/Loader.jsx';
import { Table } from '../components/Table.jsx';
import { automationService } from '../services/automationService.js';
import { telegramService } from '../services/telegramService.js';
import { formatCurrency, formatDateTime } from '../utils/formatters.js';

const emptyChannelForm = {
  username: '',
  supplierName: '',
  title: ''
};

export const TelegramMonitoringPage = () => {
  const [channels, setChannels] = useState([]);
  const [extractions, setExtractions] = useState([]);
  const [form, setForm] = useState(emptyChannelForm);
  const [sampleMessage, setSampleMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadPage = async () => {
    setLoading(true);
    setError('');

    try {
      const [channelResponse, extractionResponse] = await Promise.all([
        telegramService.channels(),
        telegramService.extractions({ limit: 30 })
      ]);
      setChannels(channelResponse || []);
      setExtractions(extractionResponse || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
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
      await telegramService.connect();
      setSuccess('Telegram client connected');
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
      const result = await automationService.runTelegram();
      setSuccess(result.active ? 'Telegram listener started' : result.message || 'Telegram listener skipped');
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
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={connectTelegram} disabled={Boolean(running)}>
              <FiSend className="h-4 w-4" aria-hidden="true" />
              {running === 'connect' ? 'Connecting...' : 'Connect'}
            </Button>
            <Button onClick={startListener} disabled={Boolean(running)}>
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
              placeholder="Spider Web Shooter ₹120&#10;Stock Available"
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
