function ConfirmModal({ open, title, description, onConfirm, onClose, confirmText = "Confirm" }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-premium">
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
        <p className="mt-2 text-sm text-muted">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
