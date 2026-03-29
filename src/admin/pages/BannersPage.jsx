import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import DataTable from "../components/DataTable";
import EmptyState from "../components/EmptyState";
import Loader from "../components/Loader";
import StatusBadge from "../components/StatusBadge";
import {
  createBanner,
  deleteBanner,
  getBanners,
  updateBanner,
} from "../services/bannersService";

function BannersPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const data = await getBanners();
      setBanners(data || []);
      setLoading(false);
    };

    load();
  }, []);

  const addBanner = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = await createBanner({
      title: form.get("title")?.toString().trim() || "",
      subtitle: form.get("subtitle")?.toString().trim() || "",
      ctaText: form.get("ctaText")?.toString().trim() || "",
      ctaLink: form.get("ctaLink")?.toString().trim() || "/shop",
      image: form.get("image")?.toString().trim() || "",
      active: true,
    });
    setBanners((prev) => [next, ...prev]);
    event.currentTarget.reset();
  };

  const toggleStatus = async (banner) => {
    const updated = await updateBanner(banner.id, { active: !banner.active });
    setBanners((prev) => prev.map((item) => (item.id === banner.id ? updated : item)));
  };

  const handleDelete = async () => {
    setDeleting(true);
    await deleteBanner(deleteId);
    setBanners((prev) => prev.filter((item) => item.id !== deleteId));
    setDeleteId("");
    setDeleting(false);
  };

  if (loading) {
    return <Loader label="Loading banners..." />;
  }

  return (
    <div className="space-y-5">
      <form onSubmit={addBanner} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-5">
        <input name="title" required placeholder="Banner title" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input name="subtitle" required placeholder="Subtitle" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input name="ctaText" required placeholder="CTA text" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input name="ctaLink" required placeholder="CTA link" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <div className="flex gap-2">
          <input name="image" required placeholder="Image URL" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button type="submit" className="inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white">
            <Plus size={14} />
            Add
          </button>
        </div>
      </form>

      <DataTable
        rowKey="id"
        rows={banners}
        columns={[
          {
            key: "banner",
            title: "Banner",
            render: (row) => (
              <div className="flex items-center gap-3">
                <img src={row.image} alt={row.title} className="h-10 w-16 rounded-md object-cover" loading="lazy" />
                <div>
                  <p className="font-semibold text-ink">{row.title}</p>
                  <p className="text-xs text-muted">{row.subtitle}</p>
                </div>
              </div>
            ),
          },
          { key: "ctaText", title: "CTA" },
          { key: "ctaLink", title: "Link" },
          {
            key: "active",
            title: "Status",
            render: (row) => <StatusBadge value={row.active ? "active" : "inactive"} />,
          },
          {
            key: "actions",
            title: "Actions",
            render: (row) => (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleStatus(row)}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                >
                  {row.active ? "Disable" : "Enable"}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteId(row.id)}
                  className="rounded-md border border-red-200 p-2 text-red-600"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ),
          },
        ]}
        emptyFallback={<EmptyState title="No banners configured" />}
      />

      <ConfirmDeleteModal
        open={Boolean(deleteId)}
        title="Delete Banner"
        message="This banner will be permanently deleted."
        onConfirm={handleDelete}
        onClose={() => setDeleteId("")}
        loading={deleting}
      />
    </div>
  );
}

export default BannersPage;
