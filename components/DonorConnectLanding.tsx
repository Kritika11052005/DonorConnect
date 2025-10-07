'use client';

import BannerSlideshow from "./BannerSlideShow";
import Header from "./Header";
import AboutSection from "./AboutSection";
import StatsSection from "./StatsSection";
import DonorFeaturesSection from "./DonorFeautureSection";
import HospitalPartnerSection from "./HospitalPartnerSection";
import NGO from "./NGO";
import CTASection from "./CTA";
import Footer from "./Footer";

const DonorConnectLanding = () => {
    return (
        <div className="min-h-screen">
          {/* Banner starts from top, no padding */}
          <BannerSlideshow />
          
          {/* Rest of the sections with proper spacing */}
          <AboutSection />
          <StatsSection />
          <DonorFeaturesSection />
          <HospitalPartnerSection />
          <NGO/>
          <CTASection/>
        </div>
      );
};

export default DonorConnectLanding;