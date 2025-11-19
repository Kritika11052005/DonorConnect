'use client';

import { X, MapPin, Star, Users, TrendingUp, Calendar, Heart, Building2, Target, DollarSign } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface CampaignDetailsModalProps {
  campaignId: Id<"fundraisingCampaigns">;
  onClose: () => void;
}

export default function CampaignDetailsModal({ campaignId, onClose }: CampaignDetailsModalProps) {
  const campaign = useQuery(api.ngos.getCampaignById, { campaignId });

  if (!campaign) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const progress = (campaign.raisedAmount / campaign.targetAmount) * 100;
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{campaign.title}</h2>
              
              {/* Status Badge */}
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                campaign.status === 'active' ? 'bg-white/20 text-white' :
                campaign.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="font-semibold">{formatCurrency(campaign.raisedAmount)} raised</span>
              <span>of {formatCurrency(campaign.targetAmount)} goal</span>
            </div>
            <div className="w-full h-3 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <p className="text-sm mt-2">{progress.toFixed(1)}% funded • {campaign.totalDonors || 0} donors</p>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 mt-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= (campaign.averageRating || 0)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-white/30'
                }`}
              />
            ))}
            <span className="text-white font-semibold ml-2">
              {(campaign.averageRating || 0).toFixed(1)}
            </span>
            {campaign?.totalRatings > 0 && (
              <span className="text-white/80 text-sm">
                ({campaign.totalRatings} reviews)
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Description */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3">About This Campaign</h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">{campaign.description}</p>
          </div>

          {/* Campaign Details */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Campaign Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Start Date</p>
                    <p className="font-semibold text-gray-900">{format(new Date(campaign.startDate), 'MMM dd, yyyy')}</p>
                  </div>
                </div>
              </div>

              {campaign.endDate && (
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">End Date</p>
                      <p className="font-semibold text-gray-900">{format(new Date(campaign.endDate), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="font-semibold text-gray-900">{campaign.category}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Target Amount</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(campaign.targetAmount)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Organized By */}
          {campaign.ngo && (
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Organized By</h3>
              <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{campaign.ngo.organizationName}</p>
                    {campaign.ngo.user && (
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {campaign.ngo.user.city}, {campaign.ngo.user.state}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
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