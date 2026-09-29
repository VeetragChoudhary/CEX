import type { Trade } from "../types";
import { fmtPrice, fmtQty } from "../format";

interface Props {
    trades: Trade[];
    quote: string;
    base: string;
    onPriceClick: (price: string) => void;
}

export default function RecentTrades({ trades, quote, base, onPriceClick }: Props) {
    return (
        <div className="flex h-full min-h-0 flex-col bg-panel">
            <div className="grid grid-cols-2 px-3 py-1.5 text-[10px] uppercase tracking-wide text-dim">
                <span>Price ({quote})</span>
                <span className="text-right">Size ({base})</span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
                {trades.length === 0 ? (
                    <p className="px-3 py-8 text-center text-xs text-muted">No trades yet</p>
                ) : (
                    trades.map((trade) => (
                        <button
                            key={trade.tradeId}
                            type="button"
                            onClick={() => onPriceClick(trade.price)}
                            className="grid w-full grid-cols-2 px-3 py-[3px] text-left text-[11px] tabular-nums hover:bg-hover"
                        >
                            <span className={trade.isBuyerMaker ? "text-down" : "text-up"}>
                                {fmtPrice(trade.price)}
                            </span>
                            <span className="text-right text-fg">{fmtQty(trade.quantity)}</span>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}
