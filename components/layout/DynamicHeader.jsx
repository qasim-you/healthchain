"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useWeb3Context } from "@/contexts/Web3Context";
import { Bell, MessageSquare, X, ChevronRight } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function DynamicHeader({ title = "Dashboard" }) {
    const { role, contract, account } = useWeb3Context();
    const router = useRouter();

    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Listen for new blockchain messages
    useEffect(() => {
        if (!contract || !account) return;

        const onMessageSent = (sender, receiver) => {
            try {
                if (!receiver || receiver.toLowerCase() !== account?.toLowerCase()) return;
                const label = `${sender.slice(0, 6)}...${sender.slice(-4)}`;
                const newNotif = {
                    id: Date.now(),
                    senderFull: sender,
                    senderLabel: label,
                    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    read: false,
                };
                setNotifications((prev) => [newNotif, ...prev].slice(0, 10)); // max 10
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

    const unreadCount = notifications.filter((n) => !n.read).length;

    const markAllRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    const dismissNotification = (id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    const openChat = (senderAddr) => {
        setShowDropdown(false);
        markAllRead();
        router.push(`/chat?partner=${senderAddr}`);
    };

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
                {/* Notifications Bell */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => {
                            setShowDropdown((prev) => !prev);
                            if (!showDropdown) markAllRead();
                        }}
                        className="relative p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        aria-label="Notifications"
                    >
                        <Bell className="h-5 w-5" />

                        {/* Only show badge when there are unread notifications */}
                        {unreadCount > 0 && (
                            <>
                                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive animate-ping" />
                                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
                            </>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showDropdown && (
                        <div className="absolute right-0 top-12 w-80 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                                <div className="flex items-center gap-2">
                                    <Bell className="w-4 h-4 text-primary" />
                                    <span className="font-semibold text-sm text-foreground">Notifications</span>
                                    {unreadCount > 0 && (
                                        <span className="text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5">
                                            {unreadCount}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => setShowDropdown(false)}
                                    className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Notification List */}
                            <div className="max-h-72 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-3">
                                        <Bell className="w-8 h-8 opacity-30" />
                                        <p className="text-sm">No notifications yet</p>
                                        <p className="text-xs opacity-60">New messages will appear here</p>
                                    </div>
                                ) : (
                                    notifications.map((notif) => (
                                        <div
                                            key={notif.id}
                                            className={`flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/40 transition-colors ${!notif.read ? "bg-primary/5" : ""}`}
                                        >
                                            {/* Icon */}
                                            <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                                <MessageSquare className="w-4 h-4 text-teal-400" />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-foreground font-medium">New Message</p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    From: <span className="font-mono text-teal-400">{notif.senderLabel}</span>
                                                </p>
                                                <p className="text-[10px] text-muted-foreground mt-0.5">{notif.time}</p>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    onClick={() => openChat(notif.senderFull)}
                                                    className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors"
                                                >
                                                    Open <ChevronRight className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={() => dismissNotification(notif.id)}
                                                    className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Footer */}
                            {notifications.length > 0 && (
                                <div className="px-4 py-2.5 border-t border-border bg-muted/20 flex justify-between items-center">
                                    <button
                                        onClick={() => router.push("/chat")}
                                        className="text-xs text-primary hover:underline font-medium"
                                    >
                                        Open Chat
                                    </button>
                                    <button
                                        onClick={() => setNotifications([])}
                                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        Clear all
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
