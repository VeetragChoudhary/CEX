import { RedisManager } from "../RedisManager.js";
import { Orderbook, type Fill, type Order } from "./Orderbook.js";
import type { MessageFromApi } from "../types/fromApi.js";
import { TRADE_ADDED, ORDER_UPDATE } from "../types/index.js";

export const BASE_CURRENCY = "INR";


interface UserBalance {
    [key: string]: {
        available: number;
        locked: number;
    }
}

export class Engine {
    private orderbooks: Orderbook[] = []
    private balances: Map<string, UserBalance> = new Map();

    constructor() {
        this.orderbooks = [new Orderbook("SOL", [], [], 0, 0)]
        this.setBaseBalances()
    }

    process({message, clientId}: {message: MessageFromApi, clientId: string}) {
        switch (message.type) {
            case "CREATE_ORDER":
                try {
                    const {executedQty, fills, orderId} = this.createOrder(message.data.market, message.data.price, message.data.quantity, message.data.side, message.data.userId)
                    RedisManager.getInstance().sendToApi(clientId, {
                        type: "ORDER_PLACED",
                        payload: {
                            orderId,
                            executedQty,
                            fills
                        }
                    })
                } catch (error) {
                    console.error("Error: ", error)
                    RedisManager.getInstance().sendToApi(clientId, {
                        type: "ORDER_CANCELLED",
                        payload: {
                            orderId: "",
                            executedQty: 0,
                            remainingQty: 0
                        }
                    })
                }
            break

            case "CANCEL_ORDER":
                try {
                    const orderId = message.data.orderId
                    const cancelMarket = message.data.market
                    const cancelOrderbook = this.orderbooks.find(o => o.ticker() === cancelMarket);
                    const baseAsset = cancelMarket.split("_")[0];
                    if (!cancelOrderbook) {
                        throw new Error("No orderbook found");
                    }
                    const order = cancelOrderbook.asks.find(o => o.orderId === orderId) || cancelOrderbook.bids.find(o => o.orderId === orderId);
                    if (!order) {
                        console.log("No order found");
                        throw new Error("No order found");
                    }
                    const cancelUserBalance = this.balances.get(order.userId);
                    if (!baseAsset || !cancelUserBalance) {
                        throw new Error("Invalid market or user");
                    }

                    if (order.side === "buy") {
                        const price = cancelOrderbook.cancelBid(order)
                        const leftQuantity = (order.quantity - order.filled) * order.price;
                        cancelUserBalance[BASE_CURRENCY]!.available += leftQuantity;
                        cancelUserBalance[BASE_CURRENCY]!.locked -= leftQuantity;
                        if (price) {
                            this.sendUpdatedDepthAt(price.toString(), cancelMarket);
                        }
                    } else {
                        const price = cancelOrderbook.cancelAsk(order)
                        const leftQuantity = order.quantity - order.filled;
                        // A sell locks the base asset, so that is what gets refunded
                        cancelUserBalance[baseAsset]!.available += leftQuantity;
                        cancelUserBalance[baseAsset]!.locked -= leftQuantity;
                        if (price) {
                            this.sendUpdatedDepthAt(price.toString(), cancelMarket);
                        }
                    }

                    RedisManager.getInstance().sendToApi(clientId, {
                        type: "ORDER_CANCELLED",
                        payload: {
                            orderId,
                            executedQty: 0,
                            remainingQty: 0
                        }
                    });

                } catch (error) {
                    console.error("Error while cancelling order: ", error)                    
                }
            break;

            case "GET_OPEN_ORDERS":
                try {
                    const openOrderbook = this.orderbooks.find(o => o.ticker() === message.data.market);
                    if (!openOrderbook) {
                        throw new Error("No orderbook found");
                    }
                    const openOrders = openOrderbook.getOpenOrders(message.data.userId);

                    RedisManager.getInstance().sendToApi(clientId, {
                        type: "OPEN_ORDERS",
                        payload: openOrders
                    }); 
                } catch(e) {
                    console.log(e);
                }
                break;
            
            case "ON_RAMP":
                const userId = message.data.userId;
                const amount = Number(message.data.amount);
                this.onRamp(userId, amount);
                // The api waits on a reply, so always send one back
                RedisManager.getInstance().sendToApi(clientId, {
                    type: "BALANCE",
                    payload: this.balances.get(userId) || {}
                });
                break;

            case "GET_BALANCE":
                RedisManager.getInstance().sendToApi(clientId, {
                    type: "BALANCE",
                    payload: this.balances.get(message.data.userId) || {}
                });
                break;
            case "GET_DEPTH":
                try {
                    const market = message.data.market;
                    const orderbook = this.orderbooks.find(o => o.ticker() === market);
                    if (!orderbook) {
                        throw new Error("No orderbook found");
                    }
                    RedisManager.getInstance().sendToApi(clientId, {
                        type: "DEPTH",
                        payload: orderbook.getDepth()
                    });
                } catch (e) {
                    console.log(e);
                    RedisManager.getInstance().sendToApi(clientId, {
                        type: "DEPTH",
                        payload: {
                            bids: [],
                            asks: []
                        }
                    });
                }
                break;
        }
    }

    // Ideally should take an object with types defined 
    createOrder(market: string, price: string, quantity: string, side: "buy" | "sell", userId: string) {
        
        const orderbook = this.orderbooks.find(o => o.ticker() === market)
        const baseAsset = market.split("_")[0];
        const quoteAsset = market.split("_")[1];

        if(!orderbook) {
            throw new Error("No orderbook found")
        }

        if(!baseAsset || !quoteAsset) {
            throw new Error("Invalid market")
        }

        this.checkAndLockFunds(baseAsset, quoteAsset, side, userId, quoteAsset, price, quantity)

        const order: Order = {
            price: Number(price),
            quantity: Number(quantity),
            orderId: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
            filled: 0,
            side, 
            userId
        }

        const { fills, executedQty } = orderbook.addOrder(order);

        this.updateBalance(userId, baseAsset, quoteAsset, side, fills, executedQty, Number(price));

        this.createDbTrades(fills, market, userId);
        this.updateDbOrders(order, executedQty, fills, market);
        this.publisWsDepthUpdates(fills, price, side, market);
        this.publishWsTrades(fills, userId, market);
        return { executedQty, fills, orderId: order.orderId };

    }

    updateDbOrders(order: Order, executedQty: number, fills: Fill[], market: string) {
        RedisManager.getInstance().pushMessage({
            type: ORDER_UPDATE,
            data: {
                orderId: order.orderId,
                executedQty: executedQty,
                market: market,
                price: order.price.toString(),
                quantity: order.quantity.toString(),
                side: order.side
            }
        })

        fills.forEach(fill => {
            RedisManager.getInstance().pushMessage({
                type: ORDER_UPDATE,
                data: {
                    orderId: fill.markerOrderId,
                    executedQty: fill.qty
                }
            })
        })
    }

    createDbTrades(fills: Fill[], market: string, userId: string) {
        fills.forEach(fill => {
            RedisManager.getInstance().pushMessage({
                type: TRADE_ADDED,
                data: {
                    id: fill.tradeId.toString(),
                    isBuyerMaker: fill.otherUserId === userId,
                    price: fill.price,
                    quantity: fill.qty.toString(),
                    quoteQuantity: (fill.qty * Number(fill.price)).toString(),
                    timestamp: Date.now(),
                    market: market
                }
            })
        })
    }

    publishWsTrades(fills: Fill[], userId: string, market: string) {
        fills.forEach(fill => {
            RedisManager.getInstance().publishMessage(`trade@${market}`, {
                stream: `trade@${market}`,
                data: {
                    e: "trade",
                    t: fill.tradeId,
                    m: fill.otherUserId === userId,
                    p: fill.price,
                    q: fill.qty.toString(),
                    s: market
                }
            })
        })
    }

    sendUpdatedDepthAt(price: string, market: string) {
        const orderbook = this.orderbooks.find(o => o.ticker() === market)
        if (!orderbook) {
            return
        }
        const depth = orderbook.getDepth()
        const updatedBids = depth.bids.filter(x => x[0] === price)
        const updatedAsks = depth.asks.filter(x => x[0] === price)

        RedisManager.getInstance().publishMessage(`depth@${market}`, {
            stream: `depth@${market}`,
            data: {
                e: "depth",
                // An empty level means the price was fully consumed, so tell
                // the client to remove it rather than leaving it stale
                b: updatedBids.length ? updatedBids : [[price, "0"]],
                a: updatedAsks.length ? updatedAsks : [[price, "0"]],
                id: Date.now()
            }
        })
    }

    publisWsDepthUpdates(fills: Fill[], price: string, side: "buy" | "sell", market: string) {
        const orderbook = this.orderbooks.find(o => o.ticker() === market)
        if (!orderbook) {
            return
        }
        const depth = orderbook.getDepth()

        if (side === "buy") {
            const updatedAsks = depth.asks.filter(x => fills.some(f => f.price === x[0]))
            const updatedBid = depth.bids.find(x => x[0] === price)
            RedisManager.getInstance().publishMessage(`depth@${market}`, {
                stream: `depth@${market}`,
                data: {
                    e: "depth",
                    a: updatedAsks,
                    b: updatedBid ? [updatedBid] : [],
                    id: Date.now()
                }
            })
        } else {
            const updatedBids = depth.bids.filter(x => fills.some(f => f.price === x[0]))
            const updatedAsk = depth.asks.find(x => x[0] === price)
            RedisManager.getInstance().publishMessage(`depth@${market}`, {
                stream: `depth@${market}`,
                data: {
                    e: "depth",
                    a: updatedAsk ? [updatedAsk] : [],
                    b: updatedBids,
                    id: Date.now()
                }
            })
        }
    }

    updateBalance(userId: string, baseAsset: string, quoteAsset: string, side: "buy" | "sell", fills: Fill[], executedQty: number, limitPrice: number) {
        if (side === "buy") {
            fills.forEach(fill => {
                // The maker sold base at its own resting price
                const quoteAmount = Number(fill.price) * fill.qty

                // The maker gives up the base it locked and receives quote
                this.getAssetBalance(fill.otherUserId, quoteAsset).available += quoteAmount
                this.getAssetBalance(fill.otherUserId, baseAsset).locked -= fill.qty

                // The taker spends the quote it locked and receives base
                this.getAssetBalance(userId, quoteAsset).locked -= quoteAmount
                this.getAssetBalance(userId, baseAsset).available += fill.qty

                // Funds were locked at the taker's limit price. If it filled
                // cheaper, the difference would stay locked forever, so give
                // the price improvement back
                const improvement = (limitPrice - Number(fill.price)) * fill.qty
                if (improvement > 0) {
                    this.getAssetBalance(userId, quoteAsset).locked -= improvement
                    this.getAssetBalance(userId, quoteAsset).available += improvement
                }
            })
        } else {
            fills.forEach(fill => {
                const quoteAmount = Number(fill.price) * fill.qty

                // The maker spends the quote it locked and receives base
                this.getAssetBalance(fill.otherUserId, quoteAsset).locked -= quoteAmount
                this.getAssetBalance(fill.otherUserId, baseAsset).available += fill.qty

                // The taker gives up the base it locked and receives quote
                this.getAssetBalance(userId, quoteAsset).available += quoteAmount
                this.getAssetBalance(userId, baseAsset).locked -= fill.qty
            })
        }
    }




    checkAndLockFunds(baseAsset: string, quoteAsset: string, side: "buy" | "sell", userId: string, asset: string, price: string, quantity: string) {
        const userBalance = this.balances.get(userId)
        if (!userBalance) {
            throw new Error("User has no balance")
        }

        if (side === "buy") {
            const required = Number(quantity) * Number(price)
            if ((userBalance[quoteAsset]?.available || 0) < required) {
                throw new Error("Insufficient funds")
            }
            userBalance[quoteAsset]!.available -= required
            userBalance[quoteAsset]!.locked += required
        } else {
            const required = Number(quantity)
            if ((userBalance[baseAsset]?.available || 0) < required) {
                throw new Error("Insufficient funds")
            }
            userBalance[baseAsset]!.available -= required
            userBalance[baseAsset]!.locked += required
        }
    }

    onRamp(userId: string, amount: number) {
        const userBalance = this.balances.get(userId)
        if (!userBalance) {
            this.balances.set(userId, {
                [BASE_CURRENCY]: {
                    available: amount,
                    locked: 0
                },
                "SOL": {
                    available: 0,
                    locked: 0
                }
            })
        } else {
            this.getAssetBalance(userId, BASE_CURRENCY).available += amount
        }
    }

    // A user may not hold an asset yet, so create the entry on first touch
    // rather than letting a missing key blow up mid-settlement
    private getAssetBalance(userId: string, asset: string) {
        let userBalance = this.balances.get(userId)
        if (!userBalance) {
            userBalance = {}
            this.balances.set(userId, userBalance)
        }
        if (!userBalance[asset]) {
            userBalance[asset] = {
                available: 0,
                locked: 0
            }
        }
        return userBalance[asset]
    }

    setBaseBalances() {
        // Seed a couple of accounts so the exchange is usable out of the box
        for (const userId of ["1", "2", "5"]) {
            this.balances.set(userId, {
                [BASE_CURRENCY]: {
                    available: 10000000,
                    locked: 0
                },
                "SOL": {
                    available: 10000000,
                    locked: 0
                }
            })
        }
    }


}