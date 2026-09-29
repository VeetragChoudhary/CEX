const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:3001";

type Callback = (data: any) => void;

// One socket for the whole app. Components register callbacks per stream
// so a single connection can feed the orderbook and the trade list at once.
class WsClient {
    private ws: WebSocket | null = null;
    private callbacks: Map<string, Callback[]> = new Map();
    private pending: string[] = [];

    private connect() {
        if (this.ws) {
            return;
        }
        this.ws = new WebSocket(WS_URL);

        this.ws.onopen = () => {
            this.pending.forEach((stream) => this.send("SUBSCRIBE", stream));
            this.pending = [];
        };

        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            const stream = message.stream;
            this.callbacks.get(stream)?.forEach((cb) => cb(message.data));
        };

        this.ws.onclose = () => {
            this.ws = null;
        };
    }

    private send(method: "SUBSCRIBE" | "UNSUBSCRIBE", stream: string) {
        this.ws?.send(JSON.stringify({ method, params: [stream] }));
    }

    subscribe(stream: string, callback: Callback) {
        this.connect();
        this.callbacks.set(stream, (this.callbacks.get(stream) || []).concat(callback));

        if (this.ws?.readyState === WebSocket.OPEN) {
            this.send("SUBSCRIBE", stream);
        } else {
            this.pending.push(stream);
        }
    }

    unsubscribe(stream: string, callback: Callback) {
        const remaining = (this.callbacks.get(stream) || []).filter((cb) => cb !== callback);
        if (remaining.length) {
            this.callbacks.set(stream, remaining);
            return;
        }
        this.callbacks.delete(stream);
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.send("UNSUBSCRIBE", stream);
        }
    }
}

export const wsClient = new WsClient();
