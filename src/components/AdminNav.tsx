import { Link, useLocation } from "react-router-dom";
import { Palette, Tags, LayoutDashboard, Package } from "lucide-react";

/** Extra admin shortcuts: site design/settings and categories. */
const AdminExtraNav = () => {
  const { pathname } = useLocation();
  const links = [
    { to: "/admin/dashboard", label: "დაფა", icon: LayoutDashboard },
    { to: "/admin", label: "პროდუქტები", icon: Package },
    { to: "/admin/categories", label: "კატეგორიები", icon: Tags },
    { to: "/admin/settings", label: "დიზაინი და პარამეტრები", icon: Palette },
  ];
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border mb-6">
      {links.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          className={`px-4 py-2.5 text-sm font-medium flex items-center gap-2 whitespace-nowrap border-b-2 transition-colors ${
            pathname === to ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Icon className="h-4 w-4" /> {label}
        </Link>
      ))}
    </div>
  );
};

export default AdminExtraNav;
