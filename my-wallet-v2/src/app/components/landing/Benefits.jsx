import { Target, Sparkles, LineChart, Clock } from "lucide-react";

const benefits = [
    {
        icon: Target,
        title: "Toma decisiones informadas",
        description: "Con toda tu información financiera centralizada, podrás identificar oportunidades de ahorro, detectar gastos innecesarios y tomar decisiones más inteligentes sobre tu dinero."
    },
    {
        icon: Sparkles,
        title: "Simplifica tu vida financiera",
        description: "Olvídate de múltiples hojas de cálculo y aplicaciones dispersas. Todo lo que necesitas está en un solo lugar, accesible desde cualquier dispositivo."
    },
    {
        icon: LineChart,
        title: "Alcanza tus metas",
        description: "Establece objetivos financieros claros y monitorea tu progreso en tiempo real. Nuestra plataforma te ayuda a mantenerte enfocado y motivado hacia tus metas de ahorro e inversión."
    },
    {
        icon: Clock,
        title: "Ahorra tiempo",
        description: "Deja que la plataforma haga el trabajo pesado. Con categorización automática, recordatorios inteligentes y reportes instantáneos, dedicarás menos tiempo a la administración y más a vivir."
    }
];

export default function Benefits() {
    return (
        <section className="py-20 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl mb-4">
                        ¿Por qué usar nuestra plataforma?
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Más que una aplicación, es tu aliado para una vida financiera más saludable
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {benefits.map((benefit, index) => (
                        <div
                            key={index}
                            className="p-8 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors"
                        >
                            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                                <benefit.icon className="w-7 h-7 text-primary" />
                            </div>

                            <h3 className="mb-3">
                                {benefit.title}
                            </h3>

                            <p className="text-muted-foreground leading-relaxed">
                                {benefit.description}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-16 p-8 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="max-w-3xl mx-auto text-center">
                        <h3 className="mb-4 text-2xl">
                            Comienza gratis hoy
                        </h3>
                        <p className="text-muted-foreground text-lg mb-6">
                            No necesitas tarjeta de crédito. Regístrate en segundos y empieza a tomar el control de tus finanzas inmediatamente. Tendrás acceso completo a todas las funcionalidades desde el primer día.
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-primary rounded-full"></span>
                                Sin costos ocultos
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-primary rounded-full"></span>
                                Cancela cuando quieras
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-primary rounded-full"></span>
                                Soporte 24/7
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
