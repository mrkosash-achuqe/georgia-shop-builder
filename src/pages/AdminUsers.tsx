import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import {
  ArrowLeft, Shield, ShieldOff, Ban, CheckCircle2, Trash2, Search,
  Users as UsersIcon, AlertTriangle, XCircle, Package, MoreVertical,
  ShoppingBag, Truck, BarChart3 , MessageSquare } from "lucide-react";

type AdminUser = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  banned_until: string | null;
  roles: string[];
  profile: { full_name: string | null; avatar_url: string | null; phone: string | null } | null;
};

type ConfirmState = {
  action: "grant-admin" | "revoke-admin" | "ban" | "unban" | "delete";
  user: AdminUser;
} | null;

const actionLabels = {
  "grant-admin": { title: "ადმინის მინიჭება", verb: "მინიჭება", danger: false },
  "revoke-admin": { title: "ადმინის წართმევა", verb: "წართმევა", danger: true },
  ban: { title: "მომხმარებლის დაბლოკვა", verb: "დაბლოკვა", danger: true },
  unban: { title: "ბლოკის მოხსნა", verb: "მოხსნა", danger: false },
  delete: { title: "მომხმარებლის წაშლა", verb: "წაშლა", danger: true },
};

const AdminUsers = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setChecking(false); return; }
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => { setIsAdmin(!!data); setChecking(false); });
  }, [user, authLoading]);

  useEffect(() => { if (isAdmin) fetchUsers(); }, [isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-users", { body: { action: "list" } });
    if (error || data?.error) {
      toast.error("მომხმარებლების ჩატვირთვა ვერ მოხერხდა: " + (data?.error || error?.message));
    } else {
      setUsers(data.users || []);
    }
    setLoading(false);
  };

  const runAction = async () => {
    if (!confirm) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: { action: confirm.action, user_id: confirm.user.id },
    });
    if (error || data?.error) {
      toast.error("შეცდომა: " + (data?.error || error?.message));
    } else {
      toast.success("✅ წარმატებით შესრულდა");
      setConfirm(null);
      fetchUsers();
    }
    setBusy(false);
  };

  const filtered = users.filter((u) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      u.email?.toLowerCase().includes(q) ||
      u.profile?.full_name?.toLowerCase().includes(q) ||
      u.profile?.phone?.toLowerCase().includes(q)
    );
  });

  const isBanned = (u: AdminUser) => u.banned_until && new Date(u.banned_until) > new Date();
  const isUserAdmin = (u: AdminUser) => u.roles.includes("admin");

  const stats = {
    total: users.length,
    admins: users.filter(isUserAdmin).length,
    banned: users.filter(isBanned).length,
  };

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">ავტორიზაცია საჭიროა</h1>
          <Link to="/" className="text-primary hover:underline">მთავარზე დაბრუნება</Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">წვდომა შეზღუდულია</h1>
          <Link to="/" className="text-primary hover:underline">მთავარზე დაბრუნება</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
          <Link to="/admin/dashboard" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 whitespace-nowrap"><BarChart3 className="h-4 w-4" /> დაშბორდი</Link>
                    <Link to="/admin" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 whitespace-nowrap">
            <Package className="h-4 w-4" /> პროდუქტები
          </Link>
          <span className="px-4 py-2.5 text-sm font-semibold text-primary border-b-2 border-primary flex items-center gap-2 whitespace-nowrap -mb-px">
            <UsersIcon className="h-4 w-4" /> მომხმარებლები
          </span>
          <Link to="/admin/orders" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 whitespace-nowrap">
            <ShoppingBag className="h-4 w-4" /> შეკვეთები
          </Link>
          <Link to="/admin/shipping" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 whitespace-nowrap">
            <Truck className="h-4 w-4" /> მიწოდება
          </Link>
          <Link to="/admin/reviews" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 whitespace-nowrap"><MessageSquare className="h-4 w-4" /> მიმოხილვები</Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
          <div className="bg-card rounded-xl sm:rounded-2xl border border-border p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <UsersIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold">{stats.total}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">სულ</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl sm:rounded-2xl border border-border p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold">{stats.admins}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">ადმინი</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl sm:rounded-2xl border border-border p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                <Ban className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold">{stats.banned}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">დაბლოკილი</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mb-4">
          <h1 className="text-xl sm:text-2xl font-bold">👥 მომხმარებლების მართვა</h1>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ძიება (ემაილი, სახელი, ტელეფონი)..."
            className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border">
            <UsersIcon className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">მომხმარებელი ვერ მოიძებნა</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((u) => {
              const banned = isBanned(u);
              const admin = isUserAdmin(u);
              const isSelf = u.id === user.id;
              return (
                <div key={u.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0 overflow-hidden">
                    {u.profile?.avatar_url ? (
                      <img src={u.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (u.profile?.full_name?.[0] || u.email?.[0] || "?").toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm truncate">{u.profile?.full_name || u.email}</p>
                      {admin && (
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <Shield className="h-2.5 w-2.5" /> ადმინი
                        </span>
                      )}
                      {banned && (
                        <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <Ban className="h-2.5 w-2.5" /> დაბლოკილი
                        </span>
                      )}
                      {isSelf && (
                        <span className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full font-medium">თქვენ</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    {u.profile?.phone && <p className="text-xs text-muted-foreground truncate">{u.profile.phone}</p>}
                  </div>

                  <div className="relative shrink-0">
                    <button
                      onClick={() => setMenuOpen(menuOpen === u.id ? null : u.id)}
                      disabled={isSelf}
                      className="p-2 rounded-lg hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {menuOpen === u.id && !isSelf && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                        <div className="absolute right-0 top-full mt-1 z-20 w-52 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                          {!admin ? (
                            <button
                              onClick={() => { setConfirm({ action: "grant-admin", user: u }); setMenuOpen(null); }}
                              className="w-full px-4 py-2.5 text-left text-sm hover:bg-secondary flex items-center gap-2"
                            >
                              <Shield className="h-4 w-4 text-primary" /> ადმინის მინიჭება
                            </button>
                          ) : (
                            <button
                              onClick={() => { setConfirm({ action: "revoke-admin", user: u }); setMenuOpen(null); }}
                              className="w-full px-4 py-2.5 text-left text-sm hover:bg-secondary flex items-center gap-2"
                            >
                              <ShieldOff className="h-4 w-4" /> ადმინის წართმევა
                            </button>
                          )}
                          {!banned ? (
                            <button
                              onClick={() => { setConfirm({ action: "ban", user: u }); setMenuOpen(null); }}
                              className="w-full px-4 py-2.5 text-left text-sm hover:bg-secondary flex items-center gap-2"
                            >
                              <Ban className="h-4 w-4 text-destructive" /> დაბლოკვა
                            </button>
                          ) : (
                            <button
                              onClick={() => { setConfirm({ action: "unban", user: u }); setMenuOpen(null); }}
                              className="w-full px-4 py-2.5 text-left text-sm hover:bg-secondary flex items-center gap-2"
                            >
                              <CheckCircle2 className="h-4 w-4 text-green-600" /> ბლოკის მოხსნა
                            </button>
                          )}
                          <div className="border-t border-border" />
                          <button
                            onClick={() => { setConfirm({ action: "delete", user: u }); setMenuOpen(null); }}
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-destructive/10 text-destructive flex items-center gap-2"
                          >
                            <Trash2 className="h-4 w-4" /> წაშლა
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirm modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-border">
            <div className={`w-14 h-14 rounded-full ${actionLabels[confirm.action].danger ? "bg-destructive/10" : "bg-primary/10"} flex items-center justify-center mx-auto mb-4`}>
              {actionLabels[confirm.action].danger
                ? <AlertTriangle className="h-7 w-7 text-destructive" />
                : <CheckCircle2 className="h-7 w-7 text-primary" />}
            </div>
            <h3 className="text-lg font-bold text-center mb-2">{actionLabels[confirm.action].title}</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              ნამდვილად გსურთ <strong>{confirm.user.profile?.full_name || confirm.user.email}</strong>-ის {actionLabels[confirm.action].verb}?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirm(null)}
                disabled={busy}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary disabled:opacity-50"
              >
                გაუქმება
              </button>
              <button
                onClick={runAction}
                disabled={busy}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 ${
                  actionLabels[confirm.action].danger
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {busy ? "..." : actionLabels[confirm.action].verb}
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default AdminUsers;
