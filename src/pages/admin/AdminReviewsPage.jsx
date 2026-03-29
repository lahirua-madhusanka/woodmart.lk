import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import DataTable from "../../components/admin/DataTable";
import { getApiErrorMessage } from "../../services/apiClient";
import { getAdminReviewsApi } from "../../services/adminApi/metaService";

function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getAdminReviewsApi();
        setReviews(data || []);
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return <div className="rounded-xl bg-white p-10 text-center text-muted">Loading reviews...</div>;
  }

  return (
    <DataTable
      rows={reviews}
      columns={[
        { key: "productName", label: "Product" },
        { key: "name", label: "Reviewer" },
        { key: "rating", label: "Rating", render: (row) => Number(row.rating).toFixed(1) },
        { key: "comment", label: "Comment" },
        {
          key: "createdAt",
          label: "Date",
          render: (row) => new Date(row.createdAt).toLocaleDateString(),
        },
      ]}
      emptyText="No reviews found"
    />
  );
}

export default AdminReviewsPage;
