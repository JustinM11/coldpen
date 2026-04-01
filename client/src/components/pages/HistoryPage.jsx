import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Heart,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Trash2,
  Loader2,
  Inbox,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { api } from "../../lib/api";
import { useAuth } from "@clerk/clerk-react";

export default function HistoryPage() {
  const navigate = useNavigate();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const { getToken } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (favoritesOnly) params.set("favorites", "true");

      const data = await api.get(`/api/emails?${params.toString()}`, {
        getToken,
      });
      setEmails(data.emails);
    } catch {
      toast.error("Failed to load email history");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, favoritesOnly]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const handleCopy = async (text, key, emailId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
      toast.success("Copied to clipboard");
      api.patch(`/api/emails/${emailId}/copy`, { getToken }).catch(() => {});
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleFavorite = async (emailId) => {
    try {
      const data = await api.patch(`/api/emails/${emailId}/favorite`, {
        getToken,
      });
      setEmails((prev) =>
        prev.map((e) =>
          e.id === emailId
            ? { ...e, is_favorited: data.email.is_favorited }
            : e,
        ),
      );
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async (emailId) => {
    if (!confirm("Delete this email generation? This cannot be undone."))
      return;
    try {
      await api.delete(`/api/emails/${emailId}`, { getToken });
      setEmails((prev) => prev.filter((e) => e.id !== emailId));
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleReuse = (email) => {
    navigate("/dashboard", {
      state: {
        prefill: {
          productDescription: email.product_description,
          targetAudience: email.target_audience,
          tone: email.tone,
          ctaGoal: email.cta_goal,
        },
      },
    });
  };

  return (
    <div>
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold text-gray-900">Email history</h1>
      <p className="text-gray-500 mt-1">
        Browse, search, and reuse your past generations.
      </p>

      {/* Filters */}
      <div className="flex items-center gap-3 mt-6 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 outline-none text-sm"
            placeholder="Search by product, audience, or CTA..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => setFavoritesOnly(!favoritesOnly)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium ${
            favoritesOnly
              ? "bg-red-50 border-red-200 text-red-500"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Heart
            className="w-3.5 h-3.5"
            fill={favoritesOnly ? "currentColor" : "none"}
          />
          Favorites
        </button>
      </div>

      {/* Email list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      ) : emails.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-16 flex flex-col items-center justify-center text-center">
          <Inbox className="w-10 h-10 text-gray-300 mb-3" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            {debouncedSearch || favoritesOnly
              ? "No matches found"
              : "No emails yet"}
          </h3>
          <p className="text-sm text-gray-400">
            {debouncedSearch || favoritesOnly
              ? "Try adjusting your search or filters."
              : "Generate your first cold email to see it here."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {emails.map((email) => {
            const isExpanded = expandedId === email.id;
            const createdDate = new Date(email.created_at).toLocaleDateString(
              "en-US",
              {
                month: "short",
                day: "numeric",
                year: "numeric",
              },
            );

            return (
              <div
                key={email.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden"
              >
                {/* Header row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : email.id)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {email.product_description}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400">
                        {createdDate}
                      </span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {email.tone}
                      </span>
                      {email.is_favorited && (
                        <Heart
                          className="w-3.5 h-3.5 text-red-400"
                          fill="currentColor"
                        />
                      )}
                      {email.copied_count > 0 && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Copy className="w-3 h-3" />
                          {email.copied_count}
                        </span>
                      )}
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Target audience
                        </span>
                        <p className="text-gray-700 mt-0.5">
                          {email.target_audience}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                          CTA goal
                        </span>
                        <p className="text-gray-700 mt-0.5">{email.cta_goal}</p>
                      </div>
                    </div>

                    {/* Variations */}
                    <div className="space-y-3">
                      {email.variations.map((v, i) => (
                        <div key={i} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <span className="text-xs font-semibold text-amber-600">
                                {v.label}
                              </span>
                              <p className="text-sm font-medium text-gray-800 mt-0.5">
                                Subject: {v.subject}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                handleCopy(
                                  `Subject: ${v.subject}\n\n${v.body}`,
                                  `${email.id}-${i}`,
                                  email.id,
                                )
                              }
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-gray-200 text-xs font-medium text-gray-600 hover:bg-white"
                            >
                              {copiedKey === `${email.id}-${i}` ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                            {v.body}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleReuse(email)}
                        className="px-3 py-1.5 rounded-md border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50"
                      >
                        Reuse inputs
                      </button>
                      <button
                        onClick={() => handleFavorite(email.id)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-md border text-xs font-medium ${
                          email.is_favorited
                            ? "text-red-500 border-red-200"
                            : "text-gray-600 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <Heart
                          className="w-3 h-3"
                          fill={email.is_favorited ? "currentColor" : "none"}
                        />
                        {email.is_favorited ? "Unfavorite" : "Favorite"}
                      </button>
                      <button
                        onClick={() => handleDelete(email.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-red-200 text-xs font-medium text-red-500 hover:bg-red-50 ml-auto"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
