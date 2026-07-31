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


export default depthRouter