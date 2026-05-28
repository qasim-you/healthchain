"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWeb3Context } from "@/contexts/Web3Context";
import { uploadFileToIPFS } from "@/utils/ipfs";
import { Button } from "@/components/ui/button";
import { HeartPulse, UploadCloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RegisterPatient() {
    const router = useRouter();
    const { contract, account, isWalletConnected } = useWeb3Context();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [doctors, setDoctors] = useState([]);

    const [form, setForm] = useState({
        name: "", age: "", bloodGroup: "A+", allergies: "None", currentMedications: "None",
        consultant: "", profilePic: null
    });

    useEffect(() => {
        if (!contract || !isWalletConnected) {
            if (!isWalletConnected) router.push("/");
            return;
        }

        const fetchVerifiedDoctors = async () => {
            try {
                const allDocs = await contract.getAllDoctors();
                const verified = allDocs.filter(d => d.isVerified);
                setDoctors(verified);
                if (verified.length > 0) setForm(f => ({ ...f, consultant: verified[0].wallet }));
            } catch (err) {
                console.error("Error fetching available doctors:", err);
            }
        };
        fetchVerifiedDoctors();
    }, [contract, isWalletConnected, router]);

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!contract) return;
        setLoading(true);

        try {
            toast({ title: "Uploading image...", description: "Please wait while we upload your profile to IPFS." });

            const profileImageURI = await uploadFileToIPFS(form.profilePic);

            const tx = await contract.registerPatient(
                form.name,
                form.age,
                form.bloodGroup,
                form.allergies,
                form.currentMedications,
                profileImageURI,
                form.consultant
            );

            toast({ title: "Transaction submitted", description: "Waiting for blockchain confirmation..." });
            await tx.wait();

            toast({ title: "Success", description: "You are now registered as a Patient in the ecosystem!" });
            router.push("/patient");
        } catch (error) {
            console.error(error);
            toast({ title: "Registration failed", description: error?.reason || error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 w-full bg-background flex flex-col items-center pt-10 pb-32 px-4 sm:px-6 overflow-y-auto">
            <div className="max-w-xl w-full bg-card border border-border rounded-3xl p-5 sm:p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-rose-500/10 blur-[80px] rounded-full pointer-events-none"></div>

                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                        <HeartPulse className="w-6 h-6 text-rose-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">Patient Registration</h2>
                        <p className="text-muted-foreground text-sm">Create your decentralized medical identity</p>
                    </div>
                </div>

                <form onSubmit={handleRegister} className="space-y-5 text-sm text-muted-foreground">
                    <div>
                        <label>Full Name</label>
                        <input required type="text" className="w-full mt-1.5 bg-background border border-border rounded-xl p-3 text-foreground focus:border-rose-500 outline-none transition-colors"
                            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label>Age</label>
                            <input required type="number" min="1" className="w-full mt-1.5 bg-background border border-border rounded-xl p-3 text-foreground focus:border-rose-500 outline-none"
                                value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
                        </div>
                        <div>
                            <label>Blood Group</label>
                            <select className="w-full mt-1.5 bg-background border border-border rounded-xl p-3 text-foreground focus:border-rose-500 outline-none"
                                value={form.bloodGroup} onChange={e => setForm({ ...form, bloodGroup: e.target.value })}>
                                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => <option key={bg}>{bg}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label>Allergies</label>
                            <input required type="text" className="w-full mt-1.5 bg-background border border-border rounded-xl p-3 text-foreground focus:border-rose-500 outline-none"
                                value={form.allergies} onChange={e => setForm({ ...form, allergies: e.target.value })} />
                        </div>
                        <div>
                            <label>Current Medications</label>
                            <input required type="text" className="w-full mt-1.5 bg-background border border-border rounded-xl p-3 text-foreground focus:border-rose-500 outline-none"
                                value={form.currentMedications} onChange={e => setForm({ ...form, currentMedications: e.target.value })} />
                        </div>
                    </div>

                    <div>
                        <label>Select General Consultant (Verified Doctor required)</label>
                        <select required className="w-full mt-1.5 bg-background border border-border rounded-xl p-3 text-foreground focus:border-rose-500 outline-none"
                            value={form.consultant} onChange={e => setForm({ ...form, consultant: e.target.value })}>
                            <option value="" disabled>-- Choose a Doctor --</option>
                            {doctors.map(d => (
                                <option key={d.wallet} value={d.wallet}>{d.name} ({d.specialization})</option>
                            ))}
                        </select>
                        {doctors.length === 0 && <p className="text-rose-500 text-xs mt-1">No verified doctors available yet.</p>}
                    </div>

                    <div>
                        <label className="mb-1.5 block">Profile Picture</label>
                        <div className="flex items-center justify-center w-full border border-dashed border-border bg-background/50 hover:border-rose-500 rounded-xl h-24 transition-colors cursor-pointer relative overflow-hidden group">
                            <input required type="file" accept="image/*" onChange={e => setForm({ ...form, profilePic: e.target.files[0] })} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                            <div className="flex flex-col items-center justify-center text-foreground0 group-hover:text-rose-400">
                                <UploadCloud className="w-6 h-6 mb-1" />
                                <span className="text-xs px-2 text-center text-ellipsis overflow-hidden w-full whitespace-nowrap">{form.profilePic ? form.profilePic.name : "Upload Profile Image"}</span>
                            </div>
                        </div>
                    </div>

                    <Button disabled={loading || doctors.length === 0} className="w-full mt-6 bg-rose-600 hover:bg-rose-500 text-foreground rounded-xl h-12 text-lg shadow-lg shadow-rose-500/20 font-semibold transition-all">
                        {loading ? "Processing..." : "Join HealthChain"}
                    </Button>
                </form>
            </div>
        </div>
    );
}
