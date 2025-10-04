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
import { HeartHandshake, Megaphone, Users2, Award } from 'lucide-react';

const NGOPartnersSection = () => {
  const plugin = useRef(
    Autoplay({ delay: 2000, stopOnInteraction: false })
  );

  const ngos = [
    { name: 'CRY', logo: '/cry.png' },
    { name: 'Smile Foundation', logo: '/smilefoundation.png' },
    { name: 'Akshaya Patra', logo: '/akshayapatra.png' },
    { name: 'Goonj', logo: '/goonj.png' },
    { name: 'Helpage India', logo: '/helpage.jpg' },
    { name: 'Pratham', logo: '/pratham.png' },
    { name: 'Nanhi Kali', logo: '/nahnikali.jpg' },
    { name: 'Teach For India', logo: '/teachforindia.png' },
    { name: 'Sneha', logo: '/sneha.png' },
  ];

  const features = [
    {
      icon: Megaphone,
      title: 'Organize Campaigns',
      description: 'Launch blood donation drives and awareness campaigns in your communities'
    },
    {
      icon: Users2,
      title: 'Mobilize Volunteers',
      description: 'Engage your volunteer network to support life-saving blood donation initiatives'
    },
    {
      icon: HeartHandshake,
      title: 'Partner with Hospitals',
      description: 'Bridge the gap between hospitals in need and willing donors'
    },
    {
      icon: Award,
      title: 'Track Impact',
      description: 'Monitor and showcase the lives saved through your organization\'s efforts'
    }
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-rose-50 to-pink-50">
      <div className="max-w-7xl mx-auto">
        {/* How NGOs Use Section - Split Layout */}
        <div className="mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:order-first">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all hover:transform hover:scale-105 border border-rose-100 hover:border-rose-300"
                >
                  <div className="bg-rose-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-rose-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Right Side - Heading */}
            <div className="lg:order-last">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                For Non-Profit Organizations
              </h2>
              <p className="text-lg text-gray-600">
                Amplify your social impact by connecting communities with life-saving blood donation opportunities through our platform.
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-rose-200 mb-16"></div>

        {/* NGO Partners Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            NGO Partners
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Working together with trusted non-profit organizations to make a difference
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
            {ngos.map((ngo, index) => (
              <CarouselItem key={index} className="pl-8 md:basis-1/3 lg:basis-1/5">
                <div className="flex items-center justify-center h-32">
                  <Image
                    src={ngo.logo}
                    alt={ngo.name}
                    width={180}
                    height={80}
                    className="object-contain max-w-full max-h-full opacity-80 hover:opacity-100 transition-opacity"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-12 bg-white/80 border-gray-300 text-gray-700 hover:bg-white" />
          <CarouselNext className="hidden md:flex -right-12 bg-white/80 border-gray-300 text-gray-700 hover:bg-white" />
        </Carousel>
      </div>
    </section>
  );
};

export default NGOPartnersSection;