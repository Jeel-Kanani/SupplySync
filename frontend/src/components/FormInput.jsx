export const FormInput = ({
  label,
  name,
  error,
  type = 'text',
  as = 'input',
  options = [],
  className = '',
  ...props
}) => {
  const controlClass =
    'focus-ring mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 disabled:bg-gray-100';

  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-medium text-gray-700">{label}</span>

      {as === 'textarea' && (
        <textarea name={name} rows={4} className={controlClass} {...props} />
      )}

      {as === 'select' && (
        <select name={name} className={controlClass} {...props}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}

      {as === 'input' && <input name={name} type={type} className={controlClass} {...props} />}

      {error && <span className="mt-1 block text-xs font-medium text-rose-600">{error}</span>}
    </label>
  );
};
