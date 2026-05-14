import { EmptyState } from './EmptyState.jsx';
import { Loader } from './Loader.jsx';

export const Table = ({
  columns,
  data,
  loading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'Create a record to see it here.'
}) => (
  <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-normal text-gray-500 ${column.className || ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {loading && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10">
                <Loader label="Loading records" />
              </td>
            </tr>
          )}

          {!loading && data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10">
                <EmptyState title={emptyTitle} description={emptyDescription} />
              </td>
            </tr>
          )}

          {!loading &&
            data.map((row) => (
              <tr key={row._id || row.id || row.productId || row.supplierId || row.listingId}>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`whitespace-nowrap px-4 py-3 text-sm text-gray-700 ${column.cellClassName || ''}`}
                  >
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  </div>
);
