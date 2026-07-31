import express from "express";
import { RedisManager } from "../RedisManager.js";
import { authMiddleware } from "../middleware/auth.js";

const Router = express.Router()

// Fetch the logged in user's balances
Router.get("/", authMiddleware, async (req, res) => {
    try {
        const response = await RedisManager.getInstance().sendAndAwait({
            type: "GET_BALANCE",
            data: {
                userId: req.userId
            }
        })
        res.json(response.payload)

    } catch (error) {
        console.error("Error in balance route", error)
        res.status(500).json({
            "error": "Internal server error"
        })
    }
})

// Add funds to the logged in user's account
Router.post("/onramp", authMiddleware, async (req, res) => {
    try {
        const { amount } = req.body

        const response = await RedisManager.getInstance().sendAndAwait({
            type: "ON_RAMP",
            data: {
                userId: req.userId,
                amount: String(amount),
                txnId: RedisManager.getInstance().getRandomClientId()
            }
        })
        res.json(response.payload)

    } catch (error) {
        console.error("Error in onramp route", error)
        res.status(500).json({
            "error": "Internal server error"
        })
    }
})

export default Router
