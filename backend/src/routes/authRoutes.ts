import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../prisma.js'
import { RedisManager } from '../RedisManager.js'

const Router = express.Router()

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret"


Router.post("/signup", async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({
                "error": "Email and password are required"
            })
        }

        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) {
            return res.status(409).json({
                "error": "User already exists"
            })
        }

        const hashed = await bcrypt.hash(password, 10)
        const user = await prisma.user.create({
            data: {
                email,
                password: hashed
            }
        })

        // Give every new account some starting balance to trade with
        await RedisManager.getInstance().sendAndAwait({
            type: "ON_RAMP",
            data: {
                userId: user.id,
                amount: "5000",
                txnId: RedisManager.getInstance().getRandomClientId()
            }
        })

        const token = jwt.sign({ userId: user.id }, JWT_SECRET)
        res.status(201).json({
            token,
            userId: user.id,
            email: user.email
        })

    } catch (error) {
        console.error("Error in signup route", error)
        res.status(500).json({
            "error": "Internal server error"
        })
    }
})

Router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({
                "error": "Email and password are required"
            })
        }

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) {
            return res.status(401).json({
                "error": "Invalid credentials"
            })
        }

        const valid = await bcrypt.compare(password, user.password)
        if (!valid) {
            return res.status(401).json({
                "error": "Invalid credentials"
            })
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET)
        res.json({
            token,
            userId: user.id,
            email: user.email
        })

    } catch (error) {
        console.error("Error in login route", error)
        res.status(500).json({
            "error": "Internal server error"
        })
    }
})

export default Router
