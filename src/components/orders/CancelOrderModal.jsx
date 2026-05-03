import { useEffect, useState } from "react";
import { X } from "lucide-react";

const PRESET_REASONS = [
  "Ordered by mistake",
  "Found cheaper elsewhere",
  "Delay in delivery",
  "Changed my mind",
  "Other",
];

function CancelOrderModal({ open, orderId, onClose, onConfirm, submitting = false }) {
  const [selected, setSelected] = useState("");
  const [otherText, setOtherText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setSelected("");
      setOtherText("");
      setError("");
    }
  }, [open, orderId]);

  if (!open) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!selected) {
      setError("Please select a reason to continue.");
      return;
    }
    let reason = selected;
    if (selected === "Other") {
      reason = otherText.trim();
      if (!reason) {
        setError("Please describe your reason.");
        return;
      }
      if (reason.length < 3) {
        setError("Reason must be at least 3 characters.");
        return;
      }
      if (reason.length > 500) {
        setError("Reason must be 500 characters or fewer.");
        return;
      }
    }
    setError("");
    onConfirm?.(reason);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-order-modal-title"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="absolute right-3 top-3 rounded-full p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <h2 id="cancel-order-modal-title" className="text-lg font-semibold text-ink">
          Cancel Order
        </h2>
        <p className="mt-1 text-sm text-muted">
          Please tell us why you are cancelling. This helps us improve your experience.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="space-y-2">
            {PRESET_REASONS.map((reason) => (
              <label
                key={reason}
                className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                  selected === reason ? "border-brand bg-brand-light/40" : "border-slate-200"
                }`}
              >
                <input
                  type="radio"
                  name="cancel-reason"
                  value={reason}
                  checked={selected === reason}
                  onChange={() => {
                    setSelected(reason);
                    setError("");
                  }}
                  className="mt-1"
                />
                <span>{reason}</span>
              </label>
            ))}
          </div>

          {selected === "Other" ? (
            <textarea
              value={otherText}
              onChange={(event) => {
                setOtherText(event.target.value);
                setError("");
              }}
              rows={3}
              maxLength={500}
              placeholder="Please describe your reason..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          ) : null}

          {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-ink hover:bg-slate-50 disabled:opacity-50"
            >
              Keep Order
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Cancelling..." : "Confirm Cancel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CancelOrderModal;
