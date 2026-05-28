"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import PageLayout from "@/components/layout/PageLayout";
import { useWeb3Context } from "@/contexts/Web3Context";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FilePlus, Search, Info } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function PrescribeMedicine() {
    const { contract, role } = useWeb3Context();
    const { toast } = useToast();
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedMed, setSelectedMed] = useState(null);
    const [prescribing, setPrescribing] = useState(false);
    const [patients, setPatients] = useState([]);

    const [form, setForm] = useState({ patientAddr: "", instruction: "", quantity: "1" });


    useEffect(() => {
        const fetchData = async () => {
            if (!contract) return;
            try {
                // Fetch Medicines
                const medData = await contract.getAllMedicines();
                setMedicines(medData);

                // Fetch all registered patients for Dropdown
                const pCount = await contract.patientCount();
                const pts = [];
                for (let i = 0; i < Number(pCount); i++) {
                    const addr = await contract.patientAddresses(i);
                    const pt = await contract.patients(addr);
                    if (pt.isRegistered) pts.push(pt);
                }
                setPatients(pts);

            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [contract]);

    const handlePrescribe = async (e) => {
        e.preventDefault();
        if (!contract || !selectedMed || role !== "doctor") return;
        setPrescribing(true);

        try {
            const qty = parseInt(form.quantity);
            if (qty <= 0) throw new Error("Invalid quantity");

            const tx = await contract.prescribeMedicine(form.patientAddr, selectedMed.id, form.instruction, qty);

            toast({ title: "Validating patient...", description: "Appending blockchain prescription log." });
            await tx.wait();

            toast({ title: "Success", description: "Prescription securely dispatched to patient." });

            setSelectedMed(null);
            setForm({ patientAddr: "", instruction: "", quantity: "1" });
        } catch (error) {
            console.error(error);
            toast({ title: "Action prohibited", description: error?.reason || error.message, variant: "destructive" });
        } finally {
            setPrescribing(false);
        }
    };

    return (
        <PageLayout requiredRole="doctor" title="Digital Prescription Pad">
            <div className="flex justify-between items-center mb-8 relative z-10">
                <div>
                    <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Prescribe Medications</h2>
                    <p className="text-muted-foreground mt-2">Browse global inventory and link prescriptions instantly.</p>
                </div>
                <div className="relative hidden md:block">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground0 w-5 h-5" />
                    <input type="text" placeholder="Search pharmacology..." className="bg-card border border-border text-foreground placeholder-slate-500 rounded-full h-12 pl-12 pr-6 w-80 focus:ring-2 focus:ring-amber-500 outline-none transition-all" />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
                {loading ? (
                    Array(8).fill(0).map((_, i) => <div key={i} className="h-80 bg-card border border-border rounded-3xl animate-pulse"></div>)
                ) : medicines.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-foreground0">
                        <Info className="w-16 h-16 mx-auto opacity-20 mb-4" />
                        <p>No verified medicines in the database.</p>
                    </div>
                ) : (
                    medicines.map((med, idx) => {
                        const isOutOfStock = Number(med.stockQuantity) <= 0;
                        return (
                            <div key={idx} className={`bg-card border border-border rounded-3xl overflow-hidden transition-all flex flex-col ${isOutOfStock ? "opacity-60" : "hover:border-amber-500/50 shadow-xl"}`}>
                                <div className="p-4 bg-white/5 relative group">
                                    {isOutOfStock && (
                                        <div className="absolute top-4 left-4 bg-red-500/80 backdrop-blur text-foreground text-[10px] font-bold px-3 py-1.5 rounded-lg z-10 uppercase tracking-widest border border-red-500/50">
                                            Depleted
                                        </div>
                                    )}
                                    <div className="aspect-[4/3] w-full relative rounded-2xl overflow-hidden shadow-inner border border-border/50 bg-muted/50 flex items-center justify-center">
                                        <img src={med.imageURI || "https://placehold.co/400x300/1e293b/a8b8d8?text=Medicine"} alt={med.name} className="w-full h-full object-cover" />
                                    </div>
                                </div>

                                <div className="p-5 flex-1 flex flex-col pt-2">
                                    <h3 className="text-xl font-bold text-foreground flex items-center justify-between mb-1">
                                        {med.name}
                                        <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider bg-amber-500/10 px-2 py-1 rounded-md">{med.category}</span>
                                    </h3>
                                    <p className="text-muted-foreground text-sm mb-4">By {med.manufacturer} • {med.dosage}</p>

                                    <div className="mt-auto pt-4 border-t border-border flex justify-between gap-3">
                                        <Button
                                            onClick={() => setSelectedMed(med)}
                                            disabled={isOutOfStock}
                                            className="w-full h-11 bg-amber-600 hover:bg-amber-500 text-foreground rounded-xl shadow-[0_0_20px_-5px_var(--tw-shadow-color)] shadow-amber-600/30">
                                            <FilePlus className="w-4 h-4 mr-2" />
                                            Assign RX
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <Dialog open={!!selectedMed} onOpenChange={(open) => !open && setSelectedMed(null)}>
                <DialogContent className="bg-card border-border text-foreground sm:max-w-[500px] p-8 rounded-3xl">
                    {selectedMed && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold mb-2">Issue Prescription</DialogTitle>
                                <div className="bg-background p-4 border border-border rounded-xl mb-6 flex gap-4 mt-4">
                                    <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden shrink-0">
                                        <img src={selectedMed.imageURI || "https://placehold.co/100"} className="w-full h-full object-cover opacity-80" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <h4 className="text-lg font-bold text-amber-500 truncate">{selectedMed.name}</h4>
                                        <p className="text-xs text-muted-foreground capitalize">{selectedMed.dosage} • {selectedMed.category}</p>
                                    </div>
                                </div>
                            </DialogHeader>

                            <form onSubmit={handlePrescribe} className="space-y-4">
                                <div>
                                    <label className="text-sm text-muted-foreground mb-1.5 block">Select Patient</label>
                                    <select required className="w-full bg-background border border-border rounded-xl p-3 text-foreground focus:border-amber-500 outline-none"
                                        value={form.patientAddr} onChange={e => setForm({ ...form, patientAddr: e.target.value })}>
                                        <option value="" disabled>-- Choose a Patient --</option>
                                        {patients.map(p => (
                                            <option key={p.wallet} value={p.wallet}>{p.name} ({p.wallet.slice(0, 6)}...{p.wallet.slice(-4)})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm text-muted-foreground mb-1.5 block">Dosage Instructions / Frequency</label>
                                    <input type="text" required placeholder="e.g. 1 Tablet every 12 hours after meals" className="w-full bg-background border border-border rounded-xl p-3 text-foreground focus:border-amber-500 outline-none"
                                        value={form.instruction} onChange={e => setForm({ ...form, instruction: e.target.value })} />
                                </div>

                                <div>
                                    <label className="text-sm text-muted-foreground mb-1.5 block">Quantity</label>
                                    <input type="number" min="1" required className="w-full bg-background border border-border rounded-xl p-3 text-foreground focus:border-amber-500 outline-none"
                                        value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
                                </div>

                                <Button disabled={prescribing} className="w-full h-12 bg-amber-600 hover:bg-amber-500 text-lg font-bold rounded-xl shadow-xl shadow-amber-600/20 mt-6">
                                    {prescribing ? "Authorizing via Smart Contract..." : "Confirm Rx Auth"}
                                </Button>
                            </form>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </PageLayout>
    );
}
