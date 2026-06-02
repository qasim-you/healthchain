"use client";

import { useEffect, useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { useWeb3Context } from "@/contexts/Web3Context";
import { Users, FileHeart, CalendarCheck } from "lucide-react";

export default function DoctorDashboard() {
    const { contract, account } = useWeb3Context();
    const [stats, setStats] = useState({
        patients: 0,
        activeAppointments: 0,
        diagnoses: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!contract || !account) return;
        const fetchStats = async () => {
            setLoading(true);
            try {
                // 1. Fetch total patients who selected this doctor as general consultant
                const pCount = await contract.patientCount();
                let myPatientsCount = 0;
                let myDiagnosesCount = 0;
                
                const patientPromises = [];
                for (let i = 0; i < Number(pCount); i++) {
                    patientPromises.push(
                        (async () => {
                            const addr = await contract.patientAddresses(i);
                            const pt = await contract.patients(addr);
                            if (pt.isRegistered && pt.generalConsultant.toLowerCase() === account.toLowerCase()) {
                                myPatientsCount++;
                            }
                            
                            // Fetch diagnoses counts
                            try {
                                const records = await contract.getPatientMedicalHistory(addr);
                                const myRecords = records.filter(r => r.doctor.toLowerCase() === account.toLowerCase());
                                myDiagnosesCount += myRecords.length;
                            } catch (e) {
                                // Gracefully ignore if not authorized
                            }
                        })()
                    );
                }
                
                // 2. Fetch active appointments
                let activeApptsCount = 0;
                const apptCount = await contract.appointmentCount();
                const apptPromises = [];
                for (let i = 1; i <= Number(apptCount); i++) {
                    apptPromises.push(
                        (async () => {
                            const appt = await contract.appointments(i);
                            if (appt.doctor.toLowerCase() === account.toLowerCase() && !appt.isCompleted) {
                                activeApptsCount++;
                            }
                        })()
                    );
                }

                await Promise.all([...patientPromises, ...apptPromises]);

                setStats({
                    patients: myPatientsCount,
                    activeAppointments: activeApptsCount,
                    diagnoses: myDiagnosesCount
                });
            } catch (err) {
                console.error("Failed to load doctor dashboard stats:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [contract, account]);

    const metrics = [
        { title: "Total Patients Assessed", value: loading ? "..." : stats.patients.toString(), icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
        { title: "Active Appointments", value: loading ? "..." : stats.activeAppointments.toString(), icon: CalendarCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { title: "Digital Diagnoses", value: loading ? "..." : stats.diagnoses.toString(), icon: FileHeart, color: "text-rose-500", bg: "bg-rose-500/10" },
    ];

    return (
        <PageLayout requiredRole="doctor" title="Doctor Workspace">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {metrics.map((m, i) => {
                    const Icon = m.icon;
                    return (
                        <div key={i} className="p-6 rounded-3xl bg-card border border-border shadow-xl flex items-center gap-5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors"></div>

                            <div className={`w-14 h-14 rounded-2xl ${m.bg} flex items-center justify-center relative z-10`}>
                                <Icon className={`w-7 h-7 ${m.color}`} />
                            </div>
                            <div className="relative z-10">
                                <p className="text-muted-foreground font-medium">{m.title}</p>
                                <h3 className="text-3xl font-bold mt-1 text-foreground">{m.value}</h3>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 grid grid-cols-1">
                <div className="p-8 rounded-3xl border border-border bg-gradient-to-br from-card to-background shadow-2xl relative overflow-hidden">
                    <h3 className="text-xl font-bold text-foreground mb-4">Ethereum Decentralized Medical Hub</h3>
                    <p className="text-muted-foreground max-w-3xl leading-relaxed">
                        As a verified medical professional on HealthChain, your consultation fees are automatically sent to your wallet immediately via smart contracts once a patient books an appointment. You hold the authority to record immutable medical histories, prescribe genuine medicines tracked securely, and handle consultations safely without intermediaries.
                    </p>
                </div>
            </div>
        </PageLayout>
    );
}
