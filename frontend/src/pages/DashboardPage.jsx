import { useEffect, useState } from 'react';
import {
  FiAlertTriangle,
  FiBox,
  FiLayers,
  FiPackage,
  FiTrendingDown,
  FiTruck,
  FiXCircle
} from 'react-icons/fi';

import { productService } from '../services/productService.js';
import { supplierService } from '../services/supplierService.js';
import { listingService } from '../services/listingService.js';
import { Alert } from '../components/Alert.jsx';
import { Badge } from '../components/Badge.jsx';
import { Card } from '../components/Card.jsx';
import { Loader } from '../components/Loader.jsx';
import { Table } from '../components/Table.jsx';
import {
  formatCount,
  formatCurrency,
  formatPercent,
  formatSupplierName
} from '../utils/formatters.js';

export const DashboardPage = () => {
  const [metrics, setMetrics] = useState({
    totalProducts: 0,
    totalSuppliers: 0,
    totalListings: 0,
    activeProducts: 0,
    deadProducts: 0,
    lowProfitProducts: 0,
    riskyListings: 0
  });
  const [recentProducts, setRecentProducts] = useState([]);
  const [recentSuppliers, setRecentSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      const [
        productResponse,
        supplierResponse,
        listingResponse,
        activeProductResponse,
        deadProductResponse,
        lowProfitProductResponse,
        riskyListingResponse
      ] = await Promise.all([
        productService.list({ limit: 5 }),
        supplierService.list({ limit: 5 }),
        listingService.list({ limit: 1 }),
        productService.list({ status: 'ACTIVE', limit: 1 }),
        productService.list({ status: 'DEAD', limit: 1 }),
        productService.list({ status: 'LOW_PROFIT', limit: 1 }),
        listingService.list({ health: 'RISKY', limit: 1 })
      ]);

      setMetrics({
        totalProducts: productResponse.pagination?.total || 0,
        totalSuppliers: supplierResponse.pagination?.total || 0,
        totalListings: listingResponse.pagination?.total || 0,
        activeProducts: activeProductResponse.pagination?.total || 0,
        deadProducts: deadProductResponse.pagination?.total || 0,
        lowProfitProducts: lowProfitProductResponse.pagination?.total || 0,
        riskyListings: riskyListingResponse.pagination?.total || 0
      });
      setRecentProducts(productResponse.items || []);
      setRecentSuppliers(supplierResponse.items || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

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
      header: 'Profit Margin',
      render: (product) => formatPercent(product.profitMargin)
    },
    {
      key: 'status',
      header: 'Status',
      render: (product) => <Badge>{product.status}</Badge>
    },
    {
      key: 'activeSupplier',
      header: 'Best Supplier',
      render: (product) => formatSupplierName(product.activeSupplier)
    }
  ];

  const supplierColumns = [
    { key: 'supplierId', header: 'Supplier ID' },
    { key: 'name', header: 'Name' },
    {
      key: 'reliabilityScore',
      header: 'Reliability',
      render: (supplier) => `${supplier.reliabilityScore || 0}/100`
    },
    {
      key: 'averageDeliveryDays',
      header: 'Delivery',
      render: (supplier) => `${supplier.averageDeliveryDays || 0} days`
    },
    {
      key: 'suppliedProducts',
      header: 'Products',
      render: (supplier) => formatCount((supplier.suppliedProducts || supplier.productsSupplied || []).length)
    }
  ];

  return (
    <div className="space-y-6">
      <Alert message={error} onClose={() => setError('')} />

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white py-16">
          <Loader label="Loading dashboard" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card title="Total Products" value={formatCount(metrics.totalProducts)} icon={FiBox} />
            <Card title="Total Suppliers" value={formatCount(metrics.totalSuppliers)} icon={FiTruck} />
            <Card title="Total Listings" value={formatCount(metrics.totalListings)} icon={FiLayers} />
            <Card title="Active Products" value={formatCount(metrics.activeProducts)} icon={FiPackage} />
            <Card title="Dead Products" value={formatCount(metrics.deadProducts)} icon={FiXCircle} />
            <Card
              title="Low Profit Products"
              value={formatCount(metrics.lowProfitProducts)}
              icon={FiTrendingDown}
            />
            <Card title="Risky Listings" value={formatCount(metrics.riskyListings)} icon={FiAlertTriangle} />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="space-y-3">
              <div>
                <h2 className="text-base font-semibold text-gray-950">Recent Products</h2>
                <p className="text-sm text-gray-500">Calculated product state and supplier dependency.</p>
              </div>
              <Table
                columns={productColumns}
                data={recentProducts}
                emptyTitle="No products yet"
                emptyDescription="Add products from the Products page."
              />
            </section>

            <section className="space-y-3">
              <div>
                <h2 className="text-base font-semibold text-gray-950">Recent Suppliers</h2>
                <p className="text-sm text-gray-500">Supplier reliability and product coverage.</p>
              </div>
              <Table
                columns={supplierColumns}
                data={recentSuppliers}
                emptyTitle="No suppliers yet"
                emptyDescription="Add suppliers from the Suppliers page."
              />
            </section>
          </div>
        </>
      )}
    </div>
  );
};
