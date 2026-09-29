import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronDown, Loader2 } from "lucide-react";
import { getBalance, getDepth, getOpenOrders, seedOrderbook } from "../api";
import { MARKETS } from "../markets";
import { wsClient } from "../ws";
import type { Balance, Depth, Order, Trade } from "../types";
import { fmtCompact, fmtPrice } from "../format";
import { useAuth } from "../useAuth";
import OrderBook from "../components/OrderBook";
import OrderForm from "../components/OrderForm";
import RecentTrades from "../components/RecentTrades";
import PriceChart from "../components/PriceChart";
import DepthChart from "../components/DepthChart";
import BottomPanel from "../components/BottomPanel";

export default function TradePage() {
    const { market: marketParam } = useParams();
    const market = marketParam ?? MARKETS[0].symbol;
    const config = MARKETS.find((m) => m.symbol === market);
    const { token } = useAuth();

    const [depth, setDepth] = useState<Depth>({ bids: [], asks: [] });
    const [orders, setOrders] = useState<Order[]>([]);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [balance, setBalance] = useState<Balance>({});
    const [price, setPrice] = useState("");
    const [bookTab, setBookTab] = useState<"book" | "trades">("book");
    const [chartTab, setChartTab] = useState<"chart" | "depth">("chart");
    const [seeding, setSeeding] = useState(false);

    const refresh = useCallback(async () => {
        try {
            const nextDepth = await getDepth(market);
            setDepth(nextDepth);
            if (token) {
                const [nextOrders, nextBalance] = await Promise.all([
                    getOpenOrders(market),
                    getBalance(),
                ]);
                setOrders(nextOrders);
                setBalance(nextBalance);
            } else {
                setOrders([]);
                setBalance({});
            }
        } catch {
            // Keep the last good snapshot
        }
    }, [market, token]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    async function handleSeed() {
        setSeeding(true);
        try {
            const nextDepth = await seedOrderbook(market);
            setDepth(nextDepth);
        } catch {
            await refresh();
        } finally {
            setSeeding(false);
        }
    }

    useEffect(() => {
        function applySide(
            current: [string, string][],
            updates: [string, string][],
            descending: boolean
        ): [string, string][] {
            const next = new Map(current);
            updates.forEach(([px, size]) => {
                if (Number(size) === 0) {
                    next.delete(px);
                } else {
                    next.set(px, size);
                }
            });
            return [...next.entries()].sort((a, b) =>
                descending ? Number(b[0]) - Number(a[0]) : Number(a[0]) - Number(b[0])
            );
        }

        const onDepth = (data: any) => {
            setDepth((prev) => ({
                bids: applySide(prev.bids, data.b || [], true),
                asks: applySide(prev.asks, data.a || [], false),
            }));
        };

        const onTrade = (data: any) => {
            setTrades((prev) =>
                [
                    {
                        tradeId: data.t,
                        price: data.p,
                        quantity: data.q,
                        isBuyerMaker: data.m,
                        time: Date.now(),
                    },
                    ...prev,
                ].slice(0, 200)
            );
        };

        wsClient.subscribe(`depth@${market}`, onDepth);
        wsClient.subscribe(`trade@${market}`, onTrade);
        return () => {
            wsClient.unsubscribe(`depth@${market}`, onDepth);
            wsClient.unsubscribe(`trade@${market}`, onTrade);
        };
    }, [market]);

    const bestAsk = depth.asks[0] ? Number(depth.asks[0][0]) : null;
    const bestBid = depth.bids[0] ? Number(depth.bids[0][0]) : null;
    const lastTrade = trades[0];
    const lastPrice = lastTrade
        ? Number(lastTrade.price)
        : bestBid !== null && bestAsk !== null
          ? (bestBid + bestAsk) / 2
          : bestBid ?? bestAsk;
    const prevPrice = trades[1] ? Number(trades[1].price) : lastPrice;
    const lastUp = lastPrice !== null && prevPrice !== null ? lastPrice >= prevPrice : true;

    const session = useMemo(() => {
        if (trades.length === 0) {
            return { change: 0, changePct: 0, high: lastPrice, low: lastPrice, volume: 0 };
        }
        const prices = trades.map((t) => Number(t.price));
        const first = Number(trades[trades.length - 1].price);
        const last = Number(trades[0].price);
        const change = last - first;
        return {
            change,
            changePct: first ? (change / first) * 100 : 0,
            high: Math.max(...prices),
            low: Math.min(...prices),
            volume: trades.reduce((s, t) => s + Number(t.price) * Number(t.quantity), 0),
        };
    }, [trades, lastPrice]);

    useEffect(() => {
        if (!price && lastPrice) {
            setPrice(lastPrice.toFixed(2));
        }
    }, [lastPrice, price]);

    if (!config) {
        return (
            <div className="grid h-full place-items-center text-sm text-muted">
                Unknown market.{" "}
                <Link to="/markets" className="ml-1 text-accent">
                    Back to markets
                </Link>
            </div>
        );
    }

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex h-12 shrink-0 items-center gap-6 overflow-x-auto border-b border-line bg-panel px-3">
                <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-[#9945FF]/20 text-[11px] font-bold text-[#c4a7ff]">
                        {config.base.slice(0, 1)}
                    </span>
                    <div>
                        <Link to="/markets" className="flex items-center gap-1.5 text-sm font-semibold">
                            {config.base}/{config.quote}
                            <ChevronDown className="h-3.5 w-3.5 text-dim" />
                        </Link>
                        <p className="text-[11px] text-muted">{config.name} spot</p>
                    </div>
                </div>

                <div>
                    <p
                        className={`min-w-[6rem] text-lg font-semibold tabular-nums ${
                            lastUp ? "text-up" : "text-down"
                        }`}
                    >
                        {lastPrice !== null ? fmtPrice(lastPrice) : "—"}
                    </p>
                </div>

                <Stat
                    label="Change"
                    value={`${session.change >= 0 ? "+" : ""}${fmtPrice(session.change)}  ${
                        session.changePct >= 0 ? "+" : ""
                    }${session.changePct.toFixed(2)}%`}
                    up={session.change >= 0}
                />
                <Stat label="High" value={session.high !== null ? fmtPrice(session.high) : "—"} />
                <Stat label="Low" value={session.low !== null ? fmtPrice(session.low) : "—"} />
                <Stat label={`Volume (${config.quote})`} value={fmtCompact(session.volume)} />
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_210px_250px]">
                <section className="flex min-h-0 min-w-0 flex-col border-r border-line">
                    <div className="flex items-center justify-between border-b border-line px-3">
                        <div className="flex gap-3">
                            {(["chart", "depth"] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setChartTab(t)}
                                    className={`relative py-2.5 text-[13px] capitalize ${
                                        chartTab === t ? "text-fg" : "text-muted hover:text-fg"
                                    }`}
                                >
                                    {t}
                                    {chartTab === t && (
                                        <span className="absolute inset-x-0 bottom-0 h-0.5 bg-fg" />
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleSeed}
                                disabled={seeding}
                                className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 text-[12px] text-muted hover:bg-hover hover:text-fg disabled:opacity-60"
                            >
                                {seeding && <Loader2 className="h-3 w-3 animate-spin" />}
                                Seed book
                            </button>
                            <span className="text-[11px] text-dim">Live · 1m</span>
                        </div>
                    </div>
                    <div className="min-h-0 flex-1">
                        {chartTab === "chart" ? (
                            <PriceChart trades={trades} lastPrice={lastPrice} />
                        ) : (
                            <DepthChart depth={depth} />
                        )}
                    </div>
                </section>

                <section className="flex min-h-0 flex-col border-r border-line">
                    <div className="flex gap-3 border-b border-line px-3">
                        {(["book", "trades"] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setBookTab(t)}
                                className={`relative py-2.5 text-[13px] capitalize ${
                                    bookTab === t ? "text-fg" : "text-muted hover:text-fg"
                                }`}
                            >
                                {t === "book" ? "Book" : "Trades"}
                                {bookTab === t && (
                                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-fg" />
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="min-h-0 flex-1">
                        {bookTab === "book" ? (
                            <OrderBook
                                depth={depth}
                                base={config.base}
                                quote={config.quote}
                                lastPrice={lastPrice}
                                lastUp={lastUp}
                                onPriceClick={setPrice}
                            />
                        ) : (
                            <RecentTrades
                                trades={trades}
                                base={config.base}
                                quote={config.quote}
                                onPriceClick={setPrice}
                            />
                        )}
                    </div>
                </section>

                <section className="min-h-0">
                    <OrderForm
                        market={market}
                        base={config.base}
                        quote={config.quote}
                        price={price}
                        onPriceChange={setPrice}
                        bestBid={bestBid}
                        bestAsk={bestAsk}
                        balance={balance}
                        onPlaced={refresh}
                    />
                </section>
            </div>

            <BottomPanel
                balance={balance}
                orders={orders}
                market={market}
                onRefresh={refresh}
            />
        </div>
    );
}

function Stat({
    label,
    value,
    up,
}: {
    label: string;
    value: string;
    up?: boolean;
}) {
    return (
        <div className="shrink-0">
            <p className="text-[11px] text-dim">{label}</p>
            <p
                className={`text-[13px] tabular-nums ${
                    up === undefined ? "text-fg" : up ? "text-up" : "text-down"
                }`}
            >
                {value}
            </p>
        </div>
    );
}
