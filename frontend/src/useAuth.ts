import {
    createContext,
    createElement,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import type { ReactNode } from "react";

type AuthMode = "login" | "signup";

interface AuthContextValue {
    token: string | null;
    email: string | null;
    authMode: AuthMode | null;
    openAuth: (mode: AuthMode) => void;
    closeAuth: () => void;
    signIn: (token: string, email: string) => void;
    signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(() =>
        localStorage.getItem("token")
    );
    const [email, setEmail] = useState<string | null>(() =>
        localStorage.getItem("email")
    );
    const [authMode, setAuthMode] = useState<AuthMode | null>(null);

    useEffect(() => {
        const onStorage = () => {
            setToken(localStorage.getItem("token"));
            setEmail(localStorage.getItem("email"));
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            token,
            email,
            authMode,
            openAuth: (mode) => setAuthMode(mode),
            closeAuth: () => setAuthMode(null),
            signIn: (nextToken, nextEmail) => {
                localStorage.setItem("token", nextToken);
                localStorage.setItem("email", nextEmail);
                setToken(nextToken);
                setEmail(nextEmail);
                setAuthMode(null);
            },
            signOut: () => {
                localStorage.removeItem("token");
                localStorage.removeItem("email");
                setToken(null);
                setEmail(null);
            },
        }),
        [token, email, authMode]
    );

    return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used inside AuthProvider");
    }
    return ctx;
}
