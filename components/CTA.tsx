'use client';
import { ArrowRight, Building2, Heart, Hospital, ShieldCheck, X } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

const CTASection = () => {
  const { isSignedIn, user } = useUser();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'signin' | 'signup'>('signin');

  // Get user data from Convex
  const userData = useQuery(
    api.users.getUserByClerkId,
    isSignedIn && user ? { clerkId: user.id } : "skip"
  );

  const userRole = userData?.role;

  const handleGetStarted = () => {
    if (!isSignedIn) {
      setModalType('signin');
      setShowModal(true);
    } else {
      // Redirect to user's dashboard based on role
      const role = userRole || 'donor';
      router.push(`/dashboard/${role}`);
    }
  };

  const openSignUp = () => {
    setModalType('signup');
    setShowModal(true);
  };

  const signupRoles = [
    {
      id: 'donor',
      name: 'Donor',
      icon: Heart,
      description: 'Make a difference',
      color: 'from-rose-500 to-pink-500'
    },
    {
      id: 'hospital',
      name: 'Hospital',
      icon: Hospital,
      description: 'Healthcare institution',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'ngo',
      name: 'NGO',
      icon: Building2,
      description: 'Non-profit organization',
      color: 'from-green-500 to-emerald-500'
    }
  ];

  const signinRoles = [
    {
      id: 'admin',
      name: 'Admin',
      icon: ShieldCheck,
      description: 'Platform administrator',
      color: 'from-purple-500 to-indigo-500'
    },
    ...signupRoles
  ];

  const roles = modalType === 'signin' ? signinRoles : signupRoles;
  const title = modalType === 'signin' ? 'Welcome Back' : 'Join DonorConnect';
  const subtitle = modalType === 'signin' ? 'Select your role to continue' : 'Select your role to get started';
  const targetPath = modalType === 'signin' ? '/sign-in' : '/sign-up';

  return (
    <>
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500"></div>

        {/* Content */}
        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Ready to Make an Impact?
          </h2>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of donors, NGOs, and hospitals creating real change every day.
          </p>

          <button
            onClick={handleGetStarted}
            className="group px-8 py-4 bg-white text-rose-600 rounded-full font-semibold text-lg hover:bg-gray-50 transition-all transform hover:scale-105 shadow-2xl inline-flex items-center gap-2"
          >
            Get Started Now
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Role Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          ></div>

          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              aria-label="Close modal"
              title="Close"
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1.5 transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent mb-2">
                {title}
              </h2>
              <p className="text-gray-600 text-lg">{subtitle}</p>
            </div>

            {/* Role Cards */}
            <div className={`grid grid-cols-1 ${modalType === 'signin' ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-6`}>
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <Link
                    key={role.id}
                    href={`${targetPath}?role=${role.id}`}
                    onClick={() => setShowModal(false)}
                    className="group relative bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border-2 border-gray-200 hover:border-transparent hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${role.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                    <div className="relative">
                      <div className={`w-14 h-14 bg-gradient-to-br ${role.color} rounded-xl flex items-center justify-center mb-4 ${modalType === 'signup' ? 'mx-auto' : ''} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-md`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className={`text-xl font-bold text-gray-900 mb-1 ${modalType === 'signup' ? 'text-center' : ''}`}>
                        {role.name}
                      </h3>
                      <p className={`text-gray-600 text-sm ${modalType === 'signup' ? 'text-center' : ''}`}>
                        {role.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Toggle Link */}
            <div className="text-center mt-8 pt-6 border-t border-gray-200">
              <p className="text-gray-600">
                {modalType === 'signin' ? "Don't have an account? " : "Already have an account? "}
                <button 
                  onClick={() => setModalType(modalType === 'signin' ? 'signup' : 'signin')}
                  className="text-rose-500 hover:text-rose-600 font-semibold hover:underline transition-all"
                >
                  {modalType === 'signin' ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CTASection;