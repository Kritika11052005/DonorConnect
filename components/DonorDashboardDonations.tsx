// components/DonorDashboardDonations.tsx
'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Download, Calendar, TrendingUp, Heart, Loader2, Receipt, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function DonorDashboardDonations() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'money' | 'items'>('all');
  
  const donationHistory = useQuery(api.payments.getMyDonationHistory);
  const subscriptions = useQuery(api.payments.getMySubscriptions);

  if (donationHistory === undefined || subscriptions === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  const filteredDonations = donationHistory.filter((donation) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'money') return donation.donationType === 'money';
    if (activeFilter === 'items') return donation.donationType !== 'money';
    return true;
  });

  const totalDonated = donationHistory
    .filter((d) => d.donationType === 'money' && d.status === 'completed')
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  const totalDonations = donationHistory.filter(
    (d) => d.status === 'completed'
  ).length;

  const monthlyContribution = subscriptions
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8" />
            <span className="text-sm font-medium opacity-90">Total Donated</span>
          </div>
          <p className="text-3xl font-bold">
            ₹{totalDonated.toLocaleString('en-IN')}
          </p>
          <p className="text-sm opacity-80 mt-1">All-time contributions</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Heart className="w-8 h-8" />
            <span className="text-sm font-medium opacity-90">Donations Made</span>
          </div>
          <p className="text-3xl font-bold">{totalDonations}</p>
          <p className="text-sm opacity-80 mt-1">Completed donations</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <CreditCard className="w-8 h-8" />
            <span className="text-sm font-medium opacity-90">Monthly Giving</span>
          </div>
          <p className="text-3xl font-bold">
            ₹{monthlyContribution.toLocaleString('en-IN')}
          </p>
          <p className="text-sm opacity-80 mt-1">
            {subscriptions.filter((s) => s.status === 'active').length} active subscriptions
          </p>
        </div>
      </div>

      {/* Active Subscriptions */}
      {subscriptions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Recurring Donations
                </h3>
                <p className="text-sm text-gray-600">
                  Your monthly contributions
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {subscriptions.map((subscription) => (
              <div
                key={subscription._id}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-md transition-all"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {subscription.targetDetails?.name || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-600">
                    ₹{subscription.amount.toLocaleString('en-IN')}/month
                  </p>
                  <span
                    className={`inline-block mt-2 text-xs px-3 py-1 rounded-full font-semibold ${
                      subscription.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {subscription.status}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-2">
                    Next payment:{' '}
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString(
                      'en-IN'
                    )}
                  </p>
                  {subscription.status === 'active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        // Handle cancel subscription
                        console.log('Cancel subscription:', subscription._id);
                      }}
                    >
                      Manage
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Donation History */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center">
              <Receipt className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Donation History
              </h3>
              <p className="text-sm text-gray-600">
                View all your past contributions
              </p>
            </div>
          </div>
          
          {/* Filter Tabs */}
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'All' },
              { value: 'money', label: 'Money' },
              { value: 'items', label: 'Items' },
            ].map((filter) => (
              <button
                key={filter.value}
                //eslint-disable-next-line @typescript-eslint/no-explicit-any
                onClick={() => setActiveFilter(filter.value as any)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeFilter === filter.value
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Donations List */}
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {filteredDonations.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-semibold">
                No donations yet
              </p>
              <p className="text-gray-400 mt-2">
                Start making a difference by donating to causes you care about!
              </p>
            </div>
          ) : (
            filteredDonations.map((donation) => (
              <div
                key={donation._id}
                className="flex items-start justify-between p-5 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-lg transition-all group"
              >
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Heart className="w-6 h-6 text-rose-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 mb-1">
                        {donation.targetDetails?.name || 'Unknown'}
                      </p>
                      {donation.targetDetails?.type === 'campaign' && (
                        <p className="text-sm text-gray-600 mb-2">
                          by {donation.targetDetails.ngoName}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(donation.donationDate).toLocaleDateString(
                            'en-IN',
                            {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            }
                          )}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            donation.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : donation.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {donation.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 ml-4">
                  {donation.donationType === 'money' && donation.amount && (
                    <p className="text-2xl font-bold text-rose-600 mb-2">
                      ₹{donation.amount.toLocaleString('en-IN')}
                    </p>
                  )}
                  {donation.donationType !== 'money' && (
                    <p className="text-sm font-semibold text-gray-700 mb-2 capitalize">
                      {donation.donationType}
                    </p>
                  )}
                  {donation.receipt && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => {
                        // Handle download receipt
                        console.log(
                          'Download receipt:',
                          donation.receipt?.receiptNumber
                        );
                      }}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Receipt
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}