'use client';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

const CTASection = () => {
  return (
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
        
        <Link href="/get-started">
          <button className="group px-8 py-4 bg-white text-rose-600 rounded-full font-semibold text-lg hover:bg-gray-50 transition-all transform hover:scale-105 shadow-2xl inline-flex items-center gap-2">
            Get Started Now
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </Link>
      </div>
    </section>
  );
};

export default CTASection;