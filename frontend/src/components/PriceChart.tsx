import { useEffect, useRef } from "react";
import {
    CandlestickSeries,
    ColorType,
    CrosshairMode,
    HistogramSeries,
    createChart,
    type IChartApi,
    type ISeriesApi,
    type UTCTimestamp,
} from "lightweight-charts";
import type { Trade } from "../types";

interface Candle {
    time: UTCTimestamp;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

function toCandles(trades: Trade[]): Candle[] {
    const buckets = new Map<number, Candle>();
    [...trades]
        .sort((a, b) => a.time - b.time)
        .forEach((trade) => {
            const t = (Math.floor(trade.time / 1000 / 60) * 60) as UTCTimestamp;
            const price = Number(trade.price);
            const qty = Number(trade.quantity);
            const existing = buckets.get(t);
            if (!existing) {
                buckets.set(t, {
                    time: t,
                    open: price,
                    high: price,
                    low: price,
                    close: price,
                    volume: qty,
                });
            } else {
                existing.high = Math.max(existing.high, price);
                existing.low = Math.min(existing.low, price);
                existing.close = price;
                existing.volume += qty;
            }
        });
    return [...buckets.values()].sort((a, b) => a.time - b.time);
}

interface Props {
    trades: Trade[];
    lastPrice: number | null;
}

export default function PriceChart({ trades, lastPrice }: Props) {
    const host = useRef<HTMLDivElement>(null);
    const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);
    const chartRef = useRef<IChartApi | null>(null);

    useEffect(() => {
        if (!host.current) return;

        const chart = createChart(host.current, {
            autoSize: true,
            layout: {
                background: { type: ColorType.Solid, color: "#0d0d10" },
                textColor: "#5c5c66",
                fontFamily: "Inter, sans-serif",
                fontSize: 11,
            },
            grid: {
                vertLines: { color: "#16161b" },
                horzLines: { color: "#16161b" },
            },
            crosshair: { mode: CrosshairMode.Normal },
            rightPriceScale: { borderColor: "#1c1c22" },
            timeScale: {
                borderColor: "#1c1c22",
                timeVisible: true,
                secondsVisible: false,
            },
        });

        const candles = chart.addSeries(CandlestickSeries, {
            upColor: "#0ecb81",
            downColor: "#f6465d",
            borderVisible: false,
            wickUpColor: "#0ecb81",
            wickDownColor: "#f6465d",
        });

        const volume = chart.addSeries(HistogramSeries, {
            priceFormat: { type: "volume" },
            priceScaleId: "vol",
        });
        chart.priceScale("vol").applyOptions({
            scaleMargins: { top: 0.82, bottom: 0 },
        });

        chartRef.current = chart;
        candleRef.current = candles;
        volumeRef.current = volume;

        return () => {
            chart.remove();
            chartRef.current = null;
            candleRef.current = null;
            volumeRef.current = null;
        };
    }, []);

    useEffect(() => {
        const data = toCandles(trades);
        if (!candleRef.current || !volumeRef.current) return;

        if (data.length === 0 && lastPrice) {
            const t = (Math.floor(Date.now() / 1000 / 60) * 60) as UTCTimestamp;
            candleRef.current.setData([
                { time: t, open: lastPrice, high: lastPrice, low: lastPrice, close: lastPrice },
            ]);
            volumeRef.current.setData([]);
            return;
        }

        candleRef.current.setData(
            data.map(({ time, open, high, low, close }) => ({
                time,
                open,
                high,
                low,
                close,
            }))
        );
        volumeRef.current.setData(
            data.map((c) => ({
                time: c.time,
                value: c.volume,
                color: c.close >= c.open ? "#0ecb8133" : "#f6465d33",
            }))
        );
    }, [trades, lastPrice]);

    return (
        <div className="relative h-full min-h-[280px] bg-panel">
            <div ref={host} className="h-full w-full" />
            {trades.length === 0 && lastPrice === null && (
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                    <p className="rounded-md border border-line bg-bg/80 px-3 py-1.5 text-xs text-muted">
                        Chart fills as trades print
                    </p>
                </div>
            )}
        </div>
    );
}
