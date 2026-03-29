import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import DataTable from "../components/DataTable";
import EmptyState from "../components/EmptyState";
import Loader from "../components/Loader";
import { deleteReview, getReviews } from "../services/reviewsService";

function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const data = await getReviews();
      setReviews(data || []);
      setLoading(false);
    };

    load();
  }, []);

  const handleDelete = async () => {
    setDeleting(true);
    await deleteReview(deleteId);
    setReviews((prev) => prev.filter((item) => item._id !== deleteId));
    setDeleteId("");
    setDeleting(false);
  };

  if (loading) {
    return <Loader label="Loading reviews..." />;
  }

  return (
    <div className="space-y-4">
      <DataTable
        rowKey="_id"
        rows={reviews}
        columns={[
          { key: "productName", title: "Product" },
          { key: "name", title: "Reviewer" },
          {
            key: "rating",
            title: "Rating",
            render: (row) => Number(row.rating || 0).toFixed(1),
          },
          { key: "comment", title: "Comment" },
          {
            key: "created",
            title: "Date",
            render: (row) => new Date(row.createdAt).toLocaleDateString(),
          },
          {
            key: "actions",
            title: "Actions",
            render: (row) => (
              <button
                type="button"
                onClick={() => setDeleteId(row._id)}
                className="rounded-md border border-red-200 p-2 text-red-600"
              >
                <Trash2 size={13} />
              </button>
            ),
          },
        ]}
        emptyFallback={<EmptyState title="No reviews found" />}
      />

      <ConfirmDeleteModal
        open={Boolean(deleteId)}
        title="Delete Review"
        message="The selected review will be removed permanently."
        onConfirm={handleDelete}
        onClose={() => setDeleteId("")}
        loading={deleting}
      />
    </div>
  );
}

export default ReviewsPage;
