'use client';

import { X, MapPin, Star, Users, TrendingUp, Building2, Heart, Calendar, Award, Globe, CheckCircle } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';

interface NGODetailsModalProps {
  ngoId: Id<"ngos">;
  onClose: () => void;
}

export default function NGODetailsModal({ ngoId, onClose }: NGODetailsModalProps) {
  const ngo = useQuery(api.ngos.getNgoById, { ngoId });
  const campaigns = useQuery(api.ngos.getMyCampaigns); // You might want to create a public version
  const ratings = useQuery(api.ngos.getMyRatings); // You might want to create a public version

  if (!ngo) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {ngo.logo ? (
                <img src={ngo.logo} alt={ngo.organizationName} className="w-16 h-16 rounded-xl object-cover bg-white p-2" />
              ) : (
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold">{ngo.organizationName}</h2>
                <p className="text-green-100 flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4" />
                  {ngo.user?.city}, {ngo.user?.state}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-3 mt-4">
            {ngo.verified && (
              <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Verified
              </span>
            )}
            {ngo.categories?.map((cat: string, idx: number) => (
              <span key={idx} className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                {cat}
              </span>
            ))}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 mt-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${star <= (ngo.averageRating || 0)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-white/30'
                  }`}
              />
            ))}
            <span className="text-white font-semibold ml-2">
              {(ngo.averageRating || 0).toFixed(1)}
            </span>
            {(ngo?.totalRatings ?? 0) > 0 && (
              <span className="text-white/80 text-sm">
                ({ngo.totalRatings} reviews)
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* About */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3">About</h3>
            <p className="text-gray-600 leading-relaxed">{ngo.description}</p>
          </div>

          {/* Key Statistics */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Key Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{ngo.totalCampaigns || 0}</p>
                    <p className="text-sm text-gray-600">Campaigns</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{ngo.activeVolunteers || 0}</p>
                    <p className="text-sm text-gray-600">Active Volunteers</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{ngo.popularityScore?.toFixed(1) || 0}</p>
                    <p className="text-sm text-gray-600">Impact Score</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Contact Information</h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              {ngo.user?.phoneNumber && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600">📞</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-semibold text-gray-900">{ngo.user.phoneNumber}</p>
                  </div>
                </div>
              )}
              {ngo.user?.address && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-semibold text-gray-900">{ngo.user.address}, {ngo.user.city}, {ngo.user.state} - {ngo.user.pincode}</p>
                  </div>
                </div>
              )}
              {ngo.websiteUrl && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Globe className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Website</p>
                    <a href={ngo.websiteUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-green-600 hover:underline">
                      {ngo.websiteUrl}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Registration Info */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Registration Details</h3>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">Registration Number</p>
              <p className="font-semibold text-gray-900 mt-1">{ngo.registrationNumber}</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Close
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            <Heart className="w-4 h-4 mr-2" />
            Donate Now
          </Button>
        </div>
      </div>
    </div>
  );
}