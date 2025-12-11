// app/donation/success/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Download, Home, Loader2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';
import { downloadReceiptPDF, ReceiptData } from '@/lib/pdf-generator';
import { useToast } from '@/lib/use-toast';
import { useUser } from '@clerk/nextjs';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const sessionId = searchParams.get('session_id');

  // Get donation details from URL params or state
  const targetName = searchParams.get('target') || receiptData?.targetName || 'a cause';
  const amount = searchParams.get('amount') || receiptData?.amount || 0;

  useEffect(() => {
    // Confetti animation code...
    const duration = 3000;
    const animationEnd = Date.now() + duration;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#f43f5e', '#ec4899', '#fb7185'],
      });

      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#f43f5e', '#ec4899', '#fb7185'],
      });
    }, 50);

    // Fetch receipt data
    const fetchReceiptData = async () => {
      if (sessionId) {
        try {
          const response = await fetch(`/api/stripe/session/${sessionId}`);
          if (response.ok) {
            const data = await response.json();
            setReceiptData(data);
          }
        } catch (error) {
          console.error('Failed to fetch receipt data:', error);
        }
      }
      setIsLoading(false);
    };

    setTimeout(() => {
      fetchReceiptData();
    }, 2000);

    return () => clearInterval(interval);
  }, [sessionId]);

  const handleDownloadReceipt = async () => {
    if (!receiptData) {
      const fallbackData: ReceiptData = {
        receiptNumber: `DCR-${Date.now()}-${sessionId?.slice(-6) || 'XXXXXX'}`,
        userName: user?.fullName || 'Donor',
        userEmail: user?.primaryEmailAddress?.emailAddress || '',
        amount: Number(amount) || 100,
        currency: 'INR',
        targetName: targetName,
        donationType: 'one_time',
        donationDate: new Date().toLocaleDateString('en-IN'),
        transactionId: sessionId || 'N/A',
      };
      
      downloadReceiptPDF(fallbackData);
      
      toast({
        title: 'Success!',
        description: 'Receipt downloaded successfully',
      });
      return;
    }

    setIsDownloading(true);

    try {
      downloadReceiptPDF(receiptData);

      toast({
        title: 'Success!',
        description: 'Receipt downloaded successfully',
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download Failed',
        description: 'Unable to download receipt. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Twitter share handler
  const handleTwitterShare = () => {
    const tweetText = `I just donated ₹${amount.toLocaleString('en-IN')} to ${targetName} through @DonorConnect! 💝 Join me in making a difference! #Donation #Philanthropy #MakingADifference`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    
    // Open in new window
    window.open(tweetUrl, '_blank', 'width=550,height=420');
    
    toast({
      title: 'Thanks for sharing!',
      description: 'Your story can inspire others to give',
    });
  };

  // Facebook share handler
  const handleFacebookShare = () => {
    const shareUrl = window.location.origin; // Your DonorConnect homepage or specific campaign URL
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(`I just made a donation of ₹${amount.toLocaleString('en-IN')} to ${targetName}! Together we can make a difference. 💝`)}`;
    
    // Open in new window
    window.open(facebookUrl, '_blank', 'width=550,height=420');
    
    toast({
      title: 'Thanks for sharing!',
      description: 'Your story can inspire others to give',
    });
  };

  // LinkedIn share handler (bonus!)
  const handleLinkedInShare = () => {
    const shareUrl = window.location.origin;
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    
    window.open(linkedInUrl, '_blank', 'width=550,height=420');
    
    toast({
      title: 'Thanks for sharing!',
      description: 'Your story can inspire others to give',
    });
  };

  // Generic Web Share API (for mobile devices)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'I Made a Donation!',
          text: `I just donated ₹${amount.toLocaleString('en-IN')} to ${targetName} through DonorConnect! Join me in making a difference! 💝`,
          url: window.location.origin,
        });
        
        toast({
          title: 'Thanks for sharing!',
          description: 'Your story can inspire others to give',
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-rose-500 mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-700">Confirming your donation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 p-4 mt-20">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-8 py-12 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">
              Thank You! 🎉
            </h1>
            <p className="text-white/90 text-lg">
              Your donation has been processed successfully
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 mb-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">What happens next?</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>A receipt has been sent to your email</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Your donation will be reflected in your dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>The organization will be notified of your contribution</span>
                </li>
              </ul>
            </div>

            {sessionId && (
              <div className="text-sm text-gray-500 text-center mb-6">
                Transaction ID: {sessionId.slice(-12)}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => router.push('/dashboard/donor')}
                className="flex-1 h-14 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all"
              >
                <Home className="w-5 h-5 mr-2" />
                Go to Dashboard
              </Button>
              <Button
                onClick={handleDownloadReceipt}
                disabled={isDownloading}
                variant="outline"
                className="flex-1 h-14 border-2"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Download Receipt
                  </>
                )}
              </Button>
            </div>

            {/* Social Share - Updated with functional buttons */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-4 text-center">
                Share your impact and inspire others!
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button 
                  onClick={handleTwitterShare}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1a8cd8] transition-colors shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"></path>
                  </svg>
                  Share on Twitter
                </button>
                
                <button 
                  onClick={handleFacebookShare}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1877F2] text-white rounded-lg hover:bg-[#166fe5] transition-colors shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Share on Facebook
                </button>
                
                {/* Show native share on mobile devices */}
                {typeof navigator !== 'undefined' && typeof navigator.share !== 'undefined' && (
                  <button 
                    onClick={handleNativeShare}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors shadow-md hover:shadow-lg"
                  >
                    <Share2 className="w-5 h-5" />
                    Share
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Message */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Your generosity makes a real difference. Thank you for choosing to make the world a better place! ❤️
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}