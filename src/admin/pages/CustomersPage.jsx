import { ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import DataTable from "../components/DataTable";
import EmptyState from "../components/EmptyState";
import Loader from "../components/Loader";
import SearchBar from "../components/SearchBar";
import StatusBadge from "../components/StatusBadge";
import usePagination from "../hooks/usePagination";
import {
  deleteCustomer,
  getCustomers,
  updateCustomerRole,
} from "../services/customersService";

function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [deleteId, setDeleteId] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const data = await getCustomers();
      setCustomers(data || []);
      setLoading(false);
    };

    load();
  }, []);

  const filtered = useMemo(() => {
    const lowered = query.toLowerCase().trim();
    if (!lowered) return customers;

    return customers.filter(
      (item) =>
        item.name?.toLowerCase().includes(lowered) ||
        item.email?.toLowerCase().includes(lowered)
    );
  }, [customers, query]);

  const { page, totalPages, data, setPage } = usePagination(filtered, 10);

  const handleRoleToggle = async (customer) => {
    const nextRole = customer.role === "admin" ? "user" : "admin";
    const updated = await updateCustomerRole(customer._id, nextRole);
    setCustomers((prev) => prev.map((item) => (item._id === customer._id ? updated : item)));
  };

  const handleDelete = async () => {
    setDeleting(true);
    await deleteCustomer(deleteId);
    setCustomers((prev) => prev.filter((item) => item._id !== deleteId));
    setDeleteId("");
    setDeleting(false);
  };

  if (loading) {
    return <Loader label="Loading customers..." />;
  }

  return (
    <div className="space-y-4">
      <SearchBar value={query} onChange={setQuery} placeholder="Search customers" />

      <DataTable
        rowKey="_id"
        rows={data}
        columns={[
          {
            key: "name",
            title: "Customer",
            render: (row) => (
              <div>
                <p className="font-semibold text-ink">{row.name}</p>
                <p className="text-xs text-muted">{row.email}</p>
              </div>
            ),
          },
          { key: "email", title: "Email" },
          {
            key: "role",
            title: "Role",
            render: (row) => <StatusBadge value={row.role || "user"} />,
          },
          {
            key: "createdAt",
            title: "Joined",
            render: (row) => new Date(row.createdAt).toLocaleDateString(),
          },
          {
            key: "actions",
            title: "Actions",
            render: (row) => (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRoleToggle(row)}
                  className="inline-flex items-center gap-1 rounded-md border border-brand px-2 py-1 text-xs font-semibold text-brand"
                >
                  <ShieldCheck size={13} />
                  Set {row.role === "admin" ? "User" : "Admin"}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteId(row._id)}
                  className="rounded-md border border-red-200 p-2 text-red-600"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ),
          },
        ]}
        emptyFallback={<EmptyState title="No customers found" />}
      />

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setPage(page - 1)}
          disabled={page <= 1}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40"
        >
          Prev
        </button>
        <span className="text-sm text-muted">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40"
        >
          Next
        </button>
      </div>

      <ConfirmDeleteModal
        open={Boolean(deleteId)}
        title="Delete Customer"
        message="This permanently removes the customer account."
        onConfirm={handleDelete}
        onClose={() => setDeleteId("")}
        loading={deleting}
      />
    </div>
  );
}

export default CustomersPage;
