'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import NGOSetupForm from './NGOSetupForm';
import CampaignForm from './CampaignForm';
import CustomDropdown from './CustomDropDown';

import {
  Building2, TrendingUp, Users, Heart, Star, Plus,
  Edit, BarChart3, DollarSign, Calendar, Award,
  CheckCircle, XCircle, Clock, Eye, Loader2, X,Filter,Package,BookOpen,Shirt,Edit2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Id } from '@/convex/_generated/dataModel';
import { format } from 'date-fns';
type Campaign = {
  _id: Id<"fundraisingCampaigns">; // Changed from string
  title: string;
  description: string;
  status: 'active' | 'completed' | 'draft' | 'cancelled';
  raisedAmount: number;
  targetAmount: number;
  startDate: number;
  endDate?: number;
  category: string;
  totalDonors?: number;
};
export default function NGODashboard() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'donations' | 'volunteers' | 'ratings'>('overview');
  const [showSetupForm, setShowSetupForm] = useState(false);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [showDonationsModal, setShowDonationsModal] = useState(false);
  const [showVolunteersModal, setShowVolunteersModal] = useState(false);
  const [volunteerViewMode, setVolunteerViewMode] = useState<'card' | 'table'>('card');
  const updateVolunteerStatus = useMutation(api.ngos.updateVolunteerStatus);
  // Add these state variables at the top of your NGODashboard component
const [donationFilter, setDonationFilter] = useState<string>('all');
const [donationTypeFilter, setDonationTypeFilter] = useState<string>('all');
const [editingDonationId, setEditingDonationId] = useState<string | null>(null);
const [updatingStatus, setUpdatingStatus] = useState(false);
  // Queries
  const currentUser = useQuery(api.users.getUserByClerkId, user ? { clerkId: user.id } : 'skip');
  const myNgo = useQuery(api.ngos.getMyNgo);
  const statistics = useQuery(api.ngos.getMyStatistics);
  const campaigns = useQuery(api.ngos.getMyCampaigns);
  const donations = useQuery(api.ngos.getMyDonations);
  const volunteers = useQuery(api.ngos.getMyVolunteers);
  const ratings = useQuery(api.ngos.getMyRatings);
  const updateDonationStatus = useMutation(api.donation.updateDonationStatus);
  



const monetaryDonations = useQuery(api.payments.getMyNGOMonetaryDonations);
  const stats = useQuery(api.payments.getMonetaryDonationStats);
// Combine both donation sources and deduplicate
const allDonations = (() => {
  const physicalDonations = donations || [];
  const moneyDonations = (monetaryDonations || []).map(md => ({
    _id: md._id,
    donorUser: md.donorDetails ? { 
      name: md.donorDetails.name, 
      email: md.donorDetails.email 
    } : null,
    donationType: 'money' as const,
    amount: md.amount,
    quantity: undefined,
    unit: undefined,
    donationDate: md.donationDate,
    status: md.status,
    campaignDetails: md.campaignDetails,
  }));

  // Remove any money donations from physicalDonations to avoid duplicates
  const nonMoneyPhysicalDonations = physicalDonations.filter(
    d => d.donationType !== 'money'
  );

  // Combine and ensure unique IDs
  const combined = [...nonMoneyPhysicalDonations, ...moneyDonations];
  
  // Remove duplicates based on _id (just in case)
  const uniqueMap = new Map();
  combined.forEach(donation => {
    if (!uniqueMap.has(donation._id)) {
      uniqueMap.set(donation._id, donation);
    }
  });
  
  return Array.from(uniqueMap.values());
})();
// Filter options
const statusFilterOptions = [
  {
    value: 'all',
    label: 'All Donations',
    icon: <Package className="w-4 h-4 text-gray-500" />,
    description: 'Show all donations'
  },
  {
    value: 'scheduled',
    label: 'Scheduled',
    icon: <Calendar className="w-4 h-4 text-blue-500" />,
    description: 'Pending pickup'
  },
  {
    value: 'completed',
    label: 'Completed',
    icon: <CheckCircle className="w-4 h-4 text-green-500" />,
    description: 'Successfully received'
  },
  {
    value: 'pending',
    label: 'Pending',
    icon: <Clock className="w-4 h-4 text-amber-500" />,
    description: 'Awaiting confirmation'
  },
  {
    value: 'cancelled',
    label: 'Cancelled',
    icon: <XCircle className="w-4 h-4 text-red-500" />,
    description: 'Cancelled donations'
  },
];

const typeFilterOptions = [
  {
    value: 'all',
    label: 'All Types',
    icon: <Package className="w-4 h-4 text-gray-500" />,
    description: 'Show all donation types'
  },
  {
    value: 'money',
    label: 'Money',
    icon: <span className="text-green-500 font-bold text-sm">₹</span>,
    description: 'Monetary donations'
  },
  {
    value: 'books',
    label: 'Books',
    icon: <BookOpen className="w-4 h-4 text-blue-500" />,
    description: 'Book donations'
  },
  {
    value: 'clothes',
    label: 'Clothes',
    icon: <Shirt className="w-4 h-4 text-purple-500" />,
    description: 'Clothing donations'
  },
  {
    value: 'food',
    label: 'Food',
    icon: <Package className="w-4 h-4 text-orange-500" />,
    description: 'Food donations'
  },
];
// Handle status update
const handleStatusUpdate = async (donationId: string, newStatus: 'pending' | 'scheduled' | 'completed' | 'cancelled') => {
  setUpdatingStatus(true);
  try {
    await updateDonationStatus({
      donationId: donationId as Id<"donations">,
      status: newStatus,
    });
    
    toast.success(`Donation status updated to ${newStatus}`);
    setEditingDonationId(null);
    
    // Refresh the page to get updated data
    window.location.reload();
  } catch (error) {
    console.error('Error updating donation status:', error);
    toast.error('Failed to update donation status');
  } finally {
    setUpdatingStatus(false);
  }
};
const filteredDonations = allDonations?.filter((donation) => {
  const statusMatch = donationFilter === 'all' || donation.status === donationFilter;
  const typeMatch = donationTypeFilter === 'all' || donation.donationType === donationTypeFilter;
  return statusMatch && typeMatch;
}) || [];
// Status update options for dropdown
const statusUpdateOptions = [
  {
    value: 'pending',
    label: 'Pending',
    icon: <Clock className="w-4 h-4 text-amber-500" />,
    description: 'Awaiting confirmation'
  },
  {
    value: 'scheduled',
    label: 'Scheduled',
    icon: <Calendar className="w-4 h-4 text-blue-500" />,
    description: 'Pickup scheduled'
  },
  {
    value: 'completed',
    label: 'Completed',
    icon: <CheckCircle className="w-4 h-4 text-green-500" />,
    description: 'Successfully received'
  },
  {
    value: 'cancelled',
    label: 'Cancelled',
    icon: <XCircle className="w-4 h-4 text-red-500" />,
    description: 'Cancelled'
  },
];
  // Show setup form if NGO profile doesn't exist
  if (!myNgo && currentUser) {
    return <NGOSetupForm userId={currentUser._id} onComplete={() => window.location.reload()} />;
  }

  // Loading state
  if (!myNgo || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const StatCard = ({ icon: Icon, title, value, subtitle, color }: { icon: React.ComponentType<{ className?: string }>, title: string, value: string | number, subtitle?: string, color: string }) => (
    <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color.replace('text', 'bg')}/10`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 mt-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {myNgo.logo ? (
                <img src={myNgo.logo} alt={myNgo.organizationName} className="w-16 h-16 rounded-xl object-cover" />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{myNgo.organizationName}</h1>
                <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                  {myNgo.verified ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-green-600 font-medium">Verified NGO</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span className="text-amber-600 font-medium">Pending Verification</span>
                    </>
                  )}
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowSetupForm(true)}
              variant="outline"
              className="border-green-300 text-green-600 hover:bg-green-50"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'campaigns', label: 'Campaigns', icon: TrendingUp },
              { id: 'donations', label: 'Donations', icon: Heart },
              { id: 'volunteers', label: 'Volunteers', icon: Users },
              { id: 'ratings', label: 'Ratings', icon: Star },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'overview' | 'campaigns' | 'donations' | 'volunteers' | 'ratings')}
                  className={`flex items-center gap-2 px-4 py-4 border-b-2 transition-colors ${activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-600 hover:text-green-600'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={TrendingUp}
                title="Total Campaigns"
                value={statistics?.totalCampaigns || 0}
                subtitle={`${statistics?.activeCampaigns || 0} active`}
                color="text-blue-600"
              />
              <StatCard
                icon={DollarSign}
                title="Amount Raised"
                value={`₹${(statistics?.totalAmountRaised || 0).toLocaleString()}`}
                subtitle={`${statistics?.totalDonations || 0} donations`}
                color="text-green-600"
              />
              <StatCard
                icon={Users}
                title="Active Volunteers"
                value={statistics?.activeVolunteers || 0}
                subtitle={`${statistics?.totalVolunteers || 0} total`}
                color="text-purple-600"
              />
              <StatCard
                icon={Star}
                title="Average Rating"
                value={(statistics?.averageRating || 0).toFixed(1)}
                subtitle={`${statistics?.totalRatings || 0} reviews`}
                color="text-amber-600"
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => setShowCampaignForm(true)}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 h-12"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Campaign
                </Button>
                <Button
                  variant="outline"
                  className="h-12 border-green-300 text-green-600 hover:bg-green-50"
                  onClick={() => setShowDonationsModal(true)}
                >
                  <Heart className="w-5 h-5 mr-2" />
                  View Donations
                </Button>
                <Button
                  variant="outline"
                  className="h-12 border-green-300 text-green-600 hover:bg-green-50"
                  onClick={() => setShowVolunteersModal(true)}
                >
                  <Users className="w-5 h-5 mr-2" />
                  Manage Volunteers
                </Button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h2 className="text-xl font-bold text-gray-800 mb-4">NGO Information</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-800">Registration Number</p>
                    <p className="text-gray-600">{myNgo.registrationNumber}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-800">Categories</p>
                    <p className="text-gray-600">{myNgo.categories.join(', ')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-800">Description</p>
                    <p className="text-gray-600">{myNgo.description}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">My Campaigns</h2>
              <Button
                onClick={() => setShowCampaignForm(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-500"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Campaign
              </Button>
            </div>

            {campaigns && campaigns.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {campaigns.map((campaign) => {
                  const progress = (campaign.raisedAmount / campaign.targetAmount) * 100;
                  return (
                    <div key={campaign._id} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">{campaign.title}</h3>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${campaign.status === 'active' ? 'bg-green-100 text-green-700' :
                            campaign.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingCampaign(campaign);
                            setShowCampaignForm(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{campaign.description}</p>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-semibold text-gray-800">{progress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">₹{campaign.raisedAmount.toLocaleString()} raised</span>
                          <span className="text-gray-600">₹{campaign.targetAmount.toLocaleString()} goal</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(campaign.startDate), 'MMM dd, yyyy')}
                        </span>
                        <span className="text-sm font-medium text-green-600">
                          {campaign.totalDonors || 0} donors
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-12 text-center shadow-md">
                <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">No Campaigns Yet</h3>
                <p className="text-gray-600 mb-6">Create your first fundraising campaign to start receiving donations</p>
                <Button
                  onClick={() => setShowCampaignForm(true)}
                  className="bg-gradient-to-r from-green-500 to-emerald-500"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Campaign
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Donations Tab */}
        {activeTab === 'donations' && (
  <div className="space-y-6">
    {/* Header with Filters */}
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <h2 className="text-2xl font-bold text-gray-800">Donations Received</h2>
      
      {/* Filter Controls */}
      <div className="flex items-center gap-3">
        <Filter className="w-5 h-5 text-gray-500" />
        <CustomDropdown
          label=""
          value={donationFilter}
          options={statusFilterOptions}
          onChange={(value) => setDonationFilter(value as string)}
          placeholder="Filter by status"
          className="w-64"
        />
        <CustomDropdown
          label=""
          value={donationTypeFilter}
          options={typeFilterOptions}
          onChange={(value) => setDonationTypeFilter(value as string)}
          placeholder="Filter by type"
          className="w-64"
        />
      </div>
    </div>

    {/* Summary Cards */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-blue-500">
    <p className="text-sm text-gray-600 mb-1">Scheduled</p>
    <p className="text-2xl font-bold text-blue-600">
      {allDonations?.filter(d => d.status === 'scheduled').length || 0}
    </p>
  </div>
  <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-green-500">
    <p className="text-sm text-gray-600 mb-1">Completed</p>
    <p className="text-2xl font-bold text-green-600">
      {allDonations?.filter(d => d.status === 'completed').length || 0}
    </p>
  </div>
  <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-amber-500">
    <p className="text-sm text-gray-600 mb-1">Pending</p>
    <p className="text-2xl font-bold text-amber-600">
      {allDonations?.filter(d => d.status === 'pending').length || 0}
    </p>
  </div>
  <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-gray-500">
    <p className="text-sm text-gray-600 mb-1">Total</p>
    <p className="text-2xl font-bold text-gray-800">
      {allDonations?.length || 0}
    </p>
  </div>
</div>

    {/* Results Count */}
    {(donationFilter !== 'all' || donationTypeFilter !== 'all') && (
  <div className="flex items-center justify-between bg-green-50 px-4 py-3 rounded-lg border border-green-200">
    <p className="text-sm text-green-800">
      Showing <span className="font-bold">{filteredDonations.length}</span> of <span className="font-bold">{allDonations?.length || 0}</span> donations
    </p>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        setDonationFilter('all');
        setDonationTypeFilter('all');
      }}
      className="text-green-600 hover:text-green-700 hover:bg-green-100"
    >
      Clear Filters
    </Button>
  </div>
)}

    {/* Donations Table */}
    {filteredDonations && filteredDonations.length > 0 ? (
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Donor</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredDonations.map((donation) => (
                <tr key={donation._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-800">{donation.donorUser?.name || 'Anonymous'}</p>
                    <p className="text-sm text-gray-500">{donation.donorUser?.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {donation.donationType === 'books' && <BookOpen className="w-4 h-4 text-blue-500" />}
                      {donation.donationType === 'clothes' && <Shirt className="w-4 h-4 text-purple-500" />}
                      {donation.donationType === 'food' && <Package className="w-4 h-4 text-orange-500" />}
                      {donation.donationType === 'money' && <span className="text-green-500 font-bold">₹</span>}
                      <span className="capitalize text-gray-700">{donation.donationType.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-800">
                    {donation.donationType === 'money' 
                      ? `₹${donation.amount?.toLocaleString()}` 
                      : `${donation.quantity} ${donation.unit || 'items'}`}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {format(new Date(donation.donationDate), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4">
                    {editingDonationId === donation._id ? (
                      <div className="w-48" onClick={(e) => e.stopPropagation()}>
                        <CustomDropdown
                          label=""
                          value={donation.status}
                          options={statusUpdateOptions}
                          onChange={(value) => handleStatusUpdate(donation._id, value as 'pending' | 'scheduled' | 'completed' | 'cancelled')}
                          placeholder="Update status"
                          className="w-full"
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingDonationId(donation._id)}
                        className="group relative"
                      >
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                          donation.status === 'completed' ? 'bg-green-100 text-green-700 group-hover:bg-green-200' :
                          donation.status === 'pending' ? 'bg-amber-100 text-amber-700 group-hover:bg-amber-200' :
                          donation.status === 'scheduled' ? 'bg-blue-100 text-blue-700 group-hover:bg-blue-200' :
                          'bg-gray-100 text-gray-700 group-hover:bg-gray-200'
                        }`}>
                          {donation.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                          {donation.status === 'pending' && <Clock className="w-3 h-3" />}
                          {donation.status === 'scheduled' && <Calendar className="w-3 h-3" />}
                          {donation.status === 'cancelled' && <XCircle className="w-3 h-3" />}
                          {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                          <Edit2 className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {donation.status === 'scheduled' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-300 text-green-600 hover:bg-green-50"
                          onClick={() => handleStatusUpdate(donation._id, 'completed')}
                          disabled={updatingStatus}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Complete
                        </Button>
                      )}
                      {donation.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-300 text-blue-600 hover:bg-blue-50"
                            onClick={() => handleStatusUpdate(donation._id, 'scheduled')}
                            disabled={updatingStatus}
                          >
                            <Calendar className="w-4 h-4 mr-1" />
                            Schedule
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                            onClick={() => handleStatusUpdate(donation._id, 'cancelled')}
                            disabled={updatingStatus}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ) : (
      <div className="bg-white rounded-xl p-12 text-center shadow-md">
  <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
  <h3 className="text-xl font-bold text-gray-800 mb-2">
    {allDonations && allDonations.length > 0 ? 'No matching donations' : 'No Donations Yet'}
  </h3>
  <p className="text-gray-600">
    {allDonations && allDonations.length > 0 
      ? 'Try adjusting your filters to see more results' 
      : 'Donations will appear here once donors start contributing'}
  </p>
  {(donationFilter !== 'all' || donationTypeFilter !== 'all') && (
    <Button
      onClick={() => {
        setDonationFilter('all');
        setDonationTypeFilter('all');
      }}
      className="mt-4 bg-gradient-to-r from-green-500 to-emerald-500"
    >
      Clear Filters
    </Button>
  )}
</div>
    )}
  </div>
)}

        {/* Volunteers Tab */}
        {/* Volunteers Tab */}
        {activeTab === 'volunteers' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Our Volunteers</h2>

              {/* View Mode Toggle */}
              <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setVolunteerViewMode('card')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${volunteerViewMode === 'card'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                    }`}
                >
                  Card View
                </button>
                <button
                  onClick={() => setVolunteerViewMode('table')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${volunteerViewMode === 'table'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                    }`}
                >
                  Table View
                </button>
              </div>
            </div>

            {volunteers && volunteers.length > 0 ? (
              <>
                {/* Card View */}
                {volunteerViewMode === 'card' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {volunteers.map((volunteer) => (
                      <div key={volunteer._id} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {volunteer.donorUser?.name?.charAt(0) || 'V'}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800">{volunteer.donorUser?.name || 'Volunteer'}</h3>
                            <p className="text-sm text-gray-500">{volunteer.role || 'General Volunteer'}</p>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm mb-4">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <span className={`font-medium ${volunteer.status === 'active' ? 'text-green-600' :
                                volunteer.status === 'completed' ? 'text-blue-600' :
                                  'text-gray-600'
                              }`}>
                              {volunteer.status.charAt(0).toUpperCase() + volunteer.status.slice(1)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Duration:</span>
                            <span className="font-medium text-gray-800">
                              {format(new Date(volunteer.startDate), 'MMM yyyy')} - {format(new Date(volunteer.endDate), 'MMM yyyy')}
                            </span>
                          </div>
                          {volunteer.hoursContributed && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Hours:</span>
                              <span className="font-medium text-gray-800">{volunteer.hoursContributed}h</span>
                            </div>
                          )}
                        </div>

                        {/* Status Change Buttons */}
                        <div className="flex gap-2 pt-4 border-t border-gray-200">
                          {volunteer.status !== 'active' && (
                            <Button
                              size="sm"
                              onClick={async () => {
                                try {
                                  await updateVolunteerStatus({
                                    volunteerId: volunteer._id,
                                    status: 'active',
                                  });
                                  toast.success('Volunteer status updated to Active');
                                  window.location.reload();
                                } catch (error) {
                                  toast.error('Failed to update status');
                                }
                              }}
                              className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                            >
                              Mark Active
                            </Button>
                          )}
                          {volunteer.status === 'active' && (
                            <Button
                              size="sm"
                              onClick={async () => {
                                try {
                                  await updateVolunteerStatus({
                                    volunteerId: volunteer._id,
                                    status: 'completed',
                                  });
                                  toast.success('Volunteer status updated to Completed');
                                  window.location.reload();
                                } catch (error) {
                                  toast.error('Failed to update status');
                                }
                              }}
                              variant="outline"
                              className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50"
                            >
                              Mark Completed
                            </Button>
                          )}
                          {volunteer.status !== 'cancelled' && (
                            <Button
                              size="sm"
                              onClick={async () => {
                                try {
                                  await updateVolunteerStatus({
                                    volunteerId: volunteer._id,
                                    status: 'cancelled',
                                  });
                                  toast.success('Volunteer status updated to Cancelled');
                                  window.location.reload();
                                } catch (error) {
                                  toast.error('Failed to update status');
                                }
                              }}
                              variant="outline"
                              className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Table View */}
                {volunteerViewMode === 'table' && (
                  <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Volunteer</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Role</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Duration</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Hours</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {volunteers.map((volunteer) => (
                            <tr key={volunteer._id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                                    {volunteer.donorUser?.name?.charAt(0) || 'V'}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-800">{volunteer.donorUser?.name || 'Volunteer'}</p>
                                    <p className="text-sm text-gray-500">{volunteer.donorUser?.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-gray-700">
                                {volunteer.role || 'General Volunteer'}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${volunteer.status === 'active' ? 'bg-green-100 text-green-700' :
                                    volunteer.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                      'bg-gray-100 text-gray-700'
                                  }`}>
                                  {volunteer.status.charAt(0).toUpperCase() + volunteer.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-gray-700">
                                <div className="text-sm">
                                  <div>{format(new Date(volunteer.startDate), 'MMM dd, yyyy')}</div>
                                  <div className="text-gray-500">{format(new Date(volunteer.endDate), 'MMM dd, yyyy')}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 font-semibold text-gray-800">
                                {volunteer.hoursContributed || 0}h
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex gap-2">
                                  {volunteer.status !== 'active' && (
                                    <Button
                                      size="sm"
                                      onClick={async () => {
                                        try {
                                          await updateVolunteerStatus({
                                            volunteerId: volunteer._id,
                                            status: 'active',
                                          });
                                          toast.success('Status updated to Active');
                                          window.location.reload();
                                        } catch (error) {
                                          toast.error('Failed to update status');
                                        }
                                      }}
                                      className="bg-green-500 hover:bg-green-600 text-white text-xs"
                                    >
                                      Active
                                    </Button>
                                  )}
                                  {volunteer.status === 'active' && (
                                    <Button
                                      size="sm"
                                      onClick={async () => {
                                        try {
                                          await updateVolunteerStatus({
                                            volunteerId: volunteer._id,
                                            status: 'completed',
                                          });
                                          toast.success('Status updated to Completed');
                                          window.location.reload();
                                        } catch (error) {
                                          toast.error('Failed to update status');
                                        }
                                      }}
                                      variant="outline"
                                      className="border-blue-300 text-blue-600 hover:bg-blue-50 text-xs"
                                    >
                                      Complete
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl p-12 text-center shadow-md">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">No Volunteers Yet</h3>
                <p className="text-gray-600">Volunteers who join your organization will appear here</p>
              </div>
            )}
          </div>
        )}

        {/* Ratings Tab */}
        {activeTab === 'ratings' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Ratings & Reviews</h2>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-800">{(statistics?.averageRating || 0).toFixed(1)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${star <= (statistics?.averageRating || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                        }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-1">{statistics?.totalRatings || 0} reviews</p>
              </div>
            </div>

            {ratings && ratings.length > 0 ? (
              <div className="space-y-4">
                {ratings.map((rating) => (
                  <div key={rating._id} className="bg-white rounded-xl p-6 shadow-md">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-800">{rating.user?.name || 'Anonymous'}</h3>
                        <div className="flex items-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${star <= rating.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                                }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">{format(new Date(rating.createdAt), 'MMM dd, yyyy')}</span>
                    </div>
                    {rating.review && <p className="text-gray-600">{rating.review}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-12 text-center shadow-md">
                <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">No Reviews Yet</h3>
                <p className="text-gray-600">Reviews from donors and volunteers will appear here</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Setup Form Modal */}
      {showSetupForm && currentUser && (
        <NGOSetupForm
          userId={currentUser._id}
          onComplete={() => {
            setShowSetupForm(false);
            window.location.reload();
          }}
          isEditMode={true}
          existingData={{
            organizationName: myNgo.organizationName,
            registrationNumber: myNgo.registrationNumber,
            description: myNgo.description,
            categories: myNgo.categories,
            logo: myNgo.logo,
            websiteUrl: myNgo.websiteUrl,
            phoneNumber: currentUser.phoneNumber || '',
            address: currentUser.address || '',
            city: currentUser.city || '',
            state: currentUser.state || '',
            pincode: currentUser.pincode || '',
          }}
        />
      )}

      {/* Campaign Form Modal - You can create a separate CampaignForm component */}
      {showCampaignForm && (
        <CampaignForm
          onClose={() => {
            setShowCampaignForm(false);
            setEditingCampaign(null);
          }}
          onSuccess={() => window.location.reload()}
          editingCampaign={editingCampaign}
        />
      )}
      {/* Donations Modal */}
      {showDonationsModal && (
  <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">All Donations</h2>
        </div>
        <button
          aria-label="Close Donations Modal"
          onClick={() => setShowDonationsModal(false)}
          className="text-white/80 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {allDonations && allDonations.length > 0 ? (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Donor</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Amount</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {allDonations.map((donation) => (
                    <tr key={donation._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">{donation.donorUser?.name || 'Anonymous'}</p>
                        <p className="text-sm text-gray-500">{donation.donorUser?.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {donation.donationType === 'books' && <BookOpen className="w-4 h-4 text-blue-500" />}
                          {donation.donationType === 'clothes' && <Shirt className="w-4 h-4 text-purple-500" />}
                          {donation.donationType === 'food' && <Package className="w-4 h-4 text-orange-500" />}
                          {donation.donationType === 'money' && <span className="text-green-500 font-bold">₹</span>}
                          <span className="capitalize text-gray-700">{donation.donationType.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-800">
                        {donation.donationType === 'money' ? `₹${donation.amount?.toLocaleString()}` : `${donation.quantity} ${donation.unit || 'items'}`}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {format(new Date(donation.donationDate), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${donation.status === 'completed' ? 'bg-green-100 text-green-700' :
                            donation.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              donation.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                          }`}>
                          {donation.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                          {donation.status === 'pending' && <Clock className="w-3 h-3" />}
                          {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Donations Yet</h3>
            <p className="text-gray-600">Donations will appear here once donors start contributing</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Total Donations: <span className="font-bold text-gray-800">{allDonations?.length || 0}</span>
          </p>
          <Button
            onClick={() => setShowDonationsModal(false)}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  </div>
)}
      {/* Volunteers Modal */}

      {showVolunteersModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Manage Volunteers</h2>
              </div>
              <button
                aria-label="Close Volunteers Modal"
                onClick={() => setShowVolunteersModal(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {volunteers && volunteers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {volunteers.map((volunteer) => (
                    <div key={volunteer._id} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all border border-gray-200">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {volunteer.donorUser?.name?.charAt(0) || 'V'}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800">{volunteer.donorUser?.name || 'Volunteer'}</h3>
                          <p className="text-sm text-gray-500">{volunteer.role || 'General Volunteer'}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${volunteer.status === 'active' ? 'bg-green-100 text-green-700' :
                            volunteer.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                          }`}>
                          {volunteer.status.charAt(0).toUpperCase() + volunteer.status.slice(1)}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm border-t border-gray-100 pt-4 mb-4">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span className="font-medium text-gray-800 text-xs">{volunteer.donorUser?.email || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Start Date:</span>
                          <span className="font-medium text-gray-800">
                            {format(new Date(volunteer.startDate), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">End Date:</span>
                          <span className="font-medium text-gray-800">
                            {format(new Date(volunteer.endDate), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        {volunteer.hoursContributed && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Hours:</span>
                            <span className="font-medium text-gray-800">{volunteer.hoursContributed}h</span>
                          </div>
                        )}
                      </div>

                      {/* Status Change Buttons */}
                      <div className="flex gap-2">
                        {volunteer.status !== 'active' && (
                          <Button
                            size="sm"
                            onClick={async () => {
                              try {
                                await updateVolunteerStatus({
                                  volunteerId: volunteer._id,
                                  status: 'active',
                                });
                                toast.success('Volunteer status updated to Active');
                                window.location.reload();
                              } catch (error) {
                                toast.error('Failed to update status');
                              }
                            }}
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                          >
                            Active
                          </Button>
                        )}
                        {volunteer.status === 'active' && (
                          <Button
                            size="sm"
                            onClick={async () => {
                              try {
                                await updateVolunteerStatus({
                                  volunteerId: volunteer._id,
                                  status: 'completed',
                                });
                                toast.success('Volunteer status updated to Completed');
                                window.location.reload();
                              } catch (error) {
                                toast.error('Failed to update status');
                              }
                            }}
                            variant="outline"
                            className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50"
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-12 text-center">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No Volunteers Yet</h3>
                  <p className="text-gray-600">Volunteers who join your organization will appear here</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Total Volunteers: <span className="font-bold text-gray-800">{volunteers?.length || 0}</span>
                </p>
                <Button
                  onClick={() => setShowVolunteersModal(false)}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}