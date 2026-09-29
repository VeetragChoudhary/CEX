import { createClient, type RedisClientType } from "redis";

export class RedisManager {
    private client: RedisClientType
    private publisher: RedisClientType;
    private static instance: RedisManager

    
    constructor() {
        this.client = createClient({
            url: process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
        })
        // Without a handler a dropped connection takes the process down
        this.client.on("error", (err) => console.error("Redis error: ", err))
        this.client.connect()

        this.publisher = createClient({
            url: process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
        })
        this.publisher.on("error", (err) => console.error("Redis error: ", err))
        this.publisher.connect()

    }

    static getInstance() {
        if(!this.instance) {
            this.instance = new RedisManager()
        }
        return this.instance
    }

    public sendAndAwait(message: {}) {
        return new Promise<{ type: string, payload: any }>((resolve) => {
            const id = this.getRandomClientId()
            
            this.client.subscribe(id, (message) => {
                this.client.unsubscribe(id)
                resolve(JSON.parse(message))
            })
            
            this.publisher.lPush("messages", JSON.stringify({clientId: id, message}))
        })

    }

    public getRandomClientId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
}