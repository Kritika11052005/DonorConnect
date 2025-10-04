'use client';
import React, { useState } from 'react';
import { UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import { Building2, Heart, Hospital, ShieldCheck, X } from 'lucide-react';

const Header = () => {
  const { isSignedIn } = useUser();
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'signin' | 'signup'>('signup');

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
        className="fixed top-0 left-0 right-0 w-full z-50 bg-transparent backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 cursor-pointer group -ml-2">
              <div className="relative">
                <Image 
                  src="/donorconnect.png" 
                  alt="DonorConnect Icon" 
                  width={40} 
                  height={40}
                  className="h-10 w-10 transition-transform group-hover:scale-110"
                />
              </div>
              <Image 
                src="/donorconnectwritten.png" 
                alt="DonorConnect Logo" 
                width={150} 
                height={40}
                className="h-10 w-auto"
              />
            </Link>

            {/* Auth Buttons */}
            <div className="flex items-center gap-4 -mr-2">
              {!isSignedIn ? (
                <>
                  <button 
                    type="button"
                    onClick={openSignIn}
                    className="px-4 py-2 text-gray-700 font-medium hover:text-rose-500 transition-colors"
                  >
                    Sign In
                  </button>
                  <button 
                    type="button"
                    onClick={openSignUp}
                    className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full hover:from-rose-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-md hover:shadow-lg font-medium"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10 ring-2 ring-rose-500/20 hover:ring-rose-500/40 transition-all"
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          ></div>

          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowModal(false)}
              aria-label="Close modal"
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-gray-900 mb-2">{title}</h2>
              <p className="text-gray-600">{subtitle}</p>
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
                    className="group relative bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all transform hover:scale-105"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${role.color} opacity-0 group-hover:opacity-5 rounded-xl transition-opacity`}></div>
                    <div className="relative">
                      <div className={`w-14 h-14 bg-gradient-to-br ${role.color} rounded-lg flex items-center justify-center mb-4 ${modalType === 'signup' ? 'mx-auto' : ''} group-hover:scale-110 transition-transform`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{role.name}</h3>
                      <p className="text-gray-600 text-sm">{role.description}</p>
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
                  type="button"
                  onClick={() => setModalType(modalType === 'signin' ? 'signup' : 'signin')}
                  className="text-rose-500 hover:text-rose-600 font-semibold"
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