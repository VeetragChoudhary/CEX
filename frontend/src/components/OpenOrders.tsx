import { useState } from "react";
import { X } from "lucide-react";
import { cancelOrder } from "../api";
import type { Order } from "../types";
import { fmtPrice, fmtQty } from "../format";

interface Props {
    orders: Order[];
    market: string;
    onCancelled: () => void;
}

export default function OpenOrders({ orders, market, onCancelled }: Props) {
    const [cancelling, setCancelling] = useState<string | null>(null);

    async function handleCancel(orderId: string) {
        setCancelling(orderId);
        try {
            await cancelOrder(orderId, market);
            onCancelled();
        } catch {
            // Keep the row visible; the next refresh will correct it
        } finally {
            setCancelling(null);
        }
    }

    if (orders.length === 0) {
        return (
            <p className="px-4 py-10 text-center text-sm text-muted">You have no open orders</p>
        );
    }

    return (
        <div className="h-full overflow-auto">
            <table className="w-full text-[12px] tabular-nums">
                <thead className="sticky top-0 bg-panel text-left text-[10px] uppercase tracking-wide text-dim">
                    <tr>
                        <th className="px-3 py-2 font-medium">Side</th>
                        <th className="px-3 py-2 font-medium">Price</th>
                        <th className="px-3 py-2 font-medium">Size</th>
                        <th className="px-3 py-2 font-medium">Filled</th>
                        <th className="px-3 py-2 font-medium">Remaining</th>
                        <th className="px-3 py-2"></th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((order) => {
                        const remaining = order.quantity - order.filled;
                        const fillPct = order.quantity
                            ? (order.filled / order.quantity) * 100
                            : 0;
                        return (
                            <tr key={order.orderId} className="border-t border-line hover:bg-hover">
                                <td
                                    className={`px-3 py-2 capitalize ${
                                        order.side === "buy" ? "text-up" : "text-down"
                                    }`}
                                >
                                    {order.side}
                                </td>
                                <td className="px-3 py-2">{fmtPrice(order.price)}</td>
                                <td className="px-3 py-2">{fmtQty(order.quantity)}</td>
                                <td className="px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted">{fmtQty(order.filled)}</span>
                                        <span className="h-1 w-16 overflow-hidden rounded-full bg-line">
                                            <span
                                                className="block h-full bg-accent"
                                                style={{ width: `${fillPct}%` }}
                                            />
                                        </span>
                                    </div>
                                </td>
                                <td className="px-3 py-2">{fmtQty(remaining)}</td>
                                <td className="px-3 py-2 text-right">
                                    <button
                                        onClick={() => handleCancel(order.orderId)}
                                        disabled={cancelling === order.orderId}
                                        className="text-muted hover:text-down disabled:opacity-50"
                                        title="Cancel order"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
