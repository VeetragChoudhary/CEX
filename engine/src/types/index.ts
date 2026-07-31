export const TRADE_ADDED = "TRADE_ADDED";
export const ORDER_UPDATE = "ORDER_UPDATE";

export type WsMessage = {
    stream: string,
    data: {
        e: "depth",
        b?: [string, string][],
        a?: [string, string][],
        id: number
    }
} | {
    stream: string,
    data: {
        e: "trade",
        t: number,
        m: boolean,
        p: string,
        q: string,
        s: string
    }
}
