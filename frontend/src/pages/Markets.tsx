import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { MARKETS } from "../markets";

export default function Markets() {
    return (
        <div className="mx-auto max-w-3xl px-4 py-8">
            <h1 className="mb-1 text-xl font-semibold">Markets</h1>
            <p className="mb-6 text-sm text-[#848e9c]">Spot trading pairs</p>

            <div className="overflow-hidden rounded-lg border border-[#2b3139]">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-[#2b3139] bg-[#181a20] text-left text-xs text-[#848e9c]">
                            <th className="px-4 py-3 font-medium">Pair</th>
                            <th className="px-4 py-3 font-medium">Name</th>
                            <th className="px-4 py-3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {MARKETS.map((market) => (
                            <tr
                                key={market.symbol}
                                className="border-b border-[#2b3139] last:border-0 hover:bg-[#181a20]"
                            >
                                <td className="px-4 py-3 font-medium">
                                    {market.base}/{market.quote}
                                </td>
                                <td className="px-4 py-3 text-[#848e9c]">{market.name}</td>
                                <td className="px-4 py-3 text-right">
                                    <Link
                                        to={`/trade/${market.symbol}`}
                                        className="inline-flex items-center gap-1 text-yellow-500 transition hover:text-yellow-400"
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
    );
}
