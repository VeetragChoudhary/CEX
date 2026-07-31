import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { getBalance, onRamp } from "../api";
import type { Balance } from "../types";

export default function Balances() {
    const [balance, setBalance] = useState<Balance>({});
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);

    async function refresh() {
        try {
            setBalance(await getBalance());
        } catch {
            // An empty balance renders fine, so nothing to do here
        }
    }

    useEffect(() => {
        refresh();
    }, []);

    async function handleDeposit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            setBalance(await onRamp(amount));
            setAmount("");
        } catch {
            // Ignore, the displayed balance stays as it was
        } finally {
            setLoading(false);
        }
    }

    const assets = Object.entries(balance);

    return (
        <div className="mx-auto max-w-3xl px-4 py-8">
            <h1 className="mb-1 text-xl font-semibold">Balances</h1>
            <p className="mb-6 text-sm text-[#848e9c]">Your available and locked funds</p>

            <div className="mb-6 overflow-hidden rounded-lg border border-[#2b3139]">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-[#2b3139] bg-[#181a20] text-left text-xs text-[#848e9c]">
                            <th className="px-4 py-3 font-medium">Asset</th>
                            <th className="px-4 py-3 font-medium">Available</th>
                            <th className="px-4 py-3 font-medium">Locked</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assets.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={3}
                                    className="px-4 py-6 text-center text-xs text-[#848e9c]"
                                >
                                    No balances yet
                                </td>
                            </tr>
                        ) : (
                            assets.map(([asset, value]) => (
                                <tr
                                    key={asset}
                                    className="border-b border-[#2b3139] last:border-0"
                                >
                                    <td className="px-4 py-3 font-medium">{asset}</td>
                                    <td className="px-4 py-3">{value.available.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-[#848e9c]">
                                        {value.locked.toFixed(2)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="rounded-lg border border-[#2b3139] bg-[#181a20] p-4">
                <h2 className="mb-3 text-sm font-medium">Deposit INR</h2>
                <form onSubmit={handleDeposit} className="flex gap-2">
                    <input
                        type="number"
                        step="any"
                        min="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        placeholder="Amount"
                        className="flex-1 rounded border border-[#2b3139] bg-[#0b0e11] px-3 py-2 text-sm outline-none focus:border-yellow-500"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-1.5 rounded bg-yellow-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-yellow-400 disabled:opacity-60"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Plus className="h-4 w-4" />
                        )}
                        Deposit
                    </button>
                </form>
            </div>
        </div>
    );
}
