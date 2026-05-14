export const Loader = ({ label = 'Loading' }) => (
  <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
    <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
    <span>{label}</span>
  </div>
);
