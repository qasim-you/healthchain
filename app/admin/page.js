"use client";

import PageLayout from "@/components/layout/PageLayout";
import { useWeb3Context } from "@/contexts/Web3Context";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Users, Stethoscope, Pill, CalendarCheck, Wallet } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminDashboard() {
    const { contract, role } = useWeb3Context();
    const [stats, setStats] = useState({
        doctors: 0,
        patients: 0,
        medicines: 0,
        appointments: 0,
        revenue: "0"
    });

    const fetchStats = async () => {
        if (!contract) return;
        try {
            const data = await contract.getPlatformStats();
            setStats({
                doctors: Number(data[0]),
                patients: Number(data[1]),
                medicines: Number(data[2]),
                appointments: Number(data[3]),
                revenue: ethers.formatEther(data[4])
            });
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [contract]);

    const cards = [
        { title: "Total Doctors", value: stats.doctors, icon: Stethoscope, color: "text-primary", bg: "bg-primary/15" },
        { title: "Total Patients", value: stats.patients, icon: Users, color: "text-primary", bg: "bg-primary/15" },
        { title: "Marketplace Medicines", value: stats.medicines, icon: Pill, color: "text-primary", bg: "bg-primary/15" },
        { title: "Platform Appointments", value: stats.appointments, icon: CalendarCheck, color: "text-primary", bg: "bg-primary/15" },
        { title: "Total Revenue (ETH)", value: stats.revenue, icon: Wallet, color: "text-primary", bg: "bg-primary/15" }
    ];

    return (
        <PageLayout requiredRole="admin" title="System Dashboard">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card, i) => {
                    const Icon = card.icon;
                    return (
                        <Card key={i} className="hover:border-primary/50 transition-colors bg-card text-card-foreground shadow-sm">
                            <CardContent className="p-6 flex items-center gap-5">
                                <div className={`w-14 h-14 rounded-2xl ${card.bg} flex items-center justify-center shrink-0`}>
                                    <Icon className={`w-7 h-7 ${card.color}`} />
                                </div>
                                <div>
                                    <p className="text-muted-foreground font-medium text-sm">{card.title}</p>
                                    <h3 className="text-3xl font-bold mt-1 text-foreground">{card.value}</h3>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <Card className="mt-12 overflow-hidden relative border-border bg-card shadow-lg">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
                <CardHeader className="relative z-10 p-8">
                    <CardTitle className="text-2xl font-semibold mb-2 text-foreground">Platform Health</CardTitle>
                    <CardDescription className="max-w-2xl leading-relaxed text-base text-muted-foreground">
                        Welcome to the HealthChain administrative portal. From here, you can oversee platform scaling, verify new medical professionals joining the network, and manage the decentralized medicine marketplace constraints. All financial transactions are purely peer-to-peer, with a small commission flowing into the smart contract.
                    </CardDescription>
                </CardHeader>
            </Card>
        </PageLayout>
    );
}
