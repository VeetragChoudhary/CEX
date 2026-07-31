import type { Trade } from "../types";

interface Props {
    trades: Trade[];
    quote: string;
    base: string;
}

export default function RecentTrades({ trades, quote, base }: Props) {
    return (
        <div className="flex h-full flex-col rounded-lg border border-[#2b3139] bg-[#181a20]">
            <div className="border-b border-[#2b3139] px-3 py-2 text-sm font-medium">
                Recent Trades
            </div>

            <div className="flex justify-between px-3 py-2 text-[11px] text-[#848e9c]">
                <span>Price ({quote})</span>
                <span>Size ({base})</span>
            </div>

            <div className="flex-1 overflow-y-auto">
                {trades.length === 0 ? (
                    <p className="px-3 py-6 text-center text-xs text-[#848e9c]">
                        No trades yet
                    </p>
                ) : (
                    trades.map((trade) => (
                        <div
                            key={trade.tradeId}
                            className="flex justify-between px-3 py-[3px] text-xs"
                        >
                            <span
                                className={
                                    trade.isBuyerMaker ? "text-red-400" : "text-green-400"
                                }
                            >
                                {Number(trade.price).toFixed(2)}
                            </span>
                            <span className="text-[#eaecef]">
                                {Number(trade.quantity).toFixed(2)}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
