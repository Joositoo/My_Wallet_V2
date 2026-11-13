// Utilidades puras de deudas (sin acceso a BD), reutilizables en servidor y cliente.

export function toISODate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

export function paidAmount(debt) {
    const paid = debt.pagos.reduce((sum, p) => sum + p.cantidad, 0);
    return Math.min(debt.precio_total, paid);
}

// Estado calculado:
//  - Liquidada: inactiva o ya pagada por completo.
//  - Retrasada: pasó la fecha de fin con deuda pendiente, o lleva más de un
//    mes natural sin registrar ninguna cuota (con un mes de margen).
//  - Activa: el resto.
export function getStatus(debt, today) {
    if (!debt.activa || paidAmount(debt) >= debt.precio_total) return "Liquidada";
    if (debt.fecha_fin < today) return "Retrasada";

    const [y, m] = today.split("-").map(Number);
    const prevMonthStart = toISODate(new Date(y, m - 2, 1));
    const hasRecentCuota = debt.pagos.some((p) => p.tipo === "cuota" && p.fecha >= prevMonthStart);
    if (debt.fecha_alta < prevMonthStart && !hasRecentCuota) return "Retrasada";

    return "Activa";
}
