import { Link } from "react-router-dom";
import { Check, Sparkles } from "lucide-react";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "5 email generations per day",
      "3 variations per generation",
      "Copy to clipboard",
      "Email history",
      "Basic analytics",
    ],
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    features: [
      "Unlimited generations",
      "3 variations per generation",
      "Full email history & search",
      "Advanced analytics",
      "Priority support",
    ],
    highlighted: true,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <Link
          to="/"
          className="text-sm text-gray-500 hover:text-gray-700 mb-8 inline-block"
        >
          ← Back to home
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-gray-500">
            Start free. Upgrade when you need unlimited power.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-xl p-8 relative ${
                plan.highlighted
                  ? "border-2 border-gray-900 ring-1 ring-gray-900"
                  : "border border-gray-200"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-900 text-white text-xs font-semibold rounded-full">
                    <Sparkles className="w-3 h-3" />
                    Most popular
                  </span>
                </div>
              )}

              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>

              <div className="flex items-baseline gap-1 mt-4 mb-6">
                <span className="text-4xl font-bold text-gray-900">
                  {plan.price}
                </span>
                <span className="text-gray-400">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-sm text-gray-700"
                  >
                    <Check className="w-4 h-4 text-green-500 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>

              {plan.highlighted ? (
                <Link
                  to="/dashboard"
                  className="block w-full text-center py-3 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800"
                >
                  Get started
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  className="block w-full text-center py-3 rounded-lg border border-gray-200 text-gray-600 font-medium hover:bg-gray-50"
                >
                  Start for free
                </Link>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-400 mt-8">
          Cancel anytime · No credit card required for free plan
        </p>
      </div>
    </div>
  );
}
