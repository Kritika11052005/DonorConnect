// app/donation/cancelled/page.tsx
'use client';

import { XCircle, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function CancelledPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4 mt-20">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-500 to-gray-600 px-8 py-12 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-gray-500" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">
              Payment Cancelled
            </h1>
            <p className="text-white/90 text-lg">
              Your donation was not completed
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-200">
              <p className="text-gray-700 mb-4">
                Don&apos;t worry - no charges were made to your account. You can try again whenever you&apos;re ready.
              </p>
              <p className="text-gray-600 text-sm">
                If you experienced any issues during checkout, please contact our support team for assistance.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => router.back()}
                className="flex-1 h-14 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={() => router.push('/dashboard/donor')}
                variant="outline"
                className="flex-1 h-14 border-2"
              >
                <Home className="w-5 h-5 mr-2" />
                Go to Dashboard
              </Button>
            </div>

            {/* Help Section */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                Need help? Contact us at{' '}
                <a href="mailto:support@donorconnect.com" className="text-rose-500 font-semibold hover:underline">
                  support@donorconnect.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}