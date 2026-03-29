import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  MessageSquare,
  PackagePlus,
  Settings,
  ShoppingBag,
  Tags,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/products", label: "Products", icon: Boxes },
  { to: "/admin/products/new", label: "Add Product", icon: PackagePlus },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/categories", label: "Categories", icon: Tags },
  { to: "/admin/reviews", label: "Reviews", icon: MessageSquare },
  { to: "/admin/settings", label: "Settings", icon: Settings },
  { to: "/", label: "Store Front", icon: BarChart3 },
];

function Sidebar({ open, onClose }) {
  return (
    <>
      {open ? (
        <button
          className="fixed inset-0 z-30 bg-slate-900/45 lg:hidden"
          onClick={onClose}
          aria-label="Close sidebar overlay"
        />
      ) : null}

      <aside
        className={`fixed left-0 top-0 z-40 h-full w-72 border-r border-slate-200 bg-white p-5 transition-transform lg:static lg:z-0 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-7">
          <p className="font-display text-2xl font-bold text-brand">Woodmart.lk</p>
          <p className="text-xs text-muted">Admin Console</p>
        </div>

        <nav className="grid gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/admin"}
              onClick={onClose}
              className={({ isActive }) =>
                `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-brand text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              <link.icon size={16} /> {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
