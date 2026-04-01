import { useState } from "react";
import { Wand2, Loader2, Copy, Check, Heart } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { api } from "../../lib/api";
import { useAuth } from "@clerk/clerk-react";

const TONES = [
  { value: "professional", label: "Professional", desc: "Corporate, polished" },
  { value: "casual", label: "Casual", desc: "Conversational, relaxed" },
  { value: "friendly", label: "Friendly", desc: "Warm, approachable" },
  { value: "bold", label: "Bold", desc: "Confident, direct" },
];

const INITIAL_FORM = {
  productDescription: "",
  targetAudience: "",
  tone: "professional",
  ctaGoal: "",
};

export default function GeneratePage() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [result, setResult] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [favorited, setFavorited] = useState(false);
  const { getToken } = useAuth();

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();

    if (
      !formData.productDescription.trim() ||
      !formData.targetAudience.trim() ||
      !formData.ctaGoal.trim()
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    setGenerating(true);
    setResult(null);
    setActiveTab(0);

    try {
      const data = await api.post("/api/emails/generate", {
        body: formData,
        getToken,
      });

      setResult(data);
      setFavorited(false);
      toast.success("3 email variations generated!");
    } catch (err) {
      if (err.status === 429) {
        toast.error(
          "Daily limit reached. Upgrade to Pro for unlimited generations.",
        );
      } else {
        toast.error(err.message || "Failed to generate emails");
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async (text, index, emailId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      toast.success("Copied to clipboard");

      if (emailId) {
        api.patch(`/api/emails/${emailId}/copy`, { getToken }).catch(() => {});
      }
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleFavorite = async (emailId) => {
    try {
      const data = await api.patch(`/api/emails/${emailId}/favorite`, {
        getToken,
      });
      setFavorited(data.email.is_favorited);
      toast.success(
        data.email.is_favorited
          ? "Saved to favorites"
          : "Removed from favorites",
      );
    } catch {
      toast.error("Failed to update favorite");
    }
  };

  const isFormValid =
    formData.productDescription.trim() &&
    formData.targetAudience.trim() &&
    formData.ctaGoal.trim();

  return (
    <div>
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold text-gray-900">Generate cold emails</h1>
      <p className="text-gray-500 mt-1">
        Describe your offer and get three high-converting variations.
      </p>

      <div className="grid lg:grid-cols-5 gap-8 mt-8">
        {/* Form */}
        <form onSubmit={handleGenerate} className="lg:col-span-2 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              What are you selling?
            </label>
            <textarea
              className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 outline-none"
              rows={3}
              placeholder="e.g. An AI analytics platform that helps e-commerce stores increase conversions by 40%"
              value={formData.productDescription}
              onChange={handleChange("productDescription")}
              maxLength={1000}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Who are you emailing?
            </label>
            <textarea
              className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 outline-none"
              rows={2}
              placeholder="e.g. Marketing directors at mid-size e-commerce companies"
              value={formData.targetAudience}
              onChange={handleChange("targetAudience")}
              maxLength={500}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tone
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TONES.map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, tone: value }))
                  }
                  className={`text-left p-3 rounded-lg border transition-all ${
                    formData.tone === value
                      ? "border-gray-900 bg-gray-50 ring-1 ring-gray-900"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-sm font-medium text-gray-800">
                    {label}
                  </span>
                  <span className="block text-xs text-gray-400 mt-0.5">
                    {desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Call-to-action goal
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 outline-none"
              placeholder="e.g. Book a 15-minute demo call"
              value={formData.ctaGoal}
              onChange={handleChange("ctaGoal")}
              maxLength={200}
            />
          </div>

          <button
            type="submit"
            disabled={!isFormValid || generating}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Generate 3 variations
              </>
            )}
          </button>
        </form>

        {/* Results */}
        <div className="lg:col-span-3">
          {generating ? (
            <div className="bg-white border border-gray-200 rounded-xl p-16 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 border-2 border-gray-200 border-t-gray-700 rounded-full animate-spin mb-4" />
              <p className="font-medium text-gray-700">
                Crafting your emails...
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Claude is generating 3 unique strategies
              </p>
            </div>
          ) : result ? (
            <div>
              {/* Tabs */}
              <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-4">
                {result.email.variations.map((v, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTab(i)}
                    className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      activeTab === i
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>

              {/* Active variation */}
              {result.email.variations[activeTab] && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
                  <p className="text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1.5 rounded-md inline-block">
                    Strategy: {result.email.variations[activeTab].strategy}
                  </p>

                  <div>
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Subject line
                    </span>
                    <p className="font-medium text-gray-900 mt-1">
                      {result.email.variations[activeTab].subject}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Email body
                    </span>
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                        {result.email.variations[activeTab].body}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() =>
                        handleCopy(
                          `Subject: ${result.email.variations[activeTab].subject}\n\n${result.email.variations[activeTab].body}`,
                          activeTab,
                          result.email.id,
                        )
                      }
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800"
                    >
                      {copiedIndex === activeTab ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy email
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleFavorite(result.email.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium ${
                        favorited
                          ? "text-red-500 border-red-200 bg-red-50"
                          : "text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <Heart
                        className="w-3.5 h-3.5"
                        fill={favorited ? "currentColor" : "none"}
                      />
                      {favorited ? "Favorited" : "Favorite"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <Wand2 className="w-7 h-7 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">
                Your emails will appear here
              </h3>
              <p className="text-sm text-gray-400 max-w-sm">
                Fill in the form and click generate. You'll get three variations
                with different persuasion strategies.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
