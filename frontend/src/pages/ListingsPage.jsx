import { useEffect, useMemo, useState } from 'react';
import { FiPlus, FiRefreshCw } from 'react-icons/fi';

import { Alert } from '../components/Alert.jsx';
import { Badge } from '../components/Badge.jsx';
import { Button } from '../components/Button.jsx';
import { FormInput } from '../components/FormInput.jsx';
import { Modal } from '../components/Modal.jsx';
import { Table } from '../components/Table.jsx';
import { listingService } from '../services/listingService.js';
import { productService } from '../services/productService.js';
import {
  formatCurrency,
  formatProductName,
  formatSupplierName
} from '../utils/formatters.js';
import { toNumberOrZero } from '../utils/forms.js';
import { LISTING_STATUSES, PLATFORMS } from '../utils/status.js';

const emptyListingForm = {
  listingId: '',
  productId: '',
  platform: 'MEESHO',
  listingUrl: '',
  listingPrice: '',
  marketplaceFees: '',
  status: 'ACTIVE'
};

export const ListingsPage = () => {
  const [listings, setListings] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyListingForm);
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const productOptions = useMemo(
    () => [
      { value: '', label: 'Select product' },
      ...products.map((product) => ({
        value: product.productId,
        label: `${product.name} (${product.productId})`
      }))
    ],
    [products]
  );

  const loadListings = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await listingService.list({ limit: 50 });
      setListings(response.items || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productService.list({ limit: 100 });
      setProducts(response.items || []);
    } catch {
      setProducts([]);
    }
  };

  useEffect(() => {
    loadListings();
    loadProducts();
  }, []);

  const validateForm = () => {
    const errors = {};

    if (!form.listingId.trim()) errors.listingId = 'Listing ID is required';
    if (!form.productId) errors.productId = 'Product is required';
    if (!form.listingUrl.trim()) errors.listingUrl = 'Listing URL is required';
    if (form.listingUrl && !/^https?:\/\/.+/i.test(form.listingUrl)) {
      errors.listingUrl = 'Listing URL must start with http:// or https://';
    }
    if (form.listingPrice === '' || Number(form.listingPrice) < 0) {
      errors.listingPrice = 'Listing price must be a non-negative number';
    }
    if (form.marketplaceFees !== '' && Number(form.marketplaceFees) < 0) {
      errors.marketplaceFees = 'Marketplace fees must be non-negative';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm(emptyListingForm);
    setFormErrors({});
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    const payload = {
      listingId: form.listingId.trim(),
      productId: form.productId,
      platform: form.platform,
      listingUrl: form.listingUrl.trim(),
      listingPrice: toNumberOrZero(form.listingPrice),
      marketplaceFees: toNumberOrZero(form.marketplaceFees),
      status: form.status
    };

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await listingService.create(payload);
      setSuccess('Listing created and product dependency recalculated');
      closeModal();
      await Promise.all([loadListings(), loadProducts()]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const recalculateLinkedProduct = async (listing) => {
    const product = listing.linkedProduct || listing.productId;
    if (!product) return;

    setError('');
    setSuccess('');

    try {
      await productService.recalculate(product._id || product.productId);
      setSuccess('Linked product and listing health recalculated');
      await loadListings();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const columns = [
    { key: 'listingId', header: 'Listing ID' },
    {
      key: 'linkedProduct',
      header: 'Linked Product',
      render: (listing) => formatProductName(listing.linkedProduct || listing.productId)
    },
    {
      key: 'platform',
      header: 'Platform',
      render: (listing) => <Badge>{listing.platform}</Badge>
    },
    {
      key: 'listingPrice',
      header: 'Listing Price',
      render: (listing) => formatCurrency(listing.listingPrice)
    },
    {
      key: 'marketplaceFees',
      header: 'Fees',
      render: (listing) => formatCurrency(listing.marketplaceFees)
    },
    {
      key: 'estimatedProfit',
      header: 'Estimated Profit',
      render: (listing) => formatCurrency(listing.estimatedProfit)
    },
    {
      key: 'activeSupplier',
      header: 'Active Supplier',
      render: (listing) => formatSupplierName((listing.linkedProduct || listing.productId)?.activeSupplier)
    },
    {
      key: 'health',
      header: 'Listing Health',
      render: (listing) => <Badge>{listing.health}</Badge>
    },
    {
      key: 'status',
      header: 'Status',
      render: (listing) => <Badge>{listing.status}</Badge>
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (listing) => (
        <Button variant="secondary" size="sm" onClick={() => recalculateLinkedProduct(listing)}>
          <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
          Recalc
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-950">Marketplace Listings</h2>
          <p className="text-sm text-gray-500">Listing health follows product status and supplier profit.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <FiPlus className="h-4 w-4" aria-hidden="true" />
          Add Listing
        </Button>
      </div>

      <Alert type="success" message={success} onClose={() => setSuccess('')} />
      <Alert message={error} onClose={() => setError('')} />

      <Table
        columns={columns}
        data={listings}
        loading={loading}
        emptyTitle="No listings found"
        emptyDescription="Create a listing after products are available."
      />

      <Modal
        open={modalOpen}
        title="Add Listing"
        description="Listing fees and price are used to estimate marketplace profit."
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              label="Listing ID"
              name="listingId"
              value={form.listingId}
              onChange={handleChange}
              error={formErrors.listingId}
              placeholder="LIST-1001"
            />
            <FormInput
              label="Product"
              name="productId"
              as="select"
              value={form.productId}
              onChange={handleChange}
              error={formErrors.productId}
              options={productOptions}
            />
            <FormInput
              label="Platform"
              name="platform"
              as="select"
              value={form.platform}
              onChange={handleChange}
              options={PLATFORMS.map((platform) => ({ value: platform, label: platform }))}
            />
            <FormInput
              label="Listing Price"
              name="listingPrice"
              type="number"
              min="0"
              value={form.listingPrice}
              onChange={handleChange}
              error={formErrors.listingPrice}
              placeholder="649"
            />
            <FormInput
              label="Marketplace Fees"
              name="marketplaceFees"
              type="number"
              min="0"
              value={form.marketplaceFees}
              onChange={handleChange}
              error={formErrors.marketplaceFees}
              placeholder="60"
            />
            <FormInput
              label="Status"
              name="status"
              as="select"
              value={form.status}
              onChange={handleChange}
              options={LISTING_STATUSES.map((status) => ({ value: status, label: status }))}
            />
          </div>

          <FormInput
            label="Listing URL"
            name="listingUrl"
            value={form.listingUrl}
            onChange={handleChange}
            error={formErrors.listingUrl}
            placeholder="https://www.meesho.com/example-product"
          />

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Create Listing'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
