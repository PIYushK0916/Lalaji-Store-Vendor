import { useState, useEffect } from 'react';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BanknotesIcon,
  CubeIcon,
  CurrencyRupeeIcon,
  ShoppingCartIcon,
  TruckIcon,
  WalletIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  DocumentCheckIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { dashboardService } from '../utils/dashboard';
import { auth } from '../utils/auth';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('revenue');
  const [user, setUser] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('pending');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get user verification status first
        const currentUser = auth.getUser();
        setUser(currentUser);
        
        // Check verification status
        const userIsVerified = currentUser?.vendorInfo?.isVerified || false;
        const userVerificationStatus = currentUser?.vendorInfo?.verificationStatus || 'pending';
        
        setIsVerified(userIsVerified);
        setVerificationStatus(userVerificationStatus);
        
        // Only fetch dashboard data if user is verified
        if (userIsVerified) {
          // Fetch dashboard data, analytics, and recent orders
          const [dashData, analyticsResponse, ordersResponse] = await Promise.all([
            dashboardService.getDashboardData(),
            dashboardService.getAnalytics(7), // Get 7 days analytics for charts
            dashboardService.getVendorOrders({ limit: 5, sort: '-createdAt' }) // Get recent 5 orders
          ]);
          
          setDashboardData(dashData.data);
          setAnalyticsData(analyticsResponse.data);
          setRecentOrders(ordersResponse.data?.orders || []);
        }
      } catch (err) {
        setError(err.message);
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">Error loading dashboard: {error}</div>
      </div>
    );
  }

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMins < 60) {
      return `${diffInMins} mins ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      return `${diffInDays} days ago`;
    }
  };

  // Calculate percentage change (mock calculation for now)
  const calculateChange = (current, previous) => {
    if (!previous || previous === 0) return '+0%';
    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  // Build stats from API data
  const stats = dashboardData ? [
    {
      name: 'Total Products',
      value: dashboardData.stats?.totalProducts?.toString() || '0',
      change: dashboardData.stats?.activeProducts ? 
        `${dashboardData.stats.activeProducts} active` : '0 active',
      changeType: 'neutral',
      icon: CubeIcon,
      color: 'blue'
    },
    {
      name: 'Today Orders',
      value: dashboardData.stats?.todayOrders?.toString() || '0',
      change: dashboardData.stats?.pendingOrders ? 
        `${dashboardData.stats.pendingOrders} pending` : '0 pending',
      changeType: dashboardData.stats?.todayOrders > 0 ? 'increase' : 'neutral',
      icon: ShoppingCartIcon,
      color: 'green'
    },
    {
      name: 'Today Revenue',
      value: formatCurrency(dashboardData.stats?.todayRevenue || 0),
      change: '+Today',
      changeType: dashboardData.stats?.todayRevenue > 0 ? 'increase' : 'neutral',
      icon: CurrencyRupeeIcon,
      color: 'purple'
    },
    {
      name: 'Low Stock Alert',
      value: dashboardData.stats?.lowStockProducts?.toString() || '0',
      change: 'Products',
      changeType: dashboardData.stats?.lowStockProducts > 0 ? 'decrease' : 'neutral',
      icon: ExclamationTriangleIcon,
      color: 'orange'
    }
  ] : [];

  // Build charts data from analytics
  const revenueData = analyticsData?.salesData?.map(item => ({
    name: new Date(item._id.date).toLocaleDateString('en-US', { weekday: 'short' }),
    revenue: item.revenue || 0,
    orders: item.orders || 0,
    date: item._id.date
  })) || [];

  // Top products from API data
  const topProducts = dashboardData?.topProducts?.map(product => ({
    name: product.name,
    sales: product.analytics?.totalSold || 0,
    revenue: formatCurrency(product.analytics?.totalRevenue || 0),
    stock: product.inventory?.stock || 0
  })) || [];

  // Order status distribution (derived from dashboard stats)
  const orderStatusData = dashboardData ? [
    { 
      name: 'Completed', 
      value: Math.max(0, (dashboardData.stats?.totalOrders || 0) - (dashboardData.stats?.pendingOrders || 0) - (dashboardData.stats?.todayOrders || 0)), 
      color: '#10B981' 
    },
    { 
      name: 'Processing', 
      value: dashboardData.stats?.todayOrders || 0, 
      color: '#3B82F6' 
    },
    { 
      name: 'Pending', 
      value: dashboardData.stats?.pendingOrders || 0, 
      color: '#F59E0B' 
    }
  ].filter(item => item.value > 0) : [];

  // Helper functions for order status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'processing':
      case 'confirmed':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'pending':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-green-100 text-green-800',
      processing: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Verification banner component
  const VerificationBanner = () => {
    if (isVerified) return null;

    const getVerificationMessage = () => {
      switch (verificationStatus) {
        case 'pending':
          return {
            title: 'Verification in Progress',
            message: 'Your account is under review. You can access Select Products to prepare your inventory.',
            icon: ClockIcon,
            bgColor: 'bg-yellow-50',
            borderColor: 'border-yellow-200',
            textColor: 'text-yellow-800',
            iconColor: 'text-yellow-600'
          };
        case 'rejected':
          return {
            title: 'Verification Required',
            message: 'Please complete your verification process to access all features.',
            icon: ExclamationTriangleIcon,
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200',
            textColor: 'text-red-800',
            iconColor: 'text-red-600'
          };
        default:
          return {
            title: 'Verification in Progress',
            message: 'Your account is under review. You can access Select Products to prepare your inventory.',
            icon: ClockIcon,
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            textColor: 'text-blue-800',
            iconColor: 'text-blue-600'
          };
      }
    };

    const verificationInfo = getVerificationMessage();
    const Icon = verificationInfo.icon;

    return (
      <div className={`${verificationInfo.bgColor} ${verificationInfo.borderColor} border rounded-lg p-4 mb-6`}>
        <div className="flex items-start">
          <div className="shrink-0">
            <Icon className={`h-6 w-6 ${verificationInfo.iconColor}`} />
          </div>
          <div className="ml-3 flex-1">
            <h3 className={`text-sm font-medium ${verificationInfo.textColor}`}>
              {verificationInfo.title}
            </h3>
            <p className={`mt-1 text-sm ${verificationInfo.textColor} opacity-90`}>
              {verificationInfo.message}
            </p>
            <div className="mt-3 flex space-x-3">
              <button 
                onClick={() => window.location.href = '/select-products'}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <CubeIcon className="h-4 w-4 mr-1" />
                Select Products
              </button>
              <button 
                onClick={() => window.location.href = '/profile'}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <DocumentCheckIcon className="h-4 w-4 mr-1" />
                View Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Locked feature component
  const LockedFeatureCard = ({ title, description, icon: Icon }) => (
    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
      <div className="flex justify-center items-center mb-3">
        <div className="relative">
          <Icon className="h-8 w-8 text-gray-400" />
          <LockClosedIcon className="h-4 w-4 text-gray-500 absolute -top-1 -right-1 bg-white rounded-full" />
        </div>
      </div>
      <h3 className="text-sm font-medium text-gray-700 mb-1">{title}</h3>
      <p className="text-xs text-gray-500">{description}</p>
      <div className="mt-3">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
          <ShieldCheckIcon className="h-3 w-3 mr-1" />
          Verification Required
        </span>
      </div>
    </div>
  );  return (
    <div className="space-y-4">
      {/* Verification Banner */}
      <VerificationBanner />

      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-0.5 text-xs text-gray-500">
            {isVerified 
              ? "Welcome back! Here's what's happening with your store today."
              : "Complete verification to access all features. You can start by selecting products."
            }
          </p>
        </div>
        <div className="mt-2 sm:mt-0">
          {isVerified ? (
            <button className="inline-flex items-center rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-500">
              <ChartBarIcon className="h-3 w-3 mr-1.5" />
              View Full Analytics
            </button>
          ) : (
            <button 
              onClick={() => window.location.href = '/select-products'}
              className="inline-flex items-center rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
            >
              <CubeIcon className="h-3 w-3 mr-1.5" />
              Select Products
            </button>
          )}
        </div>
      </div>

      {isVerified ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.name} className="bg-white overflow-hidden rounded-lg border border-zinc-200">
                <div className="p-3">
                  <div className="flex items-center">
                    <div className="shrink-0">
                      <div className={`h-8 w-8 rounded-lg bg-${stat.color}-100 flex items-center justify-center`}>
                        <stat.icon className={`h-4 w-4 text-${stat.color}-600`} />
                      </div>
                    </div>
                    <div className="ml-3 w-0 flex-1">
                      <dl>
                        <dt className="text-xs font-medium text-gray-500 truncate">
                          {stat.name}
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-lg font-semibold text-gray-900">
                            {stat.value}
                          </div>
                          <div className={`ml-2 flex items-baseline text-xs font-semibold ${
                            stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {stat.changeType === 'increase' ? (
                              <ArrowUpIcon className="h-3 w-3 mr-0.5" />
                            ) : (
                              <ArrowDownIcon className="h-3 w-3 mr-0.5" />
                            )}
                            {stat.change}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Revenue Chart */}
            <div className="bg-white p-4 rounded-lg border border-zinc-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-medium text-gray-900">Weekly Revenue</h3>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setActiveTab('revenue')}
                    className={`px-2 py-1 rounded-md text-xs ${
                      activeTab === 'revenue' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'
                    }`}
                  >
                    Revenue
                  </button>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`px-2 py-1 rounded-md text-xs ${
                      activeTab === 'orders' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'
                    }`}
                  >
                    Orders
                  </button>
                </div>
              </div>
              {revenueData && revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey={activeTab === 'revenue' ? 'revenue' : 'orders'} 
                      stroke="#3B82F6" 
                      fill="#3B82F6" 
                      fillOpacity={0.1} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-gray-500">
                  <p className="text-sm">No data available for the selected period</p>
                </div>
              )}
            </div>

            {/* Order Status Pie Chart */}
            <div className="bg-white p-4 rounded-lg border border-zinc-200">
              <h3 className="text-base font-medium text-gray-900 mb-3">Order Status Distribution</h3>
              {orderStatusData && orderStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-gray-500">
                  <p className="text-sm">No order data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Tables Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Products */}
            <div className="bg-white rounded-lg border border-zinc-200">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-base font-medium text-gray-900">Top Products</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {topProducts.map((product, index) => (
                  <div key={product.name} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="shrink-0 h-6 w-6 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">{index + 1}</span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.sales} sales</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{product.revenue}</p>
                      <p className="text-xs text-gray-500">Stock: {product.stock}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-lg border border-zinc-200">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-base font-medium text-gray-900">Recent Orders</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {recentOrders && recentOrders.length > 0 ? recentOrders.map((order) => (
                  <div key={order._id} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {getStatusIcon(order.status)}
                        <div className="ml-2">
                          <p className="text-sm font-medium text-gray-900">#{order.orderNumber || order._id?.slice(-6)}</p>
                          <p className="text-xs text-gray-500">{order.customer?.name || 'Customer'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(order.pricing?.total || 0)}</p>
                        <p className="text-xs text-gray-500">{order.items?.length || 0} items</p>
                      </div>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between">
                      {getStatusBadge(order.status)}
                      <span className="text-xs text-gray-500">{formatTimeAgo(order.createdAt)}</span>
                    </div>
                  </div>
                )) : (
                  <div className="px-4 py-6 text-center">
                    <p className="text-sm text-gray-500">No recent orders</p>
                  </div>
                )}
              </div>
              <div className="px-4 py-2 border-t border-gray-200">
                <button className="text-sm text-blue-600 hover:text-blue-500 font-medium">
                  View all orders →
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Locked Features Grid for Non-Verified Users */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white rounded-lg border border-zinc-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium text-gray-900">Available Now</h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircleIcon className="h-3 w-3 mr-1" />
                Access Granted
              </span>
            </div>
            <button 
              onClick={() => window.location.href = '/select-products'}
              className="w-full flex items-center justify-center gap-3 p-4 border-2 border-blue-200 border-dashed rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
            >
              <CubeIcon className="h-8 w-8 text-blue-600" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700">Select Products</p>
                <p className="text-xs text-gray-500">Choose products for your store</p>
              </div>
            </button>
          </div>

          <LockedFeatureCard
            title="Orders Management"
            description="View and manage customer orders"
            icon={ShoppingCartIcon}
          />
          
          <LockedFeatureCard
            title="Analytics & Reports"
            description="Track sales and performance"
            icon={ChartBarIcon}
          />
          
          <LockedFeatureCard
            title="Inventory Management"
            description="Manage stock and products"
            icon={CubeIcon}
          />
          
          <LockedFeatureCard
            title="Payments & Wallet"
            description="View earnings and transactions"
            icon={BanknotesIcon}
          />
          
          <LockedFeatureCard
            title="Delivery Team"
            description="Manage delivery personnel"
            icon={TruckIcon}
          />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
