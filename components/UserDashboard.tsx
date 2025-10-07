'use client';

import { useUser } from '@clerk/nextjs';
import { Droplet, Heart, Users, Search, TrendingUp, Award, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';
import BloodDonationForm from '@/components/BloodDonationForm';
// import VolunteerForm from '@/components/VolunteerForm';
// import OrganPledgeForm from '@/components/OrganPledgeForm';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

import DonorProfileForm from '@/components/DonorProfileForm';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function DonorDashboard() {
  const { user } = useUser();
  const [activeForm, setActiveForm] = useState<'blood' | 'volunteer' | 'organ' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const profileCheck = useQuery(
    api.donors.isDonorProfileComplete,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (profileCheck && !profileCheck.complete) {
      setShowForm(true);
    }
  }, [profileCheck]);

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
      shadowColor: 'shadow-red-200'
    },
    {
      id: 'volunteer',
      title: 'Volunteer',
      description: 'Join an NGO and make a difference',
      icon: Users,
      gradient: 'from-green-500 via-emerald-500 to-teal-500',
      shadowColor: 'shadow-green-200'
    },
    {
      id: 'organ',
      title: 'Organ Pledge',
      description: 'Pledge to be an organ donor',
      icon: Heart,
      gradient: 'from-purple-500 via-pink-500 to-rose-500',
      shadowColor: 'shadow-purple-200'
    }
  ];

  const stats = [
    { label: 'Lives Impacted', value: '0', icon: Heart, color: 'text-rose-500' },
    { label: 'Donations Made', value: '0', icon: TrendingUp, color: 'text-green-500' },
    { label: 'Impact Score', value: '0', icon: Award, color: 'text-purple-500' }
  ];

  return (
    <>
      {showForm && profileCheck?.user && (
        <DonorProfileForm
          userId={profileCheck.user._id}
          onComplete={() => setShowForm(false)}
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Welcome Section with Stats */}
          <div className="mb-12">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent mb-2">
                    Welcome back, {user?.firstName || 'Donor'}!
                  </h1>
                  <p className="text-lg text-gray-600">
                    Ready to make a difference today?
                  </p>
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
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color === 'text-rose-500' ? 'from-rose-100 to-pink-100' : stat.color === 'text-green-500' ? 'from-green-100 to-emerald-100' : 'from-purple-100 to-pink-100'} flex items-center justify-center`}>
                          <Icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
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
              return (
                <button
                  key={card.id}
                  onClick={() => setActiveForm(card.id as any)}
                  className="group relative bg-white rounded-3xl p-8 border-2 border-gray-100 hover:border-transparent transition-all transform hover:scale-105 hover:shadow-2xl text-left overflow-hidden"
                >
                  {/* Gradient Background on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                  
                  <div className="relative">
                    {/* Icon */}
                    <div className={`w-16 h-16 bg-gradient-to-br ${card.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg ${card.shadowColor} group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    
                    {/* Content */}
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-gray-700 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-gray-600 text-base leading-relaxed">
                      {card.description}
                    </p>

                    {/* Arrow Indicator */}
                    <div className="mt-6 flex items-center text-rose-500 font-semibold group-hover:translate-x-2 transition-transform">
                      Get Started
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
            <div className="flex items-center gap-3 mb-6">
              <Search className="w-8 h-8 text-rose-500" />
              <h2 className="text-3xl font-bold text-gray-900">
                Find NGOs & Hospitals
              </h2>
            </div>
            
            <p className="text-gray-600 mb-6">
              Discover trusted organizations and healthcare institutions in your area
            </p>

            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search for NGOs or hospitals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-base border-2 border-gray-200 focus:border-rose-500 rounded-xl"
                />
              </div>
              <Button className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 h-14 px-10 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all">
                Search
              </Button>
            </div>

            {/* Popular Causes */}
            <div>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Popular Causes</h3>
              <div className="flex flex-wrap gap-3">
                {['Education', 'Healthcare', 'Environment', 'Child Welfare', 'Disaster Relief'].map((cause) => (
                  <button
                    key={cause}
                    className="px-6 py-3 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-rose-50 hover:to-pink-50 border border-gray-200 hover:border-rose-300 rounded-full text-sm font-semibold text-gray-700 hover:text-rose-600 transition-all shadow-sm hover:shadow-md"
                  >
                    {cause}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Forms Modal */}
        {activeForm === 'blood' && (
          <BloodDonationForm onClose={() => setActiveForm(null)} />
        )}
        {/* Uncomment when components are ready
        {activeForm === 'volunteer' && (
          <VolunteerForm onClose={() => setActiveForm(null)} />
        )}
        {activeForm === 'organ' && (
          <OrganPledgeForm onClose={() => setActiveForm(null)} />
        )}
        */}
      </div>
    </>
  );
}