import { Receipt, Calculator, Bell, PieChart, Calendar, Shield } from "lucide-react";

const detailedFeatures = [
    {
        icon: Receipt,
        title: "Gestión completa de transacciones",
        features: [
            "Añade conceptos personalizados para cada transacción",
            "Categoriza automáticamente tus ingresos y gastos",
            "Filtra y busca transacciones por fecha, categoría o monto",
            "Adjunta notas y recibos a tus movimientos",
            "Visualiza patrones de gasto mensuales y anuales"
        ]
    },
    {
        icon: Calculator,
        title: "Control inteligente de deudas",
        features: [
            "Registra todas tus deudas activas en un solo lugar",
            "Programa recordatorios de pagos próximos",
            "Calcula intereses y visualiza el progreso de pago",
            "Establece metas de liquidación de deudas",
            "Recibe alertas cuando se acercan fechas de vencimiento"
        ]
    },
    {
        icon: Bell,
        title: "Gestión de suscripciones",
        features: [
            "Lista completa de todas tus suscripciones activas",
            "Recordatorios antes de cada renovación",
            "Calcula el gasto total mensual y anual en servicios",
            "Identifica suscripciones que no estás usando",
            "Agrupa suscripciones por categoría (streaming, software, etc.)"
        ]
    },
    {
        icon: PieChart,
        title: "Seguimiento de inversiones",
        features: [
            "Registra tus inversiones en diferentes instrumentos",
            "Visualiza el valor total de tu portafolio",
            "Seguimiento de rendimiento por tipo de inversión",
            "Calcula retornos y ganancias/pérdidas",
            "Diversifica y balancea tu cartera de inversión"
        ]
    },
    {
        icon: Calendar,
        title: "Planificación financiera",
        features: [
            "Crea presupuestos mensuales personalizados",
            "Establece objetivos de ahorro a corto y largo plazo",
            "Proyecta tu situación financiera futura",
            "Recibe recomendaciones basadas en tus hábitos",
            "Configura alertas cuando excedas tu presupuesto"
        ]
    },
    {
        icon: Shield,
        title: "Seguridad y privacidad",
        features: [
            "Tus datos están encriptados de extremo a extremo",
            "Acceso seguro con autenticación de dos factores",
            "Backups automáticos de toda tu información",
            "Control total sobre tus datos personales",
            "Exporta tu información cuando quieras"
        ]
    }
];

export default function DetailedFeatures() {
    return (
        <section className="py-20 px-6 bg-accent/30">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl mb-4">
                        Funcionalidades en detalle
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Cada herramienta ha sido diseñada pensando en ofrecerte el máximo control y visibilidad sobre tu economía personal
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {detailedFeatures.map((section, index) => (
                        <div
                            key={index}
                            className="p-8 rounded-lg border border-border bg-card"
                        >
                            <div className="flex items-start gap-4 mb-6">
                                <div className="p-3 rounded-lg bg-primary/10">
                                    <section.icon className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="pt-2">
                                    {section.title}
                                </h3>
                            </div>

                            <ul className="space-y-3">
                                {section.features.map((feature, featureIndex) => (
                                    <li
                                        key={featureIndex}
                                        className="flex items-start gap-3 text-muted-foreground"
                                    >
                                        <span className="text-primary mt-1.5 shrink-0">•</span>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
