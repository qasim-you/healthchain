"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWeb3Context } from "@/contexts/Web3Context";
import { Bell, Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function DynamicHeader({ title = "Dashboard" }) {
    const { role, contract, account } = useWeb3Context();
    const router = useRouter();

    const [hasNotification, setHasNotification] = useState(false);
    const [notificationSenderFull, setNotificationSenderFull] = useState("");
    const [notificationSenderLabel, setNotificationSenderLabel] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        if (!contract || !account) return;

        const onMessageSent = (sender, receiver) => {
            try {
                if (!receiver || receiver.toLowerCase() !== account?.toLowerCase()) return;
                const label = `${sender.slice(0, 6)}...${sender.slice(-4)}`;
                setNotificationSenderFull(sender);
                setNotificationSenderLabel(label);
                setHasNotification(true);
                setShowDropdown(true);
            } catch (err) {
                console.error("Header notification handler error:", err);
            }
        };

        contract.on("MessageSent", onMessageSent);
        return () => {
            contract.off("MessageSent", onMessageSent);
        };
    }, [contract, account]);

    return (
        <header className="h-20 bg-background/50 backdrop-blur-md border-b border-border flex items-center justify-between px-4 md:px-8 sticky top-0 z-50 transition-all text-foreground">
            <div className="flex items-center gap-4 flex-1">
                <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
                <div>
                    <h1 className="text-xl md:text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground capitalize">
                        {title}
                    </h1>
                    <p className="text-xs md:text-sm text-muted-foreground font-medium tracking-wide hidden sm:block">
                        Welcome back, {role}. Let&apos;s overview your ecosystem insights.
                    </p>
                </div>
            </div>

            <div className="flex-none flex items-center gap-6">
                {/* Search */}
                <div className="relative group hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search ecosystem..."
                        className="h-10 w-64 rounded-full bg-muted/50 border border-border text-sm px-10 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all focus:w-80"
                    />
                </div>

                {/* Notifications */}
                <button className="relative p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive animate-ping"></span>
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive"></span>
                </button>
            </div>
        </header>
    );
}
