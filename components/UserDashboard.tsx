'use client';

import { useUser } from '@clerk/nextjs';
import { Droplet, Heart, Users, Search } from 'lucide-react';
import { useState,useEffect } from 'react';
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
      <div className="min-h-screen flex items-center justify-center">
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
      color: 'from-red-500 to-rose-600',
      bgColor: 'bg-red-50 hover:bg-red-100'
    },
    {
      id: 'volunteer',
      title: 'Volunteer',
      description: 'Join an NGO and make a difference in your community',
      icon: Users,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50 hover:bg-green-100'
    },
    {
      id: 'organ',
      title: 'Organ Donation Pledge',
      description: 'Pledge to be an organ donor and give the gift of life',
      icon: Heart,
      color: 'from-purple-500 to-pink-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100'
    }
  ];

  return (
    <>
    {showForm && profileCheck?.user && (
        <DonorProfileForm
          userId={profileCheck.user._id}
          onComplete={() => setShowForm(false)}
        />
      )}

    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.firstName || 'Donor'}!
          </h1>
          <p className="text-lg text-gray-600">
            Choose how you want to make an impact today
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {actionCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                onClick={() => setActiveForm(card.id as any)}
                className={`${card.bgColor} rounded-2xl p-6 border-2 border-transparent hover:border-gray-300 transition-all transform hover:scale-105 shadow-md hover:shadow-xl text-left`}
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{card.title}</h3>
                <p className="text-gray-600 text-sm">{card.description}</p>
              </button>
            );
          })}
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Find NGOs & Hospitals
          </h2>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search for NGOs or hospitals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
            <Button className="bg-rose-500 hover:bg-rose-600 h-12 px-8">
              Search
            </Button>
          </div>

          {/* Popular Donations */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Popular Causes:</h3>
            <div className="flex flex-wrap gap-2">
              {['Education', 'Healthcare', 'Environment', 'Child Welfare', 'Disaster Relief'].map((cause) => (
                <button
                  key={cause}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-700 transition-colors"
                >
                  {cause}
                </button>
              ))}
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
    </div>
    </>
  );
}
