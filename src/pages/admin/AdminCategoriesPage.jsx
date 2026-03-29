import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "../../services/apiClient";
import { getAdminCategoriesApi } from "../../services/adminApi/productsService";

function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getAdminCategoriesApi();
        setCategories(data || []);
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return <div className="rounded-xl bg-white p-10 text-center text-muted">Loading categories...</div>;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-ink">Categories</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {categories.map((category) => (
          <span key={category} className="rounded-full bg-brand-light px-3 py-1 text-sm font-semibold text-brand-dark">
            {category}
          </span>
        ))}
      </div>
      {!categories.length ? <p className="mt-3 text-sm text-muted">No categories found.</p> : null}
    </div>
  );
}

export default AdminCategoriesPage;
