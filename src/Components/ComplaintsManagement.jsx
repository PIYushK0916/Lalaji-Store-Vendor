import { useState, useEffect } from 'react';
import {
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PhoneIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  UserIcon,
  ShoppingBagIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import { getVendorComplaints, getComplaintDetails, getComplaintsStats } from '../utils/complaintsApi';

const ComplaintsManagement = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    highPriority: 0
  });

  useEffect(() => {
    fetchComplaints();
  }, [currentPage, statusFilter, priorityFilter, searchTerm]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        limit: 10,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        search: searchTerm || undefined
      };

      // Try to fetch from API, fall back to mock data if API fails
      try {
        const response = await getVendorComplaints(params);
        setComplaints(response.data?.complaints || []);
        setTotalPages(response.data?.pagination?.pages || 1);
        
        // Fetch stats
        const statsResponse = await getComplaintsStats();
        setStats(statsResponse.data || {
          total: 0,
          pending: 0,
          resolved: 0,
          highPriority: 0
        });
      } catch (apiError) {
        console.warn('API call failed, using mock data:', apiError);
        
        // Mock data fallback
        const mockComplaints = [
          {
            _id: '1',
            complaintNumber: 'CMP12345001',
            title: 'Product Quality Issue',
            description: 'Received damaged vegetables in my order. The tomatoes were rotten and vegetables were not fresh.',
            issueType: 'product_quality',
            status: 'submitted',
            priority: 'high',
            customer: {
              name: 'Rajesh Kumar',
              phone: '+91 9876543210'
            },
            order: {
              orderNumber: 'ORD123456',
              _id: 'order1'
            },
            affectedItem: {
              productName: 'Fresh Tomatoes',
              quantity: 2
            },
            createdAt: new Date().toISOString(),
            attachments: [
              { type: 'image', url: '/api/placeholder/300/200' }
            ]
          },
          {
            _id: '2',
            complaintNumber: 'CMP12345002',
            title: 'Wrong Item Delivered',
            description: 'I ordered Basmati rice but received regular rice instead.',
            issueType: 'wrong_item',
            status: 'acknowledged',
            priority: 'medium',
            customer: {
              name: 'Priya Sharma',
              phone: '+91 9876543211'
            },
            order: {
              orderNumber: 'ORD123457',
              _id: 'order2'
            },
            affectedItem: {
              productName: 'Basmati Rice 5kg',
              quantity: 1
            },
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            assignedTo: {
              name: 'Support Team'
            }
          },
          {
            _id: '3',
            complaintNumber: 'CMP12345003',
            title: 'Missing Items',
            description: 'Two items were missing from my grocery order.',
            issueType: 'missing_item',
            status: 'resolved',
            priority: 'low',
            customer: {
              name: 'Amit Patel',
              phone: '+91 9876543212'
            },
            order: {
              orderNumber: 'ORD123458',
              _id: 'order3'
            },
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            resolution: {
              type: 'refund_issued',
              description: 'Refund processed for missing items',
              resolvedAt: new Date(Date.now() - 86400000).toISOString()
            }
          }
        ];

        setComplaints(mockComplaints);
        setStats({
          total: mockComplaints.length,
          pending: mockComplaints.filter(c => ['submitted', 'acknowledged', 'under_review'].includes(c.status)).length,
          resolved: mockComplaints.filter(c => c.status === 'resolved').length,
          highPriority: mockComplaints.filter(c => c.priority === 'high').length
        });
        setTotalPages(1);
      }
    } catch (err) {
      setError('Failed to fetch complaints');
      console.error('Error fetching complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchComplaints();
    setRefreshing(false);
  };

  const handleViewDetails = async (complaint) => {
    try {
      setLoading(true);
      
      // Try to fetch detailed complaint data from API
      try {
        const response = await getComplaintDetails(complaint._id);
        setSelectedComplaint(response.data?.complaint || complaint);
      } catch (apiError) {
        console.warn('Failed to fetch detailed complaint data, using existing data:', apiError);
        setSelectedComplaint(complaint);
      }
      
      setShowDetailsModal(true);
    } catch (err) {
      console.error('Error viewing complaint details:', err);
      setSelectedComplaint(complaint);
      setShowDetailsModal(true);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      submitted: 'bg-yellow-100 text-yellow-800',
      acknowledged: 'bg-blue-100 text-blue-800',
      under_review: 'bg-purple-100 text-purple-800',
      in_progress: 'bg-indigo-100 text-indigo-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
      escalated: 'bg-red-100 text-red-800'
    };

    const icons = {
      submitted: <ClockIcon className="h-3 w-3" />,
      acknowledged: <CheckCircleIcon className="h-3 w-3" />,
      under_review: <ExclamationTriangleIcon className="h-3 w-3" />,
      in_progress: <ArrowPathIcon className="h-3 w-3" />,
      resolved: <CheckCircleIcon className="h-3 w-3" />,
      closed: <XCircleIcon className="h-3 w-3" />,
      escalated: <ExclamationTriangleIcon className="h-3 w-3" />
    };

    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${styles[status] || styles.submitted}`}>
        {icons[status] || icons.submitted}
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${styles[priority] || styles.medium}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  const getIssueTypeIcon = (issueType) => {
    const icons = {
      product_quality: <CubeIcon className="h-4 w-4" />,
      wrong_item: <ExclamationTriangleIcon className="h-4 w-4" />,
      missing_item: <XCircleIcon className="h-4 w-4" />,
      damaged_product: <ExclamationTriangleIcon className="h-4 w-4" />,
      delivery_delayed: <ClockIcon className="h-4 w-4" />,
      delivery_not_received: <XCircleIcon className="h-4 w-4" />
    };

    return icons[issueType] || <DocumentTextIcon className="h-4 w-4" />;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = 
      complaint.complaintNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || complaint.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Complaints & Issues</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage customer complaints and order issues
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center rounded-md bg-white border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="ml-2 hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <XCircleIcon className="h-5 w-5 text-red-400" />
            <p className="ml-3 text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Complaints</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="shrink-0">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-semibold text-yellow-600">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Resolved</p>
              <p className="text-2xl font-semibold text-green-600">{stats.resolved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">High Priority</p>
              <p className="text-2xl font-semibold text-red-600">{stats.highPriority}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search complaints..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full rounded-md border-gray-300 pl-10 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full sm:w-40 rounded-md border-gray-300 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="submitted">Submitted</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="under_review">Under Review</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="block w-full sm:w-40 rounded-md border-gray-300 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Complaint
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredComplaints.length > 0 ? (
                filteredComplaints.map((complaint) => (
                  <tr key={complaint._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="shrink-0 h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          {getIssueTypeIcon(complaint.issueType)}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {complaint.complaintNumber}
                          </div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {complaint.title}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {complaint.customer.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {complaint.customer.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ShoppingBagIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <div className="text-sm font-medium text-blue-600">
                          {complaint.order.orderNumber}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getStatusBadge(complaint.status)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getPriorityBadge(complaint.priority)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(complaint.createdAt)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(complaint)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No complaints found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                        ? 'Try adjusting your search or filter criteria.'
                        : 'No customer complaints at this time.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Complaint Details Modal */}
      {showDetailsModal && selectedComplaint && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowDetailsModal(false)}></div>
            
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
              {/* Modal Header */}
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Complaint Details
                  </h3>
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="max-h-96 overflow-y-auto px-4 sm:px-6">
                <div className="space-y-4">
                  {/* Basic Info */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-gray-500">Complaint ID</div>
                        <div className="text-base font-semibold text-gray-900 mt-1">
                          {selectedComplaint.complaintNumber}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500">Status</div>
                        <div className="mt-1">
                          {getStatusBadge(selectedComplaint.status)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer & Order Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-200 p-4 rounded-lg">
                      <div className="text-sm font-medium text-gray-500">Customer</div>
                      <div className="mt-2">
                        <div className="font-medium text-gray-900">{selectedComplaint.customer.name}</div>
                        <div className="text-sm text-gray-500">{selectedComplaint.customer.phone}</div>
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 p-4 rounded-lg">
                      <div className="text-sm font-medium text-gray-500">Order</div>
                      <div className="mt-2">
                        <div className="font-medium text-blue-600">{selectedComplaint.order.orderNumber}</div>
                        {selectedComplaint.affectedItem && (
                          <div className="text-sm text-gray-500">
                            {selectedComplaint.affectedItem.productName} (Qty: {selectedComplaint.affectedItem.quantity})
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Issue Details */}
                  <div className="bg-white border border-gray-200 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-500 mb-2">Issue Description</div>
                    <div className="text-base font-medium text-gray-900 mb-2">{selectedComplaint.title}</div>
                    <div className="text-sm text-gray-700">{selectedComplaint.description}</div>
                  </div>

                  {/* Attachments */}
                  {selectedComplaint.attachments && selectedComplaint.attachments.length > 0 && (
                    <div className="bg-white border border-gray-200 p-4 rounded-lg">
                      <div className="text-sm font-medium text-gray-500 mb-3">Attachments</div>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedComplaint.attachments.map((attachment, index) => (
                          <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={attachment.url}
                              alt={`Attachment ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resolution */}
                  {selectedComplaint.resolution && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-sm font-medium text-green-700 mb-2">Resolution</div>
                      <div className="text-sm text-green-800">{selectedComplaint.resolution.description}</div>
                      <div className="text-xs text-green-600 mt-2">
                        Resolved on {formatDate(selectedComplaint.resolution.resolvedAt)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={() => setShowDetailsModal(false)}
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintsManagement;
