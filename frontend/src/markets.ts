// The engine seeds a single orderbook today. Adding a market here means
// creating the matching Orderbook in the engine as well.
export const MARKETS = [
    {
        symbol: "SOL_USD",
        base: "SOL",
        quote: "USD",
        name: "Solana",
    },
];
