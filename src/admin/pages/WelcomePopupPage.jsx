import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Loader from "../components/Loader";
import { getApiErrorMessage } from "../../services/apiClient";
import { getWelcomePopupSettings, saveWelcomePopupSettings } from "../services/welcomePopupService";

const defaultForm = {
  isActive: false,
  title: "🎉 Welcome to Woodmart.lk",
  description: "Create your account today and unlock your exclusive first-order discount.",
  couponCode: "WELCOME20",
  buttonText: "Register Now",
  imageUrl: "",
  delaySeconds: 4,
};

function WelcomePopupPage() {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const data = await getWelcomePopupSettings();
        setForm({
          isActive: Boolean(data.isActive),
          title: data.title ?? defaultForm.title,
          description: data.description ?? defaultForm.description,
          couponCode: data.couponCode ?? defaultForm.couponCode,
          buttonText: data.buttonText ?? defaultForm.buttonText,
          imageUrl: data.imageUrl ?? "",
          delaySeconds: Number.isFinite(Number(data.delaySeconds)) ? Number(data.delaySeconds) : defaultForm.delaySeconds,
        });
      } catch (error) {
        setLoadError(getApiErrorMessage(error));
        toast.error(getApiErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        couponCode: String(form.couponCode).toUpperCase().trim(),
        delaySeconds: Number(form.delaySeconds),
        imageUrl: form.imageUrl?.trim() || null,
      };
      await saveWelcomePopupSettings(payload);
      toast.success("Welcome popup settings saved");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  if (loadError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {loadError}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Welcome Popup</h1>
        <p className="mt-1 text-sm text-slate-500">
          Control the one-time welcome offer shown to new guest visitors.
        </p>
      </div>

      {/* Preview badge */}
      <div
        className={`mb-6 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
          form.isActive
            ? "border-green-200 bg-green-50 text-green-700"
            : "border-slate-200 bg-slate-50 text-slate-500"
        }`}
      >
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${
            form.isActive ? "bg-green-500" : "bg-slate-400"
          }`}
        />
        {form.isActive ? "Popup is live — visible to new guest visitors" : "Popup is disabled — not shown to visitors"}
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Enable toggle */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-4">
          <div>
            <div className="text-sm font-semibold text-slate-800">Enable Popup</div>
            <div className="text-xs text-slate-500 mt-0.5">Show the welcome popup to new guest visitors</div>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-slate-200 transition after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-all after:content-[''] peer-checked:bg-brand peer-checked:after:translate-x-full" />
          </label>
        </div>

        {/* Title */}
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Popup Title
          </label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            maxLength={255}
            required
            placeholder="🎉 Welcome to Woodmart.lk"
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>

        {/* Description */}
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Description
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            maxLength={1000}
            required
            rows={3}
            placeholder="Create your account today and unlock your exclusive first-order discount."
            className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <div className="mt-1 text-right text-xs text-slate-400">{form.description.length}/1000</div>
        </div>

        {/* Coupon code + button text (2-col) */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Coupon Code
            </label>
            <input
              type="text"
              name="couponCode"
              value={form.couponCode}
              onChange={handleChange}
              maxLength={50}
              required
              placeholder="WELCOME20"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 font-mono text-sm font-bold uppercase tracking-widest text-brand outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Register Button Text
            </label>
            <input
              type="text"
              name="buttonText"
              value={form.buttonText}
              onChange={handleChange}
              maxLength={100}
              required
              placeholder="Register Now"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
        </div>

        {/* Delay seconds */}
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Popup Delay — <span className="font-normal text-slate-500">{form.delaySeconds} second{form.delaySeconds !== 1 ? "s" : ""} after page load</span>
          </label>
          <p className="mb-3 text-xs text-slate-400">
            The popup also triggers on slight scroll (whichever comes first).
          </p>
          <input
            type="range"
            name="delaySeconds"
            min={0}
            max={30}
            step={1}
            value={form.delaySeconds}
            onChange={handleChange}
            className="w-full accent-brand"
          />
          <div className="mt-1 flex justify-between text-xs text-slate-400">
            <span>0s</span>
            <span>15s</span>
            <span>30s</span>
          </div>
        </div>

       

        {/* Save button */}
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default WelcomePopupPage;
