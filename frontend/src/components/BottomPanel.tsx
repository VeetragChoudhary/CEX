import { useState } from "react";
import { Loader2 } from "lucide-react";
import { onRamp } from "../api";
import { useAuth } from "../useAuth";
import type { Balance, Order } from "../types";
import { fmtQty } from "../format";
import OpenOrders from "./OpenOrders";

type Tab = "balances" | "orders";

interface Props {
    balance: Balance;
    orders: Order[];
    market: string;
    onRefresh: () => void;
}

export default function BottomPanel({ balance, orders, market, onRefresh }: Props) {
    const { token, openAuth } = useAuth();
    const [tab, setTab] = useState<Tab>("orders");
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);

    const assets = Object.entries(balance);

    async function handleDeposit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            await onRamp(amount);
            setAmount("");
            onRefresh();
        } catch {
            // Keep the existing snapshot
        } finally {
            setLoading(false);
        }
    }

    const tabs: { id: Tab; label: string; count?: number }[] = [
        { id: "orders", label: "Open Orders", count: orders.length },
        { id: "balances", label: "Balances" },
    ];

    return (
        <div className="flex h-[220px] shrink-0 flex-col border-t border-line bg-panel">
            <div className="flex items-center gap-1 border-b border-line px-2">
                {tabs.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`relative px-3 py-2.5 text-[13px] ${
                            tab === t.id ? "text-fg" : "text-muted hover:text-fg"
                        }`}
                    >
                        {t.label}
                        {t.count ? (
                            <span className="ml-1.5 text-[11px] text-dim">{t.count}</span>
                        ) : null}
                        {tab === t.id && (
                            <span className="absolute inset-x-2 bottom-0 h-0.5 bg-fg" />
                        )}
                    </button>
                ))}
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
                {!token ? (
                    <div className="grid h-full place-items-center">
                        <button
                            onClick={() => openAuth("login")}
                            className="text-sm text-muted hover:text-fg"
                        >
                            Log in to view {tab === "orders" ? "open orders" : "balances"}
                        </button>
                    </div>
                ) : tab === "orders" ? (
                    <OpenOrders orders={orders} market={market} onCancelled={onRefresh} />
                ) : (
                    <div className="grid h-full grid-cols-1 md:grid-cols-[1fr_280px]">
                        <div className="overflow-auto">
                            <table className="w-full text-[12px] tabular-nums">
                                <thead className="sticky top-0 bg-panel text-left text-[10px] uppercase tracking-wide text-dim">
                                    <tr>
                                        <th className="px-3 py-2 font-medium">Asset</th>
                                        <th className="px-3 py-2 font-medium">Available</th>
                                        <th className="px-3 py-2 font-medium">Locked</th>
                                        <th className="px-3 py-2 font-medium">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assets.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-3 py-8 text-center text-muted">
                                                No balances yet
                                            </td>
                                        </tr>
                                    ) : (
                                        assets.map(([asset, value]) => (
                                            <tr key={asset} className="border-t border-line">
                                                <td className="px-3 py-2 font-medium">{asset}</td>
                                                <td className="px-3 py-2">{fmtQty(value.available)}</td>
                                                <td className="px-3 py-2 text-muted">
                                                    {fmtQty(value.locked)}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {fmtQty(value.available + value.locked)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <form
                            onSubmit={handleDeposit}
                            className="flex flex-col justify-center gap-2 border-t border-line p-3 md:border-l md:border-t-0"
                        >
                            <p className="text-[11px] uppercase tracking-wide text-dim">
                                Deposit USD
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    step="any"
                                    min="0"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                    placeholder="Amount"
                                    className="h-9 flex-1 rounded-md border border-line bg-bg px-3 text-sm outline-none focus:border-accent"
                                />
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex h-9 items-center gap-1.5 rounded-md bg-fg px-3 text-[13px] font-semibold text-bg hover:bg-white disabled:opacity-60"
                                >
                                    {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                    Deposit
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
