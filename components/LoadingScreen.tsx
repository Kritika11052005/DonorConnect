import React from 'react';
import { Heart } from 'lucide-react';

export const LoadingScreen = ({ message = "Loading..." }) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Animated Heart Icon */}
        <div className="relative mb-8">
          {/* Pulse rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-red-200 animate-ping opacity-20"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center animation-delay-150">
            <div className="w-24 h-24 rounded-full bg-red-300 animate-ping opacity-30"></div>
          </div>
          
          {/* Main heart icon */}
          <div className="relative flex items-center justify-center">
            <div className="bg-white rounded-full p-6 shadow-2xl">
              <Heart 
                className="w-16 h-16 text-red-500 animate-pulse" 
                fill="currentColor"
              />
            </div>
          </div>
        </div>

        {/* Loading text */}
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          DonorConnect
        </h2>
        <p className="text-gray-600 mb-6">{message}</p>

        {/* Loading dots */}
        <div className="flex justify-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce animation-delay-200"></div>
          <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce animation-delay-400"></div>
        </div>

        {/* Progress bar */}
        <div className="mt-8 w-64 mx-auto">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red-400 via-red-500 to-pink-500 animate-slide-right"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Alternative compact loader for page transitions
export const PageLoader = () => {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-red-100 border-t-red-500 rounded-full animate-spin"></div>
        <Heart 
          className="w-6 h-6 text-red-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" 
          fill="currentColor"
        />
      </div>
    </div>
  );
};

// Demo component showing both loaders
export default function LoadingDemo() {
  const [showFullScreen, setShowFullScreen] = React.useState(true);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Loading Components</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Full Screen Loader</h2>
          <p className="text-gray-600 mb-4">Use this for initial page loads or major transitions</p>
          <button 
            onClick={() => setShowFullScreen(!showFullScreen)}
            className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition"
          >
            {showFullScreen ? 'Hide' : 'Show'} Full Screen Loader
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Page Loader</h2>
          <p className="text-gray-600 mb-4">Use this for component-level loading states</p>
          <PageLoader />
        </div>
      </div>

      {showFullScreen && <LoadingScreen message="Connecting donors and hospitals..." />}
    </div>
  );
}