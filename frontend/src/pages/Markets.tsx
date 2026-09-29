import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { MARKETS } from "../markets";

export default function Markets() {
    return (
        <div className="h-full overflow-y-auto">
            <div className="mx-auto max-w-4xl px-4 py-8">
                <h1 className="text-xl font-semibold">Markets</h1>
                <p className="mb-6 text-sm text-muted">Spot pairs on this exchange</p>

                <div className="overflow-hidden rounded-xl border border-line">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-line bg-panel text-left text-[11px] uppercase tracking-wide text-dim">
                                <th className="px-4 py-3 font-medium">Market</th>
                                <th className="px-4 py-3 font-medium">Asset</th>
                                <th className="px-4 py-3 font-medium">Type</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {MARKETS.map((market) => (
                                <tr
                                    key={market.symbol}
                                    className="border-b border-line last:border-0 hover:bg-hover"
                                >
                                    <td className="px-4 py-3">
                                        <Link
                                            to={`/trade/${market.symbol}`}
                                            className="flex items-center gap-3"
                                        >
                                            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#9945FF]/20 text-xs font-bold text-[#c4a7ff]">
                                                {market.base.slice(0, 1)}
                                            </span>
                                            <span className="font-medium">
                                                {market.base}/{market.quote}
                                            </span>
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-muted">{market.name}</td>
                                    <td className="px-4 py-3">
                                        <span className="rounded-full bg-elevated px-2 py-0.5 text-[11px] text-muted">
                                            Spot
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            to={`/trade/${market.symbol}`}
                                            className="inline-flex items-center gap-1 text-accent hover:text-fg"
                                        >
                                            Trade
                                            <ChevronRight className="h-4 w-4" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
