'use client';
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import MobileHeader from "../components/MobileHeader";
import { Plus, Pencil, Trash2, X, ChevronDown, ChevronUp, CreditCard, Calendar, FileText } from "lucide-react";

const initialSuscripciones = [];

export default function Suscripciones({ onNavigate }) {
    const [refresh, setRefresh] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [suscripciones, setSuscripciones] = useState(initialSuscripciones);
    const [expandedIds, setExpandedIds] = useState([]);

    // Modal suscripción
    const [isSuscModalOpen, setIsSuscModalOpen] = useState(false);
    const [editingSusc, setEditingSusc] = useState(null);
    const [suscNombre, setSuscNombre] = useState("");

    // Modal pago
    const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);
    const [editingPago, setEditingPago] = useState(null);
    const [targetSuscId, setTargetSuscId] = useState(null);
    const [pagoForm, setPagoForm] = useState({ cantidad: "", fecha: new Date().toISOString().split("T")[0], nota: "" });

    // Confirm delete
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Year filter
    const years = [2024, 2025, 2026, 2027];
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    function pagosForYear(pagos) {
        if (selectedYear === "all") return pagos;
        return pagos.filter(p => new Date(p.fecha).getFullYear() === selectedYear);
    }

    const totalGastado = suscripciones.reduce((sum, s) => sum + pagosForYear(s.pagos).reduce((ps, p) => ps + p.cantidad, 0), 0);
    const totalPagos = suscripciones.reduce((sum, s) => sum + pagosForYear(s.pagos).length, 0);

    function toggleExpand(id) {
        setExpandedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    }

    useEffect(() => {
        async function fetchSusc() {
            const res = await fetch('/api/suscripciones/pagos?year=' +selectedYear);
            const data = await res.json();
            setSuscripciones(data);
        }
        fetchSusc();
    }, [refresh, selectedYear]);

    // ── Suscripción modal ──
    function openNewSusc() {
        setEditingSusc(null);
        setSuscNombre("");
        setIsSuscModalOpen(true);
    }

    function openEditSusc(s) {
        setEditingSusc(s);
        setSuscNombre(s.nombre);
        setIsSuscModalOpen(true);
    }

    async function saveSusc() {
        const nombre = suscNombre.trim();
        if (!nombre) return;
        if (editingSusc) {
            console.log(editingSusc);
            await fetch('/api/suscripciones/' +editingSusc.id, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre }),
            });
        } else {
            await fetch("/api/suscripciones", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: nombre
                }),
            });
        }
        setRefresh(prev => !prev);
        setIsSuscModalOpen(false);
    }

    async function deleteSusc(id) {
        await fetch('/api/suscripciones/' +id, { method: 'DELETE' });
        setRefresh(prev => !prev);
        setDeleteConfirm(null);
    }

    // ── Pago modal ──
    function openNewPago(suscId) {
        setEditingPago(null);
        setTargetSuscId(suscId);
        setPagoForm({ cantidad: "", fecha: new Date().toISOString().split("T")[0], nota: "" });
        setIsPagoModalOpen(true);
    }

    function openEditPago(suscId, pago) {
        setEditingPago({ suscId, pago });
        setTargetSuscId(suscId);
        setPagoForm({ cantidad: pago.cantidad.toString(), fecha: pago.fecha, nota: pago.nota });
        setIsPagoModalOpen(true);
    }

    async function savePago() {
        const cantidad = parseFloat(pagoForm.cantidad);
        if (!pagoForm.fecha || isNaN(cantidad) || cantidad <= 0) return;
        if (editingPago) {
            await fetch('/api/suscripciones/pagos/' +editingPago.pago.id, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cantidad: cantidad,
                    fecha: pagoForm.fecha,
                    nota: pagoForm.nota
                }),
            })
        } else if (targetSuscId) {
            await fetch("/api/suscripciones/pagos", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    suscId: targetSuscId,
                    cantidad: cantidad,
                    fecha: pagoForm.fecha,
                    nota: pagoForm.nota
                }),
            });
        }
        setRefresh(prev => !prev);
        setIsPagoModalOpen(false);
    }

async function deletePago(suscId, pagoId) {
    await fetch(`/api/suscripciones/pagos/${pagoId}?suscId=${suscId}`, { method: 'DELETE' });
    setRefresh(prev => !prev);
    setDeleteConfirm(null);
}

    function formatAmount(n) {
        return n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
    }

    function formatDate(d) {
        return new Date(d + "T00:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <MobileHeader onMenuClick={() => setIsSidebarOpen(true)} />
            <Sidebar currentPage="suscripciones" onNavigate={onNavigate} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8">
                <div className="max-w-4xl mx-auto space-y-6">

                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight mb-1">Suscripciones</h1>
                            <p className="text-muted-foreground text-sm">Controla tus servicios y pagos recurrentes</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-2">
                                <label className="text-xs uppercase tracking-widest text-muted-foreground hidden sm:block">Año:</label>
                                <select
                                    value={selectedYear}
                                    onChange={e => setSelectedYear(e.target.value === "all" ? "all" : parseInt(e.target.value))}
                                    className="bg-secondary/40 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                                >
                                    {/*<option value="all">Todos</option>*/}
                                    {years.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={openNewSusc}
                                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                            >
                                <Plus size={16} />
                                <span className="hidden sm:inline">Nueva suscripción</span>
                                <span className="sm:hidden">Nueva</span>
                            </button>
                        </div>
                    </div>

                    {/* Summary card */}
                    <div className="bg-secondary/40 border border-border rounded-xl p-5 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <CreditCard size={20} className="text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-0.5">
                                Total gastado{selectedYear !== "all" ? ` en ${selectedYear}` : " (histórico)"}
                            </p>
                            <p className="text-2xl font-semibold tracking-tight">{formatAmount(totalGastado)}</p>
                        </div>
                        <div className="ml-auto text-right">
                            <p className="text-xs text-muted-foreground mb-0.5">{suscripciones.length} suscripción{suscripciones.length !== 1 ? "es" : ""}</p>
                            <p className="text-xs text-muted-foreground">{totalPagos} pago{totalPagos !== 1 ? "s" : ""} registrado{totalPagos !== 1 ? "s" : ""}</p>
                        </div>
                    </div>

                    {/* Empty state */}
                    {suscripciones.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
                                <CreditCard size={24} className="text-muted-foreground" />
                            </div>
                            <h3 className="font-medium mb-1">Sin suscripciones todavía</h3>
                            <p className="text-sm text-muted-foreground max-w-xs">Añade tu primera suscripción para empezar a registrar los pagos recurrentes.</p>
                            <button
                                onClick={openNewSusc}
                                className="mt-5 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                            >
                                <Plus size={16} />
                                Nueva suscripción
                            </button>
                        </div>
                    )}

                    {/* Suscription list */}
                    <div className="space-y-3">
                        {suscripciones.map(susc => {
                            const isExpanded = expandedIds.includes(susc.id);
                            const filteredPagos = pagosForYear(susc.pagos);
                            const totalSusc = filteredPagos.reduce((s, p) => s + p.cantidad, 0);
                            return (
                                <div key={susc.id} className="border border-border rounded-xl overflow-hidden bg-card">
                                    {/* Header row */}
                                    <div
                                        className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none hover:bg-muted/30 transition-colors"
                                        onClick={() => toggleExpand(susc.id)}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm">{susc.nombre}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{filteredPagos.length} pago{filteredPagos.length !== 1 ? "s" : ""}</p>
                                        </div>
                                        <span className="text-sm font-semibold tracking-tight shrink-0">{formatAmount(totalSusc)}</span>
                                        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={() => openEditSusc(susc)}
                                                className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                                title="Editar suscripción"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm({ type: "susc", id: susc.id })}
                                                className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-destructive-foreground"
                                                title="Eliminar suscripción"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <span className="text-muted-foreground shrink-0">
                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </span>
                                    </div>

                                    {/* Expanded body */}
                                    {isExpanded && (
                                        <div className="border-t border-border">
                                            {filteredPagos.length === 0 ? (
                                                <div className="px-5 py-6 text-center">
                                                    <p className="text-sm text-muted-foreground">
                                                        {susc.pagos.length === 0 ? "No hay pagos registrados aún." : `Sin pagos en ${selectedYear}.`}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead>
                                                            <tr className="border-b border-border bg-muted/20">
                                                                <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Fecha</th>
                                                                <th className="text-right px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Cantidad</th>
                                                                <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Nota</th>
                                                                <th className="px-5 py-2.5 w-20"></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {filteredPagos
                                                                .slice()
                                                                .sort((a, b) => b.fecha.localeCompare(a.fecha))
                                                                .map((pago, i) => (
                                                                    <tr key={pago.id} className={`border-b border-border/50 last:border-0 ${i % 2 === 0 ? "" : "bg-muted/90"}`}>
                                                                        <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                                                                            <span className="flex items-center gap-1.5">
                                                                                <Calendar size={12} className="shrink-0" />
                                                                                {formatDate(pago.fecha)}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-5 py-3 text-right font-medium tabular-nums">{formatAmount(pago.cantidad)}</td>
                                                                        <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell">
                                                                            {pago.nota ? (
                                                                                <span className="flex items-center gap-1.5">
                                                                                    <FileText size={12} className="shrink-0" />
                                                                                    {pago.nota}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-muted-foreground/40">—</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-5 py-3">
                                                                            <div className="flex items-center justify-end gap-1">
                                                                                <button
                                                                                    onClick={() => openEditPago(susc.id, pago)}
                                                                                    className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                                                                    title="Editar pago"
                                                                                >
                                                                                    <Pencil size={13} />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => setDeleteConfirm({ type: "pago", suscId: susc.id, pagoId: pago.id })}
                                                                                    className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-destructive-foreground"
                                                                                    title="Eliminar pago"
                                                                                >
                                                                                    <Trash2 size={13} />
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                            <div className="px-5 py-4 border-t border-border/50">
                                                <button
                                                    onClick={() => openNewPago(susc.id)}
                                                    className="flex items-center gap-1.5 text-sm bg-muted/50 hover:bg-muted border border-border rounded-lg px-3 py-2 transition-colors"
                                                >
                                                    <Plus size={14} />
                                                    Añadir pago
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>

            {/* ── Modal: Nueva / Editar suscripción ── */}
            {isSuscModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSuscModalOpen(false)} />
                    <div className="relative bg-card border border-border rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-base font-semibold">{editingSusc ? "Editar suscripción" : "Nueva suscripción"}</h2>
                            <button onClick={() => setIsSuscModalOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Nombre</label>
                                <input
                                    type="text"
                                    value={suscNombre}
                                    onChange={e => setSuscNombre(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && saveSusc()}
                                    placeholder="Ej. Netflix, Spotify..."
                                    autoFocus
                                    className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 mt-6">
                            <button
                                onClick={() => setIsSuscModalOpen(false)}
                                className="flex-1 border border-border rounded-lg py-2.5 text-sm hover:bg-muted/40 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={saveSusc}
                                disabled={!suscNombre.trim()}
                                className="flex-1 bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {editingSusc ? "Guardar cambios" : "Crear suscripción"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal: Añadir / Editar pago ── */}
            {isPagoModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsPagoModalOpen(false)} />
                    <div className="relative bg-card border border-border rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-base font-semibold">{editingPago ? "Editar pago" : "Añadir pago"}</h2>
                            <button onClick={() => setIsPagoModalOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Cantidad (€)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={pagoForm.cantidad}
                                    onChange={e => setPagoForm(f => ({ ...f, cantidad: e.target.value }))}
                                    placeholder="0.00"
                                    autoFocus
                                    className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Fecha</label>
                                <input
                                    type="date"
                                    value={pagoForm.fecha}
                                    onChange={e => setPagoForm(f => ({ ...f, fecha: e.target.value }))}
                                    className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">
                                    Nota <span className="text-muted-foreground font-normal">(opcional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={pagoForm.nota}
                                    onChange={e => setPagoForm(f => ({ ...f, nota: e.target.value }))}
                                    placeholder="Comentario sobre este pago..."
                                    className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 mt-6">
                            <button
                                onClick={() => setIsPagoModalOpen(false)}
                                className="flex-1 border border-border rounded-lg py-2.5 text-sm hover:bg-muted/40 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={savePago}
                                disabled={!pagoForm.cantidad || !pagoForm.fecha || parseFloat(pagoForm.cantidad) <= 0}
                                className="flex-1 bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {editingPago ? "Guardar cambios" : "Añadir pago"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal: Confirmar eliminación ── */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
                    <div className="relative bg-card border border-border rounded-2xl w-full max-w-xs p-6 shadow-2xl text-center">
                        <div className="w-11 h-11 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={18} className="text-destructive-foreground" />
                        </div>
                        <h2 className="text-base font-semibold mb-1">
                            {deleteConfirm.type === "susc" ? "Eliminar suscripción" : "Eliminar pago"}
                        </h2>
                        <p className="text-sm text-muted-foreground mb-6">
                            {deleteConfirm.type === "susc"
                                ? "Se eliminarán también todos sus pagos. Esta acción no se puede deshacer."
                                : "Este pago se eliminará permanentemente."}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 border border-border rounded-lg py-2.5 text-sm hover:bg-muted/40 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    if (deleteConfirm.type === "susc") deleteSusc(deleteConfirm.id);
                                    else deletePago(deleteConfirm.suscId, deleteConfirm.pagoId);
                                }}
                                className="flex-1 bg-destructive/80 text-destructive-foreground rounded-lg py-2.5 text-sm font-medium hover:bg-destructive transition-colors"
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
