"use client";

import PageLayout from "@/components/layout/PageLayout";
import { useWeb3Context } from "@/contexts/Web3Context";
import { HeartPulse, Stethoscope, FileText, Pill } from "lucide-react";

export default function PatientDashboard() {
    const { role } = useWeb3Context();

    const metrics = [
        { title: "Upcoming Appointments", value: "2", icon: Stethoscope, color: "text-blue-500", bg: "bg-blue-500/10" },
        { title: "Total Medical Records", value: "8", icon: FileText, color: "text-rose-500", bg: "bg-rose-500/10" },
        { title: "Active Prescriptions", value: "1", icon: Pill, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    ];

    return (
        <PageLayout requiredRole="patient" title="Patient Dashboard">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {metrics.map((m, i) => {
                    const Icon = m.icon;
                    return (
                        <div key={i} className="p-6 rounded-3xl bg-card border border-border shadow-xl flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-2xl ${m.bg} flex items-center justify-center`}>
                                <Icon className={`w-7 h-7 ${m.color}`} />
                            </div>
                            <div>
                                <p className="text-muted-foreground font-medium">{m.title}</p>
                                <h3 className="text-3xl font-bold mt-1 text-foreground">{m.value}</h3>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="p-8 rounded-3xl border border-border bg-card shadow-2xl relative overflow-hidden">
                    <HeartPulse className="absolute -bottom-10 -right-10 w-64 h-64 text-rose-500/5 rotate-12" />
                    <h3 className="text-xl font-bold text-foreground mb-6">Your Health Summary</h3>
                    <p className="text-muted-foreground">Your health data is securely stored on the blockchain. You can grant access to verified doctors to update your diagnosis history.</p>
                </div>
            </div>
        </PageLayout>
    );
}
