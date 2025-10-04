'use client';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { useRef } from 'react';
import Image from 'next/image';
import { Hospital, Users, Heart, TrendingUp } from 'lucide-react';

const HospitalPartnersSection = () => {
  const plugin = useRef(
    Autoplay({ delay: 2000, stopOnInteraction: false })
  );

  const hospitals = [
  { name: 'AIIMS', logo: '/aiims.png' },
  { name: 'Apollo Hospital', logo: '/apollo.jfif' },
  { name: 'Max Healthcare', logo: '/Max-Healthcare-Logo.png' },
  { name: 'Medanta', logo: '/Medanta-The-Medicity-Logo-Vector.svg-.png' },
  { name: 'Narayan Health', logo: '/narayan health.png' },
  { name: 'Postgraduate Institute', logo: '/Postgraduate_Institute_of_Medical_Education_and_Research_Logo.png' },
  { name: 'Shri Ganga Ram Hospital', logo: '/shri ganga ram.jfif' },
  { name: 'Tata Memorial', logo: '/tata.jpg' },
  { name: 'Fortis', logo: '/fortis.png' },
  { name: 'Christian Medical College', logo: '/Christian_Medical_College_&_Hospital,_Vellore_Logo.png' },
];

  const features = [
    {
      icon: Hospital,
      title: 'Post Blood Requirements',
      description: 'Quickly broadcast urgent blood needs to verified donors in your area'
    },
    {
      icon: Users,
      title: 'Access Verified Donors',
      description: 'Connect with a network of pre-screened, willing blood donors'
    },
    {
      icon: Heart,
      title: 'Manage Requests',
      description: 'Track and coordinate blood donation requests efficiently'
    },
    {
      icon: TrendingUp,
      title: 'Real-time Updates',
      description: 'Get instant notifications when donors respond to your requests'
    }
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900">
      <div className="max-w-7xl mx-auto">
        {/* How Hospitals Use Section - Split Layout */}
        <div className="mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Heading */}
            <div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                For Healthcare Institutions
              </h2>
              <p className="text-lg text-gray-300">
                Streamline your blood donation process and save lives faster with our comprehensive platform designed specifically for healthcare providers.
              </p>
            </div>

            {/* Right Side - Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 hover:border-rose-500 transition-all hover:transform hover:scale-105"
                >
                  <div className="bg-rose-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-rose-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700 mb-16"></div>

        {/* Trusted Partners Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Trusted Hospital Partners
          </h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Collaborating with India&apos;s leading healthcare institutions
          </p>
        </div>

        {/* Carousel */}
        <Carousel
          plugins={[plugin.current]}
          className="w-full max-w-6xl mx-auto"
          opts={{
            align: 'start',
            loop: true,
          }}
        >
          <CarouselContent className="-ml-8">
            {hospitals.map((hospital, index) => (
              <CarouselItem key={index} className="pl-8 md:basis-1/3 lg:basis-1/5">
                <div className="flex items-center justify-center h-32">
                  <Image
                    src={hospital.logo}
                    alt={hospital.name}
                    width={180}
                    height={80}
                    className="object-contain max-w-full max-h-full filter brightness-0 invert opacity-80 hover:opacity-100 transition-opacity"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-12 bg-white/20 border-white/30 text-white hover:bg-white/30" />
          <CarouselNext className="hidden md:flex -right-12 bg-white/20 border-white/30 text-white hover:bg-white/30" />
        </Carousel>
      </div>
    </section>
  );
};

export default HospitalPartnersSection;