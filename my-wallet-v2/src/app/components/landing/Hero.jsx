import { ArrowRight } from "lucide-react";

export default function Hero() {
    return (
        <section className=" flex flex-col items-center justify-center px-6 py-20">
            <div className="max-w-4xl mx-auto text-center space-y-8">
                <h1 className="text-5xl md:text-6xl tracking-tight">
                    Controla tus finanzas en un solo lugar
                </h1>

                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Gestiona tus transacciones, ingresos, gastos, deudas, suscripciones e inversiones de forma simple y eficiente
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <button className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 hover:cursor-pointer">
                        Comenzar ahora
                        <ArrowRight className="w-5 h-5" />
                    </button>

                    <button className="px-8 py-3 border border-border rounded-lg hover:bg-accent transition-colors  hover:cursor-pointer">
                        Iniciar sesión
                    </button>
                </div>
            </div>
        </section>
    );
}
