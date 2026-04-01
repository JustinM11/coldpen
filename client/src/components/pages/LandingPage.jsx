import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col item-center justify-center p-8">
      <h1 className="text-5xl font-bold text-gray-900 bm-4">ColdPen</h1>
      <p className="text-xl text-gray-500 mb-8">
        AI-powered cold outreach emails that actually get replies.
      </p>
      <Link
        to="/dashboard"
        className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
