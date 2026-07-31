import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CandlestickChart, Loader2 } from "lucide-react";
import { login, signup } from "../api";
import { useAuth } from "../useAuth";

export default function Auth() {
    const [mode, setMode] = useState<"login" | "signup">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const { signIn } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = mode === "login"
                ? await login(email, password)
                : await signup(email, password);
            signIn(res.token, res.email);
            navigate("/markets");
        } catch (err: any) {
            setError(err?.response?.data?.error || "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-full items-center justify-center px-4">
            <div className="w-full max-w-sm">
                <div className="mb-8 flex items-center justify-center gap-2">
                    <CandlestickChart className="h-6 w-6 text-yellow-500" />
                    <span className="text-lg font-semibold tracking-tight">Exchange</span>
                </div>

                <div className="rounded-lg border border-[#2b3139] bg-[#181a20] p-6">
                    <h1 className="mb-1 text-xl font-semibold">
                        {mode === "login" ? "Sign in" : "Create account"}
                    </h1>
                    <p className="mb-6 text-sm text-[#848e9c]">
                        {mode === "login"
                            ? "Welcome back. Enter your details below."
                            : "New accounts start with 10,000 INR."}
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="mb-1.5 block text-xs text-[#848e9c]">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full rounded border border-[#2b3139] bg-[#0b0e11] px-3 py-2 text-sm outline-none focus:border-yellow-500"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs text-[#848e9c]">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full rounded border border-[#2b3139] bg-[#0b0e11] px-3 py-2 text-sm outline-none focus:border-yellow-500"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <p className="rounded border border-red-900/50 bg-red-950/40 px-3 py-2 text-xs text-red-400">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full items-center justify-center gap-2 rounded bg-yellow-500 py-2.5 text-sm font-semibold text-black transition hover:bg-yellow-400 disabled:opacity-60"
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {mode === "login" ? "Sign in" : "Sign up"}
                        </button>
                    </form>

                    <button
                        onClick={() => {
                            setMode(mode === "login" ? "signup" : "login");
                            setError("");
                        }}
                        className="mt-4 w-full text-center text-xs text-[#848e9c] transition hover:text-[#eaecef]"
                    >
                        {mode === "login"
                            ? "Don't have an account? Sign up"
                            : "Already have an account? Sign in"}
                    </button>
                </div>
            </div>
        </div>
    );
}
