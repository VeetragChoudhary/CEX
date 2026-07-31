import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getDepth, getOpenOrders } from "../api";
import { MARKETS } from "../markets";
import { wsClient } from "../ws";
import type { Depth, Order, Trade } from "../types";
import OrderBook from "../components/OrderBook";
import OrderForm from "../components/OrderForm";
import OpenOrders from "../components/OpenOrders";
import RecentTrades from "../components/RecentTrades";

export default function TradePage() {
    const { market = "" } = useParams();
    const config = MARKETS.find((m) => m.symbol === market);

    const [depth, setDepth] = useState<Depth>({ bids: [], asks: [] });
    const [orders, setOrders] = useState<Order[]>([]);
    const [trades, setTrades] = useState<Trade[]>([]);

    const refresh = useCallback(async () => {
        try {
            const [nextDepth, nextOrders] = await Promise.all([
                getDepth(market),
                getOpenOrders(market),
            ]);
            setDepth(nextDepth);
            setOrders(nextOrders);
        } catch {
            // Leave the last good snapshot on screen if a poll fails
        }
    }, [market]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    // The engine only publishes the levels that changed, so merge each
    // update into the snapshot rather than replacing it
    useEffect(() => {
        function applySide(
            current: [string, string][],
            updates: [string, string][],
            descending: boolean
        ): [string, string][] {
            const next = new Map(current);
            updates.forEach(([price, size]) => {
                if (Number(size) === 0) {
                    next.delete(price);
                } else {
                    next.set(price, size);
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
                    },
                    ...prev,
                ].slice(0, 30)
            );
        };

        wsClient.subscribe(`depth@${market}`, onDepth);
        wsClient.subscribe(`trade@${market}`, onTrade);

        return () => {
            wsClient.unsubscribe(`depth@${market}`, onDepth);
            wsClient.unsubscribe(`trade@${market}`, onTrade);
        };
    }, [market]);

    if (!config) {
        return (
            <div className="px-4 py-8 text-center text-sm text-[#848e9c]">
                Unknown market.{" "}
                <Link to="/markets" className="text-yellow-500">
                    Back to markets
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-6">
            <div className="mb-4 flex items-center gap-3">
                <Link
                    to="/markets"
                    className="text-[#848e9c] transition hover:text-[#eaecef]"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <h1 className="text-lg font-semibold">
                    {config.base}/{config.quote}
                </h1>
                <span className="text-sm text-[#848e9c]">{config.name}</span>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_1fr_320px]">
                <div className="h-[420px]">
                    <OrderBook depth={depth} base={config.base} quote={config.quote} />
                </div>

                <div className="h-[420px]">
                    <RecentTrades
                        trades={trades}
                        base={config.base}
                        quote={config.quote}
                    />
                </div>

                <OrderForm
                    market={market}
                    base={config.base}
                    quote={config.quote}
                    onPlaced={refresh}
                />
            </div>

            <div className="mt-4">
                <OpenOrders orders={orders} market={market} onCancelled={refresh} />
            </div>
        </div>
    );
}
