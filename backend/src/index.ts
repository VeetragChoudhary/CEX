import express from "express"
import cors from "cors"

import authRouter from "./routes/authRoutes.js"
import orderRouter from "./routes/orderRoutes.js"
import depthRouter from "./routes/depthRoutes.js"
import balanceRouter from "./routes/balanceRoutes.js"

const app = express()
app.use(cors())
app.use(express.json())

app.get("/health", (_req, res) => {
    res.status(200).send("ok")
})

app.use("/api/v1/auth", authRouter)
app.use("/api/v1/order", orderRouter)
app.use("/api/v1/depth", depthRouter)
app.use("/api/v1/balance", balanceRouter)

const port = Number(process.env.PORT) || 3000
app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}!!`)
})