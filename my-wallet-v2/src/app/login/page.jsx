'use client';
import { useState } from "react";
import { ArrowRight, Eye, EyeOff, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function Login() {
    const router = useRouter()
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [emptyFields, setEmptyFields] = useState(false);
    const [incorrectCredentials, setIncorrectCredentials] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setEmptyFields(false);
        setIncorrectCredentials(false);
        
        if (!email || !password) {
            setEmptyFields(true);
            return;
        }
        setLoading(true);
        setTimeout(() => setLoading(false), 1500);

        const result = await signIn('credentials', {
            email,
            password,
            redirect: false,
        });

        if (result?.error) {
            setIncorrectCredentials(true);
            return;
        }
        
        router.push('/dashboard');
    }

    return (
        <div className="min-h-screen bg-background flex">
            {/* Left panel — decorative */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-[oklch(0.11_0_0)] border-r border-border">
                <button
                    onClick={() => router.push("/")}
                    className="flex items-center gap-2 text-foreground hover:text-muted-foreground transition-colors w-fit hover:cursor-pointer"
                >
                    <TrendingUp className="w-5 h-5" />
                    <span className="font-semibold tracking-tight">Finanzas</span>
                </button>

                <div className="space-y-6">
                    <div className="w-12 h-px bg-primary" />
                    <blockquote className="text-2xl font-light leading-relaxed text-foreground/80 tracking-tight">
                        &ldquo;El control financiero no es una restricción.&nbsp;
                        <span className="text-foreground font-normal">Es libertad.&rdquo;</span>
                    </blockquote>
                    <p className="text-sm text-muted-foreground">— Principio de gestión consciente</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: "Transacciones", value: "∞" },
                        { label: "Categorías", value: "50+" },
                        { label: "Reportes", value: "12" },
                    ].map((stat) => (
                        <div key={stat.label} className="space-y-1">
                            <p className="text-xl font-semibold tracking-tight">{stat.value}</p>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right panel — form */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
                {/* Mobile logo */}
                <button
                    onClick={() => router.push("/")}
                    className="lg:hidden flex items-center gap-2 text-foreground mb-12 hover:cursor-pointer"
                >
                    <TrendingUp className="w-5 h-5" />
                    <span className="font-semibold tracking-tight">Finanzas</span>
                </button>

                <div className="w-full max-w-sm space-y-8">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-semibold tracking-tight">Iniciar sesión</h1>
                        <p className="text-muted-foreground text-sm">Accede a tu panel financiero</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs uppercase tracking-widest text-muted-foreground">
                                Correo electrónico
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tu@correo.com"
                                //required
                                className="w-full bg-[oklch(0.11_0_0)] border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/40 transition-colors"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs uppercase tracking-widest text-muted-foreground">
                                Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    //required
                                    className="w-full bg-[oklch(0.11_0_0)] border border-border rounded-lg px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/40 transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>

                            { emptyFields && <p className="text-red-500">Rellene todos los campos.</p>}
                            { incorrectCredentials && <p className="text-red-500">Credenciales incorrectas.</p>}
                            <div className="flex justify-end pt-1">
                                

                                {/*<button
                                    type="button"
                                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    ¿Olvidaste tu contraseña?
                                </button>*/}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-foreground text-background py-3 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 hover:cursor-pointer"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                                    Accediendo…
                                </span>
                            ) : (
                                <>
                                    Entrar
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-sm text-center text-muted-foreground">
                        ¿No tienes cuenta?{" "}
                        <button
                            onClick={() => router.push("/register")}
                            className="text-foreground hover:underline underline-offset-4 transition-all hover:cursor-pointer"
                        >
                            Regístrate
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
