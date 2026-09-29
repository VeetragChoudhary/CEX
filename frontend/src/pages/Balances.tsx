import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getBalance, onRamp } from "../api";
import { useAuth } from "../useAuth";
import type { Balance } from "../types";
import { fmtQty } from "../format";

export default function Balances() {
    const { token, openAuth } = useAuth();
    const [balance, setBalance] = useState<Balance>({});
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);

    async function refresh() {
        try {
            setBalance(await getBalance());
        } catch {
            // An empty table is fine
        }
    }

    useEffect(() => {
        if (token) refresh();
    }, [token]);

    async function handleDeposit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            setBalance(await onRamp(amount));
            setAmount("");
        } catch {
            // Keep the displayed balance
        } finally {
            setLoading(false);
        }
    }

    const assets = Object.entries(balance);

    if (!token) {
        return (
            <div className="grid h-full place-items-center">
                <button
                    onClick={() => openAuth("login")}
                    className="rounded-md bg-fg px-4 py-2 text-sm font-semibold text-bg"
                >
                    Log in to view balances
                </button>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto">
            <div className="mx-auto max-w-4xl px-4 py-8">
                <h1 className="text-xl font-semibold">Balances</h1>
                <p className="mb-6 text-sm text-muted">Available and locked funds</p>

                <div className="mb-6 overflow-hidden rounded-xl border border-line">
                    <table className="w-full text-sm tabular-nums">
                        <thead>
                            <tr className="border-b border-line bg-panel text-left text-[11px] uppercase tracking-wide text-dim">
                                <th className="px-4 py-3 font-medium">Asset</th>
                                <th className="px-4 py-3 font-medium">Available</th>
                                <th className="px-4 py-3 font-medium">Locked</th>
                                <th className="px-4 py-3 font-medium">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assets.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-4 py-8 text-center text-sm text-muted"
                                    >
                                        No balances yet
                                    </td>
                                </tr>
                            ) : (
                                assets.map(([asset, value]) => (
                                    <tr key={asset} className="border-b border-line last:border-0">
                                        <td className="px-4 py-3 font-medium">{asset}</td>
                                        <td className="px-4 py-3">{fmtQty(value.available)}</td>
                                        <td className="px-4 py-3 text-muted">
                                            {fmtQty(value.locked)}
                                        </td>
                                        <td className="px-4 py-3">
                                            {fmtQty(value.available + value.locked)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="rounded-xl border border-line bg-panel p-4">
                    <h2 className="mb-3 text-sm font-medium">Deposit USD</h2>
                    <form onSubmit={handleDeposit} className="flex gap-2">
                        <input
                            type="number"
                            step="any"
                            min="0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            placeholder="Amount"
                            className="h-10 flex-1 rounded-md border border-line bg-bg px-3 text-sm outline-none focus:border-accent"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex h-10 items-center gap-1.5 rounded-md bg-fg px-4 text-sm font-semibold text-bg hover:bg-white disabled:opacity-60"
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Deposit
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
