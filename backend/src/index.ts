import express from "express"
import cors from "cors"

import authRouter from "./routes/authRoutes.js"
import orderRouter from "./routes/orderRoutes.js"
import depthRouter from "./routes/depthRoutes.js"
import balanceRouter from "./routes/balanceRoutes.js"

const app = express()
app.use(cors())
app.use(express.json())

app.use("/api/v1/auth", authRouter)
app.use("/api/v1/order", orderRouter)
app.use("/api/v1/depth", depthRouter)
app.use("/api/v1/balance", balanceRouter)

app.listen(3000, () => {
    console.log("Server running on port 3000!!")
})