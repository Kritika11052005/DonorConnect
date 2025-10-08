"use client";

import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ChevronLeft, ChevronRight, Building2, Heart, Hospital, ShieldCheck, X } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";

export default function BannerSlideShow() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'signin' | 'signup'>('signin');
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isAnimating = useRef(false);
  const { isSignedIn, user } = useUser();
  const router = useRouter();

  // Get user data from Convex
  const userData = useQuery(
    api.users.getUserByClerkId,
    isSignedIn && user ? { clerkId: user.id } : "skip"
  );

  const userRole = userData?.role;

  // Your banner images from public folder
  const banners = [
    '/banner2.png',
    '/banner1.png',
    '/banner3.png',
    '/banner4.png',
    '/banner5.png'
  ];

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

  // GSAP animation for slide transitions
  const animateSlide = (fromIndex: number, toIndex: number) => {
    if (isAnimating.current) return;
    isAnimating.current = true;

    const currentSlideEl = slideRefs.current[fromIndex];
    const nextSlideEl = slideRefs.current[toIndex];

    const tl = gsap.timeline({
      onComplete: () => {
        isAnimating.current = false;
      }
    });

    tl.set(nextSlideEl, { zIndex: 2, opacity: 0 })
      .to(nextSlideEl, {
        opacity: 1,
        duration: 1.2,
        ease: 'power2.inOut'
      })
      .set(currentSlideEl, { zIndex: 1 });
  };

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => {
        const next = (prev + 1) % banners.length;
        animateSlide(prev, next);
        return next;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [banners.length]);

  // Initial setup
  useEffect(() => {
    slideRefs.current.forEach((slide, index) => {
      if (slide) {
        gsap.set(slide, {
          opacity: index === 0 ? 1 : 0,
          zIndex: index === 0 ? 2 : 1
        });
      }
    });
  }, []);

  const goToSlide = (index: number) => {
    if (index !== currentSlide && !isAnimating.current) {
      animateSlide(currentSlide, index);
      setCurrentSlide(index);
    }
  };

  const goToPrevious = () => {
    const prevIndex = (currentSlide - 1 + banners.length) % banners.length;
    goToSlide(prevIndex);
  };

  const goToNext = () => {
    const nextIndex = (currentSlide + 1) % banners.length;
    goToSlide(nextIndex);
  };

  // Handle banner click navigation
  const handleBannerClick = (index: number) => {
    // Banner 1 (index 1) - Sign Up
    if (index === 1) {
      if (!isSignedIn) {
        toast.info('Please sign up as a Hospital/NGO to continue', {
          description: 'Create an account to access this feature'
        });
        setModalType('signup');
        setShowModal(true);
      } else {
        // User is signed in, check role
        if (userRole === 'hospital') {
          router.push('/dashboard/hospital');
        } else if (userRole === 'ngo') {
          router.push('/dashboard/ngo');
        } else if (userRole === 'donor') {
          toast.error('Sign up as a Hospital or NGO', {
            description: 'This feature is only available for hospitals and NGOs'
          });
        } else {
          router.push('/sign-up');
        }
      }
    }
    
    // Banner 2 (index 0) - Homepage
    else if (index === 0) {
      router.push('/');
    }
    
    // Banner 3 (index 2) - Blood Donation
    else if (index === 2) {
      if (!isSignedIn) {
        toast.info('Please sign in to continue', {
          description: 'Sign in to access blood donation features'
        });
        setModalType('signin');
        setShowModal(true);
      } else {
        if (userRole === 'donor') {
          router.push('/dashboard/donor');
        } else if (userRole === 'hospital') {
          toast.error('Sign in as a Donor or NGO', {
            description: 'This feature is only available for donors and NGOs'
          });
        } else if (userRole === 'ngo') {
          toast.info('Page Under Development', {
            description: 'This feature will be available soon'
          });
        } else {
          router.push('/sign-in');
        }
      }
    }
    
    // Banner 4 (index 3) - Donor Feature
    else if (index === 3) {
      if (!isSignedIn) {
        toast.info('Please sign in to continue', {
          description: 'Sign in to access donor features'
        });
        setModalType('signin');
        setShowModal(true);
      } else {
        if (userRole === 'donor') {
          router.push('/dashboard/donor');
        } else {
          toast.error('Sign in as a Donor', {
            description: 'This feature is only available for donors'
          });
        }
      }
    }
    
    // Banner 5 (index 4) - Donor Feature (same as Banner 4)
    else if (index === 4) {
      if (!isSignedIn) {
        toast.info('Please sign in to continue', {
          description: 'Sign in to access donor features'
        });
        setModalType('signin');
        setShowModal(true);
      } else {
        if (userRole === 'donor') {
          router.push('/dashboard/donor');
        } else {
          toast.error('Sign in as a Donor', {
            description: 'This feature is only available for donors'
          });
        }
      }
    }
  };

  return (
    <>
      <section className="relative h-[100vh] w-full overflow-hidden">
        {/* Slides Container */}
        <div className="relative w-full h-full">
          {banners.map((banner, index) => (
            <div
              key={index}
              ref={(el) => { slideRefs.current[index] = el; }}
              className="absolute inset-0 w-full h-full cursor-pointer"
              onClick={() => handleBannerClick(index)}
            >
              <img
                src={banner}
                alt={`Banner ${index + 1}`}
                className="w-full h-full object-fill"
              />
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToPrevious();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/30 hover:bg-white/50 backdrop-blur-sm p-3 rounded-full transition-all"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            goToNext();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/30 hover:bg-white/50 backdrop-blur-sm p-3 rounded-full transition-all"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>

        {/* Dot Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                goToSlide(index);
              }}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
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
}