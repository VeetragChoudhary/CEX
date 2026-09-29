import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { createOrder } from "../api";
import { useAuth } from "../useAuth";
import type { Balance } from "../types";
import { fmtPrice, fmtQty } from "../format";

interface Props {
    market: string;
    base: string;
    quote: string;
    price: string;
    onPriceChange: (price: string) => void;
    bestBid: number | null;
    bestAsk: number | null;
    balance: Balance;
    onPlaced: () => void;
}

export default function OrderForm({
    market,
    base,
    quote,
    price,
    onPriceChange,
    bestBid,
    bestAsk,
    balance,
    onPlaced,
}: Props) {
    const { token, openAuth } = useAuth();
    const [side, setSide] = useState<"buy" | "sell">("buy");
    const [type, setType] = useState<"limit" | "market">("limit");
    const [quantity, setQuantity] = useState("");
    const [pct, setPct] = useState(0);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const quoteAvail = balance[quote]?.available ?? 0;
    const baseAvail = balance[base]?.available ?? 0;
    const mid =
        bestBid !== null && bestAsk !== null ? (bestBid + bestAsk) / 2 : null;

    const effectivePrice = useMemo(() => {
        if (type === "limit") return Number(price);
        if (side === "buy") return bestAsk ?? Number(price);
        return bestBid ?? Number(price);
    }, [type, price, side, bestAsk, bestBid]);

    const total = (Number.isFinite(effectivePrice) ? effectivePrice : 0) * Number(quantity || 0);

    function applyPercent(next: number) {
        setPct(next);
        if (side === "buy") {
            const px = effectivePrice;
            if (!px) return;
            setQuantity(((quoteAvail * next) / 100 / px).toFixed(4));
        } else {
            setQuantity(((baseAvail * next) / 100).toFixed(4));
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!token) {
            openAuth("signup");
            return;
        }
        setError("");
        setLoading(true);
        try {
            const px =
                type === "market"
                    ? String(
                          side === "buy"
                              ? (bestAsk ?? Number(price)) * 1.05
                              : (bestBid ?? Number(price)) * 0.95
                      )
                    : price;
            await createOrder(market, px, quantity, side);
            setQuantity("");
            setPct(0);
            onPlaced();
        } catch (err: any) {
            setError(err?.response?.data?.error || "Could not place order");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex h-full min-h-0 flex-col bg-panel">
            <div className="grid grid-cols-2 p-1">
                <button
                    onClick={() => setSide("buy")}
                    className={`h-9 rounded-md text-sm font-semibold ${
                        side === "buy" ? "bg-up text-black" : "text-muted hover:text-fg"
                    }`}
                >
                    Buy
                </button>
                <button
                    onClick={() => setSide("sell")}
                    className={`h-9 rounded-md text-sm font-semibold ${
                        side === "sell" ? "bg-down text-white" : "text-muted hover:text-fg"
                    }`}
                >
                    Sell
                </button>
            </div>

            <div className="flex gap-3 px-3 pt-2 text-[13px]">
                {(["limit", "market"] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setType(t)}
                        className={`capitalize ${
                            type === t ? "text-fg" : "text-muted hover:text-fg"
                        }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            <div className="flex items-center justify-between px-3 pt-3 text-[11px] text-muted">
                <span>Balance</span>
                <span className="tabular-nums">
                    {side === "buy"
                        ? `${fmtQty(quoteAvail)} ${quote}`
                        : `${fmtQty(baseAvail)} ${base}`}
                </span>
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
                {type === "limit" && (
                    <div>
                        <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted">
                            <span>Price</span>
                            <span className="flex gap-2">
                                <button
                                    type="button"
                                    className="hover:text-fg"
                                    onClick={() => mid && onPriceChange(mid.toFixed(2))}
                                >
                                    Mid
                                </button>
                                <button
                                    type="button"
                                    className="hover:text-fg"
                                    onClick={() => {
                                        const px = side === "buy" ? bestAsk : bestBid;
                                        if (px) onPriceChange(px.toFixed(2));
                                    }}
                                >
                                    BBO
                                </button>
                            </span>
                        </div>
                        <div className="flex h-10 items-center rounded-md border border-line bg-bg px-3">
                            <input
                                type="number"
                                step="any"
                                min="0"
                                value={price}
                                onChange={(e) => onPriceChange(e.target.value)}
                                required={type === "limit"}
                                className="w-full bg-transparent text-sm tabular-nums outline-none"
                                placeholder="0.00"
                            />
                            <span className="text-xs text-dim">{quote}</span>
                        </div>
                    </div>
                )}

                <label className="block">
                    <span className="mb-1.5 block text-[11px] text-muted">Quantity</span>
                    <div className="flex h-10 items-center rounded-md border border-line bg-bg px-3">
                        <input
                            type="number"
                            step="any"
                            min="0"
                            value={quantity}
                            onChange={(e) => {
                                setQuantity(e.target.value);
                                setPct(0);
                            }}
                            required
                            className="w-full bg-transparent text-sm tabular-nums outline-none"
                            placeholder="0.00"
                        />
                        <span className="text-xs text-dim">{base}</span>
                    </div>
                </label>

                <div>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={pct}
                        onChange={(e) => applyPercent(Number(e.target.value))}
                        className="w-full"
                        style={{
                            background: `linear-gradient(to right, ${
                                side === "buy" ? "#0ecb81" : "#f6465d"
                            } ${pct}%, #2a2a32 ${pct}%)`,
                        }}
                    />
                    <div className="mt-1 flex justify-between text-[10px] text-dim">
                        <span>0%</span>
                        <span>100%</span>
                    </div>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted">Order Value</span>
                    <span className="tabular-nums">
                        {fmtPrice(total)} {quote}
                    </span>
                </div>

                {error && (
                    <p className="rounded-md border border-down/30 bg-down-dim px-3 py-2 text-xs text-down">
                        {error}
                    </p>
                )}

                {token ? (
                    <button
                        type="submit"
                        disabled={loading}
                        className={`mt-auto flex h-11 w-full items-center justify-center gap-2 rounded-md text-sm font-semibold disabled:opacity-60 ${
                            side === "buy"
                                ? "bg-up text-black hover:brightness-110"
                                : "bg-down text-white hover:brightness-110"
                        }`}
                    >
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {side === "buy" ? "Buy" : "Sell"} {base}
                    </button>
                ) : (
                    <div className="mt-auto space-y-2">
                        <button
                            type="button"
                            onClick={() => openAuth("signup")}
                            className="flex h-11 w-full items-center justify-center rounded-md bg-fg text-sm font-semibold text-bg hover:bg-white"
                        >
                            Sign up to trade
                        </button>
                        <button
                            type="button"
                            onClick={() => openAuth("login")}
                            className="w-full text-center text-xs text-muted hover:text-fg"
                        >
                            Log in to trade
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}
