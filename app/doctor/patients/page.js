"use client";

import { useState, useEffect } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { useWeb3Context } from "@/contexts/Web3Context";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileHeart, Search, User, CheckCircle2 } from "lucide-react";

export default function DoctorPatients() {
    const { contract } = useWeb3Context();
    const { toast } = useToast();

    const [allPatients, setAllPatients] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [patientInfo, setPatientInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const [form, setForm] = useState({ diagnosis: "", history: "" });

    useEffect(() => {
        if (!contract) return;
        const fetchPatients = async () => {
            setLoading(true);
            try {
                const pCount = await contract.patientCount();
                const pts = [];
                for (let i = 0; i < Number(pCount); i++) {
                    const addr = await contract.patientAddresses(i);
                    const pt = await contract.patients(addr);
                    if (pt.isRegistered) {
                        pts.push(pt);
                    }
                }
                setAllPatients(pts);
            } catch (err) {
                console.error("Failed to load patients", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPatients();
    }, [contract]);

    const filteredPatients = allPatients.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.wallet.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectPatient = (patient) => {
        setPatientInfo(patient);
        setForm({ diagnosis: "", history: "" }); // Reset form
    };

    const handleUpdateRecord = async (e) => {
        e.preventDefault();
        if (!contract || !patientInfo) return;
        setUpdating(true);
        try {
            const tx = await contract.updateMedicalRecord(
                patientInfo.wallet,
                form.diagnosis,
                form.history
            );

            toast({ title: "Submitting tx...", description: "Updating immutable medical record." });
            await tx.wait();

            toast({ title: "Success", description: "Patient diagnosis logged securely!" });
            setForm({ diagnosis: "", history: "" });
        } catch (error) {
            console.error(error);
            toast({ title: "Failed to update record", description: error?.reason || error.message, variant: "destructive" });
        } finally {
            setUpdating(false);
        }
    };

    return (
        <PageLayout requiredRole="doctor" title="Patient Diagnosis Portal">
            <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-140px)]">

                {/* Left column: Search / Patient List */}
                <div className="w-full md:w-1/3 flex flex-col gap-6">
                    <div className="bg-card border border-border rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col h-full">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[40px] rounded-full pointer-events-none"></div>
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4 relative z-10"><Search className="w-5 h-5 text-primary" /> Select Patient</h3>
                        
                        <div className="relative z-10 mb-4 shrink-0">
                            <input 
                                type="text" 
                                placeholder="Search by name..." 
                                className="w-full bg-background border border-border p-3 rounded-xl text-foreground outline-none focus:border-primary text-sm transition-colors"
                                value={searchQuery} 
                                onChange={e => setSearchQuery(e.target.value)} 
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 relative z-10 pr-1">
                            {loading ? (
                                <p className="text-center text-sm text-muted-foreground mt-4">Loading directory...</p>
                            ) : filteredPatients.length === 0 ? (
                                <p className="text-center text-sm text-muted-foreground mt-4">No patients found.</p>
                            ) : (
                                filteredPatients.map((pt, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => handleSelectPatient(pt)}
                                        className={`w-full text-left p-3 rounded-xl border flex items-center gap-3 transition-colors ${patientInfo?.wallet === pt.wallet ? "bg-primary/10 border-primary/30" : "bg-background/50 border-border hover:border-primary/30"}`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-muted overflow-hidden shrink-0">
                                            <img src={pt.profileImageURI || `https://api.dicebear.com/7.x/initials/svg?seed=${pt.name}`} alt={pt.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="overflow-hidden flex-1">
                                            <p className="font-semibold text-sm text-foreground truncate">{pt.name}</p>
                                            <p className="text-[10px] text-muted-foreground truncate">{pt.wallet}</p>
                                        </div>
                                        {patientInfo?.wallet === pt.wallet && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right column: Patient Details & Form */}
                <div className="w-full md:w-2/3 overflow-y-auto">
                    {patientInfo ? (
                        <div className="space-y-6">
                            {/* Patient Info Card */}
                            <div className="bg-card border border-border rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col sm:flex-row gap-6 items-center">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[40px] rounded-full pointer-events-none"></div>
                                <div className="w-24 h-24 rounded-full bg-muted border-4 border-primary/20 shadow-lg overflow-hidden shrink-0">
                                    <img src={patientInfo.profileImageURI || `https://api.dicebear.com/7.x/initials/svg?seed=${patientInfo.name}`} alt={patientInfo.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 space-y-2 text-center sm:text-left relative z-10">
                                    <h2 className="text-2xl font-bold text-foreground">{patientInfo.name}</h2>
                                    <p className="text-xs font-mono text-primary bg-primary/10 px-3 py-1 rounded-lg inline-block">{patientInfo.wallet}</p>
                                    <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                                        <span className="text-xs bg-background/50 border border-border px-2 py-1 rounded-md text-foreground">Age: {Number(patientInfo.age)}</span>
                                        <span className="text-xs bg-background/50 border border-rose-500/20 px-2 py-1 rounded-md text-rose-400">Blood: {patientInfo.bloodGroup}</span>
                                        <span className="text-xs bg-background/50 border border-border px-2 py-1 rounded-md text-muted-foreground">Allergies: {patientInfo.allergies || "None"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Form Card */}
                            <div className="p-8 pt-10 rounded-3xl border shadow-2xl relative overflow-hidden bg-card border-border">
                                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-rose-500/5 blur-[80px] rounded-full pointer-events-none"></div>

                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20">
                                        <FileHeart className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-foreground">Record Diagnosis</h2>
                                        <p className="text-sm text-muted-foreground mt-1">Append an immutable log to the patient's blockchain ledger</p>
                                    </div>
                                </div>

                                <form onSubmit={handleUpdateRecord} className="space-y-6">
                                    <div>
                                        <label className="text-sm font-semibold text-muted-foreground block mb-2">Primary Diagnosis</label>
                                        <input type="text" required placeholder="e.g. Acute Bronchitis" className="w-full p-4 bg-background border border-border text-foreground rounded-2xl focus:border-rose-500 outline-none transition-colors"
                                            value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-muted-foreground block mb-2">Detailed Observation & History Notes</label>
                                        <textarea required placeholder="Write clinical notes..." rows="5" className="w-full p-4 bg-background border border-border text-foreground rounded-2xl focus:border-rose-500 outline-none transition-colors resize-none"
                                            value={form.history} onChange={e => setForm({ ...form, history: e.target.value })} />
                                    </div>

                                    <Button disabled={updating} className="w-full h-14 bg-rose-600 hover:bg-rose-500 text-white text-lg font-bold rounded-2xl shadow-[0_0_30px_-5px_var(--tw-shadow-color)] shadow-rose-600/30 transition-all">
                                        {updating ? "Mining Block..." : "Sign & Append Record"}
                                    </Button>
                                </form>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 bg-card/50 border border-border/20 rounded-3xl border-dashed">
                            <User className="w-16 h-16 opacity-20 mb-4" />
                            <p>Select a patient from the directory to view their profile and record a diagnosis.</p>
                        </div>
                    )}
                </div>

            </div>
        </PageLayout>
    );
}
