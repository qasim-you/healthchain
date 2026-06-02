"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useWeb3Context } from "@/contexts/Web3Context";
import { Bell, MessageSquare, X, ChevronRight } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";

export default function DynamicHeader({ title = "Dashboard" }) {
    const { role, contract, account } = useWeb3Context();
    const router = useRouter();
    const { toast } = useToast();

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

    // Listen for new blockchain events (Messages & Appointments)
    useEffect(() => {
        if (!contract || !account) return;

        // 1. Message listener
        const onMessageSent = (sender, receiver) => {
            try {
                if (!receiver || receiver.toLowerCase() !== account?.toLowerCase()) return;
                const label = `${sender.slice(0, 6)}...${sender.slice(-4)}`;
                const newNotif = {
                    id: Date.now(),
                    type: "message",
                    title: "New Message",
                    description: `From: ${label}`,
                    senderFull: sender,
                    senderLabel: label,
                    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    read: false,
                };
                setNotifications((prev) => [newNotif, ...prev].slice(0, 10)); // max 10
                
                toast({
                    title: "💬 New Secure Message",
                    description: `You have received a secure message from ${label}.`,
                });
            } catch (err) {
                console.error("Header notification handler error:", err);
            }
        };

        // 2. Appointment Booked listener
        const onAppointmentBooked = (appointmentId, patient, doctor) => {
            try {
                if (!patient || !doctor) return;
                
                const isPatient = patient.toLowerCase() === account?.toLowerCase();
                const isDoctor = doctor.toLowerCase() === account?.toLowerCase();

                if (isPatient || isDoctor) {
                    const label = isPatient 
                        ? `Dr. ${doctor.slice(0, 6)}...${doctor.slice(-4)}`
                        : `Patient ${patient.slice(0, 6)}...${patient.slice(-4)}`;

                    const desc = isPatient
                        ? `Your consultation with ${label} is secured on the blockchain.`
                        : `${label} has scheduled a new consultation with you.`;

                    toast({
                        title: "📅 Appointment Booked",
                        description: desc,
                    });

                    const newNotif = {
                        id: Date.now(),
                        senderFull: isPatient ? doctor : patient,
                        senderLabel: label.slice(0, 12),
                        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                        read: false,
                    };
                    setNotifications((prev) => [newNotif, ...prev].slice(0, 10));
                }
            } catch (err) {
                console.error("Appointment Booked notification error:", err);
            }
        };

        // 3. Appointment Completed listener
        const onAppointmentCompleted = async (appointmentId) => {
            try {
                const appt = await contract.appointments(appointmentId);
                const isPatient = appt.patient.toLowerCase() === account?.toLowerCase();
                const isDoctor = appt.doctor.toLowerCase() === account?.toLowerCase();

                if (isPatient || isDoctor) {
                    const otherLabel = isPatient
                        ? `Dr. ${appt.doctor.slice(0, 6)}...`
                        : `Patient ${appt.patient.slice(0, 6)}...`;

                    toast({
                        title: "✅ Appointment Completed",
                        description: isPatient
                            ? `Your consultation with ${otherLabel} has been marked complete.`
                            : `You have successfully completed consultation #${appointmentId}.`,
                    });
                }
            } catch (err) {
                console.error("Appointment Completed notification error:", err);
            }
        };

        // 4. Medicine Prescribed listener
        const onMedicinePrescribed = (patient, doctor, medicineId) => {
            try {
                if (patient.toLowerCase() === account?.toLowerCase()) {
                    toast({
                        title: "💊 Prescription Written",
                        description: `Dr. ${doctor.slice(0, 6)}... has prescribed a medicine for you.`,
                    });
                }
            } catch (err) {
                console.error("Medicine Prescribed notification error:", err);
            }
        };

        // 5. Medical Record Updated listener
        const onMedicalRecordUpdated = (patient, doctor) => {
            try {
                if (patient.toLowerCase() === account?.toLowerCase()) {
                    toast({
                        title: "📂 Medical Record Updated",
                        description: `Dr. ${doctor.slice(0, 6)}... has added a new record to your history.`,
                    });
                }
            } catch (err) {
                console.error("Medical Record Updated notification error:", err);
            }
        };

        contract.on("MessageSent", onMessageSent);
        contract.on("AppointmentBooked", onAppointmentBooked);
        contract.on("AppointmentCompleted", onAppointmentCompleted);
        contract.on("MedicinePrescribed", onMedicinePrescribed);
        contract.on("MedicalRecordUpdated", onMedicalRecordUpdated);

        return () => {
            contract.off("MessageSent", onMessageSent);
            contract.off("AppointmentBooked", onAppointmentBooked);
            contract.off("AppointmentCompleted", onAppointmentCompleted);
            contract.off("MedicinePrescribed", onMedicinePrescribed);
            contract.off("MedicalRecordUpdated", onMedicalRecordUpdated);
        };
    }, [contract, account, toast]);

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
                                                {notif.type === "message" ? (
                                                    <MessageSquare className="w-4 h-4 text-teal-400" />
                                                ) : (
                                                    <Bell className="w-4 h-4 text-teal-400" />
                                                )}
                                            </div>
 
                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-foreground font-medium">{notif.title || "Alert"}</p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {notif.description || `From: ${notif.senderLabel}`}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground mt-0.5">{notif.time}</p>
                                            </div>
 
                                            {/* Actions */}
                                            <div className="flex items-center gap-1 shrink-0">
                                                {notif.type === "message" && (
                                                    <button
                                                        onClick={() => openChat(notif.senderFull)}
                                                        className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors"
                                                    >
                                                        Open <ChevronRight className="w-3 h-3" />
                                                    </button>
                                                )}
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
