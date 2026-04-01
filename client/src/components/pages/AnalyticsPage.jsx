import { useState, useEffect } from "react";
import { BarChart3, Copy, Heart, Zap, Loader2 } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "@clerk/clerk-react";

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth();

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await api.get("/api/analytics/dashboard", { getToken });
        setStats(data.stats);
      } catch {
        // silently fail — analytics aren't critical
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Generations",
      value: stats?.totalGenerations || 0,
      icon: Zap,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Emails Copied",
      value: stats?.totalCopies || 0,
      icon: Copy,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Favorites Saved",
      value: stats?.totalFavorited || 0,
      icon: Heart,
      color: "text-red-500",
      bg: "bg-red-50",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
      <p className="text-gray-500 mt-1">
        Track your outreach generation activity.
      </p>

      <div className="grid sm:grid-cols-3 gap-4 mt-8">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-white border border-gray-200 rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{label}</span>
              <div
                className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center`}
              >
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
