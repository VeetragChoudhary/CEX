import { createClient, type RedisClientType } from "redis";
import { TRADE_ADDED, ORDER_UPDATE, type WsMessage } from "./types/index.js";
import type { MessageToApi } from "./types/toApi.js";


type DbMessage = {
    type: typeof TRADE_ADDED,
    data: {
        id: string,
        isBuyerMaker: boolean,
        price: string,
        quantity: string,
        quoteQuantity: string, 
        timestamp: number,
        market: string
    }
} | {
    type: typeof ORDER_UPDATE,
    data: {
        orderId: string,
        executedQty: number,
        market?: string,
        price?: string,
        quantity?: string, 
        side?: "buy" | "sell"
    }
}

export class RedisManager {
    private client: RedisClientType
    private static instance: RedisManager

    constructor() {
        const client = createClient({
            url: process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
        })
        // Without a handler a dropped connection takes the process down
        client.on("error", (err: unknown) => console.error("Redis error: ", err))
        this.client = client as RedisClientType
        this.client.connect()
    }

    public static getInstance() {
        if(!this.instance) {
            // shoudn't I return this
            this.instance = new RedisManager()
        }
        return this.instance
    }

    public pushMessage(message: DbMessage) {
        this.client.lPush("db_processor", JSON.stringify(message))
    }

    public publishMessage(channel: string, message: WsMessage) {
        this.client.publish(channel, JSON.stringify(message))
    }

    public sendToApi(clientId: string, message: MessageToApi) {
        this.client.publish(clientId, JSON.stringify(message))
    }
}