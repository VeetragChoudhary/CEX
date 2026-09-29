import { Router} from 'express'
import { RedisManager } from '../RedisManager.js';

const depthRouter = Router()

depthRouter.get("/", async (req, res) => {
  const symbol = req.query.symbol as string;
  const response = await RedisManager.getInstance().sendAndAwait({
    type: "GET_DEPTH",
    data: { market: symbol },
  });
  res.json(response.payload);
});

depthRouter.post("/seed", async (req, res) => {
  try {
    const market = (req.body?.market || req.query.symbol) as string;
    if (!market) {
      return res.status(400).json({ error: "market is required" });
    }
    const response = await RedisManager.getInstance().sendAndAwait({
      type: "SEED_ORDERBOOK",
      data: { market },
    });
    if (response.type === "ORDER_REJECTED") {
      return res.status(400).json({ error: response.payload.error });
    }
    res.json(response.payload);
  } catch (error) {
    console.error("Error seeding orderbook", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


export default depthRouter