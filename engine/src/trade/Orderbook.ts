import { BASE_CURRENCY } from "./engine.js"



export interface Order {
    price: number;
    quantity: number;
    orderId: string;
    filled: number;
    side: "buy" | "sell";
    userId: string;
}

export interface Fill {
    price: string;
    qty: number;
    tradeId: number;
    otherUserId: string;
    markerOrderId: string;
}

export class Orderbook {
    bids: Order[]
    asks: Order[]
    baseAsset: string
    quoteAsset: string = BASE_CURRENCY 
    lastTradeId: number
    currentPrice: number

    constructor(baseAsset: string, bids: Order[], asks: Order[], lastTradeId: number, currentPrice: number) {
        this.bids = bids
        this.asks = asks
        this.baseAsset = baseAsset
        this.lastTradeId = lastTradeId || 0
        this.currentPrice = currentPrice || 0
    }

    ticker() {
        return `${this.baseAsset}_${this.quoteAsset}`;
    }



    addOrder(order: Order): { executedQty: number, fills: Fill[]} {
        if(order.side === "buy") {
            const { executedQty, fills } = this.matchBid(order)
            order.filled = executedQty
            
            if(executedQty === order.quantity) {
                return {
                    executedQty, 
                    fills
                }
            }

            this.bids.push(order)
            return {
                executedQty,
                fills
            }

        } else {
            const {executedQty, fills} = this.matchAsk(order)
            order.filled = executedQty
            if(executedQty === order.quantity) {
                return {
                    executedQty, 
                    fills
                }
            }
             
            this.asks.push(order)
            return {
                executedQty,
                fills
            }
        } 
        
    }


    matchBid(order: Order): {fills: Fill[], executedQty: number} {
        const fills: Fill[] = []
        let executedQty = 0

        // Cheapest ask first, so the bid matches at the best available price
        this.asks.sort((a, b) => a.price - b.price)

        for(let i = 0; i < this.asks.length; i++) {
            const ask = this.asks[i]
            if (!ask) {
                continue
            }
            if (ask.price <= order.price && executedQty < order.quantity) {
                const filledQty = Math.min((order.quantity - executedQty), ask.quantity - ask.filled)
                executedQty = executedQty + filledQty
                ask.filled += filledQty
                fills.push({
                    price: ask.price.toString(),
                    qty: filledQty,
                    tradeId: this.lastTradeId++,
                    otherUserId: ask.userId,
                    markerOrderId: ask.orderId

                })
            }
        }

        for(let i = 0; i < this.asks.length; i++) {
            if(this.asks[i]?.filled === this.asks[i]?.quantity) {
                this.asks.splice(i, 1)
                i--
            }
        }

        return {
            fills,
            executedQty
        };
    }



    matchAsk(order: Order): {fills: Fill[], executedQty: number} {
        const fills: Fill[] = [];
        let executedQty = 0;
        
        // Highest bid first, so the ask matches at the best available price
        this.bids.sort((a, b) => b.price - a.price);

        for (let i = 0; i < this.bids.length; i++) {
            const bid = this.bids[i];
            if (!bid) {
                continue;
            }
            if (bid.price >= order.price && executedQty < order.quantity) {
                const amountRemaining = Math.min(order.quantity - executedQty, bid.quantity - bid.filled);
                executedQty += amountRemaining;
                bid.filled += amountRemaining;
                fills.push({
                    price: bid.price.toString(),
                    qty: amountRemaining,
                    tradeId: this.lastTradeId++,
                    otherUserId: bid.userId,
                    markerOrderId: bid.orderId
                });
            }
        }
        for (let i = 0; i < this.bids.length; i++) {
            if (this.bids[i]?.filled === this.bids[i]?.quantity) {
                this.bids.splice(i, 1);
                i--;
            }
        }
        return {
            fills,
            executedQty
        };
    }

    getDepth(): { bids: [string, string][], asks: [string, string][] } {
        const bids: [string, string][] = []
        const asks: [string, string][] = []

        const bidsObj: { [key: string]: number } = {}
        const asksObj: { [key: string]: number } = {}

        for (let i = 0; i < this.bids.length; i++) {
            const order = this.bids[i]
            if (!order) {
                continue
            }
            const price = order.price.toString()
            if (!bidsObj[price]) {
                bidsObj[price] = 0
            }
            bidsObj[price] += order.quantity - order.filled
        }

        for (let i = 0; i < this.asks.length; i++) {
            const order = this.asks[i]
            if (!order) {
                continue
            }
            const price = order.price.toString()
            if (!asksObj[price]) {
                asksObj[price] = 0
            }
            asksObj[price] += order.quantity - order.filled
        }

        for (const price in bidsObj) {
            bids.push([price, bidsObj[price]!.toString()])
        }

        for (const price in asksObj) {
            asks.push([price, asksObj[price]!.toString()])
        }

        // Best bid first, best ask first
        bids.sort((a, b) => Number(b[0]) - Number(a[0]))
        asks.sort((a, b) => Number(a[0]) - Number(b[0]))

        return {
            bids,
            asks
        }
    }

    getOpenOrders(userId: string): Order[] {
        const asks = this.asks.filter(o => o.userId === userId)
        const bids = this.bids.filter(o => o.userId === userId)
        return [...asks, ...bids]
    }

    cancelBid(order: Order) {
        const index = this.bids.findIndex(o => o.orderId === order.orderId)
        if (index !== -1) {
            const price = this.bids[index]!.price
            this.bids.splice(index, 1)
            return price
        }
    }

    cancelAsk(order: Order) {
        const index = this.asks.findIndex(o => o.orderId === order.orderId)
        if (index !== -1) {
            const price = this.asks[index]!.price
            this.asks.splice(index, 1)
            return price
        }
    }
}