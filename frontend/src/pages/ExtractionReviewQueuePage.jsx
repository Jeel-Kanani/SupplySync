import { useEffect, useState } from 'react';
import { FiCheck, FiRefreshCw, FiX } from 'react-icons/fi';

import { Alert } from '../components/Alert.jsx';
import { Badge } from '../components/Badge.jsx';
import { Button } from '../components/Button.jsx';
import { Loader } from '../components/Loader.jsx';
import { Table } from '../components/Table.jsx';
import { telegramIntelligenceService } from '../services/telegramIntelligenceService.js';
import { formatCurrency, formatDateTime } from '../utils/formatters.js';

export const ExtractionReviewQueuePage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadTasks = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await telegramIntelligenceService.reviewTasks({ limit: 75, assignedStatus: 'OPEN' });
      setTasks(response.items || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const approve = async (task) => {
    const candidateId = task.candidate?._id || task.candidate;
    setBusyId(task._id);
    setError('');
    setSuccess('');

    try {
      await telegramIntelligenceService.approveCandidate(candidateId, {
        reviewedBy: 'SupplySync Operator',
        reviewNotes: 'Approved from review queue'
      });
      setSuccess('Candidate verified and applied');
      await loadTasks();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId('');
    }
  };

  const reject = async (task) => {
    const candidateId = task.candidate?._id || task.candidate;
    setBusyId(task._id);
    setError('');
    setSuccess('');

    try {
      await telegramIntelligenceService.rejectCandidate(candidateId, {
        reviewedBy: 'SupplySync Operator',
        reviewNotes: 'Rejected from review queue'
      });
      setSuccess('Candidate rejected');
      await loadTasks();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId('');
    }
  };

  const columns = [
    {
      key: 'priority',
      header: 'Priority',
      render: (task) => <Badge>{task.priority}</Badge>
    },
    {
      key: 'candidate',
      header: 'Candidate',
      render: (task) => task.candidate?.normalizedName || task.extractedData?.normalizedName || 'Unknown'
    },
    {
      key: 'confidence',
      header: 'Confidence',
      render: (task) => `${task.confidence}%`
    },
    {
      key: 'price',
      header: 'Price',
      render: (task) => formatCurrency(task.candidate?.normalizedPrice || task.extractedData?.normalizedPrice || task.extractedData?.detectedPrice)
    },
    {
      key: 'reasoning',
      header: 'Reasoning',
      render: (task) => (
        <span className="block max-w-xl whitespace-normal">
          {(task.candidate?.extractionReasoning || task.extractedData?.extractionReasoning || []).slice(0, 3).join(' | ')}
        </span>
      )
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (task) => formatDateTime(task.createdAt)
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (task) => (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => approve(task)} disabled={Boolean(busyId)}>
            <FiCheck className="h-4 w-4" aria-hidden="true" />
            {busyId === task._id ? 'Saving...' : 'Verify'}
          </Button>
          <Button size="sm" variant="danger" onClick={() => reject(task)} disabled={Boolean(busyId)}>
            <FiX className="h-4 w-4" aria-hidden="true" />
            Reject
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div>
          <h2 className="text-base font-semibold text-gray-950">Extraction Review Queue</h2>
          <p className="text-sm text-gray-500">Candidates that need human approval before product data changes.</p>
        </div>
        <Button variant="secondary" onClick={loadTasks}>
          <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
          Refresh
        </Button>
      </div>

      <Alert type="success" message={success} onClose={() => setSuccess('')} />
      <Alert message={error} onClose={() => setError('')} />
      {loading ? <div className="rounded-lg border border-gray-200 bg-white py-16"><Loader label="Loading review queue" /></div> : (
        <Table columns={columns} data={tasks} emptyTitle="No open review tasks" emptyDescription="Uncertain extractions will appear here." />
      )}
    </div>
  );
};
