import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createOrder } from "../api";

interface Props {
    market: string;
    base: string;
    quote: string;
    onPlaced: () => void;
}

export default function OrderForm({ market, base, quote, onPlaced }: Props) {
    const [side, setSide] = useState<"buy" | "sell">("buy");
    const [price, setPrice] = useState("");
    const [quantity, setQuantity] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const total = Number(price) * Number(quantity);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await createOrder(market, price, quantity, side);
            setQuantity("");
            onPlaced();
        } catch (err: any) {
            setError(err?.response?.data?.error || "Could not place order");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="rounded-lg border border-[#2b3139] bg-[#181a20]">
            <div className="grid grid-cols-2">
                <button
                    onClick={() => setSide("buy")}
                    className={`py-2.5 text-sm font-medium transition ${
                        side === "buy"
                            ? "border-b-2 border-green-500 text-green-400"
                            : "text-[#848e9c] hover:text-[#eaecef]"
                    }`}
                >
                    Buy
                </button>
                <button
                    onClick={() => setSide("sell")}
                    className={`py-2.5 text-sm font-medium transition ${
                        side === "sell"
                            ? "border-b-2 border-red-500 text-red-400"
                            : "text-[#848e9c] hover:text-[#eaecef]"
                    }`}
                >
                    Sell
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 p-3">
                <div>
                    <label className="mb-1.5 block text-xs text-[#848e9c]">
                        Price ({quote})
                    </label>
                    <input
                        type="number"
                        step="any"
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                        className="w-full rounded border border-[#2b3139] bg-[#0b0e11] px-3 py-2 text-sm outline-none focus:border-yellow-500"
                        placeholder="0.00"
                    />
                </div>

                <div>
                    <label className="mb-1.5 block text-xs text-[#848e9c]">
                        Quantity ({base})
                    </label>
                    <input
                        type="number"
                        step="any"
                        min="0"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        required
                        className="w-full rounded border border-[#2b3139] bg-[#0b0e11] px-3 py-2 text-sm outline-none focus:border-yellow-500"
                        placeholder="0.00"
                    />
                </div>

                <div className="flex justify-between border-t border-[#2b3139] pt-3 text-xs">
                    <span className="text-[#848e9c]">Total</span>
                    <span>
                        {total ? total.toFixed(2) : "0.00"} {quote}
                    </span>
                </div>

                {error && (
                    <p className="rounded border border-red-900/50 bg-red-950/40 px-3 py-2 text-xs text-red-400">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className={`flex w-full items-center justify-center gap-2 rounded py-2.5 text-sm font-semibold text-black transition disabled:opacity-60 ${
                        side === "buy"
                            ? "bg-green-500 hover:bg-green-400"
                            : "bg-red-500 hover:bg-red-400"
                    }`}
                >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {side === "buy" ? "Buy" : "Sell"} {base}
                </button>
            </form>
        </div>
    );
}
