import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import AuthModal from "./components/AuthModal";
import Balances from "./pages/Balances";
import Markets from "./pages/Markets";
import TradePage from "./pages/Trade";
import { MARKETS } from "./markets";

export default function App() {
    return (
        <BrowserRouter>
            <div className="flex h-full flex-col bg-bg">
                <Header />
                <main className="min-h-0 flex-1 overflow-hidden">
                    <Routes>
                        <Route
                            path="/"
                            element={
                                <Navigate to={`/trade/${MARKETS[0].symbol}`} replace />
                            }
                        />
                        <Route path="/trade/:market" element={<TradePage />} />
                        <Route path="/markets" element={<Markets />} />
                        <Route path="/balances" element={<Balances />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </main>
                <AuthModal />
            </div>
        </BrowserRouter>
    );
}
