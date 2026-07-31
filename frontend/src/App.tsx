import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import Auth from "./pages/Auth";
import Balances from "./pages/Balances";
import Markets from "./pages/Markets";
import TradePage from "./pages/Trade";
import { useAuth } from "./useAuth";

// Everything past the login screen needs a token
function Protected({ children }: { children: React.ReactNode }) {
    const { token } = useAuth();
    if (!token) {
        return <Navigate to="/" replace />;
    }
    return (
        <div className="flex h-full flex-col">
            <Header />
            <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
    );
}

function Landing() {
    const { token } = useAuth();
    if (token) {
        return <Navigate to="/markets" replace />;
    }
    return <Auth />;
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route
                    path="/markets"
                    element={
                        <Protected>
                            <Markets />
                        </Protected>
                    }
                />
                <Route
                    path="/trade/:market"
                    element={
                        <Protected>
                            <TradePage />
                        </Protected>
                    }
                />
                <Route
                    path="/balances"
                    element={
                        <Protected>
                            <Balances />
                        </Protected>
                    }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
