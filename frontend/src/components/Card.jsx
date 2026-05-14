export const Card = ({ title, value, subtitle, icon: Icon, children, className = '' }) => (
  <section className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}>
    {(title || value || Icon) && (
      <div className="flex items-start justify-between gap-4 p-5">
        <div>
          {title && <p className="text-sm font-medium text-gray-500">{title}</p>}
          {value !== undefined && (
            <p className="mt-2 text-2xl font-semibold tracking-normal text-gray-950">{value}</p>
          )}
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-gray-700">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
      </div>
    )}
    {children}
  </section>
);
