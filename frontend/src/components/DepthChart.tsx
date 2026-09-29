import type { Depth } from "../types";
import { fmtPrice } from "../format";

interface Props {
    depth: Depth;
}

export default function DepthChart({ depth }: Props) {
    const bids = [...depth.bids]
        .map(([p, q]) => [Number(p), Number(q)] as const)
        .filter(([p, q]) => p > 0 && q > 0)
        .sort((a, b) => b[0] - a[0]);
    const asks = [...depth.asks]
        .map(([p, q]) => [Number(p), Number(q)] as const)
        .filter(([p, q]) => p > 0 && q > 0)
        .sort((a, b) => a[0] - b[0]);

    if (bids.length === 0 && asks.length === 0) {
        return (
            <div className="grid h-full place-items-center bg-panel text-sm text-muted">
                No depth yet
            </div>
        );
    }

    let bidRun = 0;
    const bidPts = bids.map(([p, q]) => {
        bidRun += q;
        return { price: p, total: bidRun };
    });
    let askRun = 0;
    const askPts = asks.map(([p, q]) => {
        askRun += q;
        return { price: p, total: askRun };
    });

    const maxTotal = Math.max(bidRun, askRun, 1);
    const prices = [...bidPts, ...askPts].map((p) => p.price);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const span = maxP - minP || 1;

    const w = 1000;
    const h = 420;
    const pad = 16;
    const x = (price: number) => pad + ((price - minP) / span) * (w - pad * 2);
    const y = (total: number) => h - pad - (total / maxTotal) * (h - pad * 2);

    function area(points: { price: number; total: number }[], color: string) {
        if (!points.length) return null;
        const ordered = [...points].sort((a, b) => a.price - b.price);
        const first = ordered[0];
        const last = ordered[ordered.length - 1];
        const d = [
            `M ${x(first.price)} ${h - pad}`,
            ...ordered.map((p) => `L ${x(p.price)} ${y(p.total)}`),
            `L ${x(last.price)} ${h - pad}`,
            "Z",
        ].join(" ");
        const line = ordered
            .map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.price)} ${y(p.total)}`)
            .join(" ");
        return (
            <>
                <path d={d} fill={color} opacity="0.18" />
                <path d={line} fill="none" stroke={color} strokeWidth="2" />
            </>
        );
    }

    const mid = bids[0] && asks[0] ? (bids[0][0] + asks[0][0]) / 2 : null;

    return (
        <div className="relative h-full bg-panel">
            <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full" preserveAspectRatio="none">
                {area(bidPts, "#0ecb81")}
                {area(askPts, "#f6465d")}
                {mid !== null && (
                    <line
                        x1={x(mid)}
                        x2={x(mid)}
                        y1={pad}
                        y2={h - pad}
                        stroke="#2a2a32"
                        strokeDasharray="4 4"
                    />
                )}
            </svg>
            {mid !== null && (
                <div className="pointer-events-none absolute left-3 top-3 rounded-md border border-line bg-bg/80 px-2 py-1 text-[11px] tabular-nums text-muted">
                    Mid {fmtPrice(mid)}
                </div>
            )}
        </div>
    );
}
