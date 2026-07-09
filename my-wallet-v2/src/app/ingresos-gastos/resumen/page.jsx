'use client';
import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import MobileHeader from "../../components/MobileHeader";
import { useRouter } from "next/navigation";
import {
    ChevronDown,
    ChevronUp,
    PiggyBank,
    ShoppingBag,
    Wallet,
    ArrowLeft,
} from "lucide-react";

import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

export default function ResumenAnual({ onNavigate }) {
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedYear, setSelectedYear] = useState(
        new Date().getFullYear()
    );

    const [expandedMonths, setExpandedMonths] = useState([
        new Date().getMonth(),
    ]);

    const months = [
        "Ene",
        "Feb",
        "Mar",
        "Abr",
        "May",
        "Jun",
        "Jul",
        "Ago",
        "Sep",
        "Oct",
        "Nov",
        "Dic",
    ];

    const monthsFull = [
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

    const [totalAnnualIncome, setTotalAnnualIncome] = useState(0);
    const [totalAnnualExpense, setTotalAnnualExpense] = useState(0);
    const [allMovements, setAllMovements] = useState([]);
    const [categories, setCategories] = useState([]);
    const [totalHistoricalIncome, setTotalHistorialIncome] = useState(0);
    useEffect(() => {
        async function fetchData() {
            const res = await fetch(`/api/resumen?year=${selectedYear}`);
            const data = await res.json();
            setTotalAnnualIncome(data.totalAnualIncome);
            setTotalAnnualExpense(data.totalAnnualExpense);
            setAllMovements(data.allMovements);
            setTotalHistorialIncome(data.totalHistoricalIncome);
        }

        async function fetchCategories() {
            const res = await fetch('/api/categorias');
            const data = await res.json();
            setCategories(data);
        }

        fetchData();
        fetchCategories();
    }, [selectedYear]);

    function toggleMonth(index) {
        if (expandedMonths.includes(index)) {
            setExpandedMonths(expandedMonths.filter((m) => m !== index));
        } else {
            setExpandedMonths([...expandedMonths, index]);
        }
    }

    const incomeCategories = categories.filter(
        (c) => c.tipo === "ingreso"
    );

    const incomeByCategory = incomeCategories.map((category) => {
        const monthlyData = Array.from({ length: 12 }, (_, monthIndex) => {
            return allMovements
                .filter(m =>
                    m.tipo === 'ingreso' &&
                    m.categoria_id === category.id &&
                    new Date(m.fecha).getMonth() === monthIndex
                )
                .reduce((sum, m) => sum + parseFloat(m.cantidad), 0);
        });
        return {
            category: category.nombre,
            monthlyData,
            total: monthlyData.reduce((sum, val) => sum + val, 0),
        };
    });

    const monthlyTotals = Array.from({ length: 12 }, (_, monthIndex) => {
        return allMovements
            .filter(m => m.tipo === 'ingreso' && new Date(m.fecha).getMonth() === monthIndex)
            .reduce((sum, m) => sum + parseFloat(m.cantidad), 0);
    });

    const currentMonthIncome =
        monthlyTotals[new Date().getMonth()];

    const needsAmount = currentMonthIncome * 0.5;
    const wantsAmount = currentMonthIncome * 0.3;
    const savingsAmount = currentMonthIncome * 0.2;
    const expenseCategories = categories.filter(
        (c) => c.tipo === "gasto"
    );

    const expensesByMonth = Array.from({ length: 12 }, (_, monthIndex) => {
        const monthMovements = allMovements.filter(m =>
            m.tipo === 'gasto' && new Date(m.fecha).getMonth() === monthIndex
        );
        const byCategory = expenseCategories.map((category) => {
            const amount = monthMovements
                .filter(m => m.categoria_id === category.id)
                .reduce((sum, m) => sum + parseFloat(m.cantidad), 0);
            return { category: category.nombre, amount };
        }).filter(item => item.amount > 0);

        return {
            month: monthIndex,
            transactions: byCategory,
            total: monthMovements.reduce((sum, m) => sum + parseFloat(m.cantidad), 0),
        };
    });

    const comparisonChartData = months.map((month, index) => {
        const mesNumero = index + 1; // enero = 1, febrero = 2...

        const ingresos = allMovements
            .filter(m => m.tipo === 'ingreso' && new Date(m.fecha).getMonth() + 1 === mesNumero)
            .reduce((sum, m) => sum + parseFloat(m.cantidad), 0);

        const gastos = allMovements
            .filter(m => m.tipo === 'gasto' && new Date(m.fecha).getMonth() + 1 === mesNumero)
            .reduce((sum, m) => sum + parseFloat(m.cantidad), 0);

        return {
            mes: month,
            ingresos,
            gastos,
            balance: ingresos - gastos,
        };
    });
    const expenseCategoryData = expenseCategories.map((category) => {
        const total = allMovements
            .filter(m => m.tipo === 'gasto' && m.categoria_id === category.id)
            .reduce((sum, m) => sum + parseFloat(m.cantidad), 0);
        return { name: category.nombre, value: total };
    }).filter(item => item.value > 0);

    const incomeCategoryData = incomeCategories.map((category) => {
        const total = allMovements
            .filter(m => m.tipo === 'ingreso' && m.categoria_id === category.id)
            .reduce((sum, m) => sum + parseFloat(m.cantidad), 0);
        return { name: category.nombre, value: total };
    }).filter(item => item.value > 0);

    const COLORS = [
        "#10b981",
        "#3b82f6",
        "#8b5cf6",
        "#ec4899",
        "#f59e0b",
        "#14b8a6",
        "#6366f1",
        "#ef4444",
    ];

    const expenseStackedData = months.map((month, monthIndex) => {
        const dataPoint = { mes: month };
        expenseCategories.forEach((category) => {
            dataPoint[category.nombre] = allMovements
                .filter(m =>
                    m.tipo === 'gasto' &&
                    m.categoria_id === category.id &&
                    new Date(m.fecha).getMonth() === monthIndex
                )
                .reduce((sum, m) => sum + parseFloat(m.cantidad), 0);
        });
        return dataPoint;
    });
    const incomeStackedData = months.map((month, monthIndex) => {
        const dataPoint = { mes: month };
        incomeCategories.forEach((category) => {
            dataPoint[category.nombre] = allMovements
                .filter(m =>
                    m.tipo === 'ingreso' &&
                    m.categoria_id === category.id &&
                    new Date(m.fecha).getMonth() === monthIndex
                )
                .reduce((sum, m) => sum + parseFloat(m.cantidad), 0);
        });
        return dataPoint;
    });

    return (
        <div className="min-h-screen bg-background text-foreground">
            <MobileHeader onMenuClick={() => setIsSidebarOpen(true)} />
            <Sidebar currentPage="ingresos-gastos" onNavigate={onNavigate} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={() => router.push("/ingresos-gastos")}
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-sm hover:cursor-pointer">Volver a transacciones</span>
                        </button>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-semibold tracking-tight mb-2">Resumen Anual</h1>
                                <p className="text-muted-foreground text-sm">Vista completa de ingresos y gastos</p>
                            </div>
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
                        </div>
                    </div>

                    {/* Tarjetas de resumen */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="bg-[oklch(0.11_0_0)] border border-border rounded-lg p-6">
                            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Ingresos totales</p>
                            <p className="text-2xl font-semibold tracking-tight text-emerald-500">{totalAnnualIncome} €</p>
                        </div>
                        <div className="bg-[oklch(0.11_0_0)] border border-border rounded-lg p-6">
                            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Gastos totales</p>
                            <p className="text-2xl font-semibold tracking-tight text-red-500">{totalAnnualExpense} €</p>
                        </div>
                        <div className="bg-[oklch(0.11_0_0)] border border-border rounded-lg p-6">
                            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Balance</p>
                            <p className={`text-2xl font-semibold tracking-tight ${totalAnnualIncome - totalAnnualExpense >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                                {(totalAnnualIncome - totalAnnualExpense).toFixed(2)} €
                            </p>
                        </div>
                        <div className="bg-[oklch(0.11_0_0)] border border-border rounded-lg p-6">
                            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Tasa de ahorro</p>
                            <p className="text-2xl font-semibold tracking-tight">
                                {totalAnnualIncome > 0 ? (((totalAnnualIncome - totalAnnualExpense) / totalAnnualIncome) * 100).toFixed(2) : 0}%
                            </p>
                        </div>
                        <div className="bg-[oklch(0.11_0_0)] border border-border rounded-lg p-6 sm:col-span-2 lg:col-span-1">
                            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Ingresos históricos</p>
                            <p className="text-2xl font-semibold tracking-tight text-emerald-400">{totalHistoricalIncome} €</p>
                            <p className="text-xs text-muted-foreground mt-1">Todos los años</p>
                        </div>
                    </div>

                    {/* Gráficas de comparación */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold tracking-tight">Visión General</h2>

                        {/* Comparación Ingresos vs Gastos */}
                        <div className="bg-[oklch(0.11_0_0)] border border-border rounded-lg p-6">
                            <h3 className="text-lg font-semibold tracking-tight mb-6">Ingresos vs Gastos - {selectedYear}</h3>
                            <ResponsiveContainer width="100%" height={350}>
                                <LineChart data={comparisonChartData}>
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
                                    <Legend />
                                    <Line type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={2} name="Ingresos" />
                                    <Line type="monotone" dataKey="gastos" stroke="#ef4444" strokeWidth={2} name="Gastos" />
                                    <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" name="Balance" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Gráficos circulares lado a lado */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Distribución de ingresos por categoría */}
                            {incomeCategoryData.length > 0 && (
                                <div className="bg-[oklch(0.11_0_0)] border border-border rounded-lg p-6">
                                    <h3 className="text-lg font-semibold tracking-tight mb-6">Distribución de Ingresos</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={incomeCategoryData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {incomeCategoryData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: "oklch(0.11 0 0)",
                                                    border: "1px solid rgba(255,255,255,0.1)",
                                                    borderRadius: "8px",
                                                    color: "#fff",
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="mt-4 space-y-2">
                                        {incomeCategoryData.map((item, index) => (
                                            <div key={index} className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                                    <span>{item.name}</span>
                                                </div>
                                                <span className="font-semibold">{item.value.toFixed(2)} €</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Distribución de gastos por categoría */}
                            {expenseCategoryData.length > 0 && (
                                <div className="bg-[oklch(0.11_0_0)] border border-border rounded-lg p-6">
                                    <h3 className="text-lg font-semibold tracking-tight mb-6">Distribución de Gastos</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={expenseCategoryData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {expenseCategoryData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: "oklch(0.11 0 0)",
                                                    border: "1px solid rgba(255,255,255,0.1)",
                                                    borderRadius: "8px",
                                                    color: "#fff",
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="mt-4 space-y-2">
                                        {expenseCategoryData.map((item, index) => (
                                            <div key={index} className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                                    <span>{item.name}</span>
                                                </div>
                                                <span className="font-semibold">{item.value.toFixed(2)} €</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SECCIÓN INGRESOS */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold tracking-tight">Ingresos</h2>

                        {/* Gráfica de ingresos apilados por categoría */}
                        <div className="bg-[oklch(0.11_0_0)] border border-border rounded-lg p-6">
                            <h3 className="text-lg font-semibold tracking-tight mb-6">Ingresos por categoría - {selectedYear}</h3>
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={incomeStackedData}>
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
                                    <Legend />
                                    {incomeCategories.map((category, index) => (
                                        <Bar
                                            key={category.id}
                                            dataKey={category.nombre}
                                            stackId="a"
                                            fill={COLORS[index % COLORS.length]}
                                            radius={index === incomeCategories.length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]}
                                        />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Tabla de ingresos */}
                        <div className="bg-[oklch(0.11_0_0)] border border-border rounded-lg p-6 overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-3 px-2 font-medium text-muted-foreground">Categoría</th>
                                        {months.map((month, index) => (
                                            <th key={index} className="text-right py-3 px-2 font-medium text-muted-foreground">
                                                {month}
                                            </th>
                                        ))}
                                        <th className="text-right py-3 px-2 font-medium text-foreground">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {incomeByCategory.map((row, index) => (
                                        <tr key={index} className="border-b border-border/50">
                                            <td className="py-3 px-2 font-medium">{row.category}</td>
                                            {row.monthlyData.map((amount, monthIndex) => (
                                                <td key={monthIndex} className="text-right py-3 px-2 text-muted-foreground">
                                                    {amount > 0 ? `${amount.toFixed(0)}€` : "-"}
                                                </td>
                                            ))}
                                            <td className="text-right py-3 px-2 font-semibold">{row.total.toFixed(0)}€</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-foreground/5">
                                        <td className="py-3 px-2 font-semibold">Total</td>
                                        {monthlyTotals.map((total, index) => (
                                            <td key={index} className="text-right py-3 px-2 font-semibold">
                                                {total > 0 ? `${total.toFixed(0)}€` : "-"}
                                            </td>
                                        ))}
                                        <td className="text-right py-3 px-2 font-bold text-lg">{totalAnnualIncome}€</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Distribución 50/30/20 */}
                        <div className="bg-[oklch(0.11_0_0)] border border-border rounded-lg p-6">
                            <h3 className="text-lg font-semibold tracking-tight mb-4">Distribución 50/30/20 - Mes actual</h3>
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
                    </div>

                    {/* SECCIÓN GASTOS */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold tracking-tight">Gastos</h2>

                        {/* Gráfica de gastos apilados por categoría */}
                        <div className="bg-[oklch(0.11_0_0)] border border-border rounded-lg p-6">
                            <h3 className="text-lg font-semibold tracking-tight mb-6">Gastos por categoría - {selectedYear}</h3>
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={expenseStackedData}>
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
                                    <Legend />
                                    {expenseCategories.map((category, index) => (
                                        <Bar
                                            key={category.id}
                                            dataKey={category.nombre}
                                            stackId="a"
                                            fill={COLORS[index % COLORS.length]}
                                            radius={index === expenseCategories.length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]}
                                        />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Resumen mensual rápido */}
                        <div className="bg-[oklch(0.11_0_0)] border border-border rounded-lg p-6">
                            <h3 className="text-lg font-semibold tracking-tight mb-6">Resumen mensual de gastos</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={expensesByMonth.map((m, i) => ({ mes: months[i], gastos: m.total }))}>
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
                                    <Bar dataKey="gastos" fill="#ef4444" radius={[8, 8, 0, 0]} name="Gastos" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Acordeones mensuales */}
                        <div className="space-y-3">
                            {expensesByMonth.map((monthData, index) => {
                                const isExpanded = expandedMonths.includes(index);
                                const hasTransactions = monthData.transactions.length > 0;

                                return (
                                    <div key={index} className="bg-[oklch(0.11_0_0)] border border-border rounded-lg overflow-hidden">
                                        <button
                                            onClick={() => toggleMonth(index)}
                                            className="w-full flex items-center justify-between p-4 hover:bg-foreground/5 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="font-semibold">{monthsFull[index]}</span>
                                                {!hasTransactions && <span className="text-xs text-muted-foreground">(Sin gastos)</span>}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-semibold">{monthData.total.toFixed(2)} €</span>
                                                {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                                            </div>
                                        </button>

                                        {isExpanded && hasTransactions && (
                                            <div className="border-t border-border p-4">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="border-b border-border/50">
                                                            <th className="text-left py-2 font-medium text-muted-foreground">Categoría</th>
                                                            <th className="text-right py-2 font-medium text-muted-foreground">Importe</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {monthData.transactions.map((item, idx) => (
                                                            <tr key={idx} className="border-b border-border/30">
                                                                <td className="py-2">{item.category}</td>
                                                                <td className="text-right py-2">{item.amount.toFixed(2)} €</td>
                                                            </tr>
                                                        ))}
                                                        <tr className="bg-foreground/5">
                                                            <td className="py-2 font-semibold">Total</td>
                                                            <td className="text-right py-2 font-semibold">{monthData.total.toFixed(2)} €</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
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
                </div>
            </main>
        </div>
    )
};
