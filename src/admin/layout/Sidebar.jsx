import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  PlusSquare,
  Tags,
  ShoppingBag,
  Users,
  Star,
  Image,
  TicketPercent,
  Settings,
} from "lucide-react";

const links = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/products/add", label: "Add Product", icon: PlusSquare },
  { to: "/admin/categories", label: "Categories", icon: Tags },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
  { to: "/admin/banners", label: "Banners", icon: Image },
  { to: "/admin/coupons", label: "Coupons", icon: TicketPercent },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-4 lg:block">
      <div className="rounded-lg bg-brand px-3 py-2 text-sm font-bold text-white">Admin Panel</div>
      <nav className="mt-4 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;

          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive ? "bg-brand-light text-brand-dark" : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              <Icon size={16} />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;
