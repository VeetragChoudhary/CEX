import { useEffect, useState } from "react";

export function useAuth() {
    const [token, setToken] = useState<string | null>(() =>
        localStorage.getItem("token")
    );
    const [email, setEmail] = useState<string | null>(() =>
        localStorage.getItem("email")
    );

    // Keep other tabs in sync when one of them logs in or out
    useEffect(() => {
        const onStorage = () => {
            setToken(localStorage.getItem("token"));
            setEmail(localStorage.getItem("email"));
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    function signIn(token: string, email: string) {
        localStorage.setItem("token", token);
        localStorage.setItem("email", email);
        setToken(token);
        setEmail(email);
    }

    function signOut() {
        localStorage.removeItem("token");
        localStorage.removeItem("email");
        setToken(null);
        setEmail(null);
    }

    return { token, email, signIn, signOut };
}
