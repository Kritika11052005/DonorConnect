'use client';

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from 'next/navigation';

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const role = searchParams.get('role');

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <SignUp 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-xl"
          }
        }}
        routing="path"
        path="/sign-up"
        signInUrl={`/sign-in${role ? `?role=${role}` : ''}`}
        afterSignUpUrl={`/dashboard/${role || 'user'}`}
        unsafeMetadata={{
          role: role || 'user'
        }}
      />
    </div>
  );
}