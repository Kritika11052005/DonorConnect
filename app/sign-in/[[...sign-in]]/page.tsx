'use client';

import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from 'next/navigation';

export default function SignInPage() {
  const searchParams = useSearchParams();
  const role = searchParams.get('role');

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <SignIn 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-xl"
          }
        }}
        routing="path"
        path="/sign-in"
        signUpUrl={`/sign-up${role ? `?role=${role}` : ''}`}
        afterSignInUrl={role ? `/onboarding?role=${role}` : `/dashboard/donor`}
      />
    </div>
  );
}