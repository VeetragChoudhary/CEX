import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Search } from "lucide-react";
import { useAuth } from "../useAuth";
import { MARKETS } from "../markets";

export default function Header() {
    const { token, email, signOut, openAuth } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [query, setQuery] = useState("");

    const matches = query
        ? MARKETS.filter((m) =>
              `${m.base}/${m.quote} ${m.name} ${m.symbol}`
                  .toLowerCase()
                  .includes(query.toLowerCase())
          )
        : [];

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        if (matches[0]) {
            navigate(`/trade/${matches[0].symbol}`);
            setQuery("");
        } else {
            navigate("/markets");
        }
    }

    return (
        <header className="relative z-30 flex h-12 shrink-0 items-center gap-4 border-b border-line bg-panel px-3">
            <Link to="/" className="flex items-center gap-2 pr-2">
                <span className="grid h-7 w-7 place-items-center rounded-md bg-accent/15 text-accent">
                    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor">
                        <path d="M8 1.5 14 5v6L8 14.5 2 11V5L8 1.5Z" />
                    </svg>
                </span>
                <span className="text-sm font-semibold tracking-tight">CEX</span>
            </Link>

            <nav className="hidden items-center gap-1 sm:flex">
                <NavLink
                    to="/markets"
                    className={({ isActive }) =>
                        `rounded-md px-2.5 py-1 text-[13px] transition ${
                            isActive ? "bg-elevated text-fg" : "text-muted hover:text-fg"
                        }`
                    }
                >
                    Markets
                </NavLink>
                <Link
                    to={`/trade/${MARKETS[0].symbol}`}
                    className={`rounded-md px-2.5 py-1 text-[13px] transition ${
                        location.pathname === "/" || location.pathname.startsWith("/trade")
                            ? "bg-elevated text-fg"
                            : "text-muted hover:text-fg"
                    }`}
                >
                    Trade
                </Link>
                <NavLink
                    to="/balances"
                    className={({ isActive }) =>
                        `rounded-md px-2.5 py-1 text-[13px] transition ${
                            isActive ? "bg-elevated text-fg" : "text-muted hover:text-fg"
                        }`
                    }
                >
                    Balances
                </NavLink>
            </nav>

            <form
                onSubmit={handleSearch}
                className="relative mx-auto hidden w-full max-w-md md:block"
            >
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-dim" />
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search markets"
                    className="h-8 w-full rounded-md border border-line bg-bg pl-9 pr-3 text-[13px] text-fg outline-none placeholder:text-dim focus:border-line-strong"
                />
                {query && (
                    <div className="absolute left-0 right-0 top-full mt-1 overflow-hidden rounded-md border border-line bg-elevated shadow-xl">
                        {matches.length === 0 ? (
                            <p className="px-3 py-2 text-xs text-muted">No markets found</p>
                        ) : (
                            matches.map((m) => (
                                <button
                                    key={m.symbol}
                                    type="button"
                                    onClick={() => {
                                        navigate(`/trade/${m.symbol}`);
                                        setQuery("");
                                    }}
                                    className="flex w-full items-center justify-between px-3 py-2 text-left text-[13px] hover:bg-hover"
                                >
                                    <span>
                                        {m.base}/{m.quote}
                                    </span>
                                    <span className="text-muted">{m.name}</span>
                                </button>
                            ))
                        )}
                    </div>
                )}
            </form>

            <div className="ml-auto flex items-center gap-2">
                {token ? (
                    <>
                        <Link
                            to="/balances"
                            className="hidden max-w-[180px] truncate text-[13px] text-muted hover:text-fg sm:block"
                        >
                            {email}
                        </Link>
                        <button
                            onClick={() => {
                                signOut();
                                navigate("/");
                            }}
                            className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-hover hover:text-fg"
                            title="Sign out"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={() => openAuth("login")}
                            className="h-8 shrink-0 rounded-md px-3 text-[13px] whitespace-nowrap text-muted hover:bg-hover hover:text-fg"
                        >
                            Log in
                        </button>
                        <button
                            onClick={() => openAuth("signup")}
                            className="h-8 shrink-0 rounded-md bg-fg px-3 text-[13px] font-semibold whitespace-nowrap text-bg hover:bg-white"
                        >
                            Sign up
                        </button>
                    </>
                )}
            </div>
        </header>
    );
}
