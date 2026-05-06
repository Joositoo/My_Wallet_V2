import { ArrowRight, Mail } from "lucide-react";

export default function CTA() {
    return (
        <section className="py-20 px-6 bg-accent/30">
            <div className="max-w-4xl mx-auto text-center space-y-8">
                <h2 className="text-4xl md:text-5xl">
                    ¿Listo para transformar tus finanzas?
                </h2>

                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Únete a miles de usuarios que ya están tomando el control de su economía personal
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <button className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 hover:cursor-pointer">
                        Crear cuenta gratis
                        <ArrowRight className="w-5 h-5" />
                    </button>

                    <button className="px-8 py-3 border border-border rounded-lg hover:bg-accent transition-colors flex items-center justify-center gap-2 hover:cursor-pointer">
                        <Mail className="w-5 h-5" />
                        Contáctanos
                    </button>
                </div>

                <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-muted-foreground">
                    <div className="text-center">
                        <div className="text-3xl mb-1 text-foreground">10,000+</div>
                        <div>Usuarios activos</div>
                    </div>
                    <div className="hidden sm:block w-px h-12 bg-border"></div>
                    <div className="text-center">
                        <div className="text-3xl mb-1 text-foreground">$2M+</div>
                        <div>En transacciones gestionadas</div>
                    </div>
                    <div className="hidden sm:block w-px h-12 bg-border"></div>
                    <div className="text-center">
                        <div className="text-3xl mb-1 text-foreground">4.9/5</div>
                        <div>Valoración de usuarios</div>
                    </div>
                </div>
            </div>
        </section>
    );
}
