import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { toast } from 'sonner';
import { 
  Building2, 
  Heart, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Users, 
  LayoutGrid, 
  List,
  Phone,
  MapPin,
  Mail,
  Calendar,
  Award,
  TrendingUp,
  AlertCircle,
  FileText
} from 'lucide-react';
import { Id } from '../convex/_generated/dataModel';

interface DeleteModal {
  type: 'hospital' | 'ngo';
  id: Id<'hospitals'> | Id<'ngos'>;
  name: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'hospitals' | 'ngos'>('hospitals');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [showDeleteModal, setShowDeleteModal] = useState<DeleteModal | null>(null);

  const hospitals = useQuery(api.admin.getAllHospitals);
  const ngos = useQuery(api.admin.getAllNgos);
  const stats = useQuery(api.admin.getAdminStats);
  
  const updateHospitalVerification = useMutation(api.admin.updateHospitalVerification);
  const updateNgoVerification = useMutation(api.admin.updateNgoVerification);
  const deleteHospital = useMutation(api.admin.deleteHospital);
  const deleteNgo = useMutation(api.admin.deleteNgo);

  const handleVerifyHospital = async (hospitalId: Id<'hospitals'>, verified: boolean) => {
    try {
      await updateHospitalVerification({ hospitalId, verified });
      toast.success(verified ? 'Hospital verified successfully!' : 'Verification revoked');
    } catch (error) {
      console.error('Error updating hospital verification:', error);
      toast.error('Failed to update verification status');
    }
  };

  const handleVerifyNgo = async (ngoId: Id<'ngos'>, verified: boolean) => {
    try {
      await updateNgoVerification({ ngoId, verified });
      toast.success(verified ? 'NGO verified successfully!' : 'Verification revoked');
    } catch (error) {
      console.error('Error updating NGO verification:', error);
      toast.error('Failed to update verification status');
    }
  };

  const handleDelete = async () => {
    if (!showDeleteModal) return;
    
    try {
      if (showDeleteModal.type === 'hospital') {
        await deleteHospital({ hospitalId: showDeleteModal.id as Id<'hospitals'> });
        toast.success('Hospital deleted successfully');
      } else {
        await deleteNgo({ ngoId: showDeleteModal.id as Id<'ngos'> });
        toast.success('NGO deleted successfully');
      }
      setShowDeleteModal(null);
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete. Please try again.');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  interface StatsCardProps {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: number;
    color: string;
  }

  const StatsCard = ({ icon: Icon, label, value, color }: StatsCardProps) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const HospitalTableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hospital</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration No.</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {hospitals?.map((hospital) => (
            <tr key={hospital._id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div>
                  <div className="text-sm font-medium text-gray-900">{hospital.hospitalName}</div>
                  <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    {hospital.user?.city}, {hospital.user?.state}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-mono text-gray-900">{hospital.registrationNumber}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">{hospital.user?.email}</div>
                <div className="text-sm text-gray-500">{hospital.user?.phoneNumber || 'N/A'}</div>
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 capitalize">
                  {hospital.hospitalType}
                </span>
              </td>
              <td className="px-6 py-4">
                {hospital.verified ? (
                  <span className="flex items-center gap-1 text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4" /> Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-yellow-600 text-sm">
                    <AlertCircle className="w-4 h-4" /> Pending
                  </span>
                )}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {formatDate(hospital.user?.createdAt || Date.now())}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  {hospital.verified ? (
                    <button
                      onClick={() => handleVerifyHospital(hospital._id, false)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
                    >
                      Revoke
                    </button>
                  ) : (
                    <button
                      onClick={() => handleVerifyHospital(hospital._id, true)}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm"
                    >
                      Verify
                    </button>
                  )}
                  <button
                    aria-label="Delete Hospital"
                    onClick={() => setShowDeleteModal({ type: 'hospital', id: hospital._id, name: hospital.hospitalName })}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const HospitalCardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {hospitals?.map((hospital) => (
        <div key={hospital._id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{hospital.hospitalName}</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 capitalize mt-1 inline-block">
                  {hospital.hospitalType}
                </span>
              </div>
            </div>
            {hospital.verified && (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">Reg No:</span>
              <span className="font-mono text-xs text-gray-900 bg-gray-50 px-2 py-1 rounded">
                {hospital.registrationNumber}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="w-4 h-4" />
              {hospital.user?.email}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4" />
              {hospital.user?.phoneNumber || 'N/A'}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              {hospital.user?.city}, {hospital.user?.state}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              Joined {formatDate(hospital.user?.createdAt || Date.now())}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 flex gap-2">
            {hospital.verified ? (
              <button
                onClick={() => handleVerifyHospital(hospital._id, false)}
                className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
              >
                Revoke Verification
              </button>
            ) : (
              <button
                onClick={() => handleVerifyHospital(hospital._id, true)}
                className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium"
              >
                Verify Hospital
              </button>
            )}
            <button
              aria-label="Delete Hospital"
              onClick={() => setShowDeleteModal({ type: 'hospital', id: hospital._id, name: hospital.hospitalName })}
              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const NgoTableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration No.</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stats</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {ngos?.map((ngo) => (
            <tr key={ngo._id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div>
                  <div className="text-sm font-medium text-gray-900">{ngo.organizationName}</div>
                  <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    {ngo.user?.city}, {ngo.user?.state}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-mono text-gray-900">{ngo.registrationNumber}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">{ngo.user?.email}</div>
                <div className="text-sm text-gray-500">{ngo.user?.phoneNumber || 'N/A'}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-xs space-y-1">
                  <div className="text-gray-600">Campaigns: {ngo.totalCampaigns || 0}</div>
                  <div className="text-gray-600">Donations: {ngo.totalDonations || 0}</div>
                  <div className="text-gray-600">Volunteers: {ngo.totalVolunteers || 0}</div>
                </div>
              </td>
              <td className="px-6 py-4">
                {ngo.verified ? (
                  <span className="flex items-center gap-1 text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4" /> Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-yellow-600 text-sm">
                    <AlertCircle className="w-4 h-4" /> Pending
                  </span>
                )}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {formatDate(ngo.user?.createdAt || Date.now())}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  {ngo.verified ? (
                    <button
                      onClick={() => handleVerifyNgo(ngo._id, false)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
                    >
                      Revoke
                    </button>
                  ) : (
                    <button
                      onClick={() => handleVerifyNgo(ngo._id, true)}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm"
                    >
                      Verify
                    </button>
                  )}
                  <button
                    aria-label="Delete NGO"
                    onClick={() => setShowDeleteModal({ type: 'ngo', id: ngo._id, name: ngo.organizationName })}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const NgoCardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {ngos?.map((ngo) => (
        <div key={ngo._id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Heart className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{ngo.organizationName}</h3>
                {ngo.categories && ngo.categories.length > 0 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800 mt-1 inline-block">
                    {ngo.categories[0]}
                  </span>
                )}
              </div>
            </div>
            {ngo.verified && (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">Reg No:</span>
              <span className="font-mono text-xs text-gray-900 bg-gray-50 px-2 py-1 rounded">
                {ngo.registrationNumber}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="w-4 h-4" />
              {ngo.user?.email}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4" />
              {ngo.user?.phoneNumber || 'N/A'}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              {ngo.user?.city}, {ngo.user?.state}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              Joined {formatDate(ngo.user?.createdAt || Date.now())}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">{ngo.totalCampaigns || 0}</div>
              <div className="text-xs text-gray-500">Campaigns</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">{ngo.totalDonations || 0}</div>
              <div className="text-xs text-gray-500">Donations</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">{ngo.totalVolunteers || 0}</div>
              <div className="text-xs text-gray-500">Volunteers</div>
            </div>
          </div>

          <div className="flex gap-2">
            {ngo.verified ? (
              <button
                onClick={() => handleVerifyNgo(ngo._id, false)}
                className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
              >
                Revoke Verification
              </button>
            ) : (
              <button
                onClick={() => handleVerifyNgo(ngo._id, true)}
                className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium"
              >
                Verify NGO
              </button>
            )}
            <button
              aria-label="Delete NGO"
              onClick={() => setShowDeleteModal({ type: 'ngo', id: ngo._id, name: ngo.organizationName })}
              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  if (!hospitals || !ngos || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage hospitals and NGOs verification</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            icon={Building2}
            label="Total Hospitals"
            value={stats.totalHospitals}
            color="bg-blue-500"
          />
          <StatsCard
            icon={CheckCircle}
            label="Verified Hospitals"
            value={stats.verifiedHospitals}
            color="bg-green-500"
          />
          <StatsCard
            icon={Heart}
            label="Total NGOs"
            value={stats.totalNgos}
            color="bg-purple-500"
          />
          <StatsCard
            icon={Award}
            label="Verified NGOs"
            value={stats.verifiedNgos}
            color="bg-green-500"
          />
        </div>

        {/* Controls */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center justify-between">
            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('hospitals')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'hospitals'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Hospitals ({hospitals.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('ngos')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'ngos'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  NGOs ({ngos.length})
                </div>
              </button>
            </div>

            {/* View Toggle */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                aria-label="Table View"
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                aria-label="Card View"
                onClick={() => setViewMode('card')}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  viewMode === 'card'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {activeTab === 'hospitals' ? (
            viewMode === 'table' ? (
              <HospitalTableView />
            ) : (
              <div className="p-6">
                <HospitalCardView />
              </div>
            )
          ) : (
            viewMode === 'table' ? (
              <NgoTableView />
            ) : (
              <div className="p-6">
                <NgoCardView />
              </div>
            )
          )}
        </div>

        {/* Empty State */}
        {activeTab === 'hospitals' && hospitals.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hospitals registered yet</p>
          </div>
        )}
        
        {activeTab === 'ngos' && ngos.length === 0 && (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No NGOs registered yet</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{showDeleteModal.name}</strong>? This action cannot be undone and will delete all associated data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}