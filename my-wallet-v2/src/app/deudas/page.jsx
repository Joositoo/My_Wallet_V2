'use client';
import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import MobileHeader from "../components/MobileHeader";
import { toISODate, paidAmount, getStatus } from "@/lib/deudasUtils";
import {
    ArrowDownLeft,
    CalendarDays,
    Check,
    ChevronDown,
    CircleDollarSign,
    CreditCard,
    Landmark,
    Pencil,
    Plus,
    Trash2,
    X,
} from "lucide-react";

// ── Utilidades ──────────────────────────────────────────────

function money(value) {
    return value.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function parseDate(iso) {
    return new Date(`${iso}T12:00:00`);
}

function prettyDate(iso) {
    return parseDate(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

function prettyMonth(iso) {
    return parseDate(iso).toLocaleDateString("es-ES", { month: "short", year: "numeric" });
}

function remainingMonths(endIso, today) {
    const end = parseDate(endIso);
    const ref = parseDate(today);
    return Math.max(0, (end.getFullYear() - ref.getFullYear()) * 12 + end.getMonth() - ref.getMonth());
}

async function apiRequest(url, method, body) {
    const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo completar la operación");
    }
}

// ── Componentes pequeños ────────────────────────────────────

function IconButton({ label, children, danger = false, onClick }) {
    return (
        <button
            aria-label={label}
            title={label}
            onClick={onClick}
            className={`grid size-8 place-items-center rounded-lg border border-border transition ${danger
                    ? "text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-[#F05A78]"
                    : "text-muted-foreground hover:border-white/20 hover:bg-white/5 hover:text-foreground"
                }`}
        >
            {children}
        </button>
    );
}

function StatusBadge({ status }) {
    const variants = {
        Activa: "border-amber-400/15 bg-amber-400/[0.07] text-amber-200/80",
        Liquidada: "border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-200/80",
        Retrasada: "border-destructive/25 bg-destructive/[0.08] text-[#EF708A]",
    };
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${variants[status]}`}>
            <span className="size-1.5 rounded-full bg-current" />
            {status}
        </span>
    );
}

function Field({ label, type = "text", value, placeholder, onChange, ...rest }) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-medium text-muted-foreground">{label}</span>
            <input
                type={type}
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-input-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-ring"
                {...rest}
            />
        </label>
    );
}

function ModalShell({ title, description, onClose, children }) {
    return (
        <div className="fixed inset-0 z-70 grid place-items-end sm:place-items-center sm:p-5">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-border bg-card shadow-2xl sm:max-w-120 sm:rounded-2xl">
                <div className="flex items-start justify-between border-b border-border px-5 py-5 sm:px-6">
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
                        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
                    </div>
                    <button onClick={onClose} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground">
                        <X size={18} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

function ModalError({ message }) {
    if (!message) return null;
    return <p className="rounded-lg border border-destructive/25 bg-destructive/8 px-3 py-2 text-xs text-[#EF708A]">{message}</p>;
}

// ── Página ──────────────────────────────────────────────────

const emptyDebtForm = { nombre: "", total: "", cuota: "", fechaFin: "", activa: true };

export default function Deudas({ onNavigate }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [debts, setDebts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [filter, setFilter] = useState("Todas");
    const [expandedIds, setExpandedIds] = useState([]);

    // Modal deuda
    const [debtModal, setDebtModal] = useState(null); // null | "new" | debt
    const [debtForm, setDebtForm] = useState(emptyDebtForm);

    // Modal pago
    const [paymentModal, setPaymentModal] = useState(null); // null | { debtId, payment? }
    const [paymentForm, setPaymentForm] = useState({ cantidad: "", fecha: "", tipo: "cuota", nota: "" });

    // Confirmar borrado
    const [deleteTarget, setDeleteTarget] = useState(null); // null | { debtId, paymentId? }

    const [saving, setSaving] = useState(false);
    const [modalError, setModalError] = useState("");

    const today = toISODate(new Date());

    useEffect(() => {
        let cancelled = false;
        async function fetchDebts() {
            try {
                const res = await fetch("/api/deudas");
                if (!res.ok) throw new Error();
                const data = await res.json();
                if (cancelled) return;
                setDebts(data);
                setLoadError("");
            } catch {
                if (!cancelled) setLoadError("No se pudieron cargar las deudas.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchDebts();
        return () => { cancelled = true; };
    }, [refresh]);

    const debtsWithStatus = useMemo(() => {
        const now = toISODate(new Date());
        return debts.map((d) => ({
            ...d,
            status: getStatus(d, now),
            paid: paidAmount(d),
        }));
    }, [debts]);

    const filtered = debtsWithStatus.filter((d) => {
        if (filter === "Activas") return d.status !== "Liquidada";
        if (filter === "Liquidadas") return d.status === "Liquidada";
        return true;
    });

    const summary = useMemo(() => {
        const open = debtsWithStatus.filter((d) => d.status !== "Liquidada");
        const total = debtsWithStatus.reduce((s, d) => s + d.precio_total, 0);
        const paid = debtsWithStatus.reduce((s, d) => s + d.paid, 0);
        const pending = open.reduce((s, d) => s + Math.max(0, d.precio_total - d.paid), 0);
        const monthly = open.reduce((s, d) => s + d.cuota_mensual, 0);
        const now = toISODate(new Date());
        const upcoming = open.filter((d) => d.fecha_fin >= now);
        const pool = upcoming.length ? upcoming : open;
        const next = pool.slice().sort((a, b) => a.fecha_fin.localeCompare(b.fecha_fin))[0] ?? null;
        return {
            total,
            paid,
            pending,
            monthly,
            openCount: open.length,
            next,
            progress: total ? (paid / total) * 100 : 0,
        };
    }, [debtsWithStatus]);

    function toggleExpand(id) {
        setExpandedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    }

    // ── Deuda ──
    function openDebtModal(debt) {
        setModalError("");
        if (debt) {
            setDebtForm({
                nombre: debt.nombre,
                total: String(debt.precio_total),
                cuota: String(debt.cuota_mensual),
                fechaFin: debt.fecha_fin,
                activa: debt.activa,
            });
            setDebtModal(debt);
        } else {
            setDebtForm(emptyDebtForm);
            setDebtModal("new");
        }
    }

    async function saveDebt() {
        const total = Number(debtForm.total);
        const cuota = Number(debtForm.cuota);
        if (!debtForm.nombre.trim() || !(total > 0) || !(cuota > 0) || !debtForm.fechaFin) {
            setModalError("Rellena todos los campos con valores válidos.");
            return;
        }
        setSaving(true);
        setModalError("");
        try {
            const body = {
                nombre: debtForm.nombre.trim(),
                precio_total: total,
                cuota_mensual: cuota,
                fecha_fin: debtForm.fechaFin,
                activa: debtForm.activa,
            };
            if (debtModal === "new") {
                await apiRequest("/api/deudas", "POST", body);
            } else {
                await apiRequest(`/api/deudas/${debtModal.id}`, "PUT", body);
            }
            setDebtModal(null);
            setRefresh((r) => !r);
        } catch (err) {
            setModalError(err.message);
        } finally {
            setSaving(false);
        }
    }

    // ── Pago ──
    function openPaymentModal(debtId, payment, defaultTipo = "cuota") {
        setModalError("");
        setPaymentForm(
            payment
                ? { cantidad: String(payment.cantidad), fecha: payment.fecha, tipo: payment.tipo, nota: payment.nota }
                : { cantidad: "", fecha: toISODate(new Date()), tipo: defaultTipo, nota: "" }
        );
        setPaymentModal({ debtId, payment });
    }

    async function savePayment() {
        const cantidad = Number(paymentForm.cantidad);
        if (!(cantidad > 0) || !paymentForm.fecha) {
            setModalError("Indica una cantidad mayor que 0 y una fecha.");
            return;
        }
        setSaving(true);
        setModalError("");
        try {
            const body = {
                cantidad,
                fecha: paymentForm.fecha,
                tipo: paymentForm.tipo,
                nota: paymentForm.nota,
            };
            if (paymentModal.payment) {
                await apiRequest(`/api/deudas/pagos/${paymentModal.payment.id}`, "PUT", body);
            } else {
                await apiRequest("/api/deudas/pagos", "POST", { ...body, deudaId: paymentModal.debtId });
            }
            setPaymentModal(null);
            setRefresh((r) => !r);
        } catch (err) {
            setModalError(err.message);
        } finally {
            setSaving(false);
        }
    }

    // ── Borrado ──
    async function confirmDelete() {
        if (!deleteTarget) return;
        setSaving(true);
        setModalError("");
        try {
            if (deleteTarget.paymentId) {
                await apiRequest(`/api/deudas/pagos/${deleteTarget.paymentId}`, "DELETE");
            } else {
                await apiRequest(`/api/deudas/${deleteTarget.debtId}`, "DELETE");
            }
            setDeleteTarget(null);
            setRefresh((r) => !r);
        } catch (err) {
            setModalError(err.message);
        } finally {
            setSaving(false);
        }
    }

    const summaryCards = [
        {
            label: "Deuda pendiente total",
            value: money(summary.pending),
            icon: CircleDollarSign,
            note: `En ${summary.openCount} deuda${summary.openCount !== 1 ? "s" : ""} abierta${summary.openCount !== 1 ? "s" : ""}`,
        },
        {
            label: "Total pagado",
            value: money(summary.paid),
            icon: Check,
            note: `${summary.progress.toFixed(1)}% amortizado`,
        },
        {
            label: "Cuota mensual total",
            value: money(summary.monthly),
            icon: CalendarDays,
            note: "Compromiso mensual",
        },
        {
            label: "Próxima liquidación",
            value: summary.next ? prettyMonth(summary.next.fecha_fin) : "—",
            icon: Landmark,
            note: summary.next ? summary.next.nombre : "Sin deudas abiertas",
        },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground">
            <MobileHeader onMenuClick={() => setIsSidebarOpen(true)} />
            <Sidebar currentPage="deudas" onNavigate={onNavigate} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8">
                <div className="max-w-5xl mx-auto space-y-6">

                    {/* Cabecera */}
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight mb-1">Deudas</h1>
                            <p className="text-muted-foreground text-sm">Controla lo que debes y cómo avanzas en liquidarlo</p>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="flex rounded-[10px] border border-border bg-card p-1">
                                {["Todas", "Activas", "Liquidadas"].map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => setFilter(option)}
                                        className={`hover:cursor-pointer flex-1 rounded-md px-3.5 py-2 text-xs font-medium transition sm:flex-none ${filter === option ? "bg-white/9 text-foreground" : "text-muted-foreground hover:text-foreground"
                                            }`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => openDebtModal()}
                                className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                            >
                                <Plus size={16} />
                                <span className="hidden sm:inline hover:cursor-pointer">Nueva deuda</span>
                                <span className="sm:hidden">Nueva</span>
                            </button>
                        </div>
                    </div>

                    {/* Resumen */}
                    <section className="overflow-hidden rounded-xl border border-border bg-card">
                        <div className="grid grid-cols-2 xl:grid-cols-4">
                            {summaryCards.map(({ label, value, icon: Icon, note }, index) => (
                                <div
                                    key={label}
                                    className={`p-4 lg:p-6 ${index % 2 === 0 ? "border-r border-border" : ""} ${index < 2 ? "border-b border-border xl:border-b-0" : ""} ${index > 0 ? "xl:border-l xl:border-border" : ""}`}
                                >
                                    <div className="mb-4 flex items-center justify-between gap-2">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
                                        <Icon size={16} className="shrink-0 text-muted-foreground/60" />
                                    </div>
                                    <p className="text-lg font-semibold tabular-nums tracking-tight sm:text-2xl">{value}</p>
                                    <p className="mt-2 truncate text-[11px] text-muted-foreground/70">{note}</p>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-border px-5 py-4 lg:px-6">
                            <div className="mb-2.5 flex items-center justify-between gap-2 text-[11px]">
                                <span className="font-medium text-muted-foreground">Progreso global de amortización</span>
                                <span className="tabular-nums text-muted-foreground">{money(summary.paid)} de {money(summary.total)}</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-white/6">
                                <div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${summary.progress}%` }} />
                            </div>
                        </div>
                    </section>

                    {/* Lista */}
                    <section>
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-sm font-semibold">Tus deudas</h2>
                            <span className="text-[11px] text-muted-foreground/70">
                                {filtered.length} registro{filtered.length !== 1 ? "s" : ""}
                            </span>
                        </div>

                        {loading ? (
                            <p className="py-16 text-center text-sm text-muted-foreground">Cargando deudas...</p>
                        ) : loadError ? (
                            <div className="rounded-xl border border-destructive/25 bg-destructive/6 px-5 py-6 text-center">
                                <p className="text-sm text-[#EF708A]">{loadError}</p>
                                <button
                                    onClick={() => { setLoading(true); setRefresh((r) => !r); }}
                                    className="mt-3 rounded-lg border border-border px-3 py-2 text-xs hover:bg-muted/40"
                                >
                                    Reintentar
                                </button>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex min-h-85 flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 text-center">
                                <div className="mb-4 grid size-14 place-items-center rounded-full bg-muted">
                                    <CreditCard size={24} className="text-muted-foreground" />
                                </div>
                                <h3 className="font-medium mb-1">
                                    {debts.length === 0 ? "Sin deudas registradas" : "Ninguna deuda en este filtro"}
                                </h3>
                                <p className="text-sm text-muted-foreground max-w-xs">
                                    {debts.length === 0
                                        ? "Añade tu primera deuda para empezar a seguir tus pagos y progreso."
                                        : "Prueba con otro filtro para ver el resto de tus deudas."}
                                </p>
                                {debts.length === 0 && (
                                    <button
                                        onClick={() => openDebtModal()}
                                        className="mt-5 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                                    >
                                        <Plus size={16} />
                                        Nueva deuda
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filtered.map((debt) => {
                                    const pending = Math.max(0, debt.precio_total - debt.paid);
                                    const progress = Math.min(100, (debt.paid / debt.precio_total) * 100);
                                    const isExpanded = expandedIds.includes(debt.id);
                                    const isClosed = debt.status === "Liquidada";
                                    return (
                                        <article
                                            key={debt.id}
                                            className={`overflow-hidden rounded-xl border bg-card transition ${debt.status === "Retrasada" ? "border-destructive/25" : "border-border"} ${isClosed ? "opacity-80" : ""}`}
                                        >
                                            <div
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => toggleExpand(debt.id)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" || e.key === " ") {
                                                        e.preventDefault();
                                                        toggleExpand(debt.id);
                                                    }
                                                }}
                                                className="w-full cursor-pointer select-none p-4 text-left hover:bg-muted/20 sm:p-5 lg:p-6"
                                            >
                                                <div className="flex items-start gap-3 sm:gap-4">
                                                    <div
                                                        className={`mt-0.5 hidden size-10 shrink-0 place-items-center rounded-[10px] border sm:grid ${debt.status === "Retrasada"
                                                                ? "border-destructive/20 bg-destructive/6 text-[#D95C76]"
                                                                : isClosed
                                                                    ? "border-emerald-400/15 bg-emerald-400/5 text-emerald-300/70"
                                                                    : "border-border bg-secondary text-muted-foreground"
                                                            }`}
                                                    >
                                                        <CreditCard size={18} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2.5">
                                                            <h3 className="truncate text-sm font-semibold sm:text-[15px]">{debt.nombre}</h3>
                                                            <StatusBadge status={debt.status} />
                                                        </div>
                                                        <div className="mt-4">
                                                            <div className="mb-2 flex items-center justify-between text-[10px] text-muted-foreground">
                                                                <span>{money(debt.paid)} pagado</span>
                                                                <span className="tabular-nums">{progress.toFixed(0)}%</span>
                                                            </div>
                                                            <div className="h-1 overflow-hidden rounded-full bg-white/[0.07]">
                                                                <div
                                                                    className={`h-full rounded-full ${isClosed ? "bg-emerald-400/60" : debt.status === "Retrasada" ? "bg-[#D95C76]/70" : "bg-white/75"}`}
                                                                    style={{ width: `${progress}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <div onClick={(e) => e.stopPropagation()}>
                                                            <IconButton label="Editar deuda" onClick={() => openDebtModal(debt)}><Pencil size={14} /></IconButton>
                                                        </div>
                                                        <div onClick={(e) => e.stopPropagation()}>
                                                            <IconButton
                                                                label="Eliminar deuda"
                                                                danger
                                                                onClick={() => { setModalError(""); setDeleteTarget({ debtId: debt.id }); }}
                                                            >
                                                                <Trash2 size={14} />
                                                            </IconButton>
                                                        </div>
                                                        <ChevronDown size={17} className={`ml-1 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                                                    </div>
                                                </div>
                                                <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-border pt-4 sm:ml-14 sm:grid-cols-3">
                                                    <div>
                                                        <p className="text-[10px] text-muted-foreground/70">Cuota mensual</p>
                                                        <p className="mt-1 text-xs tabular-nums">{money(debt.cuota_mensual)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-muted-foreground/70">Pendiente</p>
                                                        <p className="mt-1 text-xs tabular-nums">{money(pending)}</p>
                                                    </div>
                                                    <div className="col-span-2 sm:col-span-1">
                                                        <p className="text-[10px] text-muted-foreground/70">Fecha de fin</p>
                                                        <p className="mt-1 text-xs">
                                                            {prettyDate(debt.fecha_fin)}
                                                            {!isClosed && (
                                                                <span className="ml-1 text-muted-foreground/70">· {remainingMonths(debt.fecha_fin, today)} meses</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="border-t border-border bg-background/40 px-4 py-5 sm:px-6 sm:py-6">
                                                    <div className="mb-6 grid grid-cols-2 gap-4 rounded-[10px] border border-border bg-secondary/40 p-4 sm:grid-cols-4">
                                                        {[
                                                            ["Importe total", money(debt.precio_total)],
                                                            ["Cuota", money(debt.cuota_mensual)],
                                                            ["Fecha de alta", prettyDate(debt.fecha_alta)],
                                                            ["Fecha de fin", prettyDate(debt.fecha_fin)],
                                                        ].map(([label, value]) => (
                                                            <div key={label}>
                                                                <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">{label}</p>
                                                                <p className="mt-2 text-xs font-medium">{value}</p>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                        <div>
                                                            <h4 className="text-xs font-semibold">Historial de pagos</h4>
                                                            <p className="mt-1 text-[10px] text-muted-foreground/70">
                                                                {debt.pagos.length} movimiento{debt.pagos.length !== 1 ? "s" : ""} registrado{debt.pagos.length !== 1 ? "s" : ""}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => openPaymentModal(debt.id, undefined, "extraordinario")}
                                                                className="hover:cursor-pointer flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-border px-3 text-[11px] text-muted-foreground transition hover:bg-white/4 hover:text-foreground sm:flex-none"
                                                            >
                                                                <ArrowDownLeft size={14} /> Amortización extraordinaria
                                                            </button>
                                                            <button
                                                                onClick={() => openPaymentModal(debt.id)}
                                                                className="hover:cursor-pointer flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-[11px] font-semibold text-primary-foreground transition hover:opacity-90 sm:flex-none"
                                                            >
                                                                <Plus size={14} /> Añadir pago
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {debt.pagos.length === 0 ? (
                                                        <div className="rounded-[10px] border border-border px-5 py-6 text-center">
                                                            <p className="text-sm text-muted-foreground">No hay pagos registrados aún.</p>
                                                        </div>
                                                    ) : (
                                                        <div className="overflow-x-auto rounded-[10px] border border-border">
                                                            <table className="w-full border-collapse text-left">
                                                                <thead className="bg-muted/30 text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
                                                                    <tr>
                                                                        <th className="px-4 py-3 font-medium">Fecha</th>
                                                                        <th className="px-4 py-3 font-medium">Tipo</th>
                                                                        <th className="px-4 py-3 font-medium">Cantidad</th>
                                                                        <th className="hidden px-4 py-3 font-medium sm:table-cell">Nota</th>
                                                                        <th className="px-4 py-3 text-right font-medium"></th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {debt.pagos.map((pago) => (
                                                                        <tr key={pago.id} className="border-t border-border text-xs text-muted-foreground hover:bg-white/1.5">
                                                                            <td className="whitespace-nowrap px-4 py-3.5">{prettyDate(pago.fecha)}</td>
                                                                            <td className="px-4 py-3.5">
                                                                                <span
                                                                                    className={`rounded-full border px-2 py-1 text-[10px] ${pago.tipo === "extraordinario"
                                                                                            ? "border-amber-400/15 bg-amber-400/5 text-amber-200/70"
                                                                                            : "border-border bg-white/3 text-muted-foreground"
                                                                                        }`}
                                                                                >
                                                                                    {pago.tipo === "extraordinario" ? "Extraordinario" : "Cuota"}
                                                                                </span>
                                                                            </td>
                                                                            <td className="whitespace-nowrap px-4 py-3.5 font-medium tabular-nums text-foreground">{money(pago.cantidad)}</td>
                                                                            <td className="hidden max-w-60 truncate px-4 py-3.5 sm:table-cell">{pago.nota || "—"}</td>
                                                                            <td className="px-4 py-3.5">
                                                                                <div className="flex justify-end gap-1">
                                                                                    <IconButton label="Editar pago" onClick={() => openPaymentModal(debt.id, pago)}><Pencil size={13} /></IconButton>
                                                                                    <IconButton
                                                                                        label="Eliminar pago"
                                                                                        danger
                                                                                        onClick={() => { setModalError(""); setDeleteTarget({ debtId: debt.id, paymentId: pago.id }); }}
                                                                                    >
                                                                                        <Trash2 size={13} />
                                                                                    </IconButton>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>
            </main>

            {/* ── Modal: Nueva / Editar deuda ── */}
            {debtModal && (
                <ModalShell
                    title={debtModal === "new" ? "Nueva deuda" : "Editar deuda"}
                    description={debtModal === "new" ? "Registra una nueva obligación financiera." : "Actualiza las condiciones de esta deuda."}
                    onClose={() => setDebtModal(null)}
                >
                    <div className="space-y-4 p-5 sm:p-6">
                        <Field
                            label="Nombre de la deuda"
                            value={debtForm.nombre}
                            placeholder="Ej. Préstamo del coche"
                            maxLength={100}
                            autoFocus
                            onChange={(nombre) => setDebtForm({ ...debtForm, nombre })}
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Importe total (€)" type="number" min="0" step="0.01" value={debtForm.total} placeholder="0.00" onChange={(total) => setDebtForm({ ...debtForm, total })} />
                            <Field label="Cuota mensual (€)" type="number" min="0" step="0.01" value={debtForm.cuota} placeholder="0.00" onChange={(cuota) => setDebtForm({ ...debtForm, cuota })} />
                        </div>
                        <Field label="Fecha de fin" type="date" value={debtForm.fechaFin} onChange={(fechaFin) => setDebtForm({ ...debtForm, fechaFin })} />
                        <div className="flex items-center justify-between rounded-lg border border-border bg-input-background px-3 py-3">
                            <div>
                                <span className="block text-xs font-medium">Deuda activa</span>
                                <span className="mt-0.5 block text-[10px] text-muted-foreground">Cuenta en el pendiente y la cuota mensual.</span>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={debtForm.activa}
                                onClick={() => setDebtForm({ ...debtForm, activa: !debtForm.activa })}
                                className={`relative h-6 w-11 shrink-0 rounded-full transition ${debtForm.activa ? "bg-white" : "bg-switch-background"}`}
                            >
                                <span className={`absolute top-1 size-4 rounded-full transition ${debtForm.activa ? "left-6 bg-black" : "left-1 bg-[#8E8E97]"}`} />
                            </button>
                        </div>
                        <ModalError message={modalError} />
                    </div>
                    <div className="flex justify-end gap-2 border-t border-border px-5 py-4 sm:px-6">
                        <button onClick={() => setDebtModal(null)} className="rounded-lg px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:cursor-pointer">Cancelar</button>
                        <button
                            onClick={saveDebt}
                            disabled={saving}
                            className="hover:cursor-pointer rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {debtModal === "new" ? "Crear deuda" : "Guardar cambios"}
                        </button>
                    </div>
                </ModalShell>
            )}

            {/* ── Modal: Añadir / Editar pago ── */}
            {paymentModal && (
                <ModalShell
                    title={paymentModal.payment ? "Editar pago" : paymentForm.tipo === "extraordinario" ? "Amortización extraordinaria" : "Añadir pago"}
                    description="El importe se descontará automáticamente de la deuda pendiente."
                    onClose={() => setPaymentModal(null)}
                >
                    <div className="space-y-4 p-5 sm:p-6">
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Cantidad (€)" type="number" min="0" step="0.01" value={paymentForm.cantidad} placeholder="0.00" autoFocus onChange={(cantidad) => setPaymentForm({ ...paymentForm, cantidad })} />
                            <Field label="Fecha" type="date" value={paymentForm.fecha} onChange={(fecha) => setPaymentForm({ ...paymentForm, fecha })} />
                        </div>
                        <label className="block">
                            <span className="mb-2 block text-xs font-medium text-muted-foreground">Tipo de pago</span>
                            <select
                                value={paymentForm.tipo}
                                onChange={(e) => setPaymentForm({ ...paymentForm, tipo: e.target.value })}
                                className="h-10 w-full rounded-lg border border-border bg-input-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
                            >
                                <option value="cuota">Cuota</option>
                                <option value="extraordinario">Extraordinario</option>
                            </select>
                        </label>
                        <label className="block">
                            <span className="mb-2 block text-xs font-medium text-muted-foreground">
                                Nota <span className="text-muted-foreground/60">(opcional)</span>
                            </span>
                            <textarea
                                value={paymentForm.nota}
                                onChange={(e) => setPaymentForm({ ...paymentForm, nota: e.target.value })}
                                placeholder="Añade una referencia o comentario"
                                rows={3}
                                maxLength={255}
                                className="w-full resize-none rounded-lg border border-border bg-input-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-ring"
                            />
                        </label>
                        <ModalError message={modalError} />
                    </div>
                    <div className="flex justify-end gap-2 border-t border-border px-5 py-4 sm:px-6">
                        <button onClick={() => setPaymentModal(null)} className="rounded-lg px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:cursor-pointer">Cancelar</button>
                        <button
                            onClick={savePayment}
                            disabled={saving}
                            className="rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {paymentModal.payment ? "Guardar cambios" : "Registrar pago"}
                        </button>
                    </div>
                </ModalShell>
            )}

            {/* ── Modal: Confirmar eliminación ── */}
            {deleteTarget && (
                <ModalShell
                    title={deleteTarget.paymentId ? "Eliminar pago" : "Eliminar deuda"}
                    description="Esta acción es permanente y no se puede deshacer."
                    onClose={() => setDeleteTarget(null)}
                >
                    <div className="space-y-3 p-5 sm:p-6">
                        <div className="flex gap-3 rounded-[10px] border border-destructive/20 bg-destructive/6 p-4">
                            <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-destructive/10 text-[#E45A75]"><Trash2 size={16} /></div>
                            <p className="text-xs leading-5 text-[#B98A94]">
                                {deleteTarget.paymentId
                                    ? "El pago dejará de contabilizarse en el total amortizado de esta deuda."
                                    : "Al eliminar esta deuda también se borrará todo su historial de pagos asociado."}
                            </p>
                        </div>
                        <ModalError message={modalError} />
                    </div>
                    <div className="flex justify-end gap-2 border-t border-border px-5 py-4 sm:px-6">
                        <button onClick={() => setDeleteTarget(null)} className="rounded-lg px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground">Cancelar</button>
                        <button
                            onClick={confirmDelete}
                            disabled={saving}
                            className="rounded-lg bg-destructive px-4 py-2.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Eliminar definitivamente
                        </button>
                    </div>
                </ModalShell>
            )}
        </div>
    );
}