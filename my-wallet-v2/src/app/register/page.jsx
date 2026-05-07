'use client'
import { useState } from "react";
import { ArrowRight, Eye, EyeOff, TrendingUp, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function Register() {
    const router = useRouter();
    const [nombre, setNombre] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [emptyFields, setEmptyFields] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState(false);

    const strength =
        password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
    const strengthLabel = ["", "Débil", "Moderada", "Fuerte"][strength];
    const strengthColor = ["", "bg-red-500", "bg-yellow-500", "bg-emerald-500"][strength];

    async function handleSubmit (e) {
        e.preventDefault();
        setEmptyFields(false);
        setRegisteredEmail(false);
        
        if (!nombre || !email || !password) {
            setEmptyFields(true);
            return;
        }

        setLoading(true);
        setTimeout(() => setLoading(false), 1500);

        const res = await fetch("/api/register", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, email, password }),
        });

        const data = await res.json();

        if (res.status == 409 || res.status == 500) {
            setRegisteredEmail(true);
            return;
        }
        
        const loginRes = await signIn("credentials", {
            redirect: false,
            email,
            password,
        });

        if (loginRes?.ok) router.push("/dashboard");

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
                    <p className="text-2xl font-light leading-relaxed text-foreground/80 tracking-tight">
                        Comienza tu camino hacia la{" "}
                        <span className="text-foreground font-normal">claridad financiera</span> hoy mismo.
                    </p>

                    <ul className="space-y-3">
                        {[
                            "Registra ingresos y gastos sin fricción",
                            "Controla deudas y suscripciones activas",
                            "Visualiza el crecimiento de tus inversiones",
                        ].map((item) => (
                            <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                                <Check className="w-4 h-4 mt-0.5 text-foreground/60 shrink-0" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="text-xs text-muted-foreground/50 leading-relaxed">
                    Tus datos se almacenan de forma segura. Sin compromisos, sin tarjeta requerida.
                </p>
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
                        <h1 className="text-3xl font-semibold tracking-tight">Crear cuenta</h1>
                        <p className="text-muted-foreground text-sm">Empieza a gestionar tus finanzas</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs uppercase tracking-widest text-muted-foreground">
                                Nombre completo
                            </label>
                            <input
                                type="text"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                placeholder="Ana García"
                                //required
                                className="w-full bg-[oklch(0.11_0_0)] border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/40 transition-colors"
                            />
                        </div>

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
                                    placeholder="Mínimo 8 caracteres"
                                    //required
                                    //minLength={8}
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

                            {password.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                    <div className="flex gap-1">
                                        {[1, 2, 3].map((level) => (
                                            <div
                                                key={level}
                                                className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${level <= strength ? strengthColor : "bg-border"
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Seguridad: <span className="text-foreground">{strengthLabel}</span>
                                    </p>
                                </div>
                            )}
                        </div>

                        { emptyFields && <p className="text-red-500">Rellene todos los campos.</p>}
                        { registeredEmail && <p className="text-red-500">Ha ocurrido un error al crear la cuenta.</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-foreground text-background py-3 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 hover:cursor-pointer"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                                    Creando cuenta…
                                </span>
                            ) : (
                                <>
                                    Crear cuenta
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-sm text-center text-muted-foreground">
                        ¿Ya tienes cuenta?{" "}
                        <button
                            onClick={() => router.push("/login")}
                            className="text-foreground hover:underline underline-offset-4 transition-all hover:cursor-pointer"
                        >
                            Inicia sesión
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
