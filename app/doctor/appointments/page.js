"use client";

import { useEffect, useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { useWeb3Context } from "@/contexts/Web3Context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CalendarCheck, Calendar } from "lucide-react";

export default function DoctorAppointments() {
    const { contract, account } = useWeb3Context();
    const { toast } = useToast();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAppointments = async () => {
        if (!contract || !account) return;
        try {
            const countStr = await contract.appointmentCount();
            const count = Number(countStr);
            const temp = [];

            for (let i = 1; i <= count; i++) {
                const appt = await contract.appointments(i);
                if (appt.doctor.toLowerCase() === account.toLowerCase()) {
                    const pt = await contract.patients(appt.patient);
                    temp.push({
                        id: appt.id,
                        patientWallet: appt.patient,
                        patientName: pt.name || "Unknown Patient",
                        time: appt.time,
                        note: appt.note,
                        isCompleted: appt.isCompleted
                    });
                }
            }
            setAppointments(temp.reverse()); // latest first
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [contract, account]);

    const handleComplete = async (id) => {
        if (!contract) return;
        try {
            const tx = await contract.completeAppointment(id);
            toast({ title: "Submitting tx...", description: "Marking appointment as complete." });
            await tx.wait();

            toast({ title: "Success", description: "Appointment completed!" });
            fetchAppointments();
        } catch (error) {
            console.error(error);
            toast({ title: "Action Failed", description: error?.reason || error.message, variant: "destructive" });
        }
    };

    return (
        <PageLayout requiredRole="doctor" title="My Appointments">
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-2xl relative">
                <div className="p-6 border-b border-border">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" /> Appointment Queue
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1">Manage physical & digital consultations</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-background/50 text-muted-foreground text-sm uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">Booking ID</th>
                                <th className="px-6 py-4 font-semibold">Patient Wallet</th>
                                <th className="px-6 py-4 font-semibold">Time Schedule</th>
                                <th className="px-6 py-4 font-semibold">Notes / Symptoms</th>
                                <th className="px-6 py-4 font-semibold text-center w-48">Status/Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 text-foreground">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-foreground0">Checking patient ledgers...</td>
                                </tr>
                            ) : appointments.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-foreground0">No appointments scheduled for you.</td>
                                </tr>
                            ) : (
                                appointments.map((appt, idx) => (
                                    <tr key={idx} className={`transition-colors ${appt.isCompleted ? "opacity-50 hover:opacity-100" : "hover:bg-muted/20"}`}>
                                        <td className="px-6 py-4 font-mono text-sm text-primary">#{Number(appt.id)}</td>
                                        <td className="px-6 py-4 font-medium text-foreground">
                                            <div className="flex flex-col">
                                                <span>{appt.patientName}</span>
                                                <span className="font-mono text-[10px] text-muted-foreground mt-0.5">{appt.patientWallet.slice(0, 6)}...{appt.patientWallet.slice(-4)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-emerald-400 font-medium">{appt.time}</td>
                                        <td className="px-6 py-4 text-muted-foreground text-sm max-w-xs truncate">{appt.note || "No notes"}</td>
                                        <td className="px-6 py-4 text-center">
                                            {appt.isCompleted ? (
                                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-none font-semibold">Completed</Badge>
                                            ) : (
                                                <Button size="sm" onClick={() => handleComplete(appt.id)} className="bg-primary hover:bg-primary/90 text-white rounded-lg w-full">
                                                    <CalendarCheck className="w-4 h-4 mr-2" /> Mark Done
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </PageLayout>
    );
}
