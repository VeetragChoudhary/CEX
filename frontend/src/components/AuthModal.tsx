import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { login, signup } from "../api";
import { useAuth } from "../useAuth";

export default function AuthModal() {
    const { authMode, closeAuth, signIn, openAuth } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    if (!authMode) return null;

    const mode = authMode;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res =
                mode === "login"
                    ? await login(email, password)
                    : await signup(email, password);
            signIn(res.token, res.email);
            setEmail("");
            setPassword("");
        } catch (err: any) {
            setError(err?.response?.data?.error || "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-xl border border-line bg-panel p-5 shadow-2xl">
                <div className="mb-4 flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">
                            {mode === "login" ? "Welcome back" : "Create account"}
                        </h2>
                        <p className="mt-1 text-[13px] text-muted">
                            {mode === "login"
                                ? "Log in to place orders and view balances."
                                : "New accounts start with 5,000 USD and 50 SOL."}
                        </p>
                    </div>
                    <button
                        onClick={closeAuth}
                        aria-label="Close"
                        className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-hover hover:text-fg"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <label className="block">
                        <span className="mb-1.5 block text-[11px] uppercase tracking-wide text-dim">
                            Email
                        </span>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="h-10 w-full rounded-md border border-line bg-bg px-3 text-sm outline-none focus:border-accent"
                            placeholder="you@example.com"
                        />
                    </label>
                    <label className="block">
                        <span className="mb-1.5 block text-[11px] uppercase tracking-wide text-dim">
                            Password
                        </span>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="h-10 w-full rounded-md border border-line bg-bg px-3 text-sm outline-none focus:border-accent"
                            placeholder="••••••••"
                        />
                    </label>
                    {error && (
                        <p className="rounded-md border border-down/30 bg-down-dim px-3 py-2 text-xs text-down">
                            {error}
                        </p>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-fg text-sm font-semibold text-bg hover:bg-white disabled:opacity-60"
                    >
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {mode === "login" ? "Log in" : "Sign up"}
                    </button>
                </form>

                <button
                    onClick={() => {
                        openAuth(mode === "login" ? "signup" : "login");
                        setError("");
                    }}
                    className="mt-4 w-full text-center text-xs text-muted hover:text-fg"
                >
                    {mode === "login"
                        ? "Don't have an account? Sign up"
                        : "Already have an account? Log in"}
                </button>
            </div>
        </div>
    );
}
