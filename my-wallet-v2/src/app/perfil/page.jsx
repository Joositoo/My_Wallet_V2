'use client';
import { useEffect, useState } from "react";
import { Eye, EyeOff, Check } from "lucide-react";
import Sidebar from "../components/Sidebar";
import MobileHeader from "../components/MobileHeader";

export default function Profile() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [name, setName] = useState("");
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState(name);
    const [emptyName, setEmptyName] = useState(false);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [nameSaved, setNameSaved] = useState(false);
    const [passwordSaved, setPasswordSaved] = useState(false);

    const [wrongPasswords, setWrongPasswords] = useState(false);
    const [emptyPassword, setEmptyPassword] = useState(false);

    useEffect(() => {
        async function getName() {
            try {
                const response = await fetch('/api/perfil');
                const data = await response.json();

                setName(data.nombre);
                setTempName(data.nombre);
            }
            catch (error) { console.log("Error al obtener el nombre: ", error); }
        }
        getName();
    }, []);

    async function handleSaveName() {
        if (!tempName || tempName.trim() === '') {
            setEmptyName(true);
            return; 
        }

        setEmptyName(false);
        setName(tempName);
        setIsEditingName(false);

        await fetch('/api/perfil/nombre', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: tempName }),
        });

        setNameSaved(true);
        setTimeout(() => setNameSaved(false), 3000);
    }

    function handleCancelEditName() {
        setTempName(name);
        setIsEditingName(false);
    }

    async function handlePasswordSubmit(e) {
        e.preventDefault();
        setEmptyPassword(false);
        setWrongPasswords(false);
        console.log(currentPassword, newPassword, confirmPassword);

        if (!currentPassword || !newPassword || !confirmPassword) {
            setEmptyPassword(true);
            return;
        }

        if (newPassword !== confirmPassword) {
            setWrongPasswords(true);
            return;
        }

        await fetch('/api/perfil/password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, newPassword }),
        });

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        setPasswordSaved(true);

        setTimeout(() => setPasswordSaved(false), 3000);
    }

    const passwordStrength =
        newPassword.length === 0
            ? 0
            : newPassword.length < 6
                ? 1
                : newPassword.length < 10
                    ? 2
                    : 3;

    const strengthLabel = ["", "Débil", "Moderada", "Fuerte"][passwordStrength];

    const strengthColor = [
        "",
        "bg-red-500",
        "bg-yellow-500",
        "bg-emerald-500",
    ][passwordStrength];

    return (
        <div className="min-h-screen bg-background text-foreground">
            <MobileHeader onMenuClick={() => setIsSidebarOpen(true)} />

            <Sidebar
                currentPage="perfil"
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <main className="lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8">
                <div className="max-w-3xl mx-auto space-y-8">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight mb-2">
                            Perfil
                        </h1>

                        {/*<p className="text-muted-foreground text-sm">
                            Hola, {name}
                        </p>*/}
                    </div>

                    {/* Información personal */}
                    <div className="bg-[oklch(0.11_0_0)] border border-border rounded-lg p-6">
                        <h2 className="text-lg font-semibold tracking-tight mb-4">
                            Información personal
                        </h2>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs uppercase tracking-widest text-muted-foreground">
                                    Nombre completo
                                </label>

                                {isEditingName ? (
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            value={tempName}
                                            onChange={(e) =>
                                                setTempName(e.target.value)
                                            }
                                            className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:border-foreground/40 transition-colors"
                                        />

                                        {emptyName && <p className="text-red-500 my-2">El nombre no puede quedar vacío.</p>}

                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleCancelEditName}
                                                className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-foreground/5 transition-colors hover:cursor-pointer"
                                            >
                                                Cancelar
                                            </button>

                                            <button
                                                onClick={handleSaveName}
                                                className="flex-1 bg-foreground text-background px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity hover:cursor-pointer"
                                            >
                                                Guardar cambios
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between p-4 bg-background border border-border rounded-lg">
                                        <span className="text-sm">{name}</span>

                                        <button
                                            onClick={() =>
                                                setIsEditingName(true)
                                            }
                                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            Editar
                                        </button>
                                    </div>
                                )}
                            </div>

                            {nameSaved && (
                                <div className="flex items-center gap-2 text-sm text-emerald-500 bg-emerald-500/10 px-4 py-2.5 rounded-lg">
                                    <Check className="w-4 h-4" />
                                    Nombre actualizado correctamente
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cambiar contraseña */}
                    <div className="bg-[oklch(0.11_0_0)] border border-border rounded-lg p-6">
                        <h2 className="text-lg font-semibold tracking-tight mb-4">
                            Cambiar contraseña
                        </h2>

                        <form
                            onSubmit={handlePasswordSubmit}
                            className="space-y-5"
                        >
                            {/* Contraseña actual */}
                            <div className="space-y-1.5">
                                <label className="text-xs uppercase tracking-widest text-muted-foreground">
                                    Contraseña actual
                                </label>

                                <div className="relative">
                                    <input
                                        type={
                                            showCurrentPassword
                                                ? "text"
                                                : "password"
                                        }
                                        value={currentPassword}
                                        onChange={(e) =>
                                            setCurrentPassword(e.target.value)
                                        }
                                        placeholder="••••••••"
                                        //required
                                        className="w-full bg-background border border-border rounded-lg px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/40 transition-colors"
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowCurrentPassword(
                                                !showCurrentPassword
                                            )
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showCurrentPassword ? (
                                            <EyeOff className="w-4 h-4 hover:cursor-pointer" />
                                        ) : (
                                            <Eye className="w-4 h-4 hover:cursor-pointer" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Nueva contraseña */}
                            <div className="space-y-1.5">
                                <label className="text-xs uppercase tracking-widest text-muted-foreground">
                                    Nueva contraseña
                                </label>

                                <div className="relative">
                                    <input
                                        type={
                                            showNewPassword
                                                ? "text"
                                                : "password"
                                        }
                                        value={newPassword}
                                        onChange={(e) =>
                                            setNewPassword(e.target.value)
                                        }
                                        placeholder="Mínimo 8 caracteres"
                                        //required
                                        //minLength={8}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/40 transition-colors"
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowNewPassword(
                                                !showNewPassword
                                            )
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showNewPassword ? (
                                            <EyeOff className="w-4 h-4 hover:cursor-pointer" />
                                        ) : (
                                            <Eye className="w-4 h-4 hover:cursor-pointer" />
                                        )}
                                    </button>
                                </div>

                                {newPassword.length > 0 && (
                                    <div className="space-y-1.5 pt-1">
                                        <div className="flex gap-1">
                                            {[1, 2, 3].map((level) => (
                                                <div
                                                    key={level}
                                                    className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${level <= passwordStrength
                                                        ? strengthColor
                                                        : "bg-border"
                                                        }`}
                                                />
                                            ))}
                                        </div>

                                        <p className="text-xs text-muted-foreground">
                                            Seguridad:{" "}
                                            <span className="text-foreground">
                                                {strengthLabel}
                                            </span>
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Confirmar contraseña */}
                            <div className="space-y-1.5">
                                <label className="text-xs uppercase tracking-widest text-muted-foreground">
                                    Confirmar nueva contraseña
                                </label>

                                <div className="relative">
                                    <input
                                        type={
                                            showConfirmPassword
                                                ? "text"
                                                : "password"
                                        }
                                        value={confirmPassword}
                                        onChange={(e) =>
                                            setConfirmPassword(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Repite la nueva contraseña"
                                        //required
                                        //minLength={8}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/40 transition-colors"
                                    />

                                    {wrongPasswords && <p className="text-red-500 my-5">Las contraseñas no coinciden.</p>}
                                    {emptyPassword && <p className="text-red-500 my-5">Rellene todos los campos.</p>}

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowConfirmPassword(
                                                !showConfirmPassword
                                            )
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="w-4 h-4 hover:cursor-pointer" />
                                        ) : (
                                            <Eye className="w-4 h-4 hover:cursor-pointer" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-foreground text-background px-4 py-3 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity hover:cursor-pointer"
                            >
                                Cambiar contraseña
                            </button>

                            {passwordSaved && (
                                <div className="flex items-center gap-2 text-sm text-emerald-500 bg-emerald-500/10 px-4 py-2.5 rounded-lg">
                                    <Check className="w-4 h-4" />
                                    Contraseña actualizada correctamente
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}