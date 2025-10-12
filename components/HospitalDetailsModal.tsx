import { X, MapPin, Star, Phone, Building2, Stethoscope, Bed, TrendingUp, Heart, Calendar, Award, Clock, MessageSquare, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import { useUser } from '@clerk/nextjs';
import { Id } from '@/convex/_generated/dataModel';

interface HospitalDetailsModalProps {
  hospitalId: Id<"hospitals">;
  onClose: () => void;
  isOwnHospital?: boolean;
  isHospitalUser?: boolean;
}

export default function HospitalDetailsModal({ 
  hospitalId, 
  onClose, 
  isOwnHospital = false, 
  isHospitalUser = false 
}: HospitalDetailsModalProps) {
  const { user } = useUser();
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [review, setReview] = useState('');
  const [isRating, setIsRating] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'contact'>('overview');

  // Fetch hospital details
  const hospital = useQuery(api.hospitals.getHospitalById, { hospitalId });
  
  // Fetch all reviews for this hospital
  const reviews = useQuery(api.hospitalRatings.getHospitalReviews, { hospitalId });

  // Mutation for rating
  const rateHospital = useMutation(api.popularityScores.submitHospitalRating);

  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!hospital) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600">Loading hospital details...</p>
        </div>
      </div>
    );
  }

  const openRatingModal = () => {
    if (!user) {
      toast.error('Please sign in to rate');
      return;
    }
    if (isOwnHospital) {
      toast.error('You cannot rate your own hospital');
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
      await rateHospital({
        hospitalId: hospital._id,
        rating: selectedRating,
        review: review || undefined,
      });

      toast.success('Rating submitted successfully!');
      setShowRatingModal(false);
      setSelectedRating(0);
      setReview('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit rating');
    } finally {
      setIsRating(false);
    }
  };

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
                  isFilled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
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
      </div>
    );
  };

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

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleDonateBlood = () => {
    if (isOwnHospital) {
      toast.error('You cannot donate blood to your own hospital');
      return;
    }
    if (!user) {
      toast.error('Please sign in to donate blood');
      return;
    }
    // Navigate to blood donation form
    toast.success('Redirecting to blood donation signup...');
    // TODO: Add navigation to blood donation form with hospitalId pre-selected
    console.log('Navigate to blood donation with hospital:', hospitalId);
  };

  return (
    <>
      {/* Modal Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        {/* Modal Container */}
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
          {/* Header with Hero Section */}
          <div className="relative bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-8">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-20 h-20 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="w-10 h-10 text-rose-500" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {hospital.hospitalName}
                </h2>
                
                <div className="flex items-center gap-2 text-white/90 mb-3">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">
                    {hospital.user?.city}, {hospital.user?.state}
                  </span>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {hospital.verified && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold text-white">
                      <Award className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold text-white capitalize">
                    {hospital.hospitalType}
                  </span>
                  {renderDisplayStars(hospital.averageRating)}
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="flex gap-1 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 font-medium text-sm transition-all ${
                  activeTab === 'overview'
                    ? 'text-rose-600 border-b-2 border-rose-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-6 py-3 font-medium text-sm transition-all ${
                  activeTab === 'reviews'
                    ? 'text-rose-600 border-b-2 border-rose-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Reviews ({hospital.totalRatings || 0})
              </button>
              <button
                onClick={() => setActiveTab('contact')}
                className={`px-6 py-3 font-medium text-sm transition-all ${
                  activeTab === 'contact'
                    ? 'text-rose-600 border-b-2 border-rose-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Contact & Location
              </button>
            </div>
          </div>

          {/* Content Area - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">About</h3>
                  <p className="text-gray-600 leading-relaxed">{hospital.description}</p>
                </div>

                {/* Key Stats */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Key Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {hospital.totalBeds && (
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
                        <Bed className="w-6 h-6 text-blue-600 mb-2" />
                        <p className="text-2xl font-bold text-blue-900">{hospital.totalBeds}</p>
                        <p className="text-xs text-blue-700">Total Beds</p>
                      </div>
                    )}
                    {(hospital.totalBloodDonations ?? 0 )> 0 && (
                      <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl">
                        <TrendingUp className="w-6 h-6 text-red-600 mb-2" />
                        <p className="text-2xl font-bold text-red-900">{hospital.totalBloodDonations}</p>
                        <p className="text-xs text-red-700">Blood Donations</p>
                      </div>
                    )}
                    {(hospital.totalOrganTransplants ?? 0) > 0 && (
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
                        <Heart className="w-6 h-6 text-purple-600 mb-2" />
                        <p className="text-2xl font-bold text-purple-900">{hospital.totalOrganTransplants}</p>
                        <p className="text-xs text-purple-700">Organ Transplants</p>
                      </div>
                    )}
                    {(hospital.popularityScore ?? 0) > 0 && (
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl">
                        <Award className="w-6 h-6 text-orange-600 mb-2" />
                        <p className="text-2xl font-bold text-orange-900">{(hospital.popularityScore ?? 0).toFixed(1)}</p>
                        <p className="text-xs text-orange-700">Impact Score</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Specializations */}
                {hospital.specializations && hospital.specializations.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Specializations</h3>
                    <div className="flex flex-wrap gap-2">
                      {hospital.specializations.map((spec, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-700"
                        >
                          <Stethoscope className="w-4 h-4 text-gray-500" />
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {/* Rating Summary */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Overall Rating</h3>
                      <div className="flex items-center gap-3">
                        <span className="text-4xl font-bold text-gray-900">
                          {hospital.averageRating ? hospital.averageRating.toFixed(1) : '0.0'}
                        </span>
                        {renderDisplayStars(hospital.averageRating)}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Based on {hospital.totalRatings || 0} {hospital.totalRatings === 1 ? 'review' : 'reviews'}
                      </p>
                    </div>
                    {!isOwnHospital && (
                      <button
                        onClick={openRatingModal}
                        className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                      >
                        Write a Review
                      </button>
                    )}
                  </div>
                </div>

                {/* Individual Reviews */}
                {reviews && reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((reviewItem) => (
                      <div key={reviewItem._id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-400 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{reviewItem.user?.name || 'Anonymous'}</p>
                              <p className="text-xs text-gray-500">{formatDate(reviewItem.createdAt)}</p>
                            </div>
                          </div>
                          {renderDisplayStars(reviewItem.rating)}
                        </div>
                        {reviewItem.review && (
                          <p className="text-gray-600 leading-relaxed">{reviewItem.review}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No reviews yet. Be the first to review!</p>
                    {!isOwnHospital && (
                      <button
                        onClick={openRatingModal}
                        className="mt-4 px-6 py-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all"
                      >
                        Write First Review
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Contact & Location Tab */}
            {activeTab === 'contact' && (
              <div className="space-y-6">
                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    {hospital.user?.phoneNumber && (
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                        <Phone className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Phone</p>
                          <p className="text-gray-900 font-semibold">{hospital.user.phoneNumber}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                      <MapPin className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Address</p>
                        <p className="text-gray-900 font-semibold">
                          {hospital.user?.address || 'Address not available'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {hospital.user?.city}, {hospital.user?.state} - {hospital.user?.pincode}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Map */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Location</h3>
                  <div className="bg-gray-100 rounded-xl overflow-hidden border border-gray-200" style={{ height: '400px' }}>
                    <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(
                        `${hospital.hospitalName}, ${hospital.user?.city}, ${hospital.user?.state}`
                      )}`}
                      title="Hospital Location"
                    />
                    {/* Fallback message if API key not configured */}
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium mb-1">{hospital.hospitalName}</p>
                        <p className="text-sm text-gray-500">
                          {hospital.user?.city}, {hospital.user?.state}
                        </p>
                        <p className="text-xs text-gray-400 mt-4">
                          Map integration available with Google Maps API
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer with Actions */}
          {/* Footer with Actions */}
<div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
  {!isOwnHospital && !isHospitalUser && (
    <>
      <button
        onClick={openRatingModal}
        className="px-6 py-2.5 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-all"
      >
        Rate Hospital
      </button>
      <button
        onClick={handleDonateBlood}
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
      >
        <Heart className="w-4 h-4" />
        Donate Blood
      </button>
    </>
  )}
  {isOwnHospital && (
    <p className="text-sm text-gray-500 italic">
      This is your hospital
    </p>
  )}
  {isHospitalUser && !isOwnHospital && (
    <p className="text-sm text-gray-500 italic">
      Viewing as hospital account
    </p>
  )}
</div>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-4">
              <h3 className="text-xl font-bold text-white">Rate Hospital</h3>
              <p className="text-sm text-white/90 mt-1">{hospital.hospitalName}</p>
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