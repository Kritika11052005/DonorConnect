'use client';
import { Heart, TrendingUp, FileText, CheckCircle } from 'lucide-react';

const DonorFeaturesSection = () => {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-rose-50/50 to-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-left mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            For Donors
          </h2>
          <p className="text-lg text-slate-600 max-w-3xl">
            Make a meaningful impact with complete transparency and convenience
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* How to Donate */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all hover:transform hover:scale-105 border border-rose-100 hover:border-rose-300">
            <div className="flex justify-start mb-6">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center">
                <Heart className="w-8 h-8 text-rose-500" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4 text-left">How to Donate</h3>
            <ul className="space-y-3 text-slate-600">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Browse verified NGOs and hospitals by location or cause</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Choose donation type: Money, Clothes, Food, Books, or Medical Supplies</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Secure payment gateway for monetary donations</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Schedule pickup for physical items with logistics support</span>
              </li>
            </ul>
          </div>

          {/* Track Impact */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all hover:transform hover:scale-105 border border-blue-100 hover:border-blue-300">
            <div className="flex justify-start mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4 text-left">Track Impact</h3>
            <ul className="space-y-3 text-slate-600">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>View real-time updates on how your donations are used</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Access impact reports and success stories from NGOs</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>View your total contribution dashboard</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Rate and review NGOs based on your experience</span>
              </li>
            </ul>
          </div>

          {/* Tax Benefits */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all hover:transform hover:scale-105 border border-green-100 hover:border-green-300">
            <div className="flex justify-start mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4 text-left">Tax Benefits</h3>
            <ul className="space-y-3 text-slate-600">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Auto-generated 80G certificates for monetary donations</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Download receipts instantly after donation</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Annual donation summary for tax filing</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Government-compliant documentation</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DonorFeaturesSection;