import { Wallet, TrendingDown, CreditCard, RefreshCw, TrendingUp, BarChart3 } from "lucide-react";

const features = [
    {
        icon: Wallet,
        title: "Transacciones diarias",
        description: "Registra y organiza todos tus ingresos y gastos del día a día"
    },
    {
        icon: TrendingDown,
        title: "Control de deudas",
        description: "Visualiza y gestiona las deudas que estás pagando actualmente"
    },
    {
        icon: CreditCard,
        title: "Suscripciones",
        description: "Mantén un seguimiento de todos tus servicios de suscripción y pagos recurrentes"
    },
    {
        icon: TrendingUp,
        title: "Inversiones",
        description: "Monitorea cuánto tienes invertido y el rendimiento de tus inversiones"
    },
    {
        icon: BarChart3,
        title: "Reportes visuales",
        description: "Gráficos claros que te ayudan a entender tu situación financiera"
    },
    {
        icon: RefreshCw,
        title: "Actualización en tiempo real",
        description: "Tus datos siempre sincronizados y disponibles cuando los necesites"
    }
];

export default function Features() {
    return (
        <section className="px-6 py-6">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl mb-4">
                        Todo lo que necesitas para gestionar tu dinero
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Herramientas diseñadas para darte control total sobre tus finanzas personales
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="p-6 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                        >
                            <feature.icon className="w-12 h-12 mb-4 text-primary" />
                            <h3 className="mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-muted-foreground">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
