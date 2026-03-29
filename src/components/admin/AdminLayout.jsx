import { Outlet, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const titleMap = {
  "/admin": "Dashboard",
  "/admin/products": "Products",
  "/admin/products/new": "Add Product",
  "/admin/orders": "Orders",
  "/admin/users": "Users",
  "/admin/categories": "Categories",
  "/admin/reviews": "Reviews",
  "/admin/settings": "Settings",
};

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const title = useMemo(() => {
    if (location.pathname.startsWith("/admin/products/edit")) return "Edit Product";
    return titleMap[location.pathname] || "Admin";
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-shell lg:grid lg:grid-cols-[288px_1fr]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="min-h-screen">
        <Topbar onToggleSidebar={() => setSidebarOpen((value) => !value)} title={title} />
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
