import { useState } from "react";
import { X, Mail, Lock, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";

const AuthModal = () => {
  const { authModalOpen, setAuthModalOpen, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const { t } = useLanguage();
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!authModalOpen) return null;

  const handleClose = () => {
    setAuthModalOpen(false);
    setError("");
    setEmail("");
    setPassword("");
    setFullName("");
    setMode("signin");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "signin") {
      const res = await signInWithEmail(email, password);
      if (res.error) setError(res.error);
    } else {
      const res = await signUpWithEmail(email, password, fullName);
      if (res.error) {
        setError(res.error);
      } else {
        toast.success(t.auth.signUpSuccess);
        setMode("signin");
        setPassword("");
      }
    }
    setLoading(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border pointer-events-auto animate-in zoom-in-95 fade-in duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors z-10"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="p-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                {mode === "signin" ? t.auth.signIn : t.auth.register}
              </h2>
              {mode === "signin" ? (
                <button
                  onClick={() => { setMode("register"); setError(""); }}
                  className="ml-auto px-4 py-1.5 rounded-full border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  {t.auth.register}
                </button>
              ) : (
                <button
                  onClick={() => { setMode("signin"); setError(""); }}
                  className="ml-auto px-4 py-1.5 rounded-full border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  {t.auth.signIn}
                </button>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {t.auth.fullName}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {t.auth.email}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {t.auth.password}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
              </div>

              {mode === "signin" && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <input type="checkbox" className="rounded border-border text-primary focus:ring-primary h-4 w-4" />
                    {t.auth.staySignedIn}
                  </label>
                  <button type="button" className="text-sm text-primary hover:underline">
                    {t.auth.forgotPassword}
                  </button>
                </div>
              )}

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-foreground text-background font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "..." : mode === "signin" ? t.auth.signIn : t.auth.register}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-sm text-muted-foreground">{t.auth.or}</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Social buttons */}
            <div className="space-y-3">
              <button
                onClick={signInWithGoogle}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border bg-background text-foreground hover:bg-secondary transition-colors font-medium text-sm"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                {t.auth.googleSignIn}
              </button>
            </div>

            {/* Terms */}
            <p className="text-xs text-muted-foreground text-center mt-6 leading-relaxed">
              {t.auth.termsNote}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthModal;
