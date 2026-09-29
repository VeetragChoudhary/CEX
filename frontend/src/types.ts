export interface Depth {
    bids: [string, string][];
    asks: [string, string][];
}

export interface Order {
    price: number;
    quantity: number;
    orderId: string;
    filled: number;
    side: "buy" | "sell";
    userId: string;
}

export interface Trade {
    tradeId: number;
    price: string;
    quantity: string;
    isBuyerMaker: boolean;
    time: number;
}

export interface Balance {
    [asset: string]: {
        available: number;
        locked: number;
    };
}
