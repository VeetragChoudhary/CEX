import { createClient } from "redis";
import { Engine } from "./trade/engine.js";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));


async function main() { 

    const redisClient = createClient({
        url: process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
    })
    // Without a handler a dropped connection takes the process down
    redisClient.on("error", (err) => console.error("Redis error: ", err))
    await redisClient.connect()
    console.log("connected to redis");

    const engine = new Engine()
    // await engine.init()
    // console.log("engine ready");


    while (true) {
        const response = await redisClient.rPop("messages" as string);
        if (!response) {
            await sleep(100);
            continue;
        }
        engine.process(JSON.parse(response));   
  }


}


main()