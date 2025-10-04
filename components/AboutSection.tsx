'use client';
import { Heart, Shield, Users } from 'lucide-react';

const AboutSection = () => {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-slate-800">Donor</span>
            <span className="text-rose-500">Connect</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
            A secure and transparent platform connecting compassionate donors with verified NGOs and hospitals. 
            Empowering impact through monetary donations, essential items, and life-saving organ pledges. 
            Together, we create real change with 100% transparency and government compliance.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="text-center p-6 rounded-lg bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-100 rounded-full mb-4">
              <Heart className="w-8 h-8 text-rose-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Make an Impact</h3>
            <p className="text-slate-600">
              Support verified causes through monetary donations, essential items, or organ pledges
            </p>
          </div>

          <div className="text-center p-6 rounded-lg bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">100% Transparent</h3>
            <p className="text-slate-600">
              Track every donation with complete transparency and government compliance
            </p>
          </div>

          <div className="text-center p-6 rounded-lg bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <Users className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Verified Partners</h3>
            <p className="text-slate-600">
              Connect with trusted NGOs and hospitals making real differences in communities
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;