import type { Depth } from "../types";

interface Props {
    depth: Depth;
    base: string;
    quote: string;
}

// Rows are drawn with a background bar sized by cumulative total, which is
// the usual way to read depth at a glance.
function Rows({
    levels,
    side,
}: {
    levels: [string, string][];
    side: "bid" | "ask";
}) {
    let running = 0;
    const totals = levels.map(([, size]) => (running += Number(size)));
    const max = totals[totals.length - 1] || 1;

    return (
        <div>
            {levels.map(([price, size], i) => (
                <div key={price} className="relative flex justify-between px-3 py-[3px] text-xs">
                    <div
                        className={`absolute inset-y-0 right-0 ${
                            side === "bid" ? "bg-green-500/10" : "bg-red-500/10"
                        }`}
                        style={{ width: `${(totals[i] / max) * 100}%` }}
                    />
                    <span
                        className={`relative ${
                            side === "bid" ? "text-green-400" : "text-red-400"
                        }`}
                    >
                        {Number(price).toFixed(2)}
                    </span>
                    <span className="relative text-[#eaecef]">{Number(size).toFixed(2)}</span>
                    <span className="relative text-[#848e9c]">{totals[i].toFixed(2)}</span>
                </div>
            ))}
        </div>
    );
}

export default function OrderBook({ depth, base, quote }: Props) {
    // Best prices sit next to the spread, so asks are drawn worst to best
    const asks = [...depth.asks].slice(0, 12).reverse();
    const bids = [...depth.bids].slice(0, 12);

    const bestAsk = depth.asks[0] ? Number(depth.asks[0][0]) : null;
    const bestBid = depth.bids[0] ? Number(depth.bids[0][0]) : null;
    const spread = bestAsk !== null && bestBid !== null ? bestAsk - bestBid : null;

    return (
        <div className="flex h-full flex-col rounded-lg border border-[#2b3139] bg-[#181a20]">
            <div className="border-b border-[#2b3139] px-3 py-2 text-sm font-medium">
                Order Book
            </div>

            <div className="flex justify-between px-3 py-2 text-[11px] text-[#848e9c]">
                <span>Price ({quote})</span>
                <span>Size ({base})</span>
                <span>Total</span>
            </div>

            <div className="flex-1 overflow-y-auto">
                {asks.length === 0 && bids.length === 0 ? (
                    <p className="px-3 py-6 text-center text-xs text-[#848e9c]">
                        No orders yet
                    </p>
                ) : (
                    <>
                        <Rows levels={asks} side="ask" />

                        <div className="flex items-center justify-between border-y border-[#2b3139] px-3 py-1.5">
                            <span className="text-sm font-medium">
                                {bestBid !== null ? bestBid.toFixed(2) : "--"}
                            </span>
                            {spread !== null && (
                                <span className="text-[11px] text-[#848e9c]">
                                    Spread {spread.toFixed(2)}
                                </span>
                            )}
                        </div>

                        <Rows levels={bids} side="bid" />
                    </>
                )}
            </div>
        </div>
    );
}
