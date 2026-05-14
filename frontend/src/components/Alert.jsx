export const Alert = ({ type = 'error', message, onClose }) => {
  if (!message) return null;

  const styles =
    type === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : 'border-rose-200 bg-rose-50 text-rose-800';

  return (
    <div className={`flex items-start justify-between gap-3 rounded-md border px-4 py-3 text-sm ${styles}`}>
      <span>{message}</span>
      {onClose && (
        <button type="button" onClick={onClose} className="font-semibold">
          Dismiss
        </button>
      )}
    </div>
  );
};
