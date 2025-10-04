'use client';
import { useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'donor';
  const [error, setError] = useState(false);

  useEffect(() => {
    const updateRole = async () => {
      if (!isLoaded) return;
      
      if (!user) {
        router.push('/sign-in');
        return;
      }

      try {
        // Check if role is already set
        const existingRole = user.unsafeMetadata?.role as string;
        
        if (!existingRole) {
          // Set the role in user metadata
          await user.update({
            unsafeMetadata: {
              role: role
            }
          });
          
          console.log('Role updated to:', role);
        }

        // Redirect to dashboard with the role
        const finalRole = existingRole || role;
        router.push(`/dashboard/${finalRole}`);
      } catch (err) {
        console.error('Error setting role:', err);
        setError(true);
      }
    };

    updateRole();
  }, [isLoaded, user, role, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50">
        <div className="text-center">
          <p className="text-lg text-red-600 mb-4">Error setting up your account</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-rose-500 text-white rounded-full hover:bg-rose-600"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
        <p className="text-lg text-gray-600">Setting up your account...</p>
      </div>
    </div>
  );
}