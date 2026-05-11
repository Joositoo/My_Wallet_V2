'use client';
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import MobileHeader from "../components/MobileHeader";

export default function Dashboard() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <MobileHeader onMenuClick={() => setIsSidebarOpen(true)} />

            <Sidebar
                currentPage="dashboard"
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <main className="lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-semibold tracking-tight mb-2">
                        Dashboard
                    </h1>

                    <p className="text-muted-foreground text-sm">
                        Bienvenido a tu panel de control financiero
                    </p>
                </div>
            </main>
        </div>
    );
}