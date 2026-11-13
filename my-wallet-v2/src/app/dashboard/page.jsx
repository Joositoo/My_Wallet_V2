'use client';
import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "../components/Sidebar";
import MobileHeader from "../components/MobileHeader";
import {
    ArrowDownRight,
    ArrowLeftRight,
    ArrowRight,
    ArrowUpRight,
    BarChart3,
    BellRing,
    CircleDollarSign,
    CreditCard,
    PieChart as PieChartIcon,
    Receipt,
    Tags,
    WalletCards,
} from "lucide-react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

// ── Utilidades ──────────────────────────────────────────────

const PIE_COLORS = ["#E7E7E7", "#AFAFB5", "#7E7E86", "#56565D", "#343438"];

function money(value, decimals = 0) {
    return value.toLocaleString("es-ES", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}

function signedMoney(value, decimals = 0) {
    return `${value > 0 ? "+" : ""}${money(value, decimals)}`;
}

function formatPct(value, suffix = "%") {
    const text = value.toFixed(1).replace(".", ",");
    return `${value > 0 ? "+" : ""}${text}${suffix}`;
}

function parseDate(iso) {
    return new Date(`${iso}T12:00:00`);
}

function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function periodLabel(periodo, rango) {
    const inicio = parseDate(rango.inicio);
    const fin = parseDate(rango.fin);
    if (periodo === "anio") return String(fin.getFullYear());
    if (periodo === "3meses") {
        const a = inicio.toLocaleDateString("es-ES", { month: "short" }).replace(".", "");
        const b = fin.toLocaleDateString("es-ES", { month: "short", year: "numeric" }).replace(".", "");
        return `${capitalize(a)} – ${capitalize(b)}`;
    }
    return capitalize(fin.toLocaleDateString("es-ES", { month: "long", year: "numeric" }));
}

function shortDate(iso) {
    return parseDate(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short" }).replace(".", "");
}

// ── Componentes ─────────────────────────────────────────────

function BlockCard({ title, icon: Icon, href, children, className = "" }) {
    return (
        <Link
            href={href}
            className={`group block overflow-hidden rounded-xl border border-border bg-card transition duration-200 hover:border-white/20 ${className}`}
        >
            <div className="flex h-14.5 items-center justify-between border-b border-border px-5">
                <div className="flex items-center gap-2.5">
                    <Icon size={16} className="text-[#8C8C94]" strokeWidth={1.8} />
                    <h2 className="text-xs font-semibold">{title}</h2>
                </div>
                <span className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground transition group-hover:text-foreground">
                    Ver todo <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </span>
            </div>
            {children}
        </Link>
    );
}

function Metric({ label, value, change, goodWhenUp = true, suffix = "%", highlighted = false }) {
    const hasChange = change !== null && change !== undefined;
    const up = hasChange && change >= 0;
    const Icon = up ? ArrowUpRight : ArrowDownRight;
    const neutral = hasChange && change === 0;
    const good = goodWhenUp ? up : !up;
    const color = neutral ? "text-muted-foreground" : good ? "text-emerald-300/80" : "text-[#EA6A83]";

    return (
        <Link
            href="/ingresos-gastos"
            className={`rounded-xl border p-5 transition hover:border-white/20 ${highlighted ? "border-white/15 bg-secondary" : "border-border bg-card"}`}
        >
            <div className="flex items-center justify-between">
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
                {highlighted && <span className="size-1.5 rounded-full bg-white" />}
            </div>
            <p className="mt-5 text-2xl font-semibold leading-none tracking-tight tabular-nums">{value}</p>
            <div className="mt-4 flex items-center gap-1.5 text-[10px]">
                {hasChange ? (
                    <>
                        <span className={`flex items-center gap-1 font-medium ${color}`}>
                            <Icon size={12} /> {formatPct(change, suffix)}
                        </span>
                        <span className="text-muted-foreground/70">vs. periodo anterior</span>
                    </>
                ) : (
                    <span className="text-muted-foreground/70">Sin datos del periodo anterior</span>
                )}
            </div>
        </Link>
    );
}

function ChartTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg border border-border bg-secondary px-3 py-2 shadow-xl">
            <p className="mb-1.5 text-[10px] text-muted-foreground">{label}</p>
            {payload.map((item) => (
                <div key={item.name} className="flex min-w-32 items-center justify-between gap-4 text-[10px]">
                    <span style={{ color: item.color }}>{item.name}</span>
                    <span className="tabular-nums text-foreground">{money(item.value)}</span>
                </div>
            ))}
        </div>
    );
}

function EmptyBlock({ children }) {
    return <p className="px-5 py-10 text-center text-xs text-muted-foreground">{children}</p>;
}

function EmptyDashboard() {
    const links = [
        { title: "Ingresos y Gastos", description: "Registra y consulta todos tus movimientos.", icon: ArrowLeftRight, href: "/ingresos-gastos" },
        { title: "Suscripciones", description: "Controla tus pagos recurrentes y servicios.", icon: Receipt, href: "/suscripciones" },
        { title: "Deudas", description: "Sigue tu progreso y próximas cuotas.", icon: CreditCard, href: "/deudas" },
        { title: "Categorías", description: "Organiza cómo entra y sale tu dinero.", icon: Tags, href: "/categorias" },
    ];
    return (
        <section className="flex min-h-[calc(100vh-240px)] flex-col justify-center">
            <div className="mx-auto max-w-xl text-center">
                <span className="mx-auto grid size-12 place-items-center rounded-xl border border-border bg-card text-[#8B8B93]">
                    <WalletCards size={21} />
                </span>
                <p className="mt-6 text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">Tu espacio financiero</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">Bienvenido a Finanzas</h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                    Tu dashboard se irá completando a medida que añadas información en los distintos apartados.
                </p>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-2">
                {links.map(({ title, description, icon: Icon, href }) => (
                    <Link
                        key={title}
                        href={href}
                        className="group flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition hover:border-white/20 hover:bg-[#171717]"
                    >
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-secondary text-[#8B8B93]">
                            <Icon size={16} />
                        </span>
                        <span className="flex-1">
                            <span className="flex items-center justify-between text-xs font-semibold">
                                {title}
                                <ArrowRight size={14} className="text-muted-foreground/70 transition group-hover:translate-x-0.5 group-hover:text-foreground" />
                            </span>
                            <span className="mt-2 block text-[11px] leading-5 text-muted-foreground">{description}</span>
                        </span>
                    </Link>
                ))}
            </div>
        </section>
    );
}

// ── Página ──────────────────────────────────────────────────

export default function Dashboard({ onNavigate }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [periodo, setPeriodo] = useState("mes");
    const [data, setData] = useState(null);
    const [error, setError] = useState("");
    const [retry, setRetry] = useState(0);

    useEffect(() => {
        let cancelled = false;
        async function fetchDashboard() {
            try {
                const res = await fetch(`/api/dashboard?periodo=${periodo}`);
                if (!res.ok) throw new Error();
                const json = await res.json();
                if (cancelled) return;
                setData(json);
                setError("");
            } catch {
                if (!cancelled) setError("No se pudo cargar el dashboard.");
            }
        }
        fetchDashboard();
        return () => { cancelled = true; };
    }, [periodo, retry]);

    // Cargando: aún no hay datos o los que hay son de otro periodo
    const loading = !error && (!data || data.periodo !== periodo);
    const isEmpty = Boolean(data?.vacio);

    const k = data?.kpis;
    const ventana6 = data?.mensual ?? [];

    return (
        <div className="min-h-screen bg-background text-foreground">
            <MobileHeader onMenuClick={() => setIsSidebarOpen(true)} />
            <Sidebar currentPage="dashboard" onNavigate={onNavigate} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8">
                <div className="max-w-6xl mx-auto space-y-6">

                    {/* Cabecera */}
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            {data && (
                                <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
                                    Vista general · {periodLabel(data.periodo, data.rango)}
                                </p>
                            )}
                            <h1 className="text-3xl font-semibold tracking-tight mb-1">Dashboard</h1>
                            <p className="text-muted-foreground text-sm">Resumen de tu situación financiera</p>
                        </div>
                        {!isEmpty && (
                            <label className="flex items-center gap-3">
                                <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">Periodo</span>
                                <select
                                    value={periodo}
                                    onChange={(e) => setPeriodo(e.target.value)}
                                    className="h-10 cursor-pointer rounded-lg border border-border bg-card px-3 text-xs outline-none transition focus:ring-1 focus:ring-ring"
                                >
                                    <option value="mes">Este mes</option>
                                    <option value="3meses">Últimos 3 meses</option>
                                    <option value="anio">Este año</option>
                                </select>
                            </label>
                        )}
                    </div>

                    {error ? (
                        <div className="rounded-xl border border-destructive/25 bg-destructive/6 px-5 py-6 text-center">
                            <p className="text-sm text-[#EF708A]">{error}</p>
                            <button
                                onClick={() => { setError(""); setRetry((r) => r + 1); }}
                                className="mt-3 cursor-pointer rounded-lg border border-border px-3 py-2 text-xs hover:bg-muted/40"
                            >
                                Reintentar
                            </button>
                        </div>
                    ) : !data ? (
                        <p className="py-24 text-center text-sm text-muted-foreground">Cargando dashboard...</p>
                    ) : isEmpty ? (
                        <EmptyDashboard />
                    ) : (
                        <div className={`space-y-4 transition-opacity ${loading ? "opacity-50" : ""}`}>

                            {/* KPIs */}
                            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                <Metric label="Balance del periodo" value={signedMoney(k.balance)} change={k.variaciones.balance} highlighted />
                                <Metric label="Ingresos" value={money(k.ingresos)} change={k.variaciones.ingresos} />
                                <Metric label="Gastos" value={money(k.gastos)} change={k.variaciones.gastos} goodWhenUp={false} />
                                <Metric label="Tasa de ahorro" value={`${k.tasaAhorro.toFixed(1).replace(".", ",")}%`} change={k.variaciones.tasaAhorro} suffix=" pp" />
                            </section>

                            <div className="grid gap-4 lg:grid-cols-12">

                                {/* Ingresos y Gastos */}
                                <BlockCard title="Ingresos y Gastos" icon={ArrowLeftRight} href="/ingresos-gastos" className="lg:col-span-7">
                                    <div className="p-5">
                                        <div className="mb-4 flex items-end justify-between gap-3">
                                            <div>
                                                <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/70">Balance de los últimos 6 meses</p>
                                                <p className="mt-1 text-lg font-medium tabular-nums">{signedMoney(data.balance6Meses)}</p>
                                            </div>
                                            <div className="flex items-center gap-4 text-[9px] text-muted-foreground">
                                                <span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-emerald-300/70" /> Ingresos</span>
                                                <span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-[#EA6A83]/80" /> Gastos</span>
                                            </div>
                                        </div>
                                        <div className="h-55">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={ventana6} barGap={3}>
                                                    <CartesianGrid vertical={false} stroke="rgba(255,255,255,.055)" />
                                                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: "#717182", fontSize: 9 }} dy={8} />
                                                    <YAxis
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: "#717182", fontSize: 9 }}
                                                        tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : v)}
                                                        width={32}
                                                    />
                                                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,.025)" }} />
                                                    <Bar dataKey="ingresos" name="Ingresos" fill="rgba(110,231,183,.62)" radius={[3, 3, 0, 0]} maxBarSize={18} />
                                                    <Bar dataKey="gastos" name="Gastos" fill="rgba(234,106,131,.62)" radius={[3, 3, 0, 0]} maxBarSize={18} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </BlockCard>

                                {/* Resumen anual */}
                                <BlockCard title="Resumen anual" icon={BarChart3} href="/ingresos-gastos/resumen" className="lg:col-span-5">
                                    <div className="p-5">
                                        <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/70">Balance acumulado {data.anual.anio}</p>
                                        <p className="mt-2 text-[22px] font-medium tabular-nums">{signedMoney(data.anual.balanceTotal)}</p>
                                        <div className="mt-3 h-32.5">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={data.anual.meses}>
                                                    <CartesianGrid vertical={false} stroke="rgba(255,255,255,.05)" />
                                                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: "#717182", fontSize: 9 }} dy={6} />
                                                    <Tooltip content={<ChartTooltip />} />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="balance"
                                                        name="Balance"
                                                        stroke="#E7E7E7"
                                                        strokeWidth={1.5}
                                                        dot={{ r: 2, fill: "#141414", stroke: "#E7E7E7" }}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="mt-4 grid grid-cols-2 divide-x divide-border rounded-lg border border-border bg-secondary py-3">
                                            {[["Mejor mes", data.anual.mejor], ["Peor mes", data.anual.peor]].map(([label, mes]) => (
                                                <div key={label} className="px-3">
                                                    <p className="text-[9px] text-muted-foreground/70">{label}</p>
                                                    {mes ? (
                                                        <p className="mt-1 text-[11px] font-medium">
                                                            {mes.mes}{" "}
                                                            <span className={`tabular-nums ${mes.neto >= 0 ? "text-emerald-300/70" : "text-[#EA6A83]"}`}>
                                                                {signedMoney(mes.neto)}
                                                            </span>
                                                        </p>
                                                    ) : (
                                                        <p className="mt-1 text-[11px] text-muted-foreground">—</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </BlockCard>

                                {/* Categorías */}
                                <BlockCard title="Categorías" icon={PieChartIcon} href="/categorias" className="lg:col-span-7">
                                    {data.categorias.gastos.items.length === 0 ? (
                                        <EmptyBlock>Sin gastos en este periodo.</EmptyBlock>
                                    ) : (
                                        <div className="grid sm:grid-cols-[180px_1fr]">
                                            <div className="relative flex h-55 items-center justify-center border-b border-border sm:border-b-0 sm:border-r">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={data.categorias.gastos.items}
                                                            dataKey="importe"
                                                            nameKey="nombre"
                                                            innerRadius={52}
                                                            outerRadius={72}
                                                            paddingAngle={2}
                                                            stroke="none"
                                                        >
                                                            {data.categorias.gastos.items.map((item, i) => (
                                                                <Cell key={item.nombre} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip
                                                            formatter={(value, name) => [money(value), name]}
                                                            contentStyle={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, fontSize: 10 }}
                                                            itemStyle={{ color: "#fff" }}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                                <div className="pointer-events-none absolute text-center">
                                                    <p className="text-sm font-medium tabular-nums">{money(data.categorias.gastos.total)}</p>
                                                    <p className="mt-1 text-[8px] uppercase tracking-[0.12em] text-muted-foreground/70">Gastos</p>
                                                </div>
                                            </div>
                                            <div className="p-5">
                                                <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70">Principales gastos</p>
                                                <div className="space-y-2.5">
                                                    {data.categorias.gastos.items.map((category, i) => (
                                                        <div key={category.nombre} className="grid grid-cols-[8px_1fr_auto_auto] items-center gap-2 text-[10px]">
                                                            <span className="size-1.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                                            <span className="truncate text-[#A7A7AE]">{category.nombre}</span>
                                                            <span className="tabular-nums">{money(category.importe)}</span>
                                                            <span className="w-9 text-right tabular-nums text-muted-foreground/70">{Math.round(category.porcentaje)}%</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between gap-4 border-t border-border bg-background/40 px-5 py-3.5">
                                        <div className="min-w-0">
                                            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">Categorías de ingresos</p>
                                            <p className="mt-1 truncate text-[10px] text-[#8C8C94]">
                                                {data.categorias.ingresos.items.length
                                                    ? data.categorias.ingresos.items.map((i) => `${i.nombre} ${String(i.porcentaje).replace(".", ",")}%`).join(" · ")
                                                    : "Sin ingresos en este periodo"}
                                            </p>
                                        </div>
                                        <span className="shrink-0 text-xs tabular-nums text-emerald-300/75">{money(data.categorias.ingresos.total)}</span>
                                    </div>
                                </BlockCard>

                                {/* Suscripciones */}
                                <BlockCard title="Suscripciones" icon={Receipt} href="/suscripciones" className="lg:col-span-5">
                                    <div className="p-5">
                                        <div className="grid grid-cols-2 divide-x divide-border rounded-lg border border-border bg-secondary py-3.5">
                                            <div className="px-4">
                                                <p className="text-[9px] uppercase tracking-[0.13em] text-muted-foreground/70">Gasto {data.suscripciones.anio}</p>
                                                <p className="mt-2 text-lg tabular-nums">{money(data.suscripciones.gastoAnual)}</p>
                                            </div>
                                            <div className="px-4">
                                                <p className="text-[9px] uppercase tracking-[0.13em] text-muted-foreground/70">Suscripciones</p>
                                                <p className="mt-2 text-lg tabular-nums">{data.suscripciones.cantidad}</p>
                                            </div>
                                        </div>
                                        {data.suscripciones.top.length === 0 ? (
                                            <p className="pt-8 pb-3 text-center text-xs text-muted-foreground">Aún no tienes suscripciones.</p>
                                        ) : (
                                            <div className="mt-5 space-y-1">
                                                {data.suscripciones.top.map((susc, index) => (
                                                    <div key={susc.id} className="flex items-center gap-3 border-b border-border/60 py-2.5 last:border-0">
                                                        <span className="grid size-5 place-items-center rounded bg-secondary text-[8px] tabular-nums text-muted-foreground/70">0{index + 1}</span>
                                                        <span className="flex-1 truncate text-[11px] text-[#A7A7AE]">{susc.nombre}</span>
                                                        <span className="text-[10px] tabular-nums">{money(susc.importe, 2)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </BlockCard>

                                {/* Deudas */}
                                <BlockCard title="Deudas" icon={CreditCard} href="/deudas" className="lg:col-span-6">
                                    {data.deudas.cantidad === 0 ? (
                                        <EmptyBlock>Aún no tienes deudas registradas.</EmptyBlock>
                                    ) : (
                                        <div className="p-5">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground/70">Deuda pendiente</p>
                                                    <p className="mt-2 text-[22px] font-medium tabular-nums">{money(data.deudas.pendiente)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground/70">Cuota mensual</p>
                                                    <p className="mt-2 text-sm tabular-nums">{money(data.deudas.cuotaMensual)}</p>
                                                </div>
                                            </div>
                                            <div className="mt-4">
                                                <div className="mb-2 flex justify-between text-[9px] text-muted-foreground/70">
                                                    <span>Progreso global</span>
                                                    <span className="tabular-nums">{String(data.deudas.progreso).replace(".", ",")}%</span>
                                                </div>
                                                <div className="h-1.5 overflow-hidden rounded-full bg-white/7">
                                                    <div className="h-full rounded-full bg-white/75" style={{ width: `${data.deudas.progreso}%` }} />
                                                </div>
                                            </div>
                                            <div className="mt-5 space-y-3">
                                                {data.deudas.top.map((deuda) => (
                                                    <div key={deuda.id} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5">
                                                        <span className="truncate text-[10px] text-[#A7A7AE]">{deuda.nombre}</span>
                                                        <span className={`text-[9px] ${deuda.estado === "Retrasada" ? "text-[#EA6A83]" : deuda.estado === "Liquidada" ? "text-emerald-300/70" : "text-muted-foreground"}`}>
                                                            {deuda.estado}
                                                        </span>
                                                        <div className="col-span-2 h-1 overflow-hidden rounded-full bg-white/6">
                                                            <div
                                                                className={`h-full rounded-full ${deuda.estado === "Retrasada" ? "bg-[#EA6A83]/60" : deuda.estado === "Liquidada" ? "bg-emerald-300/55" : "bg-white/55"}`}
                                                                style={{ width: `${deuda.progreso}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {data.deudas.retrasadas > 0 && (
                                                <div className="mt-5 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-[10px] text-[#CF7486]">
                                                    <BellRing size={13} className="shrink-0" />
                                                    {data.deudas.retrasadas === 1
                                                        ? "Tienes una deuda con cuotas retrasadas."
                                                        : `Tienes ${data.deudas.retrasadas} deudas con cuotas retrasadas.`}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </BlockCard>

                                {/* Últimos movimientos */}
                                <BlockCard title="Últimos movimientos" icon={CircleDollarSign} href="/ingresos-gastos" className="lg:col-span-6">
                                    {data.movimientos.length === 0 ? (
                                        <EmptyBlock>Aún no hay movimientos.</EmptyBlock>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full min-w-125 border-collapse text-left">
                                                <thead>
                                                    <tr className="border-b border-border text-[8px] uppercase tracking-[0.14em] text-muted-foreground/70">
                                                        <th className="px-5 py-3 font-medium">Fecha</th>
                                                        <th className="px-3 py-3 font-medium">Descripción</th>
                                                        <th className="px-3 py-3 font-medium">Categoría</th>
                                                        <th className="px-5 py-3 text-right font-medium">Importe</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.movimientos.map((mov) => (
                                                        <tr key={mov.id} className="border-b border-border/60 text-[10px] last:border-0">
                                                            <td className="whitespace-nowrap px-5 py-3 text-muted-foreground/70">{shortDate(mov.fecha)}</td>
                                                            <td className="max-w-40 truncate px-3 py-3 text-[#B8B8BE]">{mov.descripcion || "—"}</td>
                                                            <td className="px-3 py-3 text-muted-foreground">{mov.categoria}</td>
                                                            <td className={`whitespace-nowrap px-5 py-3 text-right tabular-nums ${mov.tipo === "ingreso" ? "text-emerald-300/80" : "text-[#EA6A83]"}`}>
                                                                {mov.tipo === "ingreso" ? "+" : "-"}{money(mov.cantidad, 2)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </BlockCard>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
