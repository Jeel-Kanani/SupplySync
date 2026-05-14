import { useCallback, useEffect, useState } from 'react';

export const useAsync = (asyncFunction, options = {}) => {
  const { immediate = true } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(immediate));
  const [error, setError] = useState('');

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError('');

      try {
        const result = await asyncFunction(...args);
        setData(result);
        return result;
      } catch (requestError) {
        setError(requestError.message || 'Something went wrong');
        throw requestError;
      } finally {
        setLoading(false);
      }
    },
    [asyncFunction]
  );

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { data, loading, error, execute, setData, setError };
};
