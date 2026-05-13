'use client';
import { useEffect, useState } from "react";
import {
    Plus,
    Pencil,
    Trash2,
    X,
    TrendingDown,
    TrendingUp as TrendingUpIcon,
    Tags,
    DollarSign,
    ShoppingCart,
    Home,
    Car,
    Coffee,
    Briefcase,
    Gift,
    Heart,
    Zap,
    AlertTriangle,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import MobileHeader from "../components/MobileHeader";

const availableIcons = [
    { name: "DollarSign", component: DollarSign },
    { name: "TrendingUpIcon", component: TrendingUpIcon },
    { name: "Briefcase", component: Briefcase },
    { name: "Gift", component: Gift },
    { name: "ShoppingCart", component: ShoppingCart },
    { name: "Coffee", component: Coffee },
    { name: "Home", component: Home },
    { name: "Car", component: Car },
    { name: "Heart", component: Heart },
    { name: "Zap", component: Zap },
];

export default function Categories({ onNavigate }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [categories, setCategories] = useState([]);

    const [refresh, setRefresh] = useState(false);

    const [emptyName, setEmptyName] = useState(false);

    useEffect(() => {
        async function fetchCategorias() {
            const res = await fetch('/api/categorias');
            const data = await res.json();

            setCategories(data);
        }

        fetchCategorias();
    }, [refresh]);

    const [isModalOpen, setIsModalOpen] = useState(false);

    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        nombre: "",
        tipo: "ingreso",
        icono: "DollarSign",
    });

    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const ingresoCategories = categories.filter(
        (cat) => cat.tipo === "ingreso"
    );

    const gastoCategories = categories.filter(
        (cat) => cat.tipo === "gasto"
    );

    function handleOpenModal(category) {
        if (category) {
            setEditingId(category.id);

            setFormData({
                nombre: category.nombre,
                tipo: category.tipo,
                icono: category.icono,
            });
        } else {
            setEditingId(null);

            setFormData({
                nombre: "",
                tipo: "ingreso",
                icono: "DollarSign",
            });
        }

        setIsModalOpen(true);
    }

    function handleCloseModal() {
        setIsModalOpen(false);
        setEmptyName(false);
        setEditingId(null);

        setFormData({
            nombre: "",
            tipo: "ingreso",
            icono: "DollarSign",
        });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setEmptyName(false);

        if (!formData.nombre) {
                setEmptyName(true);
                return;
            }

        if (editingId) {
            await fetch(`/api/categorias/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
        } else {
            const newCategory = {
                nombre: formData.nombre,
                tipo: formData.tipo,
                icono: formData.icono,
            };

            await fetch('/api/categorias', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCategory),
            });
        }

        setRefresh(prev => !prev);
        handleCloseModal();
    }

    function handleDeleteClick(id) {
        setDeleteConfirmId(id);
    }

    async function handleConfirmDelete() {
        await fetch(`/api/categorias/${deleteConfirmId}`, { method: 'DELETE' });
        setRefresh(prev => !prev);
        setDeleteConfirmId(null);
    }

    function handleCancelDelete() {
        setDeleteConfirmId(null);
    }

    function getIconComponent(iconName) {
        const icon = availableIcons.find((i) => i.name === iconName);

        return icon ? icon.component : DollarSign;
    }

    function renderCategorySection(title, cats, titleIcon) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    {titleIcon}

                    <h2 className="text-lg font-semibold tracking-tight">
                        {title}
                    </h2>

                    <span className="text-sm text-muted-foreground">
                        ({cats.length})
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cats.map((category) => {
                        const IconComponent = getIconComponent(category.icono);

                        return (
                            <div
                                key={category.id}
                                className="bg-[oklch(0.11_0_0)] border border-border rounded-lg p-4 flex items-center justify-between group hover:border-foreground/20 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-foreground/5 flex items-center justify-center">
                                        <IconComponent className="w-5 h-5 text-foreground" />
                                    </div>

                                    <span className="text-sm font-medium">
                                        {category.nombre}
                                    </span>
                                </div>

                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleOpenModal(category)}
                                        className="p-1.5 hover:bg-foreground/5 rounded text-muted-foreground hover:text-foreground transition-colors hover:cursor-pointer"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>

                                    <button
                                        onClick={() => handleDeleteClick(category.id)}
                                        className="p-1.5 hover:bg-foreground/5 rounded text-muted-foreground hover:text-red-500 transition-colors hover:cursor-pointer"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {cats.length === 0 && (
                        <div className="col-span-full text-center py-8">
                            <Tags className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />

                            <p className="text-muted-foreground text-sm">
                                No hay categorías aún
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <MobileHeader
                onMenuClick={() => setIsSidebarOpen(true)}
            />

            <Sidebar
                currentPage="categories"
                onNavigate={onNavigate}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <main className="lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight mb-2">
                                Categorías
                            </h1>

                            <p className="text-muted-foreground text-sm">
                                Organiza tus transacciones con categorías
                                personalizadas
                            </p>
                        </div>

                        <button
                            onClick={() => handleOpenModal()}
                            className="flex items-center gap-2 bg-foreground text-background px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity hover:cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            Nueva categoría
                        </button>
                    </div>

                    <div className="space-y-8">
                        {renderCategorySection(
                            "Ingresos",
                            ingresoCategories,
                            <TrendingUpIcon className="w-5 h-5 text-emerald-500" />
                        )}

                        {renderCategorySection(
                            "Gastos",
                            gastoCategories,
                            <TrendingDown className="w-5 h-5 text-red-500" />
                        )}
                    </div>
                </div>
            </main>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[oklch(0.11_0_0)] border border-border rounded-lg w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold tracking-tight">
                                {editingId
                                    ? "Editar categoría"
                                    : "Nueva categoría"}
                            </h2>

                            <button
                                onClick={handleCloseModal}
                                className="text-muted-foreground hover:text-foreground transition-colors hover:cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-5"
                        >
                            <div className="space-y-1.5">
                                <label className="text-xs uppercase tracking-widest text-muted-foreground">
                                    Nombre de la categoría
                                </label>

                                <input
                                    type="text"
                                    value={formData.nombre}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            nombre: e.target.value,
                                        })
                                    }
                                    placeholder="Ej: Salario, Alimentación..."
                                    //required
                                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/40 transition-colors"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs uppercase tracking-widest text-muted-foreground">
                                    Tipo
                                </label>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setFormData({
                                                ...formData,
                                                tipo: "ingreso",
                                            })
                                        }
                                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all hover:cursor-pointer ${formData.tipo === "ingreso"
                                            ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-500"
                                            : "bg-background border-border text-muted-foreground hover:border-foreground/40"
                                            }`}
                                    >
                                        <TrendingUpIcon className="w-4 h-4" />

                                        <span className="text-sm font-medium">
                                            Ingreso
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setFormData({
                                                ...formData,
                                                tipo: "gasto",
                                            })
                                        }
                                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all hover:cursor-pointer ${formData.tipo === "gasto"
                                            ? "bg-red-500/10 border-red-500/50 text-red-500"
                                            : "bg-background border-border text-muted-foreground hover:border-foreground/40"
                                            }`}
                                    >
                                        <TrendingDown className="w-4 h-4" />

                                        <span className="text-sm font-medium">
                                            Gasto
                                        </span>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs uppercase tracking-widest text-muted-foreground">
                                    Icono
                                </label>

                                <div className="grid grid-cols-5 gap-2 mt-4">
                                    {availableIcons.map((icon) => {
                                        const IconComponent = icon.component;

                                        return (
                                            <button
                                                key={icon.name}
                                                type="button"
                                                onClick={() =>
                                                    setFormData({
                                                        ...formData,
                                                        icono: icon.name,
                                                    })
                                                }
                                                className={`w-full aspect-square rounded-lg flex items-center justify-center transition-all hover:cursor-pointer ${formData.icono === icon.name
                                                    ? "bg-foreground/10 ring-2 ring-foreground ring-offset-2 ring-offset-[oklch(0.11_0_0)] scale-110"
                                                    : "bg-foreground/5 hover:bg-foreground/10 hover:scale-105"
                                                    }`}
                                            >
                                                <IconComponent className="w-5 h-5" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {emptyName && <p className="text-red-500 my-2">El nombre no puede quedar vacío.</p>}

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
                                    {editingId
                                        ? "Guardar cambios"
                                        : "Crear categoría"}
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
                                    ¿Eliminar categoría?
                                </h2>

                                <p className="text-sm text-muted-foreground">
                                    Esta acción no se puede deshacer. La categoría
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