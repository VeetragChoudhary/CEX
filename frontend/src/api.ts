import axios from "axios";
import type { Balance, Depth, Order } from "./types";

const BASE_URL = "http://localhost:3000/api/v1";

export const api = axios.create({
    baseURL: BASE_URL,
});

// Every protected route expects the token, so attach it once here
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export async function signup(email: string, password: string) {
    const res = await api.post("/auth/signup", { email, password });
    return res.data as { token: string; userId: string; email: string };
}

export async function login(email: string, password: string) {
    const res = await api.post("/auth/login", { email, password });
    return res.data as { token: string; userId: string; email: string };
}

export async function getDepth(market: string) {
    const res = await api.get("/depth", { params: { symbol: market } });
    return res.data as Depth;
}

export async function getOpenOrders(market: string) {
    const res = await api.get("/order/open", { params: { market } });
    return res.data as Order[];
}

export async function createOrder(
    market: string,
    price: string,
    quantity: string,
    side: "buy" | "sell"
) {
    const res = await api.post("/order", { market, price, quantity, side });
    return res.data;
}

export async function cancelOrder(orderId: string, market: string) {
    const res = await api.delete("/order", { data: { orderId, market } });
    return res.data;
}

export async function getBalance() {
    const res = await api.get("/balance");
    return res.data as Balance;
}

export async function onRamp(amount: string) {
    const res = await api.post("/balance/onramp", { amount });
    return res.data as Balance;
}
