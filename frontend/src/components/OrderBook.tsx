import type { Depth } from "../types";
import { fmtPrice, fmtQty } from "../format";

interface Props {
    depth: Depth;
    base: string;
    quote: string;
    lastPrice: number | null;
    lastUp: boolean;
    onPriceClick: (price: string) => void;
}

function Rows({
    levels,
    side,
    onPriceClick,
}: {
    levels: [string, string][];
    side: "bid" | "ask";
    onPriceClick: (price: string) => void;
}) {
    let running = 0;
    const totals = levels.map(([, size]) => (running += Number(size)));
    const max = totals[totals.length - 1] || 1;

    return (
        <div>
            {levels.map(([price, size], i) => (
                <button
                    key={`${side}-${price}`}
                    type="button"
                    onClick={() => onPriceClick(price)}
                    className="relative flex w-full items-center justify-between px-3 py-[3px] text-[11px] tabular-nums hover:bg-hover"
                >
                    <div
                        className={`absolute inset-y-0 right-0 ${
                            side === "bid" ? "bg-up/10" : "bg-down/10"
                        }`}
                        style={{ width: `${(totals[i] / max) * 100}%` }}
                    />
                    <span className={`relative ${side === "bid" ? "text-up" : "text-down"}`}>
                        {fmtPrice(price)}
                    </span>
                    <span className="relative text-fg">{fmtQty(size)}</span>
                    <span className="relative text-muted">{fmtQty(totals[i])}</span>
                </button>
            ))}
        </div>
    );
}

export default function OrderBook({
    depth,
    base,
    quote,
    lastPrice,
    lastUp,
    onPriceClick,
}: Props) {
    const asks = [...depth.asks].slice(0, 11).reverse();
    const bids = [...depth.bids].slice(0, 11);

    const bidVol = depth.bids.reduce((s, [, q]) => s + Number(q), 0);
    const askVol = depth.asks.reduce((s, [, q]) => s + Number(q), 0);
    const totalVol = bidVol + askVol;
    const bidPct = totalVol ? (bidVol / totalVol) * 100 : 50;

    return (
        <div className="flex h-full min-h-0 flex-col bg-panel">
            <div className="grid grid-cols-3 px-3 py-1.5 text-[10px] uppercase tracking-wide text-dim">
                <span>Price ({quote})</span>
                <span className="text-center">Size ({base})</span>
                <span className="text-right">Total</span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
                {asks.length === 0 && bids.length === 0 ? (
                    <p className="px-3 py-8 text-center text-xs text-muted">No orders yet</p>
                ) : (
                    <>
                        <Rows levels={asks} side="ask" onPriceClick={onPriceClick} />
                        <div className="flex items-center justify-between border-y border-line px-3 py-1.5">
                            <span
                                className={`text-sm font-semibold tabular-nums ${
                                    lastUp ? "text-up" : "text-down"
                                }`}
                            >
                                {lastPrice !== null ? fmtPrice(lastPrice) : "—"}
                            </span>
                            <span className="text-[10px] uppercase tracking-wide text-dim">
                                last
                            </span>
                        </div>
                        <Rows levels={bids} side="bid" onPriceClick={onPriceClick} />
                    </>
                )}
            </div>

            <div className="flex items-center gap-2 border-t border-line px-3 py-2 text-[10px] tabular-nums">
                <span className="text-up">{bidPct.toFixed(0)}%</span>
                <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                    <div className="h-full bg-up" style={{ width: `${bidPct}%` }} />
                    <div className="h-full bg-down" style={{ width: `${100 - bidPct}%` }} />
                </div>
                <span className="text-down">{(100 - bidPct).toFixed(0)}%</span>
            </div>
        </div>
    );
}
