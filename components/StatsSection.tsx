'use client';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

const StatsSection = () => {
  const [activeDonors, setActiveDonors] = useState(0);
  const [verifiedNGOs, setVerifiedNGOs] = useState(0);
  const [partnerHospitals, setPartnerHospitals] = useState(0);
  const [donationsMade, setDonationsMade] = useState(0);
  const sectionRef = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            animateCounters();
          }
        });
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const animateCounters = () => {
    // Animate Active Donors to 10,000+
    gsap.to({ val: 0 }, {
      val: 10000,
      duration: 2.5,
      ease: 'power2.out',
      onUpdate: function() {
        setActiveDonors(Math.floor(this.targets()[0].val));
      }
    });

    // Animate Verified NGOs to 500+
    gsap.to({ val: 0 }, {
      val: 500,
      duration: 2.5,
      ease: 'power2.out',
      onUpdate: function() {
        setVerifiedNGOs(Math.floor(this.targets()[0].val));
      }
    });

    // Animate Partner Hospitals to 100+
    gsap.to({ val: 0 }, {
      val: 100,
      duration: 2.5,
      ease: 'power2.out',
      onUpdate: function() {
        setPartnerHospitals(Math.floor(this.targets()[0].val));
      }
    });

    // Animate Donations Made to 5Cr+
    gsap.to({ val: 0 }, {
      val: 5,
      duration: 2.5,
      ease: 'power2.out',
      onUpdate: function() {
        setDonationsMade(Math.floor(this.targets()[0].val));
      }
    });
  };

  const formatNumber = (num:number) => {
    return num.toLocaleString('en-IN');
  };

  return (
    <section 
      ref={sectionRef}
      className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-900"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {/* Active Donors */}
          <div className="text-center">
            <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-rose-500 mb-2">
              {formatNumber(activeDonors)}+
            </div>
            <div className="text-sm md:text-base text-gray-300">Active Donors</div>
          </div>

          {/* Verified NGOs */}
          <div className="text-center">
            <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-rose-500 mb-2">
              {formatNumber(verifiedNGOs)}+
            </div>
            <div className="text-sm md:text-base text-gray-300">Verified NGOs</div>
          </div>

          {/* Partner Hospitals */}
          <div className="text-center">
            <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-rose-500 mb-2">
              {formatNumber(partnerHospitals)}+
            </div>
            <div className="text-sm md:text-base text-gray-300">Partner Hospitals</div>
          </div>

          {/* Donations Made */}
          <div className="text-center">
            <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-rose-500 mb-2">
              ₹{donationsMade}Cr+
            </div>
            <div className="text-sm md:text-base text-gray-300">Donations Made</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;