'use client';
import React, { useState, useEffect } from 'react';
import { UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import { Building2, Heart, Hospital, ShieldCheck, X } from 'lucide-react';

const Header = () => {
  const { isSignedIn } = useUser();
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'signin' | 'signup'>('signup');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  const openSignIn = () => {
    setModalType('signin');
    setShowModal(true);
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
      <header 
        className={`absolute top-0 left-0 right-0 w-full z-50 transition-all duration-500 ease-in-out ${
          scrolled 
            ? 'bg-white/90 backdrop-blur-md shadow-lg border-b border-gray-200/50 fixed' 
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo with Background Box */}
            <Link href="/" className="flex items-center gap-3 cursor-pointer group">
              <div className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-300 ${
                scrolled 
                  ? 'bg-white/20 shadow-sm hover:shadow-md' 
                  : 'bg-white/20 backdrop-blur-sm hover:bg-white/30'
              }`}>
                <div className="relative">
                  <Image 
                    src="/donorconnect.png" 
                    alt="DonorConnect Icon" 
                    width={40} 
                    height={40}
                    className="h-10 w-10 transition-all duration-300 group-hover:scale-110"
                  />
                </div>
                <Image 
                  src="/donorconnectwritten.png" 
                  alt="DonorConnect Logo" 
                  width={150} 
                  height={40}
                  className="h-10 w-auto transition-all duration-300"
                />
              </div>
            </Link>

            {/* Auth Buttons */}
            <div className="flex items-center gap-4">
              {!isSignedIn ? (
                <>
                  <button 
                    onClick={openSignIn}
                    className={`px-5 py-2.5 font-medium rounded-lg transition-all duration-300 ${
                      scrolled 
                        ? 'text-gray-500 hover:text-rose-500 hover:bg-gray-50 bg-white/5 shadow-sm hover:shadow-md' 
                        : 'text-gray-900 bg-white/30 hover:bg-white backdrop-blur-sm shadow-md hover:shadow-lg'
                    }`}
                  >
                    Sign In
                  </button>
                  <button 
                    onClick={openSignUp}
                    className={`px-6 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full hover:from-rose-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 font-medium ${
                      scrolled 
                        ? 'shadow-md hover:shadow-lg' 
                        : 'shadow-lg hover:shadow-xl'
                    }`}
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-50 h-50 ring-2 ring-rose-500/20 hover:ring-rose-500/40 transition-all"
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </header>

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

export default Header;