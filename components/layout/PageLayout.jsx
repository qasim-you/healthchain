"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWeb3Context } from "@/contexts/Web3Context";
import DynamicSidebar from "./DynamicSidebar";
import DynamicHeader from "./DynamicHeader";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default function PageLayout({ children, requiredRole, title }) {
    const router = useRouter();
    const { account, role, isWalletConnected } = useWeb3Context();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        // A small delay to ensure the wallet has hydrated
        const timer = setTimeout(() => {
            if (!isWalletConnected) {
                router.push("/");
            } else if (requiredRole && role !== requiredRole) {
                router.push("/");
            } else {
                setIsAuthorized(true);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [isWalletConnected, role, requiredRole, router]);

    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center flex-col gap-6">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-muted-foreground font-medium tracking-widest text-sm uppercase">Authenticating Identity...</p>
            </div>
        );
    }

    return (
        <SidebarProvider>
            <DynamicSidebar />

            <SidebarInset className="flex-1 flex flex-col h-screen overflow-hidden bg-background text-foreground">
                <DynamicHeader title={title || (role ? `${role} Dashboard` : "Dashboard")} />

                <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
                    {/* Subtle grid background to look high-tech */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-20"></div>

                    <div className="max-w-7xl mx-auto relative z-10 w-full h-full">
                        {children}
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
