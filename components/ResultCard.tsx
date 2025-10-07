import { MapPin, Star, Calendar, TrendingUp, Users, StarIcon, Target, Heart, DollarSign, BookOpen, Shirt, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import { useUser } from '@clerk/nextjs';

interface ResultCardProps {
  result: any;
  type: 'hospital' | 'ngo' | 'campaign';
  onViewDetails: (id: string) => void;
}

export default function ResultCard({ result, type, onViewDetails }: ResultCardProps) {
  const { user } = useUser();
  const [isRating, setIsRating] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [review, setReview] = useState('');
  const [showDonateDropdown, setShowDonateDropdown] = useState(false);

  // Mutations for rating - using popularityScores functions
  const rateHospital = useMutation(api.popularityScores.submitHospitalRating);
  const rateNgo = useMutation(api.popularityScores.submitNGORating);
  const rateCampaign = useMutation(api.popularityScores.submitCampaignRating);

  const openRatingModal = () => {
    if (!user) {
      toast.error('Please sign in to rate');
      return;
    }
    setShowRatingModal(true);
  };

  const submitRating = async () => {
    if (!user) {
      toast.error('Please sign in to rate');
      return;
    }

    if (selectedRating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setIsRating(true);

    try {
      if (type === 'hospital') {
        await rateHospital({
          hospitalId: result._id,
          rating: selectedRating,
          review: review || undefined,
        });
      } else if (type === 'ngo') {
        await rateNgo({
          ngoId: result._id,
          rating: selectedRating,
          review: review || undefined,
        });
      } else if (type === 'campaign') {
        await rateCampaign({
          campaignId: result._id,
          rating: selectedRating,
          review: review || undefined,
        });
      }

      toast.success('Rating submitted successfully!');
      setShowRatingModal(false);
      setSelectedRating(0);
      setReview('');
      
      // Optionally refresh the page or refetch data to show updated rating
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit rating');
    } finally {
      setIsRating(false);
    }
  };

  // Display stars - NOT interactive, just shows the average rating
  const renderDisplayStars = (rating?: number) => {
    const stars = rating || 0;
    const fullStars = Math.floor(stars);
    const hasHalfStar = stars % 1 >= 0.5;

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= fullStars;
          const isHalf = star === fullStars + 1 && hasHalfStar;

          return (
            <div key={star} className="relative">
              <Star
                className={`w-5 h-5 ${
                  isFilled
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
              {isHalf && (
                <div className="absolute inset-0 overflow-hidden w-1/2">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                </div>
              )}
            </div>
          );
        })}
        <span className="text-sm text-gray-700 ml-2 font-semibold">
          {stars > 0 ? stars.toFixed(1) : 'No ratings'}
        </span>
        {result.totalRatings > 0 && (
          <span className="text-xs text-gray-500 ml-1">
            ({result.totalRatings} {result.totalRatings === 1 ? 'review' : 'reviews'})
          </span>
        )}
      </div>
    );
  };

  // Interactive stars for modal
  const renderInteractiveStars = () => {
    return (
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setSelectedRating(star)}
            className="transition-all hover:scale-125 focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded"
          >
            <Star
              className={`w-10 h-10 transition-colors ${
                star <= selectedRating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 hover:text-gray-400'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getProgressPercentage = () => {
    if (type === 'campaign' && result.targetAmount) {
      return Math.min((result.raisedAmount / result.targetAmount) * 100, 100);
    }
    return 0;
  };

  const donationTypes = [
    { value: 'money', label: 'Money', icon: <DollarSign className="w-5 h-5 text-green-600" /> },
    { value: 'books', label: 'Books', icon: <BookOpen className="w-5 h-5 text-blue-600" /> },
    { value: 'clothes', label: 'Clothes', icon: <Shirt className="w-5 h-5 text-purple-600" /> },
    { value: 'food', label: 'Food', icon: <Package className="w-5 h-5 text-orange-600" /> },
  ];

  const handleDonateClick = (donationType?: string) => {
    if (!user) {
      toast.error('Please sign in to donate');
      return;
    }
    
    if (type === 'ngo' && donationType) {
      // Handle NGO donation navigation with type
      toast.success(`Redirecting to ${donationType} donation...`);
      // TODO: Navigate to donation page with NGO ID and donation type
      console.log(`Donate ${donationType} to NGO:`, result._id);
    } else if (type === 'campaign') {
      // Handle campaign donation
      toast.success('Redirecting to campaign donation...');
      // TODO: Navigate to campaign donation page
      console.log('Donate to campaign:', result._id);
    }
    setShowDonateDropdown(false);
  };

  return (
    <>
      <div className="group p-6 border-2 border-gray-100 rounded-2xl hover:border-rose-300 hover:shadow-xl transition-all bg-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Title */}
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-rose-600 transition-colors line-clamp-2">
                  {result.hospitalName || result.organizationName || result.title}
                </h3>
                
                {/* Location */}
                {result.user && (
                  <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">
                      {result.user.city}, {result.user.state}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-600 mb-4 line-clamp-2 text-sm leading-relaxed">
              {result.description}
            </p>

            {/* Campaign Progress Bar */}
            {type === 'campaign' && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="font-semibold text-gray-700">
                    {formatCurrency(result.raisedAmount)} raised
                  </span>
                  <span className="text-gray-500">
                    of {formatCurrency(result.targetAmount)} goal
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${getProgressPercentage()}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {getProgressPercentage().toFixed(1)}% funded
                </p>
              </div>
            )}

            {/* Overall Rating Display (Non-Interactive) */}
            <div className="mb-3">
              {renderDisplayStars(result.averageRating)}
            </div>

            {/* Click to Rate Button */}
            <button
              onClick={openRatingModal}
              className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 border-2 border-yellow-200 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 transition-all group/rate"
            >
              <StarIcon className="w-4 h-4 text-yellow-500 group-hover/rate:scale-110 transition-transform" />
              <span>Click to Rate</span>
            </button>

            {/* Metadata Row */}
            <div className="flex items-center gap-4 flex-wrap mb-4">
              {/* Verified Badge */}
              {result.verified && (
                <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Verified
                </span>
              )}

              {/* Status Badge */}
              {result.status && (
                <span
                  className={`text-xs px-3 py-1 rounded-full font-semibold ${
                    result.status === 'active'
                      ? 'bg-emerald-100 text-emerald-700'
                      : result.status === 'completed'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                </span>
              )}

              {/* Hospital Type */}
              {type === 'hospital' && result.hospitalType && (
                <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
                  {result.hospitalType.charAt(0).toUpperCase() +
                    result.hospitalType.slice(1)}
                </span>
              )}
            </div>

            {/* Additional Stats */}
            <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
              {/* Hospital Stats */}
              {type === 'hospital' && (
                <>
                  {result.totalBloodDonations > 0 && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-red-500" />
                      <span>{result.totalBloodDonations} blood donations</span>
                    </div>
                  )}
                  {result.totalBeds && (
                    <div className="flex items-center gap-1">
                      <span>🛏️ {result.totalBeds} beds</span>
                    </div>
                  )}
                </>
              )}

              {/* NGO Stats */}
              {type === 'ngo' && (
                <>
                  {result.totalVolunteers > 0 && (
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-green-500" />
                      <span>{result.totalVolunteers} volunteers</span>
                    </div>
                  )}
                  {result.totalAmountRaised > 0 && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-purple-500" />
                      <span>{formatCurrency(result.totalAmountRaised)} raised</span>
                    </div>
                  )}
                </>
              )}

              {/* Campaign Stats */}
              {type === 'campaign' && (
                <>
                  {result.totalDonors > 0 && (
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span>{result.totalDonors} donors</span>
                    </div>
                  )}
                  {result.endDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-orange-500" />
                      <span>Ends {formatDate(result.endDate)}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Categories/Specializations */}
            {(result.categories || result.specializations) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {(result.categories || result.specializations)
                  .slice(0, 4)
                  .map((item: string, index: number) => (
                    <span
                      key={index}
                      className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full"
                    >
                      {item}
                    </span>
                  ))}
                {(result.categories || result.specializations).length > 4 && (
                  <span className="text-xs text-gray-500 px-2 py-1">
                    +{(result.categories || result.specializations).length - 4} more
                  </span>
                )}
              </div>
            )}

            {/* Campaign NGO Info */}
            {type === 'campaign' && result.ngo && (
              <div className="mt-4 p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600 mb-1">Organized by:</p>
                <p className="text-sm font-semibold text-gray-900">
                  {result.ngo.organizationName}
                </p>
                {result.ngo.user && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    {result.ngo.user.city}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action Button and Impact Score */}
          <div className="flex-shrink-0 flex flex-col items-end gap-3">
            {/* Popularity Score Badge */}
            {result.popularityScore > 0 && (
              <div className="text-center">
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full">
                  <Target className="w-3 h-3 text-orange-600" />
                  <span className="text-xs font-bold text-orange-700">
                    {result.popularityScore.toFixed(1)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Impact Score</p>
              </div>
            )}

            {/* Donate Button for NGOs with Dropdown */}
            {type === 'ngo' && (
              <div className="relative">
                <button
                  onClick={() => setShowDonateDropdown(!showDonateDropdown)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all whitespace-nowrap"
                >
                  <Heart className="w-4 h-4" />
                  Donate Now
                </button>

                {/* Custom Dropdown */}
                {showDonateDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white border-2 border-gray-200 rounded-xl shadow-2xl overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                    <div className="p-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase px-3 py-2">
                        Choose Donation Type
                      </p>
                      {donationTypes.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => handleDonateClick(type.value)}
                          className="w-full px-3 py-3 text-left transition-all duration-150 flex items-center gap-3 rounded-lg hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 group"
                        >
                          <span className="flex-shrink-0 group-hover:scale-110 transition-transform">
                            {type.icon}
                          </span>
                          <span className="block font-medium text-gray-900 group-hover:text-green-700">
                            {type.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Donate Button for Campaigns */}
            {type === 'campaign' && (
              <button
                onClick={() => handleDonateClick()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all whitespace-nowrap"
              >
                <Heart className="w-4 h-4" />
                Donate Now
              </button>
            )}
            
            <Button
              onClick={() => onViewDetails(result._id)}
              className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all whitespace-nowrap"
            >
              View Details
              <svg
                className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Button>
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-4">
              <h3 className="text-xl font-bold text-white">
                Rate {type === 'hospital' ? 'Hospital' : type === 'ngo' ? 'NGO' : 'Campaign'}
              </h3>
              <p className="text-sm text-white/90 mt-1">
                {result.hospitalName || result.organizationName || result.title}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Your Rating:</p>
                {renderInteractiveStars()}
                <p className="text-center mt-2 text-sm text-gray-600">
                  {selectedRating === 0 
                    ? 'Select a rating' 
                    : `${selectedRating} star${selectedRating > 1 ? 's' : ''}`}
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Review (Optional)
                </label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Share your experience..."
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all resize-none"
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {review.length}/500 characters
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowRatingModal(false);
                    setSelectedRating(0);
                    setReview('');
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  disabled={isRating}
                >
                  Cancel
                </button>
                <button
                  onClick={submitRating}
                  disabled={isRating || selectedRating === 0}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-medium hover:from-rose-600 hover:to-pink-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRating ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}