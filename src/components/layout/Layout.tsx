import type { ReactNode } from 'react';

interface LayoutProps {
    children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
    return (
        <div className="min-h-screen bg-neutral-900 text-white flex flex-col font-sans">
            <header className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/80 backdrop-blur-md sticky top-0 z-50">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    Gesture Arena
                </h1>
                <nav className="flex gap-4 text-sm text-neutral-400">
                    <a href="#" className="hover:text-white transition-colors">Games</a>
                    <a href="#" className="hover:text-white transition-colors">Calibration</a>
                    <a href="#" className="hover:text-white transition-colors">Settings</a>
                </nav>
            </header>

            <main className="flex-1 container mx-auto p-4 flex flex-col relative">
                {children}
            </main>

            <footer className="p-4 text-center text-xs text-neutral-600 border-t border-neutral-800">
                Powered by MediaPipe & React
            </footer>
        </div>
    );
};
