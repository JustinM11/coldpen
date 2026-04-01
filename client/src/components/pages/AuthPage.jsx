import { SignIn, SignUp } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { PenLine } from "lucide-react";

export default function AuthPage({ mode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="p-6">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
            <PenLine className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">ColdPen</span>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 -mt-16">
        {mode === "signIn" ? (
          <SignIn
            routing="path"
            path="/sign-in"
            afterSignInUrl="/dashboard"
            signUpUrl="/sign-up"
          />
        ) : (
          <SignUp
            routing="path"
            path="/sign-up"
            afterSignUpUrl="/dashboard"
            signInUrl="/sign-in"
          />
        )}
      </div>
    </div>
  );
}
