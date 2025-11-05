import { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PhotoIcon,
  TagIcon,
  CubeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TableCellsIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import { getVendorProducts, getMyVendorProducts, addProduct, updateProduct, deleteProduct, selectProduct, getAvailableProducts } from '../utils/product';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', or 'select'
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'cards'
  const [selectionData, setSelectionData] = useState({
    productId: '',
    stock: '',
    notes: ''
  });
  const [availableProducts, setAvailableProducts] = useState([]);
  const [availableProductsLoading, setAvailableProductsLoading] = useState(false);
  const [selectedProductForSelection, setSelectedProductForSelection] = useState(null);
  const [availableSearchTerm, setAvailableSearchTerm] = useState('');
  const [availablePage, setAvailablePage] = useState(1);
  const [availableTotalPages, setAvailableTotalPages] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    images: [],
    status: 'active',
    sku: '',
    weight: '',
    dimensions: ''
  });

  const categories = [
    'Fruits & Vegetables',
    'Dairy Products',
    'Bakery',
    'Meat & Seafood',
    'Beverages',
    'Snacks',
    'Personal Care',
    'Household'
  ];

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchProducts();
    }, searchTerm ? 500 : 0); // 500ms delay for search, immediate for other changes

    return () => clearTimeout(debounceTimer);
  }, [currentPage, searchTerm, filterStatus, filterCategory]);

  // Fetch available products when modal is in select mode
  useEffect(() => {
    if (showModal && modalMode === 'select') {
      const debounceTimer = setTimeout(() => {
        fetchAvailableProducts();
      }, availableSearchTerm ? 500 : 0);

      return () => clearTimeout(debounceTimer);
    }
  }, [showModal, modalMode, availablePage, availableSearchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters for API
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        status: filterStatus,
        category: filterCategory
      };

      console.log('fetchProducts - Calling getVendorProducts with params:', params);
      const response = await getVendorProducts(params);
      console.log('fetchProducts - API Response:', response);

      // Handle API response structure: { success, count, total, pagination: { page, pages }, data: [...] }
      if (response?.success && response?.data) {
        setProducts(response.data);
        setTotalProducts(response.total || 0);
        setTotalPages(response.pagination?.pages || 1);
      } else {
        // Fallback for unexpected response format
        console.warn('fetchProducts - Unexpected response format:', response);
        setProducts([]);
        setTotalProducts(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('fetchProducts - Error:', err);
      setError(err.message);
      setProducts([]);
      setTotalProducts(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableProducts = async () => {
    try {
      setAvailableProductsLoading(true);
      setError(null);

      const params = {
        page: availablePage,
        limit: 10,
        search: availableSearchTerm
      };

      console.log('fetchAvailableProducts - Calling API with params:', params);

      const response = await getAvailableProducts(params);

      console.log('fetchAvailableProducts - Full API Response:', response);

      if (response?.success && response?.data) {
        console.log('fetchAvailableProducts - Success! Products count:', response.data.length);
        setAvailableProducts(response.data);
        setAvailableTotalPages(response.pagination?.pages || 1);
      } else {
        console.warn('fetchAvailableProducts - Unexpected response format:', response);
        setAvailableProducts([]);
        setAvailableTotalPages(1);
        setError('Unable to load available products. Please try again.');
      }
    } catch (err) {
      console.error('fetchAvailableProducts - Error:', err);
      console.error('fetchAvailableProducts - Error message:', err.message);
      console.error('fetchAvailableProducts - Error stack:', err.stack);
      setAvailableProducts([]);
      setAvailableTotalPages(1);
      setError(`Failed to load products: ${err.message}`);
    } finally {
      setAvailableProductsLoading(false);
    }
  };

  const handleOpenSelectProduct = () => {
    setModalMode('select');
    setShowModal(true);
    setSelectedProductForSelection(null);
    setSelectionData({
      productId: '',
      stock: '',
      notes: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'select') {
        // Handle product selection
        if (!selectedProductForSelection) {
          setError('Please select a product');
          return;
        }

        await selectProduct({
          productId: selectedProductForSelection._id || selectedProductForSelection.id,
          stock: parseInt(selectionData.stock),
          notes: selectionData.notes
        });
      } else if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
      } else {
        await addProduct(formData);
      }
      await fetchProducts();
      setShowModal(false);
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id);
        await fetchProducts();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleEdit = (product) => {
    setModalMode('edit');
    setEditingProduct(product);

    // Extract product data from Product model structure
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: (product.pricing?.sellingPrice || '').toString(),
      category: product.category?.name || product.category || '',
      stock: '', // Product model doesn't have stock
      images: product.images || [],
      status: product.status || 'pending_approval',
      sku: product.sku || '',
      weight: product.weight?.value || '',
      dimensions: product.dimensions || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      stock: '',
      images: [],
      status: 'active',
      sku: '',
      weight: '',
      dimensions: ''
    });
    setEditingProduct(null);
    setModalMode('add');
    setSelectedProductForSelection(null);
    setSelectionData({
      productId: '',
      stock: '',
      notes: ''
    });
    setAvailableSearchTerm('');
    setAvailablePage(1);
  };

  // Reset to page 1 when search or filters change
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value) => {
    setFilterStatus(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value) => {
    setFilterCategory(value);
    setCurrentPage(1);
  };

  // Products are already filtered and paginated by the API
  // No need for client-side filtering
  const currentProducts = products;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'inactive':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'out_of_stock':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      out_of_stock: 'bg-yellow-100 text-yellow-800'
    };

    const labels = {
      active: 'Active',
      inactive: 'Inactive',
      out_of_stock: 'Out of Stock'
    };

    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your product inventory and listings
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <button
            onClick={handleOpenSelectProduct}
            className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
          >
            <CheckCircleIcon className="h-4 w-4 mr-2" />
            Select Product
          </button>
          <button
            onClick={() => {
              setModalMode('add');
              setShowModal(true);
            }}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <MagnifyingGlassIcon className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400 pl-3" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="block w-full rounded-lg border-gray-300 pl-10 py-2 focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="rounded-lg border-gray-300 py-2 px-3 focus:border-blue-500 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="rounded-lg border-gray-300 py-2 px-3 focus:border-blue-500 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          {/* More Filters Button */}
          <button className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <FunnelIcon className="h-4 w-4 mr-1.5" />
            More Filters
          </button>

          {/* View Toggle Buttons */}
          <div className="ml-auto inline-flex rounded-lg border border-gray-300 bg-white p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <TableCellsIcon className="h-4 w-4 mr-1.5" />
              List
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'cards'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Squares2X2Icon className="h-4 w-4 mr-1.5" />
              Cards
            </button>
          </div>
        </div>
      </div>

      {/* Products View - List or Cards */}
      {viewMode === 'list' ? (
        /* List View - Table */
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approval
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentProducts.map((product) => {
                  // Product model structure from /vendor/products endpoint
                  const price = product.pricing?.sellingPrice || 0;
                  const approvalStatus = product.approvalStatus?.status || 'pending';

                  return (
                  <tr key={product._id || product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          {product.images && product.images.length > 0 ? (
                            <img
                              className="h-12 w-12 rounded-lg object-cover"
                              src={product.images[0]?.url || product.images[0]}
                              alt={product.images[0]?.altText || product.name}
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                              <PhotoIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{product.sku || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <TagIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {product.category?.name || product.category || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CubeIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-500">N/A</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(product.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        approvalStatus === 'approved' ? 'bg-green-100 text-green-800' :
                        approvalStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {approvalStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product._id || product.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{totalProducts > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span>
                  {' '}to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, totalProducts)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{totalProducts}</span>
                  {' '}results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Card View - Grid */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentProducts.map((product) => {
              // Product model structure from /vendor/products endpoint
              const price = product.pricing?.sellingPrice || 0;
              const approvalStatus = product.approvalStatus?.status || 'pending';

              return (
                <div key={product._id || product.id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Product Image */}
                  <div className="relative h-48 bg-gray-100">
                    {product.images && product.images.length > 0 ? (
                      <img
                        className="w-full h-full object-cover"
                        src={product.images[0]?.url || product.images[0]}
                        alt={product.images[0]?.altText || product.name}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PhotoIcon className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      {getStatusBadge(product.status)}
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="p-4">
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name || 'N/A'}</h3>
                      <p className="text-sm text-gray-500">{product.sku || 'N/A'}</p>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center text-gray-600">
                          <TagIcon className="h-4 w-4 mr-1.5" />
                          {product.category?.name || product.category || 'N/A'}
                        </span>
                        <span className="text-lg font-bold text-gray-900">₹{price}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center text-gray-600">
                          <CubeIcon className="h-4 w-4 mr-1.5" />
                          Stock:
                        </span>
                        <span className="text-sm text-gray-500">N/A</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Approval:</span>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          approvalStatus === 'approved' ? 'bg-green-100 text-green-800' :
                          approvalStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {approvalStatus}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => handleEdit(product)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <PencilIcon className="h-4 w-4 mr-1.5" />
                        Edit
                      </button>
                      <button
                        className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product._id || product.id)}
                        className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-red-600 bg-white hover:bg-red-50"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination for Card View */}
          <div className="bg-white shadow rounded-lg px-4 py-3 flex items-center justify-between sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{totalProducts > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span>
                  {' '}to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, totalProducts)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{totalProducts}</span>
                  {' '}results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit/Select Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 py-8">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)}></div>

            <div className={`relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all w-full ${modalMode === 'select' ? 'max-w-4xl' : 'max-w-4xl'}`}>
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {modalMode === 'select' ? 'Select Product' : editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h3>

                  {modalMode === 'select' ? (
                    <div className="space-y-4">
                      {/* Search Available Products */}
                      <div className="relative">
                        <MagnifyingGlassIcon className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400 pl-3" />
                        <input
                          type="text"
                          placeholder="Search available products..."
                          value={availableSearchTerm}
                          onChange={(e) => {
                            setAvailableSearchTerm(e.target.value);
                            setAvailablePage(1);
                          }}
                          className="block w-full rounded-lg border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>

                      {/* Available Products List */}
                      <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                        {availableProductsLoading ? (
                          <div className="flex flex-col items-center justify-center h-32 space-y-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="text-sm text-gray-500">Loading available products...</p>
                          </div>
                        ) : error ? (
                          <div className="text-center py-8 px-4">
                            <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-3" />
                            <p className="text-sm text-red-600 font-medium">{error}</p>
                            <button
                              type="button"
                              onClick={() => fetchAvailableProducts()}
                              className="mt-3 text-sm text-blue-600 hover:text-blue-700"
                            >
                              Try again
                            </button>
                          </div>
                        ) : availableProducts.length === 0 ? (
                          <div className="text-center py-8 px-4">
                            <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-sm text-gray-500 font-medium">No available products found</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {availableSearchTerm
                                ? 'Try adjusting your search terms'
                                : 'All approved products have been added to your inventory'}
                            </p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-200">
                            {availableProducts.map((product) => (
                              <div
                                key={product._id || product.id}
                                onClick={() => setSelectedProductForSelection(product)}
                                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                                  selectedProductForSelection?._id === product._id || selectedProductForSelection?.id === product.id
                                    ? 'bg-blue-50 border-l-4 border-blue-500'
                                    : ''
                                }`}
                              >
                                <div className="flex items-start space-x-4">
                                  <div className="flex-shrink-0">
                                    {product.images && product.images.length > 0 ? (
                                      <img
                                        className="h-16 w-16 rounded-lg object-cover"
                                        src={product.images[0]?.url || product.images[0]}
                                        alt={product.images[0]?.altText || product.name}
                                      />
                                    ) : (
                                      <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center">
                                        <PhotoIcon className="h-8 w-8 text-gray-400" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                                    <p className="text-sm text-gray-500 truncate">{product.description}</p>
                                    <div className="mt-2 flex items-center space-x-4 text-sm">
                                      <span className="text-gray-600">
                                        <TagIcon className="inline h-4 w-4 mr-1" />
                                        {product.category?.name || product.category || 'N/A'}
                                      </span>
                                      <span className="text-gray-600">SKU: {product.sku}</span>
                                    </div>
                                  </div>
                                  <div className="flex-shrink-0">
                                    {selectedProductForSelection?._id === product._id || selectedProductForSelection?.id === product.id ? (
                                      <CheckCircleIcon className="h-6 w-6 text-blue-600" />
                                    ) : (
                                      <div className="h-6 w-6 rounded-full border-2 border-gray-300"></div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Pagination for Available Products */}
                      {availableTotalPages > 1 && (
                        <div className="flex justify-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setAvailablePage(Math.max(1, availablePage - 1))}
                            disabled={availablePage === 1}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                          >
                            Previous
                          </button>
                          <span className="px-3 py-1 text-sm text-gray-700">
                            Page {availablePage} of {availableTotalPages}
                          </span>
                          <button
                            type="button"
                            onClick={() => setAvailablePage(Math.min(availableTotalPages, availablePage + 1))}
                            disabled={availablePage === availableTotalPages}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                          >
                            Next
                          </button>
                        </div>
                      )}

                      {/* Stock and Notes Form */}
                      {selectedProductForSelection && (
                        <div className="border-t border-gray-200 pt-4 space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Initial Stock</label>
                            <input
                              type="number"
                              required
                              min="0"
                              value={selectionData.stock}
                              onChange={(e) => setSelectionData({...selectionData, stock: e.target.value})}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              placeholder="Enter initial stock quantity"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                            <textarea
                              rows={3}
                              value={selectionData.notes}
                              onChange={(e) => setSelectionData({...selectionData, notes: e.target.value})}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              placeholder="Add any notes about this product..."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {/* Essential Information Section */}
                      <div className="bg-white border border-gray-200 rounded-lg p-5">
                        <div className="flex items-start mb-5">
                          <div className="bg-green-600 rounded-lg p-2 mr-3">
                            <CubeIcon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-gray-900">Essential Information</h3>
                            <p className="text-sm text-gray-500 mt-0.5">Required fields to create your product</p>
                          </div>
                        </div>

                        <div className="space-y-5">
                          {/* Product Name */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Product Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.name}
                              onChange={(e) => setFormData({...formData, name: e.target.value})}
                              className="block w-full px-4 py-2.5 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                              placeholder="Enter product name"
                            />
                          </div>

                          {/* SKU (Auto-generated option) */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              SKU <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-3">
                              <input
                                type="text"
                                required
                                value={formData.sku}
                                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                                className="block w-full px-4 py-2.5 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                                placeholder="e.g., APL-ORG-001"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const randomSKU = `SKU-${Date.now().toString().slice(-6)}`;
                                  setFormData({...formData, sku: randomSKU});
                                }}
                                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 whitespace-nowrap transition-colors"
                              >
                                Auto
                              </button>
                            </div>
                          </div>

                          {/* Weight and Unit */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Weight</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.weight}
                                onChange={(e) => setFormData({...formData, weight: e.target.value})}
                                className="block w-full px-4 py-2.5 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                              <select className="block w-full px-4 py-2.5 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm bg-gray-50" disabled>
                                <option>kg</option>
                              </select>
                            </div>
                          </div>

                          {/* Category and Selling Price */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Category <span className="text-red-500">*</span>
                              </label>
                              <select
                                required
                                value={formData.category}
                                onChange={(e) => setFormData({...formData, category: e.target.value})}
                                className="block w-full px-4 py-2.5 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                              >
                                <option value="">Select category</option>
                                {categories.map(category => (
                                  <option key={category} value={category}>{category}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Selling Price (₹) <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 text-sm font-medium">₹</span>
                                <input
                                  type="number"
                                  required
                                  min="0"
                                  step="0.01"
                                  value={formData.price}
                                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                                  className="block w-full pl-9 pr-4 py-2.5 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Product Description */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Product Description</label>
                            <textarea
                              rows={3}
                              value={formData.description}
                              onChange={(e) => setFormData({...formData, description: e.target.value})}
                              className="block w-full px-4 py-2.5 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm resize-none"
                              placeholder="Brief description of your product..."
                            />
                          </div>
                        </div>
                      </div>

                      {/* Info Note */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mt-0.5">
                            <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-3">
                            <h4 className="text-sm font-semibold text-blue-900">Approval Process</h4>
                            <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                              Your product will be submitted for approval by the admin. Once approved, you can select it and add inventory through "Select Product" to start selling.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Progress Indicator */}
                      <div className="flex items-center justify-start">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          Essential: {formData.name && formData.sku && formData.category && formData.price ? '100%' : '0%'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white px-6 py-4 flex items-center justify-between border-t border-gray-200">
                  <div className="flex items-center text-xs text-gray-500">
                    {modalMode === 'add' && (
                      <span className="inline-flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${
                          formData.name && formData.sku && formData.category && formData.price ? 'bg-green-500' : 'bg-yellow-500'
                        }`}></span>
                        <span className="font-medium">Essential: {formData.name && formData.sku && formData.category && formData.price ? '100%' : '0%'}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
                      className="inline-flex justify-center items-center rounded-md border border-gray-300 px-5 py-2.5 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={modalMode === 'select' && !selectedProductForSelection}
                      className="inline-flex justify-center items-center rounded-md px-6 py-2.5 bg-green-600 text-sm font-semibold text-white hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {modalMode === 'select' ? 'Select Product' : editingProduct ? 'Update Product' : 'Save Product'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
