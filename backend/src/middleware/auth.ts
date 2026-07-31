import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

// Express has no userId on Request by default, so widen it here
declare global {
    namespace Express {
        interface Request {
            userId?: string
        }
    }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization

    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({
            "error": "No token provided"
        })
    }

    const token = header.split(" ")[1]

    if (!token) {
        return res.status(401).json({
            "error": "No token provided"
        })
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
        req.userId = decoded.userId
        next()
    } catch (error) {
        return res.status(401).json({
            "error": "Invalid token"
        })
    }
}
