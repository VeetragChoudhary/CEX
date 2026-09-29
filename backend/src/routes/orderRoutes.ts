import express from "express";
import { RedisManager } from "../RedisManager.js";
import { authMiddleware } from "../middleware/auth.js";
const Router = express.Router()

// Place new orders
Router.post("/", authMiddleware, async (req, res) => {
    try {
        const { market, price, quantity, side } = req.body

        // Trades are always placed as the authenticated user
        const response = await RedisManager.getInstance().sendAndAwait({
            type: "CREATE_ORDER",
            data: {
                market,
                price,
                quantity,
                side,
                userId: req.userId
            }

        })

        // The engine rejects orders it cannot fund. That is a client error,
        // not a 202, otherwise the ui reports a failed order as placed.
        if (response.type === "ORDER_REJECTED") {
            return res.status(400).json({
                error: response.payload.error
            })
        }

        res.status(202).json(response.payload)

    } catch (error) {
        console.error("Error in order routne", error)
        res.status(500).json({
            "error": "Internal server error"
        })
    }
})


// Delete existing order
Router.delete("/", authMiddleware, async (req, res) => {
    try {
        const {orderId, market} = req.body

        const response = await RedisManager.getInstance().sendAndAwait({
            type: "CANCEL_ORDER",
            data: {
                orderId,
                market
            }
        })
        res.json(response.payload)

    } catch (error) {
        console.error("Error in cancel order route", error)
        res.status(500).json({
            "error": "Internal server error"
        })
    }
})


// Fetch all the open orders
Router.get("/open", authMiddleware, async (req, res) => {
    try {
        const response = await RedisManager.getInstance().sendAndAwait({
            type: "GET_OPEN_ORDERS",
            data: {
                userId: req.userId,
                market: req.query.market as string
            }
        });
        res.json(response.payload);

    } catch (error) {
        console.error("Error in open orders route", error)
        res.status(500).json({
            "error": "Internal server error"
        })
    }
});



export default Router