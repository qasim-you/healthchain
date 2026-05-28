"use client";

import { useEffect, useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { useWeb3Context } from "@/contexts/Web3Context";
import { Badge } from "@/components/ui/badge";
import { Clock, Pill, Stethoscope, FileText } from "lucide-react";

export default function PatientRecords() {
    const { contract, account } = useWeb3Context();
    const [records, setRecords] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchHistory = async () => {
        if (!contract || !account) return;
        try {
            const recs = await contract.getPatientMedicalHistory(account);
            const mappedRecs = await Promise.all(recs.map(async (r) => {
                const doc = await contract.doctors(r.doctor);
                return { ...r, timestamp: r.timestamp, diagnosis: r.diagnosis, medicalHistory: r.medicalHistory, doctorWallet: r.doctor, doctorName: doc.name || "Unknown Doctor" };
            }));

            const prescs = await contract.getPatientPrescriptions(account);
            const mappedPrescs = await Promise.all(prescs.map(async (p) => {
                const doc = await contract.doctors(p.doctor);
                return { ...p, timestamp: p.timestamp, medicineId: p.medicineId, dosageInstruction: p.dosageInstruction, quantity: p.quantity, doctorName: doc.name || "Unknown Doctor" };
            }));

            setRecords(mappedRecs);
            setPrescriptions(mappedPrescs);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [contract, account]);

    const formatDate = (timestamp) => {
        return new Date(Number(timestamp) * 1000).toLocaleString();
    };

    const handleDownloadReport = () => {
        let content = "MEDICAL REPORT & HISTORY\n";
        content += "===========================\n\n";
        
        content += "--- DIAGNOSES & CONSULTATIONS ---\n";
        records.forEach(r => {
            content += `Date: ${formatDate(r.timestamp)}\n`;
            content += `Doctor: ${r.doctor}\n`;
            content += `Diagnosis: ${r.diagnosis}\n`;
            content += `Notes: ${r.medicalHistory}\n\n`;
        });
        
        content += "--- PRESCRIPTIONS ---\n";
        prescriptions.forEach(p => {
            content += `Date: ${formatDate(p.timestamp)}\n`;
            content += `Medicine ID: ${Number(p.medicineId)}\n`;
            content += `Instructions: ${p.dosageInstruction}\n`;
            content += `Quantity: ${Number(p.quantity)}\n\n`;
        });

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `medical_report_${account}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <PageLayout requiredRole="patient" title="My Medical History">

            <div className="flex flex-col gap-10">

                {/* Diagnoses Section */}
                <section>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-foreground flex items-center gap-2"><FileText className="text-primary" /> Consultations & Diagnoses</h3>
                        <button onClick={handleDownloadReport} className="bg-primary hover:bg-primary/90 text-foreground px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-lg">Download Report</button>
                    </div>

                    <div className="space-y-4 relative">
                        <div className="absolute left-[39px] top-4 bottom-4 w-px bg-muted"></div>

                        {loading ? (
                            <div className="text-foreground0 pl-24 animate-pulse">Loading secure records...</div>
                        ) : records.length === 0 ? (
                            <div className="text-foreground0 pl-24 bg-card border border-border p-6 rounded-2xl ml-[75px]">No medical diagnoses recorded yet.</div>
                        ) : (
                            records.map((rec, idx) => (
                                <div key={idx} className="flex gap-8 relative z-10 w-full pl-6">
                                    <div className="w-20 pt-1 shrink-0 text-right">
                                        <p className="text-xs text-foreground0 font-medium">
                                            {formatDate(rec.timestamp).split(',')[0]}<br />
                                            {formatDate(rec.timestamp).split(',')[1]}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-card border-4 border-border flex shadow-sm shadow-primary/10 items-center justify-center -ml-11 shrink-0 z-20 overflow-hidden">
                                        <Stethoscope className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="flex-1 bg-card border border-border p-6 rounded-3xl shadow-xl">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-sm font-semibold text-muted-foreground mb-1">Diagnosis</p>
                                                <h4 className="text-lg font-bold text-foreground leading-tight">{rec.diagnosis}</h4>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <p className="text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-lg font-bold">Dr. {rec.doctorName}</p>
                                                <p className="text-[10px] text-foreground0 mt-1 font-mono">{rec.doctorWallet.slice(0, 6)}...{rec.doctorWallet.slice(-4)}</p>
                                            </div>
                                        </div>

                                        <p className="text-sm text-muted-foreground bg-background/50 p-4 rounded-2xl shadow-inner border border-border/50">
                                            {rec.medicalHistory}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Prescriptions Section */}
                <section className="mt-6">
                    <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2"><Pill className="text-rose-400" /> Doctor Prescriptions</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? (
                            Array(3).fill(0).map((_, i) => <div key={i} className="h-40 bg-card border border-border rounded-3xl animate-pulse" />)
                        ) : prescriptions.length === 0 ? (
                            <div className="col-span-full py-10 text-center text-foreground0 border border-border rounded-3xl bg-card">
                                No active prescriptions found.
                            </div>
                        ) : (
                            prescriptions.map((pres, idx) => (
                                <div key={idx} className="bg-card border border-border p-6 rounded-3xl shadow-xl flex flex-col relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-[40px] rounded-full"></div>

                                    <div className="flex items-center justify-between mb-4 relative z-10">
                                        <Badge className="bg-rose-500/10 text-rose-400 border-none px-3 font-semibold uppercase tracking-wider text-[10px]">By Dr. {pres.doctorName}</Badge>
                                        <span className="text-xs text-foreground0 flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDate(pres.timestamp).split(',')[0]}</span>
                                    </div>

                                    <div className="relative z-10 flex-1">
                                        <p className="text-sm font-semibold text-muted-foreground">Medicine ID: {Number(pres.medicineId)}</p>
                                        <h4 className="text-lg font-bold text-foreground mt-1 mb-4">{pres.dosageInstruction}</h4>

                                        <div className="bg-background p-3 rounded-2xl flex justify-between items-center text-sm text-muted-foreground border border-border/50">
                                            <span>Prescribed Qty</span>
                                            <span className="font-bold">{Number(pres.quantity)} units</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

            </div>

        </PageLayout>
    );
}
