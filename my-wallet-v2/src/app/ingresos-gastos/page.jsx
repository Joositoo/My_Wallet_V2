'use client';
import { act, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import MobileHeader from "../components/MobileHeader";
import { useRouter } from "next/navigation";

import {
    Plus,
    Pencil,
    Trash2,
    X,
    TrendingUp,
    TrendingDown,
    PiggyBank,
    ShoppingBag,
    Wallet,
    BarChart3,
    ChevronDown,
    ChevronUp,
    AlertTriangle
} from "lucide-react";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

export default function IngresosGastos({ onNavigate }) {
    const router = useRouter();
    const [refresh, setRefresh] = useState(false);
    const [emptyFields, setEmptyFields] = useState(false);
    const [negativeAmount, setNegativeAmount] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [deleteConfirmType, setDeleteConfirmType] = useState('');
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());

    const [activeTab, setActiveTab] = useState("ingreso");

    const [selectedYear, setSelectedYear] = useState(
        new Date().getFullYear()
    );

    const [selectedMonth, setSelectedMonth] = useState(
        new Date().getMonth()
    );
    const [expandedMonths, setExpandedMonths] = useState([
        new Date().getMonth(),
    ]);

    const [categories, setCategories] = useState([]);
    const [currentMonthIncome, setCurrentMonthIncome] = useState(0);
    const [currentYearIncome, setCurrentYearIncome] = useState(0);
    const [currentMonthExpense, setCurrentMonthExpense] = useState(0);
    const [currentYearExpense, setCurrentYearExpense] = useState(0);

    const [transactions, setTransactions] = useState([]);

    const [isModalOpen, setIsModalOpen] = useState(false);

    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        categoria_id: "",
        cantidad: "",
        descripcion: "",
        fecha: today.toISOString().split("T")[0],
    });

    const months = [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
    ];

    const years = [2024, 2025, 2026, 2027];

    useEffect(() => {
        async function fetchCategorias() {
            const res = await fetch('/api/categorias');
            const data = await res.json();
            setCategories(data);
        }

        async function fetchTransacciones() {
            const res = await fetch('/api/ingresos');
            const data = await res.json();
            setCurrentMonthIncome(data.currentMonth);
            setCurrentYearIncome(data.currentYear);

            const res2 = await fetch('/api/gastos');
            const data2 = await res2.json();
            setCurrentMonthExpense(data2.currentMonth);
            setCurrentYearExpense(data2.currentYear);

            const ingresos = data.incomes.map(i => ({ ...i, tipo: 'ingreso' }));
            const gastos = data2.expenses.map(i => ({ ...i, tipo: 'gasto' }));

            const allTransactions = [...ingresos, ...gastos];

            setTransactions(allTransactions);
        }

        fetchCategorias();
        fetchTransacciones();
    }, [refresh]);

    function toggleMonth(index) {
        if (expandedMonths.includes(index)) {
            setExpandedMonths(expandedMonths.filter((m) => m !== index));
        } else {
            setExpandedMonths([...expandedMonths, index]);
        }
    }

    function handleOpenModal(transaction) {
        setEmptyFields(false);
        setNegativeAmount(false);

        if (transaction) {
            setEditingId(transaction.id);

            setFormData({
                categoria_id: transaction.categoria_id,
                cantidad: transaction.cantidad.toString(),
                descripcion: transaction.descripcion,
                fecha: new Date(transaction.fecha).toLocaleDateString("sv-SE"),
            });
        } else {
            setEditingId(null);

            setFormData({
                categoria_id: "",
                cantidad: "",
                descripcion: "",
                fecha: today.toISOString().split("T")[0],
            });
        }

        setIsModalOpen(true);
    }

    function handleCloseModal() {
        setIsModalOpen(false);
        setEditingId(null);
    }

    function handleCancelDelete() {
        setDeleteConfirmId(null);
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!formData.categoria_id || !formData.cantidad || !formData.descripcion || !formData.fecha) {
            setEmptyFields(true);
            return;
        }

        if (formData.cantidad <= 0) {
            setNegativeAmount(true);
            return;
        }

        const endpoint = activeTab === "ingreso" ? "/api/ingresos" : "/api/gastos";
        if (editingId) {
            await fetch(`${endpoint}/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    categoria_id: formData.categoria_id,
                    cantidad: parseFloat(formData.cantidad),
                    descripcion: formData.descripcion,
                    fecha: formData.fecha,
                })
            })
            setTransactions(
                transactions.map((t) =>
                    t.id === editingId
                        ? {
                            ...t,
                            categoria_id: formData.categoria_id,
                            cantidad: parseFloat(formData.cantidad),
                            descripcion: formData.descripcion,
                            fecha: formData.fecha,
                        }
                        : t
                )
            );
        } else {
            await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    categoria_id: formData.categoria_id,
                    cantidad: parseFloat(formData.cantidad),
                    descripcion: formData.descripcion,
                    fecha: formData.fecha,
                }),
            });
        }
        setRefresh(prev => !prev);
        handleCloseModal();
    }

    function handleDeleteClick(id, tipo) {
        setDeleteConfirmId(id);
        setDeleteConfirmType(tipo);
    }


    async function handleConfirmDelete() {
        const endpoint = deleteConfirmType === "ingreso" ? `api/ingresos/${deleteConfirmId}` : `/api/gastos/${deleteConfirmId}`;

        await fetch(endpoint, { method: 'DELETE' });
        setRefresh(prev => !prev);
        setDeleteConfirmId(null);
        setDeleteConfirmType('');
    }

    function getCategoryName(id) {
        return (
            categories.find((c) => c.id === id)?.nombre ||
            "Sin categoría"
        );
    }

    const filteredTransactions = transactions.filter(
        (t) => t.tipo === activeTab
    );

    const needsAmount = currentMonthIncome * 0.5;

    const wantsAmount = currentMonthIncome * 0.3;

    const savingsAmount = currentMonthIncome * 0.2;

    const yearTransactions =
        filteredTransactions.filter((t) => {
            const date = new Date(t.fecha);

            return (
                date.getFullYear() === selectedYear
            );
        });

    const availableCategories = categories.filter(
        (c) => c.tipo === activeTab
    );

    const chartData = months.map((month, index) => {
        const total = transactions
            .filter((t) => {
                const date = new Date(t.fecha);

                return (
                    date.getFullYear() === selectedYear &&
                    date.getMonth() === index &&
                    t.tipo === activeTab
                );
            })
            .reduce((sum, t) => sum + Number(t.cantidad), 0);

        return {
            mes: month,
            cantidad: total,
        };
    });

    return (
        <div className="min-h-screen bg-background text-foreground">
            <MobileHeader onMenuClick={() => setIsSidebarOpen(true)} />
            <Sidebar
                currentPage="ingresos-gastos"
                onNavigate={onNavigate}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <main className="lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight mb-2">Ingresos y Gastos</h1>
                            <p className="text-muted-foreground text-sm">Gestiona tus transacciones del año {selectedYear}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <label className="text-xs uppercase tracking-widest text-muted-foreground">Año:</label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    className="bg-[oklch(0.11_0_0)] border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:border-foreground/40 transition-colors hover:cursor-pointer"
                                >
                                    {years.map((year) => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={() => router.push("/ingresos-gastos/resumen")}
                                className="flex items-center justify-center gap-2 border border-border px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-foreground/5 transition-colors hover:cursor-pointer"
                            >
                                <BarChart3 className="w-4 h-4" />
                                Ver resumen anual
                            </button>
                            <button
                                onClick={() => handleOpenModal()}
                                className="flex items-center justify-center gap-2 bg-foreground text-background px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity hover:cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                Nueva transacción
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-4 border-b border-border">
                        <button
                            onClick={() => setActiveTab("ingreso")}
                            className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === "ingreso" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <div className="flex items-center gap-2 hover:cursor-pointer">
                                <TrendingUp className="w-4 h-4" />
                                Ingresos
                            </div>
                            {activeTab === "ingreso" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />}
                        </button>
                        <button
                            onClick={() => setActiveTab("gasto")}
                            className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === "gasto" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <div className="flex items-center gap-2 hover:cursor-pointer">
                                <TrendingDown className="w-4 h-4" />
                                Gastos
                            </div>
                            {activeTab === "gasto" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />}
                        </button>
                    </div>

                    {/* Ingresos */}
                    {activeTab === "ingreso" && (
                        <div className="space-y-6">
                            {/* Resumen anual */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-[oklch(0.11_0_0)] border border-border rounded-lg p-6">
                                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Mes actual</p>
                                    <p className="text-2xl font-semibold tracking-tight">{currentMonthIncome} €</p>
                                </div>
                                <div className="bg-[oklch(0.11_0_0)] border border-border rounded-lg p-6">
                                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Total anual</p>
                                    <p className="text-2xl font-semibold tracking-tight">{currentYearIncome} €</p>
                                </div>
                                <div className="bg-[oklch(0.11_0_0)] border border-border rounded-lg p-6">
                                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Promedio mensual</p>
                                    <p className="text-2xl font-semibold tracking-tight">{(currentYearIncome / (new Date().getMonth() + 1))} €</p>
                                </div>
                            </div>

                            {/* Regla 50/30/20 */}
                            <div className="bg-[oklch(0.11_0_0)] border border-border rounded-lg p-6">
                                <h2 className="text-lg font-semibold tracking-tight mb-4">Distribución 50/30/20 - Mes actual</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="flex items-start gap-3 p-4 bg-background rounded-lg border border-border">
                                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                            <Wallet className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Necesidades (50%)</p>
                                            <p className="text-xl font-semibold tracking-tight">{needsAmount.toFixed(2)} €</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-4 bg-background rounded-lg border border-border">
                                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                                            <ShoppingBag className="w-5 h-5 text-purple-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Ocio (30%)</p>
                                            <p className="text-xl font-semibold tracking-tight">{wantsAmount.toFixed(2)} €</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-4 bg-background rounded-lg border border-border">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                                            <PiggyBank className="w-5 h-5 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Ahorro (20%)</p>
                                            <p className="text-xl font-semibold tracking-tight">{savingsAmount.toFixed(2)} €</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Gráfica de ingresos */}
                            <div className="bg-[oklch(0.11_0_0)] border border-border rounded-lg p-6">
                                <h2 className="text-lg font-semibold tracking-tight mb-6">Evolución de ingresos {selectedYear}</h2>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis dataKey="mes" stroke="rgba(255,255,255,0.5)" style={{ fontSize: "12px" }} />
                                        <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: "12px" }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "oklch(0.11 0 0)",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                borderRadius: "8px",
                                                color: "#fff",
                                            }}
                                        />
                                        <Bar dataKey="cantidad" fill="#10b981" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Acordeón mensual de ingresos */}
                            <div className="space-y-3">
                                {months.map((month, index) => {
                                    const isExpanded = expandedMonths.includes(index);
                                    const monthTrans = transactions.filter((t) => {
                                        const date = new Date(t.fecha);

                                        return (
                                            date.getFullYear() === selectedYear &&
                                            date.getMonth() === index &&
                                            t.tipo === activeTab
                                        );
                                    });

                                    const hasTransactions = monthTrans.length > 0;
                                    const monthTotal = monthTrans.reduce(
                                        (sum, t) => sum + Number(t.cantidad),
                                        0
                                    );

                                    return (
                                        <div key={index} className="bg-[oklch(0.11_0_0)] border border-border rounded-lg overflow-hidden">
                                            <button
                                                onClick={() => toggleMonth(index)}
                                                className="w-full flex items-center justify-between p-4 hover:bg-foreground/5 transition-colors hover:cursor-pointer"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="font-semibold">{month}</span>
                                                    {!hasTransactions && (
                                                        <span className="text-xs text-muted-foreground">(Sin ingresos)</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-semibold">{monthTotal} €</span>
                                                    {isExpanded
                                                        ? <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                                        : <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                                    }
                                                </div>
                                            </button>

                                            {isExpanded && hasTransactions && (
                                                <div className="border-t border-border p-4">
                                                    <div className="space-y-2">
                                                        {monthTrans.map((transaction) => (
                                                            <div
                                                                key={transaction.id}
                                                                className="flex items-center justify-between p-4 bg-background rounded-lg border border-border hover:border-foreground/20 transition-colors group"
                                                            >
                                                                <div className="flex-1">
                                                                    <p className="font-medium text-sm mb-1">{getCategoryName(transaction.categoria_id)}</p>
                                                                    <p className="text-xs text-muted-foreground">{transaction.descripcion}</p>
                                                                    <p className="text-xs text-muted-foreground mt-1">{new Date(transaction.fecha).toLocaleDateString("es-ES")}</p>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <p className="text-lg font-semibold">{transaction.cantidad} €</p>
                                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <button
                                                                            onClick={() => handleOpenModal(transaction)}
                                                                            className="p-1.5 hover:bg-foreground/5 rounded text-muted-foreground hover:text-foreground transition-colors hover:cursor-pointer"
                                                                        >
                                                                            <Pencil className="w-4 h-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteClick(transaction.id, transaction.tipo)}
                                                                            className="p-1.5 hover:bg-foreground/5 rounded text-muted-foreground hover:text-red-500 transition-colors hover:cursor-pointer"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="mt-3 pt-3 border-t border-border/50 flex justify-between">
                                                        <span className="text-sm font-semibold">Total</span>
                                                        <span className="text-sm font-semibold">{monthTotal} €</span>
                                                    </div>
                                                </div>
                                            )}

                                            {isExpanded && !hasTransactions && (
                                                <div className="border-t border-border p-4 text-center">
                                                    <p className="text-sm text-muted-foreground">No hay ingresos registrados en este mes</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Gastos */}
                    {activeTab === "gasto" && (
                        <div className="space-y-6">
                            {/* Resumen anual */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-[oklch(0.11_0_0)] border border-border rounded-lg p-6">
                                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Mes actual</p>
                                    <p className="text-2xl font-semibold tracking-tight">{currentMonthExpense} €</p>
                                </div>
                                <div className="bg-[oklch(0.11_0_0)] border border-border rounded-lg p-6">
                                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Total anual</p>
                                    <p className="text-2xl font-semibold tracking-tight">{currentYearExpense} €</p>
                                </div>
                                <div className="bg-[oklch(0.11_0_0)] border border-border rounded-lg p-6">
                                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Promedio mensual</p>
                                    <p className="text-2xl font-semibold tracking-tight">{(currentYearExpense / (new Date().getMonth() + 1))} €</p>
                                </div>
                            </div>

                            {/* Gráfica de gastos */}
                            <div className="bg-[oklch(0.11_0_0)] border border-border rounded-lg p-6">
                                <h2 className="text-lg font-semibold tracking-tight mb-6">Evolución de gastos {selectedYear}</h2>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis dataKey="mes" stroke="rgba(255,255,255,0.5)" style={{ fontSize: "12px" }} />
                                        <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: "12px" }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "oklch(0.11 0 0)",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                borderRadius: "8px",
                                                color: "#fff",
                                            }}
                                        />
                                        <Bar dataKey="cantidad" fill="#ef4444" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Acordeón mensual de gastos */}
                            <div className="space-y-3">
                                {months.map((month, index) => {
                                    const isExpanded = expandedMonths.includes(index);
                                    const monthTrans = transactions.filter((t) => {
                                        const date = new Date(t.fecha);

                                        return (
                                            t.tipo === "gasto" &&
                                            date.getFullYear() === selectedYear &&
                                            date.getMonth() === index
                                        );
                                    });

                                    const hasTransactions = monthTrans.length > 0;
                                    const monthTotal = monthTrans.reduce(
                                        (sum, t) => sum + Number(t.cantidad),
                                        0
                                    );
                                    return (
                                        <div key={index} className="bg-[oklch(0.11_0_0)] border border-border rounded-lg overflow-hidden">
                                            <button
                                                onClick={() => toggleMonth(index)}
                                                className="w-full flex items-center justify-between p-4 hover:bg-foreground/5 transition-colors hover:cursor-pointer"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="font-semibold">{month}</span>
                                                    {!hasTransactions && (
                                                        <span className="text-xs text-muted-foreground">(Sin gastos)</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-semibold">{monthTotal.toFixed(2)} €</span>
                                                    {isExpanded
                                                        ? <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                                        : <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                                    }
                                                </div>
                                            </button>

                                            {isExpanded && hasTransactions && (
                                                <div className="border-t border-border p-4">
                                                    <div className="space-y-2">
                                                        {monthTrans.map((transaction) => (
                                                            <div
                                                                key={transaction.id}
                                                                className="flex items-center justify-between p-4 bg-background rounded-lg border border-border hover:border-foreground/20 transition-colors group"
                                                            >
                                                                <div className="flex-1">
                                                                    <p className="font-medium text-sm mb-1">{getCategoryName(transaction.categoria_id)}</p>
                                                                    <p className="text-xs text-muted-foreground">{transaction.descripcion}</p>
                                                                    <p className="text-xs text-muted-foreground mt-1">{new Date(transaction.fecha).toLocaleDateString("es-ES")}</p>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <p className="text-lg font-semibold">{transaction.cantidad} €</p>
                                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <button
                                                                            onClick={() => handleOpenModal(transaction)}
                                                                            className="p-1.5 hover:bg-foreground/5 rounded text-muted-foreground hover:text-foreground transition-colors hover:cursor-pointer"
                                                                        >
                                                                            <Pencil className="w-4 h-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteClick(transaction.id, transaction.tipo)}
                                                                            className="p-1.5 hover:bg-foreground/5 rounded text-muted-foreground hover:text-red-500 transition-colors hover:cursor-pointer"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="mt-3 pt-3 border-t border-border/50 flex justify-between">
                                                        <span className="text-sm font-semibold">Total</span>
                                                        <span className="text-sm font-semibold">{monthTotal.toFixed(2)} €</span>
                                                    </div>
                                                </div>
                                            )}

                                            {isExpanded && !hasTransactions && (
                                                <div className="border-t border-border p-4 text-center">
                                                    <p className="text-sm text-muted-foreground">No hay gastos registrados en este mes</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                </div>
            </main>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[oklch(0.11_0_0)] border border-border rounded-lg w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold tracking-tight">
                                {editingId ? "Editar transacción" : `Nuevo ${activeTab === "ingreso" ? "ingreso" : "gasto"}`}
                            </h2>
                            <button onClick={handleCloseModal} className="text-muted-foreground hover:text-foreground transition-colors hover:cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs uppercase tracking-widest text-muted-foreground">Categoría</label>
                                <select
                                    value={formData.categoria_id}
                                    onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:border-foreground/40 transition-colors hover:cursor-pointer"
                                >
                                    <option value="">Selecciona una categoría</option>
                                    {availableCategories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs uppercase tracking-widest text-muted-foreground">Cantidad (€)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.cantidad}
                                    onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                                    placeholder="0.00"
                                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/40 transition-colors"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs uppercase tracking-widest text-muted-foreground">Descripción</label>
                                <input
                                    type="text"
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                    placeholder="Descripción de la transacción"
                                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/40 transition-colors"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs uppercase tracking-widest text-muted-foreground">Fecha</label>
                                <input
                                    type="date"
                                    value={formData.fecha}
                                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:border-foreground/40 transition-colors hover:cursor-pointer"
                                />
                            </div>

                            {emptyFields && <p className="text-red-500">Ningún campo debe quedar vacío.</p>}
                            {negativeAmount && <p className="text-red-500">La cantidad no puede ser negativa.</p>}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-foreground/5 transition-colors hover:cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-foreground text-background px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity hover:cursor-pointer"
                                >
                                    {editingId ? "Guardar cambios" : "Crear"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[oklch(0.11_0_0)] border border-border rounded-lg w-full max-w-md p-6">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                            </div>

                            <div>
                                <h2 className="text-lg font-semibold tracking-tight mb-1">
                                    ¿Eliminar transacción?
                                </h2>

                                <p className="text-sm text-muted-foreground">
                                    Esta acción no se puede deshacer. La transacción
                                    será eliminada permanentemente.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleCancelDelete}
                                className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-foreground/5 transition-colors hover:cursor-pointer"
                            >
                                Cancelar
                            </button>

                            <button
                                onClick={handleConfirmDelete}
                                className="flex-1 bg-red-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors hover:cursor-pointer"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
