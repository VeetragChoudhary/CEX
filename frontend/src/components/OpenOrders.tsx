import { useState } from "react";
import { X } from "lucide-react";
import { cancelOrder } from "../api";
import type { Order } from "../types";

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
            // The list refreshes anyway, so a failed cancel just stays visible
        } finally {
            setCancelling(null);
        }
    }

    return (
        <div className="rounded-lg border border-[#2b3139] bg-[#181a20]">
            <div className="border-b border-[#2b3139] px-3 py-2 text-sm font-medium">
                Open Orders
            </div>

            {orders.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-[#848e9c]">
                    You have no open orders
                </p>
            ) : (
                <table className="w-full text-xs">
                    <thead>
                        <tr className="text-left text-[#848e9c]">
                            <th className="px-3 py-2 font-medium">Side</th>
                            <th className="px-3 py-2 font-medium">Price</th>
                            <th className="px-3 py-2 font-medium">Amount</th>
                            <th className="px-3 py-2 font-medium">Filled</th>
                            <th className="px-3 py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr key={order.orderId} className="border-t border-[#2b3139]">
                                <td
                                    className={`px-3 py-2 capitalize ${
                                        order.side === "buy" ? "text-green-400" : "text-red-400"
                                    }`}
                                >
                                    {order.side}
                                </td>
                                <td className="px-3 py-2">{order.price.toFixed(2)}</td>
                                <td className="px-3 py-2">{order.quantity}</td>
                                <td className="px-3 py-2 text-[#848e9c]">
                                    {order.filled} / {order.quantity}
                                </td>
                                <td className="px-3 py-2 text-right">
                                    <button
                                        onClick={() => handleCancel(order.orderId)}
                                        disabled={cancelling === order.orderId}
                                        className="text-[#848e9c] transition hover:text-red-400 disabled:opacity-50"
                                        title="Cancel order"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
