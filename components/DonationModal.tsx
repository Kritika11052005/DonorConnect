// components/DonationModal.tsx
'use client';

import { useState } from 'react';
import { X, Heart, Loader2, CreditCard, Calendar, BookOpen, Shirt, Package, MapPin, Clock, Phone, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useUser } from '@clerk/nextjs';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'ngo' | 'campaign';
  targetId: string;
  targetName: string;
  itemType?: 'money' | 'books' | 'clothes' | 'food';
}

export default function DonationModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetName,
  itemType = 'money',
}: DonationModalProps) {
  const { user } = useUser();
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Money donation state
  const [amount, setAmount] = useState<string>('');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [donationType, setDonationType] = useState<'one_time' | 'recurring'>('one_time');

  // Physical donation state
  const [quantity, setQuantity] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [pickupAddress, setPickupAddress] = useState<string>('');
  const [pickupCity, setPickupCity] = useState<string>('');
  const [pickupState, setPickupState] = useState<string>('');
  const [pickupPincode, setPickupPincode] = useState<string>('');
  const [pickupDate, setPickupDate] = useState<string>('');
  const [pickupTime, setPickupTime] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [specialInstructions, setSpecialInstructions] = useState<string>('');

  const createPaymentSession = useMutation(api.payments.createPaymentSession);
  const createPhysicalDonation = useMutation(api.donation.createPhysicalDonation);

  const predefinedAmounts = [100, 500, 1000, 2500, 5000, 10000];

  const isPhysicalDonation = itemType !== 'money';

  const handleAmountClick = (value: number) => {
    setAmount(value.toString());
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setAmount(value);
  };

  const getDisplayAmount = () => {
    if (customAmount) return parseFloat(customAmount);
    if (amount) return parseFloat(amount);
    return 0;
  };

  const getItemIcon = () => {
    switch (itemType) {
      case 'books': return <BookOpen className="w-6 h-6 text-blue-600" />;
      case 'clothes': return <Shirt className="w-6 h-6 text-purple-600" />;
      case 'food': return <Package className="w-6 h-6 text-orange-600" />;
      default: return <Heart className="w-6 h-6 text-white" />;
    }
  };

  const getItemTitle = () => {
    const titles = {
      money: 'Make a Donation',
      books: 'Donate Books',
      clothes: 'Donate Clothes',
      food: 'Donate Food',
    };
    return titles[itemType];
  };

  const getUnit = () => {
    const units = {
      books: 'books',
      clothes: 'pieces',
      food: 'kg',
      money: '',
    };
    return units[itemType];
  };

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const validateStep1 = () => {
    if (isPhysicalDonation) {
      const qty = parseFloat(quantity);
      if (!qty || qty <= 0) {
        toast.error('Please enter a valid quantity');
        return false;
      }
      if (!description.trim()) {
        toast.error('Please describe what you are donating');
        return false;
      }
    }
    return true;
  };

  const validateStep2 = () => {
    if (!pickupAddress.trim()) {
      toast.error('Please enter your pickup address');
      return false;
    }
    if (!pickupCity.trim()) {
      toast.error('Please enter your city');
      return false;
    }
    if (!pickupState.trim()) {
      toast.error('Please enter your state');
      return false;
    }
    if (!pickupPincode.trim() || pickupPincode.length !== 6) {
      toast.error('Please enter a valid 6-digit pincode');
      return false;
    }
    if (!pickupDate) {
      toast.error('Please select a pickup date');
      return false;
    }
    if (!pickupTime) {
      toast.error('Please select a pickup time');
      return false;
    }
    if (!contactPhone.trim() || contactPhone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleDonate = async () => {
    if (!user) {
      toast.error('Please sign in to donate');
      return;
    }

    setIsProcessing(true);

    try {
      if (itemType === 'money') {
        const donationAmount = getDisplayAmount();

        if (!donationAmount || donationAmount < 1) {
          toast.error('Please enter a valid amount (minimum ₹1)');
          setIsProcessing(false);
          return;
        }

        if (donationAmount > 100000) {
          toast.error('Maximum donation amount is ₹1,00,000');
          setIsProcessing(false);
          return;
        }

        // Create checkout session via API
        const response = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: donationAmount,
            targetType,
            targetId,
            targetName,
            donationType,
            itemType,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create checkout session');
        }

        const { sessionId, url } = await response.json();

        // Store payment session in Convex
        await createPaymentSession({
          clerkUserId: user.id,
          targetType,
          targetId,
          stripeSessionId: sessionId,
          amount: donationAmount,
          currency: 'INR',
          paymentType: donationType,
          donationItemType: itemType,
        });

        // Redirect to Stripe Checkout
        window.location.href = url;
      } else {
        // Physical donation
        if (!validateStep2()) {
          setIsProcessing(false);
          return;
        }

        await createPhysicalDonation({
          targetType,
          targetId,
          donationType: itemType,
          quantity: parseFloat(quantity),
          unit: getUnit(),
          description,
          pickupAddress,
          pickupCity,
          pickupState,
          pickupPincode,
          pickupDate: new Date(pickupDate).getTime(),
          pickupTime,
          contactPhone,
          specialInstructions,
        });

        toast.success('Donation scheduled successfully! We will contact you for pickup.');
        handleClose();
      }
    } catch (error: unknown) {
      console.error('Donation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process donation');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setAmount('');
    setCustomAmount('');
    setDonationType('one_time');
    setQuantity('');
    setDescription('');
    setPickupAddress('');
    setPickupCity('');
    setPickupState('');
    setPickupPincode('');
    setPickupDate('');
    setPickupTime('');
    setContactPhone('');
    setSpecialInstructions('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-500 to-pink-500 px-8 py-6 relative flex-shrink-0">
          <button
          aria-label="Close donation modal"
            onClick={handleClose}
            className="absolute top-6 right-6 text-white hover:bg-white/20 rounded-full p-2 transition-all"
            disabled={isProcessing}
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              {getItemIcon()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{getItemTitle()}</h2>
              <p className="text-white/90 text-sm mt-1">Supporting {targetName}</p>
            </div>
          </div>

          {/* Progress indicator for physical donations */}
          {isPhysicalDonation && (
            <div className="flex items-center gap-2 mt-4">
              <div className={`flex-1 h-1 rounded ${step >= 1 ? 'bg-white' : 'bg-white/30'}`} />
              <div className={`flex-1 h-1 rounded ${step >= 2 ? 'bg-white' : 'bg-white/30'}`} />
            </div>
          )}
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto flex-1">
          <div className="p-8">
            {itemType === 'money' ? (
              // MONEY DONATION FLOW
              <>
                {/* Donation Type Toggle */}
                <div className="mb-6">
                  <label className="text-sm font-semibold text-gray-700 block mb-3">
                    Donation Type
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDonationType('one_time')}
                      disabled={isProcessing}
                      className={`flex-1 px-6 py-4 rounded-xl border-2 transition-all font-semibold ${
                        donationType === 'one_time'
                          ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white border-transparent shadow-lg'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-rose-300'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 mx-auto mb-2" />
                      One-Time
                    </button>
                    <button
                      onClick={() => setDonationType('recurring')}
                      disabled={isProcessing}
                      className={`flex-1 px-6 py-4 rounded-xl border-2 transition-all font-semibold ${
                        donationType === 'recurring'
                          ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white border-transparent shadow-lg'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-rose-300'
                      }`}
                    >
                      <Calendar className="w-5 h-5 mx-auto mb-2" />
                      Monthly
                    </button>
                  </div>
                </div>

                {/* Amount Selection */}
                <div className="mb-6">
                  <label className="text-sm font-semibold text-gray-700 block mb-3">
                    Select Amount {donationType === 'recurring' && '(per month)'}
                  </label>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {predefinedAmounts.map((value) => (
                      <button
                        key={value}
                        onClick={() => handleAmountClick(value)}
                        disabled={isProcessing}
                        className={`px-4 py-3 rounded-xl border-2 font-semibold transition-all ${
                          amount === value.toString() && !customAmount
                            ? 'bg-rose-50 border-rose-500 text-rose-700'
                            : 'border-gray-200 text-gray-700 hover:border-rose-300 hover:bg-rose-50'
                        }`}
                      >
                        ₹{value.toLocaleString('en-IN')}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg font-semibold">
                      ₹
                    </span>
                    <Input
                      type="number"
                      placeholder="Enter custom amount"
                      value={customAmount}
                      onChange={(e) => handleCustomAmountChange(e.target.value)}
                      disabled={isProcessing}
                      className="pl-10 h-14 text-lg border-2 border-gray-200 focus:border-rose-500 rounded-xl"
                      min="1"
                      max="100000"
                    />
                  </div>
                </div>

                {/* Summary */}
                {getDisplayAmount() > 0 && (
                  <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-6 mb-6 border-2 border-rose-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 font-medium">
                        {donationType === 'recurring' ? 'Monthly donation' : 'Donation amount'}
                      </span>
                      <span className="text-3xl font-bold text-rose-600">
                        ₹{getDisplayAmount().toLocaleString('en-IN')}
                      </span>
                    </div>
                    {donationType === 'recurring' && (
                      <p className="text-sm text-gray-600">
                        You&apos;ll be charged this amount every month. You can cancel anytime.
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              // PHYSICAL DONATION FLOW
              <>
                {step === 1 && (
                  <>
                    {/* Quantity */}
                    <div className="mb-6">
                      <label className="text-sm font-semibold text-gray-700 block mb-3">
                        Quantity ({getUnit()})
                      </label>
                      <Input
                        type="number"
                        placeholder={`Enter number of ${getUnit()}`}
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        disabled={isProcessing}
                        className="h-14 text-lg border-2 border-gray-200 focus:border-rose-500 rounded-xl"
                        min="1"
                      />
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                      <label className="text-sm font-semibold text-gray-700 block mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Description
                      </label>
                      <textarea
                        placeholder={`Describe what you're donating (e.g., "Children's books for ages 5-10" or "Winter clothes - jackets and sweaters")`}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={isProcessing}
                        rows={4}
                        maxLength={500}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-1 text-right">
                        {description.length}/500 characters
                      </p>
                    </div>

                    {/* Summary Box */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200">
                      <h4 className="font-semibold text-gray-900 mb-3">Donation Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <span className="font-semibold text-gray-900 capitalize">{itemType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Quantity:</span>
                          <span className="font-semibold text-gray-900">{quantity || '0'} {getUnit()}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-rose-500" />
                      Pickup Details
                    </h3>

                    {/* Address */}
                    <div className="mb-4">
                      <label className="text-sm font-semibold text-gray-700 block mb-2">
                        Pickup Address
                      </label>
                      <textarea
                        placeholder="Enter your complete address"
                        value={pickupAddress}
                        onChange={(e) => setPickupAddress(e.target.value)}
                        disabled={isProcessing}
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all resize-none"
                      />
                    </div>

                    {/* City, State, Pincode */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-sm font-semibold text-gray-700 block mb-2">
                          City
                        </label>
                        <Input
                          placeholder="City"
                          value={pickupCity}
                          onChange={(e) => setPickupCity(e.target.value)}
                          disabled={isProcessing}
                          className="h-12 border-2"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-700 block mb-2">
                          State
                        </label>
                        <Input
                          placeholder="State"
                          value={pickupState}
                          onChange={(e) => setPickupState(e.target.value)}
                          disabled={isProcessing}
                          className="h-12 border-2"
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="text-sm font-semibold text-gray-700 block mb-2">
                        Pincode
                      </label>
                      <Input
                        type="text"
                        placeholder="6-digit pincode"
                        value={pickupPincode}
                        onChange={(e) => setPickupPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        disabled={isProcessing}
                        maxLength={6}
                        className="h-12 border-2"
                      />
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-sm font-semibold text-gray-700 block mb-2 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Pickup Date
                        </label>
                        <Input
                          type="date"
                          value={pickupDate}
                          onChange={(e) => setPickupDate(e.target.value)}
                          disabled={isProcessing}
                          min={getMinDate()}
                          className="h-12 border-2"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-700 block mb-2 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Pickup Time
                        </label>
                        <select
                        aria-label='pickup'
                          value={pickupTime}
                          onChange={(e) => setPickupTime(e.target.value)}
                          disabled={isProcessing}
                          className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all"
                        >
                          <option value="">Select time</option>
                          <option value="09:00-12:00">9:00 AM - 12:00 PM</option>
                          <option value="12:00-15:00">12:00 PM - 3:00 PM</option>
                          <option value="15:00-18:00">3:00 PM - 6:00 PM</option>
                          <option value="18:00-21:00">6:00 PM - 9:00 PM</option>
                        </select>
                      </div>
                    </div>

                    {/* Contact Phone */}
                    <div className="mb-4">
                      <label className="text-sm font-semibold text-gray-700 block mb-2 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Contact Phone
                      </label>
                      <Input
                        type="tel"
                        placeholder="10-digit mobile number"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        disabled={isProcessing}
                        maxLength={10}
                        className="h-12 border-2"
                      />
                    </div>

                    {/* Special Instructions */}
                    <div className="mb-4">
                      <label className="text-sm font-semibold text-gray-700 block mb-2">
                        Special Instructions (Optional)
                      </label>
                      <textarea
                        placeholder="Any special instructions for pickup"
                        value={specialInstructions}
                        onChange={(e) => setSpecialInstructions(e.target.value)}
                        disabled={isProcessing}
                        rows={3}
                        maxLength={300}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-1 text-right">
                        {specialInstructions.length}/300 characters
                      </p>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-gray-50 border-t flex-shrink-0">
          <div className="flex gap-3">
            {isPhysicalDonation && step === 2 && (
              <Button
                onClick={() => setStep(1)}
                disabled={isProcessing}
                variant="outline"
                className="flex-1 h-14 text-base font-semibold border-2"
              >
                Back
              </Button>
            )}
            <Button
              onClick={handleClose}
              disabled={isProcessing}
              variant="outline"
              className="flex-1 h-14 text-base font-semibold border-2"
            >
              Cancel
            </Button>
            <Button
              onClick={isPhysicalDonation && step === 1 ? handleNext : handleDonate}
              disabled={isProcessing || (itemType === 'money' && getDisplayAmount() < 1)}
              className="flex-1 h-14 text-base font-semibold bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : isPhysicalDonation && step === 1 ? (
                'Next'
              ) : itemType === 'money' ? (
                <>
                  <Heart className="w-5 h-5 mr-2" />
                  Proceed to Payment
                </>
              ) : (
                <>
                  <Heart className="w-5 h-5 mr-2" />
                  Schedule Pickup
                </>
              )}
            </Button>
          </div>

          {itemType === 'money' && (
            <p className="text-center text-xs text-gray-500 mt-3">
              🔒 Secure payment powered by Stripe
            </p>
          )}
        </div>
      </div>
    </div>
  );
}