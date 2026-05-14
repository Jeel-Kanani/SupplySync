import { useEffect, useMemo, useState } from 'react';
import { FiEye, FiPlus } from 'react-icons/fi';

import { Alert } from '../components/Alert.jsx';
import { Badge } from '../components/Badge.jsx';
import { Button } from '../components/Button.jsx';
import { FormInput } from '../components/FormInput.jsx';
import { Loader } from '../components/Loader.jsx';
import { Modal } from '../components/Modal.jsx';
import { Table } from '../components/Table.jsx';
import { productService } from '../services/productService.js';
import { supplierService } from '../services/supplierService.js';
import { formatCount, formatCurrency, formatPercent, formatSupplierName } from '../utils/formatters.js';
import { toNumberOrZero } from '../utils/forms.js';

const emptySupplierForm = {
  supplierId: '',
  name: '',
  website: '',
  email: '',
  phone: '',
  address: '',
  reliabilityScore: 50,
  isActive: true,
  averageDeliveryDays: 7,
  suppliedProducts: []
};

export const SuppliersPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [supplierProductData, setSupplierProductData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [form, setForm] = useState(emptySupplierForm);
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const rankingMap = useMemo(() => {
    const map = new Map();
    rankings.forEach((ranking) => {
      map.set(ranking.supplier?._id, ranking);
    });
    return map;
  }, [rankings]);

  const loadSuppliers = async () => {
    setLoading(true);
    setError('');

    try {
      const [supplierResponse, rankingResponse] = await Promise.all([
        supplierService.list({ limit: 50 }),
        supplierService.rankings()
      ]);

      setSuppliers(supplierResponse.items || []);
      setRankings(rankingResponse || []);
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
    loadSuppliers();
    loadProducts();
  }, []);

  const validateForm = () => {
    const errors = {};

    if (!form.supplierId.trim()) errors.supplierId = 'Supplier ID is required';
    if (!form.name.trim()) errors.name = 'Name is required';
    if (form.website && !/^https?:\/\/.+/i.test(form.website)) {
      errors.website = 'Website must start with http:// or https://';
    }
    if (form.reliabilityScore === '' || Number(form.reliabilityScore) < 0 || Number(form.reliabilityScore) > 100) {
      errors.reliabilityScore = 'Reliability score must be between 0 and 100';
    }
    if (form.averageDeliveryDays === '' || Number(form.averageDeliveryDays) < 0) {
      errors.averageDeliveryDays = 'Average delivery days must be non-negative';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleProductsChange = (event) => {
    const selectedProducts = Array.from(event.target.selectedOptions).map((option) => option.value);
    setForm((current) => ({ ...current, suppliedProducts: selectedProducts }));
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm(emptySupplierForm);
    setFormErrors({});
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    const contactInfo = {
      ...(form.email.trim() ? { email: form.email.trim() } : {}),
      ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      ...(form.address.trim() ? { address: form.address.trim() } : {})
    };

    const payload = {
      supplierId: form.supplierId.trim(),
      name: form.name.trim(),
      ...(form.website.trim() ? { website: form.website.trim() } : {}),
      contactInfo,
      reliabilityScore: toNumberOrZero(form.reliabilityScore),
      isActive: Boolean(form.isActive),
      averageDeliveryDays: toNumberOrZero(form.averageDeliveryDays),
      suppliedProducts: form.suppliedProducts
    };

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await supplierService.create(payload);
      setSuccess('Supplier created and linked products recalculated');
      closeModal();
      await Promise.all([loadSuppliers(), loadProducts()]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const inspectSupplierProducts = async (supplier) => {
    setDetailsModalOpen(true);
    setDetailsLoading(true);
    setSupplierProductData(null);

    try {
      const response = await supplierService.products(supplier._id || supplier.supplierId);
      setSupplierProductData(response);
    } catch (requestError) {
      setError(requestError.message);
      setDetailsModalOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const columns = [
    { key: 'supplierId', header: 'Supplier ID' },
    { key: 'name', header: 'Name' },
    {
      key: 'reliabilityScore',
      header: 'Reliability',
      render: (supplier) => `${supplier.reliabilityScore || 0}/100`
    },
    {
      key: 'rankingScore',
      header: 'Ranking Score',
      render: (supplier) => rankingMap.get(supplier._id)?.rankingScore || 0
    },
    {
      key: 'isActive',
      header: 'Availability',
      render: (supplier) => <Badge>{supplier.isActive === false ? 'INACTIVE' : 'ACTIVE'}</Badge>
    },
    {
      key: 'averageDeliveryDays',
      header: 'Delivery',
      render: (supplier) => `${supplier.averageDeliveryDays || 0} days`
    },
    {
      key: 'suppliedProducts',
      header: 'Products Supplied',
      render: (supplier) =>
        formatCount((supplier.suppliedProducts || supplier.productsSupplied || []).length)
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (supplier) => (
        <Button variant="secondary" size="sm" onClick={() => inspectSupplierProducts(supplier)}>
          <FiEye className="h-4 w-4" aria-hidden="true" />
          Products
        </Button>
      )
    }
  ];

  const productColumns = [
    { key: 'productId', header: 'Product ID' },
    { key: 'name', header: 'Name' },
    {
      key: 'sellingPrice',
      header: 'Selling Price',
      render: (product) => formatCurrency(product.sellingPrice)
    },
    {
      key: 'profitMargin',
      header: 'Margin',
      render: (product) => formatPercent(product.profitMargin)
    },
    {
      key: 'status',
      header: 'Status',
      render: (product) => <Badge>{product.status}</Badge>
    },
    {
      key: 'activeSupplier',
      header: 'Current Best Supplier',
      render: (product) => formatSupplierName(product.activeSupplier)
    }
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-950">Supplier Directory</h2>
          <p className="text-sm text-gray-500">Supplier reliability, coverage, and ranking score.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <FiPlus className="h-4 w-4" aria-hidden="true" />
          Add Supplier
        </Button>
      </div>

      <Alert type="success" message={success} onClose={() => setSuccess('')} />
      <Alert message={error} onClose={() => setError('')} />

      <Table
        columns={columns}
        data={suppliers}
        loading={loading}
        emptyTitle="No suppliers found"
        emptyDescription="Add a supplier to start tracking product sourcing."
      />

      <Modal
        open={modalOpen}
        title="Add Supplier"
        description="Supplier reliability and delivery values feed the ranking engine."
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              label="Supplier ID"
              name="supplierId"
              value={form.supplierId}
              onChange={handleChange}
              error={formErrors.supplierId}
              placeholder="SUP-1001"
            />
            <FormInput
              label="Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              error={formErrors.name}
              placeholder="Jaipur Textile Hub"
            />
            <FormInput
              label="Website"
              name="website"
              value={form.website}
              onChange={handleChange}
              error={formErrors.website}
              placeholder="https://supplier.example"
            />
            <FormInput
              label="Reliability Score"
              name="reliabilityScore"
              type="number"
              min="0"
              max="100"
              value={form.reliabilityScore}
              onChange={handleChange}
              error={formErrors.reliabilityScore}
            />
            <FormInput
              label="Average Delivery Days"
              name="averageDeliveryDays"
              type="number"
              min="0"
              value={form.averageDeliveryDays}
              onChange={handleChange}
              error={formErrors.averageDeliveryDays}
            />
            <label className="flex items-end gap-2 pb-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-gray-900"
              />
              Supplier available
            </label>
            <FormInput
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="sales@supplier.example"
            />
            <FormInput
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+91-9000000000"
            />
          </div>

          <FormInput
            label="Address"
            name="address"
            as="textarea"
            value={form.address}
            onChange={handleChange}
            placeholder="Supplier address"
          />

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Supplied Products</span>
            <select
              multiple
              value={form.suppliedProducts}
              onChange={handleProductsChange}
              className="focus-ring mt-1 block min-h-28 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
            >
              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.name} ({product.productId})
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-gray-500">
              Product-specific buy price is managed from the Products page.
            </span>
          </label>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Create Supplier'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={detailsModalOpen}
        title="Supplied Products"
        description="Products connected to this supplier through direct links or product relationships."
        onClose={() => setDetailsModalOpen(false)}
      >
        {detailsLoading ? (
          <Loader label="Loading supplied products" />
        ) : (
          <div className="space-y-4">
            {supplierProductData?.supplier && (
              <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                <p className="text-sm font-semibold text-gray-950">
                  {supplierProductData.supplier.name}
                </p>
                <p className="text-sm text-gray-500">
                  Reliability {supplierProductData.supplier.reliabilityScore || 0}/100
                </p>
              </div>
            )}
            <Table
              columns={productColumns}
              data={supplierProductData?.products || []}
              emptyTitle="No supplied products"
              emptyDescription="Link this supplier to products to see them here."
            />
          </div>
        )}
      </Modal>
    </div>
  );
};
