// Product API utilities for vendor portal
import { auth } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.lalajistore.com/api';

// Helper function to make authenticated requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  // Get token from auth service
  const token = auth.getToken();

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  };

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    // Handle token expiration
    if (response.status === 401) {
      auth.logout();
      window.location.href = '/login';
      return;
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};

// Get MY vendor products using authenticated user (my-products endpoint)
// This endpoint automatically gets vendor ID from req.user.id (JWT token)
// Backend response structure: { success: true, count, total, pagination: { page, pages }, data: [...vendorProducts] }
// Supports: page, limit, status, search
export const getMyVendorProducts = async (params = {}) => {
  console.log('getMyVendorProducts called with params:', params);

  const filteredParams = Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      acc[key] = value;
    }
    return acc;
  }, {});

  const queryString = new URLSearchParams(filteredParams).toString();
  const endpoint = `/vendor-products/my-products${queryString ? `?${queryString}` : ''}`;

  console.log('Fetching from endpoint:', endpoint);

  const response = await apiRequest(endpoint);

  console.log('API Response:', response);

  return response;
};

// Get products by vendor ID (VendorProduct model) - requires vendorId parameter
// Backend response structure: { success: true, count, total, pagination: { page, pages }, data: [...vendorProducts] }
export const getProductsByVendor = async (vendorId, params = {}) => {
  console.log('getProductsByVendor called with vendorId:', vendorId, 'params:', params);

  const filteredParams = Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      acc[key] = value;
    }
    return acc;
  }, {});

  const queryString = new URLSearchParams(filteredParams).toString();
  const endpoint = `/vendor-products/vendor/${vendorId}${queryString ? `?${queryString}` : ''}`;

  console.log('Fetching from endpoint:', endpoint);

  const response = await apiRequest(endpoint);

  console.log('API Response:', response);

  return response;
};

// Get single product by ID
export const getProduct = async (id) => {
  return apiRequest(`/vendor/products/${id}`);
};

// Add new product
export const addProduct = async (productData) => {
  console.log('addProduct called with:', productData);

  // Transform frontend data to backend format with nested objects
  const backendData = {
    name: productData.name,
    description: productData.description,
    shortDescription: productData.shortDescription,
    sku: productData.sku,
    category: productData.category,
    subcategory: productData.subcategory,
    status: productData.status,
    dimensions: productData.dimensions,

    // Pricing nested object
    'pricing[sellingPrice]': productData.price ? parseFloat(productData.price) : undefined,
    'pricing[costPrice]': productData.costPrice ? parseFloat(productData.costPrice) : undefined,
    'pricing[suggestedMRP]': productData.suggestedMRP ? parseFloat(productData.suggestedMRP) : undefined,
    'pricing[minSellingPrice]': productData.minSellingPrice ? parseFloat(productData.minSellingPrice) : undefined,

    // Weight nested object
    'weight[value]': productData.weight ? parseFloat(productData.weight) : undefined,
    'weight[unit]': productData.weightUnit || 'kg',

    // Additional details
    manufacturingDate: productData.manufacturingDate,
    expiryDate: productData.expiryDate,
    perishable: productData.perishable,

    // Nutritional info
    calories: productData.calories,
    protein: productData.protein,
    carbohydrates: productData.carbohydrates,
    fat: productData.fat,
    fiber: productData.fiber,
    sugar: productData.sugar,
    sodium: productData.sodium,

    // SEO
    seoTitle: productData.seoTitle,
    seoDescription: productData.seoDescription,

    // Tags and ingredients (if arrays)
    tags: productData.tags,
    ingredients: productData.ingredients
  };

  // Remove undefined, null, and empty string values
  Object.keys(backendData).forEach(key => {
    if (backendData[key] === undefined || backendData[key] === null || backendData[key] === '') {
      delete backendData[key];
    }
  });

  console.log('Sending to backend:', backendData);

  const response = await apiRequest('/vendor/products', {
    method: 'POST',
    body: JSON.stringify(backendData),
  });

  console.log('addProduct response:', response);
  return response;
};

// Update existing product
export const updateProduct = async (id, productData) => {
  return apiRequest(`/vendor/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(productData),
  });
};

// Delete product
export const deleteProduct = async (id) => {
  return apiRequest(`/vendor/products/${id}`, {
    method: 'DELETE',
  });
};

// Get available products for vendor to select (products not yet added to vendor's inventory)
// Backend response structure: { success: true, count, total, pagination: { page, pages }, data: [...products] }
// Get all approved products with vendor selection status
export const getAvailableProducts = async (params = {}) => {
  console.log('getAvailableProducts called with params:', params);

  const filteredParams = Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      acc[key] = value;
    }
    return acc;
  }, {});

  const queryString = new URLSearchParams(filteredParams).toString();
  
  try {
    // First try the vendor-products/available endpoint
    const vendorEndpoint = `/vendor-products/available${queryString ? `?${queryString}` : ''}`;
    console.log('Fetching from vendor endpoint:', vendorEndpoint);
    
    const vendorResponse = await apiRequest(vendorEndpoint);
    console.log('Vendor API Response:', vendorResponse);
    
    // If we got products from vendor endpoint, return them
    if (vendorResponse?.success && vendorResponse?.data && vendorResponse.data.length > 0) {
      return vendorResponse;
    }
    
    // If no products from vendor endpoint, try general products endpoint
    console.log('No products from vendor endpoint, trying general products endpoint...');
    const generalEndpoint = `/products${queryString ? `?${queryString}` : ''}`;
    console.log('Fetching from general endpoint:', generalEndpoint);
    
    const generalResponse = await apiRequest(generalEndpoint);
    console.log('General API Response:', generalResponse);
    console.log('General response data structure:', {
      hasData: !!generalResponse?.data,
      dataType: typeof generalResponse?.data,
      isArray: Array.isArray(generalResponse?.data),
      hasProducts: !!(generalResponse?.data?.products),
      productsType: typeof generalResponse?.data?.products,
      productsIsArray: Array.isArray(generalResponse?.data?.products)
    });
    
    if (generalResponse?.success && generalResponse?.data) {
      // Get vendor's selected products to mark them as selected
      let selectedProductIds = new Set();
      let vendorProductMap = new Map(); // Map product ID to vendor product ID
      try {
        const selectedResponse = await apiRequest('/vendor-products/my-products?limit=1000');
        if (selectedResponse?.data) {
          selectedResponse.data.forEach(vp => {
            const productId = vp.product?._id || vp.product;
            if (productId) {
              selectedProductIds.add(productId);
              vendorProductMap.set(productId, vp._id); // Store vendor product ID
            }
          });
        }
        console.log('Found selected product IDs:', Array.from(selectedProductIds));
        console.log('Vendor product mapping:', Array.from(vendorProductMap.entries()));
      } catch (selectedError) {
        console.warn('Could not fetch selected products:', selectedError.message);
        // Continue without selected products info
      }
      
      // Handle different response structures for general products
      let productsArray = [];
      if (Array.isArray(generalResponse.data)) {
        productsArray = generalResponse.data;
      } else if (generalResponse.data.products && Array.isArray(generalResponse.data.products)) {
        productsArray = generalResponse.data.products;
      } else {
        console.log('Unexpected general response structure:', generalResponse.data);
        productsArray = [];
      }
      
      console.log('Products array length:', productsArray.length);
      
      // Add selection status to products
      const productsWithStatus = productsArray.map(product => ({
        ...product,
        isSelectedByVendor: selectedProductIds.has(product._id),
        vendorProductId: vendorProductMap.get(product._id) // Include vendor product ID for removal
      }));
      
      return {
        ...generalResponse,
        data: productsWithStatus
      };
    }
    
    return vendorResponse || generalResponse;
    
  } catch (error) {
    console.error('Error in getAvailableProducts:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // If both endpoints fail, return a proper error response
    return {
      success: false,
      error: error.message || 'Failed to fetch products',
      data: [],
      pagination: { page: 1, pages: 0 }
    };
  }
};

// Select product (add to vendor's inventory)
// Requires: productId, stock, notes (optional)
// Response: { success: true, data: vendorProduct, message: '...' }
export const selectProduct = async (productData) => {
  console.log('selectProduct called with data:', productData);

  const response = await apiRequest('/vendor-products/select', {
    method: 'POST',
    body: JSON.stringify(productData),
  });

  console.log('selectProduct response:', response);

  return response;
};

// Remove product from vendor's inventory
// Requires: vendorProductId (not the regular product ID)
// Response: { success: true, message: '...' }
export const removeProduct = async (vendorProductId) => {
  console.log('removeProduct called with vendorProductId:', vendorProductId);

  const response = await apiRequest(`/vendor-products/${vendorProductId}`, {
    method: 'DELETE'
  });

  console.log('Remove product response:', response);

  return response;
};

// Utility functions
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Get vendor submitted products (products submitted by vendor for approval)
export const getVendorSubmittedProducts = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add pagination
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    
    // Add search
    if (params.search) queryParams.append('search', params.search);
    
    // Add category filter
    if (params.category && params.category !== 'all') {
      queryParams.append('category', params.category);
    }

    const queryString = queryParams.toString();
    const endpoint = `/products/vendor/my-submissions${queryString ? `?${queryString}` : ''}`;
    
    console.log('getVendorSubmittedProducts - Making API call to:', endpoint);
    
    const response = await apiRequest(endpoint);
    console.log('getVendorSubmittedProducts - API Response:', response);
    
    return response;
  } catch (error) {
    console.error('getVendorSubmittedProducts - Error:', error);
    throw error;
  }
};

export default {
  getMyVendorProducts,
  getProductsByVendor,
  getProduct,
  addProduct,
  updateProduct,
  deleteProduct,
  getAvailableProducts,
  selectProduct,
  removeProduct,
  getVendorSubmittedProducts,
  formatCurrency,
  formatDate,
  formatDateTime,
};
