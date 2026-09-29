import http from "http"
import { WebSocketServer } from "ws"
import { UserManager } from "./UserManager.js"

const port = Number(process.env.PORT) || 3001

const server = http.createServer((req, res) => {
    if (req.url === "/health" || req.url === "/") {
        res.writeHead(200)
        res.end("ok")
        return
    }
    res.writeHead(404)
    res.end()
})

const wss = new WebSocketServer({ server })

wss.on("connection", (ws) => {
    UserManager.getInstance().addUser(ws)
})

server.listen(port, "0.0.0.0", () => {
    console.log(`Websocket server running on port ${port}`)
})
