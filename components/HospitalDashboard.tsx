import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Building2, Heart, Activity, Users, Search, AlertCircle, MapPin, Star, Filter, Plus, Edit2, X, ChevronDown, Send } from 'lucide-react';
import HospitalSetupForm from './HospitalSetupForm';
import HospitalEditForm from './HospitalEditForm';
import OrganRequestForm from './OrganRequestForm';
import OrganDetailsModal from './OrganDetailModal';
import IncomingRequestsModal from './IncomingRequestsModal';
import OutgoingRequestsModal from './OutgoingRequestsModal';
import BloodDonationsModal from './BloodDonationsModal';
import CustomDropdown from './CustomDropDown';
import { Id } from '@/convex/_generated/dataModel';
import HospitalDetailsModal from './HospitalDetailsModal';
export default function HospitalDashboard() {
  const currentHospital = useQuery(api.hospitals.getCurrentHospital);
  const availableOrgans = useQuery(api.hospitals.getHospitalOrganAvailability);
  const bloodDonationsCount = useQuery(api.hospitals.getCompletedBloodDonationsCount);
  const incomingRequests = useQuery(api.hospitals.getIncomingOrganRequests);
  const outgoingRequests = useQuery(api.hospitals.getOutgoingOrganRequests);
  const [showIncomingRequests, setShowIncomingRequests] = useState(false);
  const [showOrganDetails, setShowOrganDetails] = useState(false);
  const [showSetupForm, setShowSetupForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [sortBy, setSortBy] = useState('urgency');
  const [showFilters, setShowFilters] = useState(false);
  const [showOutgoingRequests, setShowOutgoingRequests] = useState(false);
  const [showBloodDonationsModal, setShowBloodDonationsModal] = useState(false);
  const searchResults = useQuery(api.hospitals.searchHospitals, {
    searchTerm: searchTerm || undefined,
    city: selectedCity || undefined,
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    sortBy: sortBy as any,
  });
  const [selectedHospitalId, setSelectedHospitalId] = useState<Id<"hospitals"> | null>(null);
  React.useEffect(() => {
    if (currentHospital === null) {
      setShowSetupForm(true);
    } else if (currentHospital) {
      setShowSetupForm(false);
    }
  }, [currentHospital]);

  if (currentHospital === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (showSetupForm || !currentHospital) {
    return <HospitalSetupForm onComplete={() => setShowSetupForm(false)} />;
  }

  if (showEditForm) {
    return (
      <HospitalEditForm
        hospital={currentHospital}
        onComplete={() => setShowEditForm(false)}
        onCancel={() => setShowEditForm(false)}
      />
    );
  }

  const cities = searchResults
    ? Array.from(new Set(searchResults.map((h) => h.city).filter(Boolean)))
    : [];

  return (
    <div className="min-h-screen bg-gray-50 p-6 mt-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-red-100 p-3 rounded-lg">
                <Building2 className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{currentHospital.hospitalName}</h1>
                <p className="text-gray-600 mt-1">{currentHospital.user?.city}, {currentHospital.user?.state}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${currentHospital.verified
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                    }`}>
                    {currentHospital.verified ? 'Verified' : 'Pending Verification'}
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 capitalize">
                    {currentHospital.hospitalType}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowEditForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </button>
          </div>
        </div>

        {/* Stats Cards - NOW WITH 4 COLUMNS */}
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Available Organs */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Heart className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Available Organs</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {availableOrgans?.length || 0}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowOrganDetails(true)}
              className="w-full mt-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium rounded-lg transition text-sm"
            >
              View Details
            </button>
          </div>

          {/* Blood Donations */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-3 rounded-lg">
                <Activity className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Blood Donations</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {bloodDonationsCount || 0}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowBloodDonationsModal(true)}
              className="w-full mt-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded-lg transition text-sm"
            >
              View Details
            </button>
          </div>

          {/* Incoming Requests */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Incoming Requests</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {incomingRequests?.length || 0}
                </p>
              </div>
            </div>
            {incomingRequests && incomingRequests.length > 0 && (
              <button
                onClick={() => setShowIncomingRequests(true)}
                className="w-full mt-2 px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 font-medium rounded-lg transition text-sm"
              >
                View Requests
              </button>
            )}
          </div>


          {/* Outgoing Requests */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Send className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Outgoing Requests</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {outgoingRequests?.length || 0}
                </p>
              </div>
            </div>
            {outgoingRequests && outgoingRequests.length > 0 && (
              <button
                onClick={() => setShowOutgoingRequests(true)}
                className="w-full mt-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg transition text-sm"
              >
                View Details
              </button>
            )}
          </div>

        </div>

        {/* Incoming Organ Requests */}
        {Array.isArray(incomingRequests) && incomingRequests.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Incoming Organ Requests
            </h2>
            <div className="space-y-4">
              {incomingRequests.map((request) => (
                <div key={request._id} className="border rounded-lg p-4 hover:border-red-300 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {request.requestingHospital?.hospitalName}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${request.urgency === 'critical'
                          ? 'bg-red-100 text-red-700'
                          : request.urgency === 'urgent'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-blue-100 text-blue-700'
                          }`}>
                          {request.urgency.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        {request.requestingUser?.city}, {request.requestingUser?.state}
                      </p>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Organ:</span>
                          <span className="ml-2 font-medium capitalize">{request.organType}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Blood Group:</span>
                          <span className="ml-2 font-medium">{request.patientBloodGroup}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Patient Age:</span>
                          <span className="ml-2 font-medium">{request.patientAge} years</span>
                        </div>
                      </div>
                      {request.additionalDetails && (
                        <p className="text-sm text-gray-600 mt-2">{request.additionalDetails}</p>
                      )}
                    </div>
                    <button className="ml-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium">
                      Respond
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        {/* Create Request Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowRequestForm(!showRequestForm)}
            className="w-full bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition flex items-center justify-center gap-2 text-red-600 font-semibold"
          >
            <Plus className="w-5 h-5" />
            Create Organ Transplant Request
          </button>
        </div>

        {showRequestForm && (
          <OrganRequestForm onClose={() => setShowRequestForm(false)} />
        )}

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Find Hospitals</h2>

          {/* Search Bar */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search hospitals by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <Filter className="w-5 h-5" />
              Filters
              <ChevronDown className={`w-4 h-4 transition ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
    <CustomDropdown
      label="Sort By"
      value={sortBy}
      onChange={(value) => setSortBy(value as string)}
      options={[
        { value: 'urgency', label: 'Urgent Needs First', description: 'Show critical requests first' },
        { value: 'rating', label: 'Highest Rated', description: 'Top-rated hospitals first' },
        { value: 'name', label: 'A-Z', description: 'Alphabetical order' },
      ]}
      placeholder="Select sorting option"
    />
    
    <CustomDropdown
      label="Filter by City"
      value={selectedCity}
      onChange={(value) => setSelectedCity(value as string)}
      options={[
        { value: '', label: 'All Cities', description: 'Show hospitals from all cities' },
        ...cities.map((city) => ({
          value: city,
          label: city,
        })),
      ]}
      placeholder="Select a city"
    />
  </div>
)}

          {/* Hospital Results */}
          <div className="space-y-4">
            {searchResults === undefined ? (
              <div className="text-center py-8 text-gray-500">Loading hospitals...</div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No hospitals found</div>
            ) : (
              searchResults.map((hospital) => (
                <div
                  key={hospital._id}
                  className={`border rounded-lg p-4 hover:shadow-md transition ${hospital.urgentRequestsCount > 0 ? 'border-red-300 bg-red-50' : ''
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{hospital.hospitalName}</h3>
                        {hospital.urgentRequestsCount > 0 && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-600 text-white">
                            {hospital.urgentRequestsCount} URGENT REQUEST{hospital.urgentRequestsCount > 1 ? 'S' : ''}
                          </span>
                        )}
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                          {hospital.hospitalType}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        {hospital.city}, {hospital.state}
                      </p>
                      <p className="text-sm text-gray-600 mb-3">{hospital.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="font-medium">{hospital.averageRating.toFixed(1)}</span>
                          <span className="text-gray-500">({hospital.totalRatings} reviews)</span>
                        </div>
                        {hospital.specializations && hospital.specializations.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {hospital.specializations.slice(0, 3).map((spec) => (
                              <span key={spec} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                                {spec}
                              </span>
                            ))}
                            {hospital.specializations.length > 3 && (
                              <span className="text-gray-500 text-xs">+{hospital.specializations.length - 3} more</span>
                            )}
                          </div>
                        )}
                      </div>
                      {hospital.urgentRequests && hospital.urgentRequests.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-red-200">
                          <p className="text-sm font-medium text-red-700 mb-2">Critical Needs:</p>
                          <div className="flex flex-wrap gap-2">
                            
                            {//eslint-disable-next-line @typescript-eslint/no-explicit-any
                            hospital.urgentRequests.map((req: any) => (
                              <span key={req._id} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                                {req.organType} ({req.patientBloodGroup})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <button 
                    onClick={() => setSelectedHospitalId(hospital._id)}
                    className="ml-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium whitespace-nowrap">
                      View Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {showOrganDetails && (
        <OrganDetailsModal onClose={() => setShowOrganDetails(false)} />
      )}
      {showIncomingRequests && (
        <IncomingRequestsModal onClose={() => setShowIncomingRequests(false)} />
      )}
      {showOutgoingRequests && (
        <OutgoingRequestsModal onClose={() => setShowOutgoingRequests(false)} />
      )}
      {showBloodDonationsModal && (
        <BloodDonationsModal onClose={() => setShowBloodDonationsModal(false)} />
      )}
      {selectedHospitalId && (
  <HospitalDetailsModal
    hospitalId={selectedHospitalId}
    onClose={() => setSelectedHospitalId(null)}
    isOwnHospital={selectedHospitalId === currentHospital?._id}
    isHospitalUser={true}
  />
)}
    </div>
  );
}