import { useEffect, useMemo, useState } from 'react';
import { FiEdit2, FiEye, FiPlus, FiRefreshCw, FiSearch, FiTrash2, FiX } from 'react-icons/fi';

import { Alert } from '../components/Alert.jsx';
import { Badge } from '../components/Badge.jsx';
import { Button } from '../components/Button.jsx';
import { FormInput } from '../components/FormInput.jsx';
import { Loader } from '../components/Loader.jsx';
import { Modal } from '../components/Modal.jsx';
import { Table } from '../components/Table.jsx';
import { productService } from '../services/productService.js';
import { supplierService } from '../services/supplierService.js';
import {
  formatCurrency,
  formatPercent,
  formatSupplierName
} from '../utils/formatters.js';
import { splitLines, toNumberOrZero } from '../utils/forms.js';

const emptySupplierLink = {
  supplier: '',
  buyPrice: '',
  isAvailable: true,
  stockQuantity: 10,
  deliveryDays: 7,
  notes: ''
};

const emptyProductForm = {
  productId: '',
  name: '',
  category: '',
  description: '',
  images: '',
  sellingPrice: '',
  suppliers: []
};

export const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [businessLoading, setBusinessLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [businessModalOpen, setBusinessModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [businessData, setBusinessData] = useState(null);
  const [form, setForm] = useState(emptyProductForm);
  const [formErrors, setFormErrors] = useState({});

  const supplierOptions = useMemo(
    () => [
      { value: '', label: 'Select supplier' },
      ...suppliers.map((supplier) => ({
        value: supplier._id,
        label: `${supplier.name} (${supplier.supplierId})`
      }))
    ],
    [suppliers]
  );

  const loadProducts = async (params = {}) => {
    setLoading(true);
    setError('');

    try {
      const response = await productService.list({
        limit: 50,
        ...(params.search ? { search: params.search } : {})
      });
      setProducts(response.items || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await supplierService.list({ limit: 100 });
      setSuppliers(response.items || []);
    } catch {
      setSuppliers([]);
    }
  };

  useEffect(() => {
    loadProducts();
    loadSuppliers();
  }, []);

  const validateForm = () => {
    const errors = {};

    if (!form.productId.trim()) errors.productId = 'Product ID is required';
    if (!form.name.trim()) errors.name = 'Name is required';
    if (!form.category.trim()) errors.category = 'Category is required';
    if (form.sellingPrice === '' || Number(form.sellingPrice) < 0) {
      errors.sellingPrice = 'Selling price must be a non-negative number';
    }

    form.suppliers.forEach((relationship, index) => {
      if (!relationship.supplier) errors[`supplier-${index}`] = 'Supplier is required';
      if (relationship.buyPrice === '' || Number(relationship.buyPrice) < 0) {
        errors[`buyPrice-${index}`] = 'Buy price must be non-negative';
      }
      if (Number(relationship.stockQuantity) < 0) {
        errors[`stockQuantity-${index}`] = 'Stock cannot be negative';
      }
      if (Number(relationship.deliveryDays) < 0) {
        errors[`deliveryDays-${index}`] = 'Delivery days cannot be negative';
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setForm(emptyProductForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setForm({
      productId: product.productId || '',
      name: product.name || '',
      category: product.category || '',
      description: product.description || '',
      images: (product.images || []).join('\n'),
      sellingPrice: product.sellingPrice ?? '',
      suppliers: (product.suppliers || []).map((relationship) => ({
        supplier: relationship.supplier?._id || relationship.supplier || '',
        buyPrice: relationship.buyPrice ?? '',
        isAvailable: relationship.isAvailable !== false,
        stockQuantity: relationship.stockQuantity ?? 0,
        deliveryDays: relationship.deliveryDays ?? 7,
        notes: relationship.notes || ''
      }))
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
    setForm(emptyProductForm);
    setFormErrors({});
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const addSupplierLink = () => {
    setForm((current) => ({
      ...current,
      suppliers: [...current.suppliers, { ...emptySupplierLink }]
    }));
  };

  const removeSupplierLink = (index) => {
    setForm((current) => ({
      ...current,
      suppliers: current.suppliers.filter((_item, itemIndex) => itemIndex !== index)
    }));
  };

  const updateSupplierLink = (index, field, value) => {
    setForm((current) => ({
      ...current,
      suppliers: current.suppliers.map((relationship, itemIndex) =>
        itemIndex === index ? { ...relationship, [field]: value } : relationship
      )
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    const payload = {
      productId: form.productId.trim(),
      name: form.name.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
      images: splitLines(form.images),
      sellingPrice: toNumberOrZero(form.sellingPrice),
      suppliers: form.suppliers
        .filter((relationship) => relationship.supplier)
        .map((relationship) => ({
          supplier: relationship.supplier,
          buyPrice: toNumberOrZero(relationship.buyPrice),
          isAvailable: Boolean(relationship.isAvailable),
          stockQuantity: toNumberOrZero(relationship.stockQuantity),
          deliveryDays: toNumberOrZero(relationship.deliveryDays),
          notes: relationship.notes?.trim() || ''
        }))
    };

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (editingProduct) {
        await productService.update(editingProduct._id || editingProduct.productId, payload);
        setSuccess('Product updated and recalculated successfully');
      } else {
        await productService.create(payload);
        setSuccess('Product created and calculated successfully');
      }

      closeModal();
      await Promise.all([loadProducts({ search }), loadSuppliers()]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    const confirmed = window.confirm(`Delete ${product.name}? This also removes linked listings.`);
    if (!confirmed) return;

    setError('');
    setSuccess('');

    try {
      await productService.remove(product._id || product.productId);
      setSuccess('Product deleted successfully');
      await Promise.all([loadProducts({ search }), loadSuppliers()]);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleRecalculate = async (product) => {
    setError('');
    setSuccess('');

    try {
      await productService.recalculate(product._id || product.productId);
      setSuccess(`${product.name} recalculated successfully`);
      await loadProducts({ search });
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const inspectProduct = async (product) => {
    setBusinessModalOpen(true);
    setBusinessLoading(true);
    setBusinessData(null);
    setError('');

    try {
      const response = await productService.recalculate(product._id || product.productId);
      setBusinessData(response);
      await loadProducts({ search });
    } catch (requestError) {
      setError(requestError.message);
      setBusinessModalOpen(false);
    } finally {
      setBusinessLoading(false);
    }
  };

  const handleSearch = (event) => {
    event.preventDefault();
    loadProducts({ search: search.trim() });
  };

  const clearSearch = () => {
    setSearch('');
    loadProducts();
  };

  const columns = [
    { key: 'productId', header: 'Product ID' },
    { key: 'name', header: 'Name' },
    { key: 'category', header: 'Category' },
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
      key: 'suppliers',
      header: 'Linked Suppliers',
      render: (product) => product.suppliers?.length || 0
    },
    {
      key: 'activeSupplier',
      header: 'Best Supplier',
      render: (product) => formatSupplierName(product.activeSupplier)
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (product) => (
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => inspectProduct(product)}>
            <FiEye className="h-4 w-4" aria-hidden="true" />
            Inspect
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleRecalculate(product)}>
            <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
            Recalc
          </Button>
          <Button variant="secondary" size="sm" onClick={() => openEditModal(product)}>
            <FiEdit2 className="h-4 w-4" aria-hidden="true" />
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => handleDelete(product)}>
            <FiTrash2 className="h-4 w-4" aria-hidden="true" />
            Delete
          </Button>
        </div>
      )
    }
  ];

  const rankingColumns = [
    {
      key: 'supplier',
      header: 'Supplier',
      render: (ranking) => formatSupplierName(ranking.supplier)
    },
    {
      key: 'buyPrice',
      header: 'Buy Price',
      render: (ranking) => formatCurrency(ranking.buyPrice)
    },
    {
      key: 'score',
      header: 'Score',
      render: (ranking) => ranking.score
    },
    {
      key: 'stockQuantity',
      header: 'Stock',
      render: (ranking) => ranking.stockQuantity
    },
    {
      key: 'deliveryDays',
      header: 'Delivery',
      render: (ranking) => `${ranking.deliveryDays} days`
    },
    {
      key: 'isAvailable',
      header: 'Availability',
      render: (ranking) => (ranking.isAvailable ? 'Available' : 'Unavailable')
    }
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <form onSubmit={handleSearch} className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <FiSearch className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by product name or category"
              className="focus-ring h-10 w-full rounded-md border border-gray-300 pl-9 pr-3 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="secondary">
              Search
            </Button>
            {search && (
              <Button type="button" variant="ghost" onClick={clearSearch}>
                <FiX className="h-4 w-4" aria-hidden="true" />
                Clear
              </Button>
            )}
          </div>
        </form>
        <Button onClick={openCreateModal}>
          <FiPlus className="h-4 w-4" aria-hidden="true" />
          Add Product
        </Button>
      </div>

      <Alert type="success" message={success} onClose={() => setSuccess('')} />
      <Alert message={error} onClose={() => setError('')} />

      <Table
        columns={columns}
        data={products}
        loading={loading}
        emptyTitle="No products found"
        emptyDescription="Add your first product or adjust the search term."
      />

      <Modal
        open={modalOpen}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        description="Supplier relationships drive status, profit, and marketplace listing health."
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              label="Product ID"
              name="productId"
              value={form.productId}
              onChange={handleChange}
              error={formErrors.productId}
              placeholder="PROD-1001"
            />
            <FormInput
              label="Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              error={formErrors.name}
              placeholder="Cotton Printed Kurti"
            />
            <FormInput
              label="Category"
              name="category"
              value={form.category}
              onChange={handleChange}
              error={formErrors.category}
              placeholder="Women Fashion"
            />
            <FormInput
              label="Selling Price"
              name="sellingPrice"
              type="number"
              min="0"
              value={form.sellingPrice}
              onChange={handleChange}
              error={formErrors.sellingPrice}
              placeholder="599"
            />
          </div>

          <FormInput
            label="Description"
            name="description"
            as="textarea"
            value={form.description}
            onChange={handleChange}
            placeholder="Short product description"
          />
          <FormInput
            label="Image URLs"
            name="images"
            as="textarea"
            value={form.images}
            onChange={handleChange}
            placeholder="One image URL per line"
          />

          <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-950">Supplier Relationships</h3>
                <p className="text-sm text-gray-500">Buy price, stock, and delivery feed the scoring engine.</p>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={addSupplierLink}>
                <FiPlus className="h-4 w-4" aria-hidden="true" />
                Add
              </Button>
            </div>

            {form.suppliers.length === 0 && (
              <p className="rounded-md border border-dashed border-gray-300 bg-white px-3 py-3 text-sm text-gray-500">
                No suppliers linked. The product will calculate as DEAD until at least one supplier is available.
              </p>
            )}

            {form.suppliers.map((relationship, index) => (
              <div key={`${relationship.supplier}-${index}`} className="rounded-md border border-gray-200 bg-white p-3">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <FormInput
                    label="Supplier"
                    name={`supplier-${index}`}
                    as="select"
                    value={relationship.supplier}
                    onChange={(event) => updateSupplierLink(index, 'supplier', event.target.value)}
                    error={formErrors[`supplier-${index}`]}
                    options={supplierOptions}
                    className="lg:col-span-2"
                  />
                  <FormInput
                    label="Buy Price"
                    name={`buyPrice-${index}`}
                    type="number"
                    min="0"
                    value={relationship.buyPrice}
                    onChange={(event) => updateSupplierLink(index, 'buyPrice', event.target.value)}
                    error={formErrors[`buyPrice-${index}`]}
                  />
                  <FormInput
                    label="Stock"
                    name={`stockQuantity-${index}`}
                    type="number"
                    min="0"
                    value={relationship.stockQuantity}
                    onChange={(event) => updateSupplierLink(index, 'stockQuantity', event.target.value)}
                    error={formErrors[`stockQuantity-${index}`]}
                  />
                  <FormInput
                    label="Delivery Days"
                    name={`deliveryDays-${index}`}
                    type="number"
                    min="0"
                    value={relationship.deliveryDays}
                    onChange={(event) => updateSupplierLink(index, 'deliveryDays', event.target.value)}
                    error={formErrors[`deliveryDays-${index}`]}
                  />
                </div>

                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={relationship.isAvailable}
                      onChange={(event) => updateSupplierLink(index, 'isAvailable', event.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-gray-900"
                    />
                    Available
                  </label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeSupplierLink(index)}>
                    Remove supplier
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={businessModalOpen}
        title="Product Business Engine"
        description="Calculated supplier ranking, best supplier, product status, and profit margin."
        onClose={() => setBusinessModalOpen(false)}
      >
        {businessLoading ? (
          <Loader label="Calculating product" />
        ) : businessData ? (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-md border border-gray-200 p-3">
                <p className="text-xs font-medium uppercase text-gray-500">Status</p>
                <div className="mt-2">
                  <Badge>{businessData.status?.value}</Badge>
                </div>
              </div>
              <div className="rounded-md border border-gray-200 p-3">
                <p className="text-xs font-medium uppercase text-gray-500">Profit</p>
                <p className="mt-2 text-sm font-semibold text-gray-950">
                  {formatCurrency(businessData.profit?.estimatedProfit)}
                </p>
              </div>
              <div className="rounded-md border border-gray-200 p-3">
                <p className="text-xs font-medium uppercase text-gray-500">Margin</p>
                <p className="mt-2 text-sm font-semibold text-gray-950">
                  {formatPercent(businessData.profit?.profitMargin)}
                </p>
              </div>
              <div className="rounded-md border border-gray-200 p-3">
                <p className="text-xs font-medium uppercase text-gray-500">Best Supplier</p>
                <p className="mt-2 text-sm font-semibold text-gray-950">
                  {formatSupplierName(businessData.bestSupplier?.supplier)}
                </p>
              </div>
            </div>

            {businessData.status?.reasons?.length > 0 && (
              <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                <p className="text-sm font-semibold text-gray-950">Status Reasons</p>
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  {businessData.status.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}

            <Table
              columns={rankingColumns}
              data={businessData.supplierRankings || []}
              emptyTitle="No supplier rankings"
              emptyDescription="Link suppliers to this product to calculate rankings."
            />
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
