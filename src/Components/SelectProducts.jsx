import { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  CheckCircleIcon,
  TagIcon,
  CubeIcon,
  ShoppingCartIcon,
  StarIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { getAvailableProducts, selectProduct } from '../utils/product';
import { getCategories, getSubcategories } from '../utils/category';
import { auth } from '../utils/auth';

// Custom Dropdown Component
const CustomDropdown = ({ 
  label, 
  value, 
  onChange, 
  options, 
  placeholder = "Select", 
  required = false,
  className = "",
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(option => option.value === value);

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`}>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className="block w-full px-3 py-2 text-sm text-left rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <span className={selectedOption ? "text-gray-900" : "text-gray-500"}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </button>

        {isOpen && !disabled && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
            {options.length > 5 && (
              <div className="p-2 border-b border-gray-200">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}
            
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                      value === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                    }`}
                  >
                    {option.label}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500">No options found</div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

const SelectProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterSubcategory, setFilterSubcategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [itemsPerPage] = useState(12);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState(null);
  const [selectionData, setSelectionData] = useState({
    stock: '',
    notes: ''
  });
  const [selectingProduct, setSelectingProduct] = useState(null);

  // Dropdown options
  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...categories.map(category => ({
      value: category._id || category.id,
      label: category.name
    }))
  ];

  const subcategoryOptions = [
    { value: 'all', label: 'All Subcategories' },
    ...subcategories.map(subcategory => ({
      value: subcategory._id || subcategory.id,
      label: subcategory.name
    }))
  ];

  // Fetch available products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        category: filterCategory !== 'all' ? filterCategory : undefined,
        subcategory: filterSubcategory !== 'all' ? filterSubcategory : undefined
        // Note: Backend controller already filters for approved products
      };

      console.log('Fetching available products with params:', params);
      const response = await getAvailableProducts(params);
      console.log('Available products response:', response);
      if (response?.success && response?.data) {
        setProducts(response.data);
        setTotalPages(response.pagination?.pages || 1);
      } else {
        setProducts([]);
        setTotalPages(1);
        setError('No products available at the moment');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again.');
      setProducts([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await getCategories();
      if (response?.success && response?.data) {
        setCategories(response.data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // Fetch subcategories when category changes
  const fetchSubcategories = async (categoryId) => {
    try {
      if (!categoryId || categoryId === 'all') {
        setSubcategories([]);
        return;
      }
      const response = await getSubcategories(categoryId);
      if (response?.success && response?.data) {
        setSubcategories(response.data);
      }
    } catch (err) {
      console.error('Error fetching subcategories:', err);
      setSubcategories([]);
    }
  };

  // Handle product selection
  const handleSelectProduct = async (product, stock, notes = '') => {
    try {
      setSelectingProduct(product._id);
      setError(null);
      setSuccess(null);

      await selectProduct({
        productId: product._id,
        stock: parseInt(stock),
        notes: notes
      });

      setSuccess(`Successfully added "${product.name}" to your inventory!`);
      setSelectedProducts(prev => new Set([...prev, product._id]));
      setShowSelectionModal(false);
      setSelectedProductForModal(null);
      setSelectionData({ stock: '', notes: '' });
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error selecting product:', err);
      setError(err.message || 'Failed to add product to inventory');
    } finally {
      setSelectingProduct(null);
    }
  };

  // Open selection modal
  const openSelectionModal = (product) => {
    setSelectedProductForModal(product);
    setSelectionData({ stock: '', notes: '' });
    setShowSelectionModal(true);
  };

  // Handle search change
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Handle category change
  const handleCategoryChange = (value) => {
    setFilterCategory(value);
    setFilterSubcategory('all');
    setCurrentPage(1);
    fetchSubcategories(value);
  };

  // Handle subcategory change
  const handleSubcategoryChange = (value) => {
    setFilterSubcategory(value);
    setCurrentPage(1);
  };

  // Effects
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchProducts();
    }, searchTerm ? 500 : 0);

    return () => clearTimeout(debounceTimer);
  }, [currentPage, searchTerm, filterCategory, filterSubcategory]);

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Get product image
  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    return '/api/placeholder/300/300';
  };

  if (loading && currentPage === 1) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header - Compact */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Select Products</h1>
          <p className="mt-0.5 text-xs text-gray-500">
            Choose from approved products on Lalaji platform to add to your inventory
          </p>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="rounded-md bg-green-50 p-3">
          <div className="flex">
            <CheckCircleIcon className="h-4 w-4 text-green-400" />
            <div className="ml-2">
              <p className="text-xs font-medium text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-3">
          <div className="flex">
            <div className="ml-2">
              <p className="text-xs font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters - Compact */}
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          {/* Search */}
          <div className="md:col-span-2">
            <label htmlFor="search" className="block text-xs font-medium text-gray-700 mb-1">
              Search Products
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                id="search"
                placeholder="Search by name, brand, or description..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="block w-full rounded-md border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <CustomDropdown
              label="Category"
              value={filterCategory}
              onChange={handleCategoryChange}
              options={categoryOptions}
              placeholder="All Categories"
            />
          </div>

          {/* Subcategory Filter */}
          <div>
            <CustomDropdown
              label="Subcategory"
              value={filterSubcategory}
              onChange={handleSubcategoryChange}
              options={subcategoryOptions}
              placeholder="All Subcategories"
              disabled={filterCategory === 'all' || subcategories.length === 0}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Showing {products.length} available products
          </div>
          <div className="text-xs text-gray-500">
            {selectedProducts.size} products added to inventory
          </div>
        </div>
      </div>

      {/* Products Grid - Compact */}
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        {loading ? (
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8">
            <CubeIcon className="mx-auto h-10 w-10 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-xs text-gray-500">
              Try adjusting your search criteria or check back later for new products.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200"
                >
                  {/* Product Image */}
                  <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-t-lg bg-gray-50">
                    <img
                      src={getProductImage(product)}
                      alt={product.name}
                      className="h-32 w-full object-cover object-center"
                      onError={(e) => {
                        e.target.src = '/api/placeholder/300/300';
                      }}
                    />
                  </div>

                  {/* Product Info */}
                  <div className="p-3">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                        {product.name}
                      </h3>
                      {selectedProducts.has(product._id) && (
                        <CheckCircleIcon className="h-4 w-4 text-green-500 shrink-0 ml-1" />
                      )}
                    </div>

                    {/* Brand */}
                    {product.brand && (
                      <p className="text-xs text-gray-500 mb-1">{product.brand}</p>
                    )}

                    {/* Price */}
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatPrice(product.pricing?.basePrice || 0)}
                        </p>
                        {product.pricing?.discount?.percentage > 0 && (
                          <p className="text-xs text-gray-500 line-through">
                            {formatPrice((product.pricing.basePrice / (1 - product.pricing.discount.percentage / 100)))}
                          </p>
                        )}
                      </div>
                      {product.rating && (
                        <div className="flex items-center">
                          <StarIcon className="h-3 w-3 text-yellow-400 fill-current" />
                          <span className="text-xs text-gray-600 ml-1">{product.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    {/* Category */}
                    {product.category?.name && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-2">
                        {product.category.name}
                      </span>
                    )}

                    {/* Action Button */}
                    <button
                      onClick={() => openSelectionModal(product)}
                      disabled={selectedProducts.has(product._id) || selectingProduct === product._id}
                      className={`w-full inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md transition-colors duration-200 ${
                        selectedProducts.has(product._id)
                          ? 'bg-green-100 text-green-800 cursor-not-allowed'
                          : selectingProduct === product._id
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {selectingProduct === product._id ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                          Adding...
                        </>
                      ) : selectedProducts.has(product._id) ? (
                        <>
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Added
                        </>
                      ) : (
                        <>
                          <ShoppingCartIcon className="h-3 w-3 mr-1" />
                          Add to Inventory
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination - Compact */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                    className="relative inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage >= totalPages}
                    className="ml-3 relative inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs text-gray-700">
                      Page <span className="font-medium">{currentPage}</span> of{' '}
                      <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage <= 1}
                        className="relative inline-flex items-center px-2 py-1.5 rounded-l-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeftIcon className="h-3 w-3" />
                      </button>
                      {[...Array(Math.min(5, totalPages))].map((_, index) => {
                        const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + index;
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-3 py-1.5 border text-xs font-medium ${
                              page === currentPage
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage >= totalPages}
                        className="relative inline-flex items-center px-2 py-1.5 rounded-r-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRightIcon className="h-3 w-3" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Selection Modal - Compact */}
      {showSelectionModal && selectedProductForModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-4 border w-80 shadow-lg rounded-md bg-white">
            <div className="mt-2">
              <h3 className="text-base font-medium text-gray-900 mb-3">
                Add Product to Inventory
              </h3>
              
              <div className="mb-3">
                <img
                  src={getProductImage(selectedProductForModal)}
                  alt={selectedProductForModal.name}
                  className="w-16 h-16 object-cover rounded-md mx-auto"
                  onError={(e) => {
                    e.target.src = '/api/placeholder/100/100';
                  }}
                />
                <h4 className="text-center mt-2 text-sm font-medium">{selectedProductForModal.name}</h4>
                <p className="text-center text-xs text-gray-600">{formatPrice(selectedProductForModal.pricing?.basePrice || 0)}</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label htmlFor="stock" className="block text-xs font-medium text-gray-700 mb-1">
                    Initial Stock Quantity *
                  </label>
                  <input
                    type="number"
                    id="stock"
                    min="1"
                    value={selectionData.stock}
                    onChange={(e) => setSelectionData({ ...selectionData, stock: e.target.value })}
                    className="block w-full rounded-md border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter quantity"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="notes" className="block text-xs font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    id="notes"
                    rows={2}
                    value={selectionData.notes}
                    onChange={(e) => setSelectionData({ ...selectionData, notes: e.target.value })}
                    className="block w-full rounded-md border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 mt-4">
                <button
                  onClick={() => {
                    setShowSelectionModal(false);
                    setSelectedProductForModal(null);
                    setSelectionData({ stock: '', notes: '' });
                  }}
                  className="px-3 py-1.5 bg-gray-300 text-gray-700 text-xs rounded-md hover:bg-gray-400 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSelectProduct(selectedProductForModal, selectionData.stock, selectionData.notes)}
                  disabled={!selectionData.stock || parseInt(selectionData.stock) < 1}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Add to Inventory
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectProducts;
