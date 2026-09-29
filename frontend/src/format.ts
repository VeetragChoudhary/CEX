export function fmtPrice(value: number | string, digits = 2) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "—";
    return n.toLocaleString("en-US", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    });
}

export function fmtQty(value: number | string, digits = 2) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "0.00";
    return n.toLocaleString("en-US", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    });
}

export function fmtCompact(value: number) {
    if (!Number.isFinite(value)) return "—";
    return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}
