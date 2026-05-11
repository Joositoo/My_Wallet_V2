import { Menu } from "lucide-react";

export default function MobileHeader({ onMenuClick }) {
    return (
        <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[oklch(0.11_0_0)] border-b border-border flex items-center px-4 z-30">
            <button
                onClick={onMenuClick}
                className="p-2 text-foreground hover:bg-foreground/5 rounded-lg transition-colors"
            >
                <Menu className="w-6 h-6" />
            </button>
        </header>
    );
}