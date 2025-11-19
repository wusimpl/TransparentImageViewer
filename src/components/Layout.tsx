import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
    children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
    return (
        <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden bg-gray-950 relative">
                {children}
            </main>
        </div>
    );
};
