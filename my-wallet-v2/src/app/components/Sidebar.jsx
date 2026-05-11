import {
    TrendingUp,
    LayoutDashboard,
    Tags,
    User,
    LogOut,
    ArrowLeftRight,
    CreditCard,
    TrendingUp as Investment,
    Receipt,
    X,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function Sidebar({
    currentPage,
    isOpen,
    onClose,
}) {
    const router = useRouter()
    const menuItems = [
        {
            id: "dashboard",
            label: "Dashboard",
            icon: LayoutDashboard,
        },
        {
            id: "ingresos-gastos",
            label: "Ingresos y Gastos",
            icon: ArrowLeftRight,
        },
        {
            id: "suscripciones",
            label: "Suscripciones",
            icon: Receipt,
        },
        {
            id: "inversiones",
            label: "Inversiones",
            icon: Investment,
        },
        {
            id: "deudas",
            label: "Deudas",
            icon: CreditCard,
        },
        {
            id: "categories",
            label: "Categorías",
            icon: Tags,
        },
        {
            id: "perfil",
            label: "perfil",
            icon: User,
        },
    ];

    function handleNavigate(page) {
        router.push(page);
        
        if (onClose) {
        onClose();
    }
    }

    return (
        <>
            {/* Overlay mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed left-0 top-0 h-full w-64 bg-[oklch(0.11_0_0)] border-r border-border p-6 flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                {/* Botón cerrar en mobile */}
                <button
                    onClick={onClose}
                    className="lg:hidden absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2 mb-12">
                    <TrendingUp className="w-6 h-6 text-primary" />
                    <span className="font-semibold tracking-tight text-lg">
                        Finanzas
                    </span>
                </div>

                <nav className="flex-1 space-y-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentPage === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => handleNavigate(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:cursor-pointer ${isActive
                                        ? "bg-foreground/5 text-foreground"
                                        : "hover:bg-foreground/5 text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                <Icon className="w-5 h-5" />

                                <span className="text-sm font-medium">
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </nav>

                <button
                    onClick={() => handleNavigate("/")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <LogOut className="w-5 h-5" />

                    <span className="text-sm font-medium">
                        Cerrar sesión
                    </span>
                </button>
            </aside>
        </>
    );
}