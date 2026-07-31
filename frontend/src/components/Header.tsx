import { Link, useLocation, useNavigate } from "react-router-dom";
import { CandlestickChart, LogOut, Wallet } from "lucide-react";
import { useAuth } from "../useAuth";

export default function Header() {
    const { email, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    function handleSignOut() {
        signOut();
        navigate("/");
    }

    const linkClass = (path: string) =>
        `text-sm transition hover:text-[#eaecef] ${
            location.pathname.startsWith(path) ? "text-[#eaecef]" : "text-[#848e9c]"
        }`;

    return (
        <header className="flex items-center justify-between border-b border-[#2b3139] px-4 py-3">
            <div className="flex items-center gap-6">
                <Link to="/markets" className="flex items-center gap-2">
                    <CandlestickChart className="h-5 w-5 text-yellow-500" />
                    <span className="font-semibold tracking-tight">Exchange</span>
                </Link>
                <nav className="flex items-center gap-4">
                    <Link to="/markets" className={linkClass("/markets")}>
                        Markets
                    </Link>
                    <Link to="/balances" className={linkClass("/balances")}>
                        Balances
                    </Link>
                </nav>
            </div>

            <div className="flex items-center gap-4">
                <Link
                    to="/balances"
                    className="flex items-center gap-1.5 text-sm text-[#848e9c] transition hover:text-[#eaecef]"
                >
                    <Wallet className="h-4 w-4" />
                    <span className="hidden sm:inline">{email}</span>
                </Link>
                <button
                    onClick={handleSignOut}
                    className="flex items-center gap-1.5 text-sm text-[#848e9c] transition hover:text-[#eaecef]"
                    title="Sign out"
                >
                    <LogOut className="h-4 w-4" />
                </button>
            </div>
        </header>
    );
}
