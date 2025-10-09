'use client';

import { useUser } from '@clerk/nextjs';
import { Droplet, Heart, Users, Search, TrendingUp, Award, Activity, CheckCircle2, Filter, Building2, HandHeart, Target, Loader2, Edit } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import BloodDonationForm from '@/components/BloodDonationForm';
import VolunteerForm from '@/components/VolunteerForm';
import OrganPledgeForm from '@/components/OrganPledgeForm';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

import DonorProfileForm from '@/components/DonorProfileForm';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import FilterPanel from '@/components/FilterPanel';
import ResultCard from '@/components/ResultCard';

export default function UserDashboard() {
  const { user, isLoaded } = useUser();
  const [activeForm, setActiveForm] = useState<'blood' | 'volunteer' | 'organ' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'hospitals' | 'ngos' | 'campaigns'>('ngos');
  
  // Filter states
  const [filters, setFilters] = useState({
    sortBy: 'popular' as 'popular' | 'rating' | 'recent' | 'name' | 'ending_soon' | 'amount_raised',
    category: '',
    city: '',
    status: 'all' as 'active' | 'completed' | 'all',
    minRating: 0,
    hospitalType: '' as '' | 'government' | 'private' | 'trust',
  });

  const profileCheck = useQuery(
    api.donors.isDonorProfileComplete,
    user?.id ? { clerkId: user.id } : "skip"
  );
  
  const [showForm, setShowForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (profileCheck && !profileCheck.complete) {
      setShowForm(true);
      setIsEditMode(false);
    }
  }, [profileCheck]);

  const upcomingAppointment = useQuery(api.bloodDonations.getUpcomingAppointment);
  const activeVolunteer = useQuery(api.volunteers.getActiveVolunteerRegistration);
  const organPledge = useQuery(api.organDonation.getMyPledge);
  const dashboardStats = useQuery(api.stats.getDashboardStats);

  // Get appropriate sortBy value based on active tab
  const getValidSortBy = () => {
    if (activeTab === 'campaigns') {
      if (filters.sortBy === 'name') {
        return 'popular';
      }
      return filters.sortBy as 'popular' | 'rating' | 'recent' | 'ending_soon' | 'amount_raised';
    }
    return filters.sortBy as 'popular' | 'rating' | 'recent' | 'name';
  };

  // Search queries based on active tab
  const hospitalResults = useQuery(
    api.search.searchHospitals,
    activeTab === 'hospitals'
      ? {
          searchQuery,
          sortBy: getValidSortBy() as 'popular' | 'rating' | 'recent' | 'name',
          city: filters.city || undefined,
          hospitalType: filters.hospitalType || undefined,
          minRating: filters.minRating || undefined,
        }
      : 'skip'
  );

  const ngoResults = useQuery(
    api.search.searchNGOs,
    activeTab === 'ngos'
      ? {
          searchQuery,
          sortBy: getValidSortBy() as 'popular' | 'rating' | 'recent' | 'name',
          category: filters.category || undefined,
          city: filters.city || undefined,
          minRating: filters.minRating || undefined,
        }
      : 'skip'
  );

  const campaignResults = useQuery(
    api.search.searchCampaigns,
    activeTab === 'campaigns'
      ? {
          searchQuery,
          status: filters.status,
          sortBy: getValidSortBy() as 'popular' | 'rating' | 'recent' | 'ending_soon' | 'amount_raised',
          category: filters.category || undefined,
          minRating: filters.minRating || undefined,
        }
      : 'skip'
  );

  const popularCauses = useQuery(api.search.getPopularCauses);
  const availableCities = useQuery(api.search.getAvailableCities);

  const hasShownWelcomeToast = useRef(false);

  useEffect(() => {
    if (isLoaded && user && !hasShownWelcomeToast.current) {
      const lastLoginToast = sessionStorage.getItem('welcomeToastShown');
      
      if (!lastLoginToast) {
        toast.success('🎉 Welcome to DonorConnect!', {
          description: `Great to have you here, ${user.firstName || 'Friend'}!`,
          duration: 5000,
        });
        sessionStorage.setItem('welcomeToastShown', 'true');
        hasShownWelcomeToast.current = true;
      }
    }
  }, [isLoaded, user]);

  const handleCauseClick = (cause: string) => {
    setFilters(prev => ({ ...prev, category: cause.toLowerCase() }));
    setActiveTab('ngos');
  };

  const resetFilters = () => {
    setFilters({
      sortBy: 'popular',
      category: '',
      city: '',
      status: 'all',
      minRating: 0,
      hospitalType: '',
    });
  };

  const handleViewDetails = (id: string) => {
    console.log('View details for:', id);
    toast.info('Details page coming soon!');
  };

  const handleEditProfile = () => {
    setIsEditMode(true);
    setShowForm(true);
  };

  const activeResults = 
    activeTab === 'hospitals' ? hospitalResults :
    activeTab === 'ngos' ? ngoResults :
    campaignResults;

  const resultCount = activeResults?.count || 0;

  if (!user || profileCheck === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  const actionCards = [
    {
      id: 'blood',
      title: 'Blood Donation',
      description: 'Sign up to donate blood and save lives',
      icon: Droplet,
      gradient: 'from-red-500 via-rose-500 to-pink-500',
      shadowColor: 'shadow-red-200',
      hasAppointment: !!upcomingAppointment
    },
    {
      id: 'volunteer',
      title: 'Volunteer',
      description: 'Join an NGO and make a difference',
      icon: Users,
      gradient: 'from-green-500 via-emerald-500 to-teal-500',
      shadowColor: 'shadow-green-200',
      hasAppointment: !!activeVolunteer
    },
    {
      id: 'organ',
      title: 'Organ Pledge',
      description: 'Pledge to be an organ donor',
      icon: Heart,
      gradient: 'from-purple-500 via-pink-500 to-rose-500',
      shadowColor: 'shadow-purple-200',
      hasAppointment: !!organPledge
    }
  ];

  const stats = [
    { 
      label: 'Lives Impacted', 
      value: dashboardStats?.livesImpacted?.toString() || '0',
      icon: Heart, 
      color: 'text-rose-500',
      subtitle: 'Through donations'
    },
    { 
      label: 'Donations Made', 
      value: dashboardStats?.donationsMade?.toString() || '0',
      icon: TrendingUp, 
      color: 'text-green-500',
      subtitle: 'Total activities'
    },
    { 
      label: 'Impact Score', 
      value: dashboardStats?.impactScore?.toString() || '0',
      icon: Award, 
      color: 'text-purple-500',
      subtitle: 'Contribution score'
    }
  ];

  return (
    <>
      {showForm && profileCheck?.user && (
        <DonorProfileForm
          userId={profileCheck.user._id}
          onComplete={() => {
            setShowForm(false);
            setIsEditMode(false);
          }}
          isEditMode={isEditMode}
          existingData={isEditMode && profileCheck ? {
            phoneNumber: profileCheck.user.phoneNumber || '',
            address: profileCheck.user.address || '',
            city: profileCheck.user.city || '',
            state: profileCheck.user.state || '',
            pincode: profileCheck.user.pincode || '',
            bloodGroup: profileCheck.donor?.bloodGroup || '',
            gender: profileCheck.donor?.gender || '',
            dateOfBirth: profileCheck.donor?.dateOfBirth || '',
          } : undefined}
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Welcome Section with Stats */}
          <div className="mb-12">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-start justify-between mb-6">
                <div className="flex-1 pr-6">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent mb-2">
                    Welcome back, {user?.firstName || 'Donor'}!
                  </h1>
                  <p className="text-lg text-gray-600 ml-auto">
                    {profileCheck?.user?.city && profileCheck?.user?.state 
                      ? `${profileCheck.user.city}, ${profileCheck.user.state}`
                      : 'Ready to make a difference today?'}
                  </p>
                </div>
                <div className="flex items-center gap-5">
                  {profileCheck?.complete && (
                    <button
                      onClick={handleEditProfile}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-rose-300 hover:text-rose-600 transition-all shadow-sm hover:shadow-md"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Profile
                    </button>
                  )}
                  
                </div>
              </div>
                <Activity className="w-12 h-12 text-rose-500 animate-pulse" />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                          stat.color === 'text-rose-500' ? 'from-rose-100 to-pink-100' :
                          stat.color === 'text-green-500' ? 'from-green-100 to-emerald-100' :
                          'from-purple-100 to-pink-100'
                        } flex items-center justify-center`}>
                          <Icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                          <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section Title */}
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Choose Your Impact</h2>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {actionCards.map((card) => {
              const Icon = card.icon;
              const hasActiveStatus = card.hasAppointment;
              
              let statusDetails = null;
              if (hasActiveStatus) {
                if (card.id === 'blood' && upcomingAppointment) {
                  statusDetails = (
                    <div className="mt-4 p-4 bg-gradient-to-br from-red-50 to-pink-50 border-l-4 border-red-500 rounded-lg">
                      <p className="text-xs font-bold text-red-800 mb-2">Upcoming Appointment:</p>
                      <p className="text-sm text-red-700"><span className="font-semibold">Hospital:</span> {upcomingAppointment.hospital?.hospitalName || 'N/A'}</p>
                      <p className="text-sm text-red-700"><span className="font-semibold">Date:</span> {new Date(upcomingAppointment.scheduledDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                      <p className="text-sm text-red-700"><span className="font-semibold">Time:</span> {upcomingAppointment.scheduledTime || 'N/A'}</p>
                    </div>
                  );
                } else if (card.id === 'volunteer' && activeVolunteer) {
                  statusDetails = (
                    <div className="mt-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg">
                      <p className="text-xs font-bold text-green-800 mb-2">Active Registration:</p>
                      <p className="text-sm text-green-700"><span className="font-semibold">NGO:</span> {activeVolunteer.ngo?.organizationName || 'N/A'}</p>
                      <p className="text-sm text-green-700"><span className="font-semibold">Role:</span> {activeVolunteer.role || 'N/A'}</p>
                      <p className="text-sm text-green-700"><span className="font-semibold">Start Date:</span> {new Date(activeVolunteer.startDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}</p>
                      <p className="text-sm text-green-700"><span className="font-semibold">End Date:</span> {new Date(activeVolunteer.endDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}</p>
                      <p className="text-sm text-green-700"><span className="font-semibold">Hours:</span> {activeVolunteer.hoursContributed || 0} hours</p>
                    </div>
                  );
                } else if (card.id === 'organ' && organPledge) {
                  statusDetails = (
                    <div className="mt-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-l-4 border-purple-500 rounded-lg">
                      <p className="text-xs font-bold text-purple-800 mb-2">Active Pledge:</p>
                      <p className="text-sm text-purple-700"><span className="font-semibold">Organs:</span> {organPledge.organs?.join(', ') || 'All organs'}</p>
                      <p className="text-sm text-purple-700"><span className="font-semibold">Pledged on:</span> {new Date(organPledge.pledgeDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}</p>
                      <p className="text-sm text-purple-700"><span className="font-semibold">Status:</span> {organPledge.status || 'active'}</p>
                    </div>
                  );
                }
              }
              
              return (
                <button
                  key={card.id}
                  onClick={() => setActiveForm(card.id as any)}
                  className="group relative bg-white rounded-3xl p-8 border-2 border-gray-100 hover:border-transparent transition-all transform hover:scale-105 hover:shadow-2xl text-left overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                  
                  <div className="relative">
                    <div className="relative mb-6 w-fit">
                      <div className={`w-16 h-16 bg-gradient-to-br ${card.gradient} rounded-2xl flex items-center justify-center shadow-lg ${card.shadowColor} group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      {hasActiveStatus && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-gray-700 transition-colors">
                      {card.title}
                    </h3>
                    
                    {!hasActiveStatus && (
                      <p className="text-gray-600 text-base leading-relaxed mb-4">
                        {card.description}
                      </p>
                    )}

                    {statusDetails}

                    <div className="mt-6 flex items-center text-rose-500 font-semibold group-hover:translate-x-2 transition-transform">
                      {hasActiveStatus ? 'View Details' : 'Get Started'}
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Search Section */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Search className="w-8 h-8 text-rose-500" />
                <h2 className="text-3xl font-bold text-gray-900">
                  Find NGOs & Hospitals
                </h2>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  showFilters
                    ? 'bg-rose-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Filter className="w-5 h-5" />
                Filters
                {Object.values(filters).filter(v => v && v !== 'popular' && v !== 'all' && v !== 0 && v !== '').length > 0 && (
                  <span className="bg-white text-rose-500 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    {Object.values(filters).filter(v => v && v !== 'popular' && v !== 'all' && v !== 0 && v !== '').length}
                  </span>
                )}
              </button>
            </div>
            
            <p className="text-gray-600 mb-6">
              Discover trusted organizations and healthcare institutions in your area
            </p>

            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder={`Search for ${activeTab}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-14 text-base border-2 border-gray-200 focus:border-rose-500 rounded-xl"
                  />
                </div>
                <Button 
                  onClick={() => {}}
                  className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 h-14 px-10 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  Search
                </Button>
              </div>

              <div className="flex gap-2 border-b border-gray-200">
                {[
                  { id: 'ngos', label: 'NGOs', icon: HandHeart },
                  { id: 'hospitals', label: 'Hospitals', icon: Building2 },
                  { id: 'campaigns', label: 'Campaigns', icon: Target },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all border-b-2 ${
                        activeTab === tab.id
                          ? 'text-rose-500 border-rose-500'
                          : 'text-gray-500 border-transparent hover:text-gray-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {showFilters && (
              <FilterPanel
                activeTab={activeTab}
                filters={filters}
                onFilterChange={setFilters}
                onReset={resetFilters}
                availableCities={availableCities}
                popularCauses={popularCauses}
              />
            )}

            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Found <span className="font-bold text-rose-500">{resultCount}</span> {activeTab}
              </p>
            </div>

            <div className="space-y-4 mb-8 max-h-[600px] overflow-y-auto pr-2">
              {activeResults && activeResults.results.length > 0 ? (
                activeResults.results.map((result: any) => (
                  <ResultCard
                    key={result._id}
                    result={result}
                    type={
                      activeTab === 'hospitals' ? 'hospital' :
                      activeTab === 'ngos' ? 'ngo' :
                      'campaign'
                    }
                    onViewDetails={handleViewDetails}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-semibold">
                    No {activeTab} found matching your criteria
                  </p>
                  <p className="text-gray-400 mt-2">
                    Try adjusting your filters or search query
                  </p>
                </div>
              )}
            </div>

            {popularCauses && popularCauses.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
                  Popular Causes
                </h3>
                <div className="flex flex-wrap gap-3">
                  {popularCauses.slice(0, 8).map((cause) => (
                    <button
                      key={cause.name}
                      onClick={() => handleCauseClick(cause.name)}
                      className={`px-6 py-3 rounded-full text-sm font-semibold transition-all shadow-sm hover:shadow-md ${
                        filters.category === cause.name.toLowerCase()
                          ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white'
                          : 'bg-gradient-to-br from-gray-50 to-gray-100 hover:from-rose-50 hover:to-pink-50 border border-gray-200 hover:border-rose-300 text-gray-700 hover:text-rose-600'
                      }`}
                    >
                      {cause.name} <span className={filters.category === cause.name.toLowerCase() ? 'text-white/80' : 'text-gray-400'}>({cause.count})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {activeForm === 'blood' && (
          <BloodDonationForm onClose={() => setActiveForm(null)} />
        )}
        
        {activeForm === 'volunteer' && (
          <VolunteerForm onClose={() => setActiveForm(null)} />
        )}
        {activeForm === 'organ' && (
          <OrganPledgeForm onClose={() => setActiveForm(null)} />
        )}
        
      </div>
    </>
  );
}