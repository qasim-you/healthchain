"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { useWeb3Context } from "@/contexts/Web3Context";
import { uploadFileToIPFS } from "@/utils/ipfs";
import { Button } from "@/components/ui/button";
import { Stethoscope, UploadCloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RegisterDoctor() {
    const router = useRouter();
    const { contract, account, isWalletConnected } = useWeb3Context();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        name: "", specialization: "", experience: "", fee: "", hours: "",
        profilePic: null, certificate: null
    });

    useEffect(() => {
        if (!isWalletConnected) {
            router.push("/");
        }
    }, [isWalletConnected, router]);

    if (!isWalletConnected) return null;

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!contract) return;
        setLoading(true);

        try {
            toast({ title: "Uploading files...", description: "Please wait while we upload your profile to IPFS." });

            const profileImageURI = await uploadFileToIPFS(form.profilePic);
            const certificateURI = await uploadFileToIPFS(form.certificate);
            const feeWei = ethers.parseEther(form.fee.toString());
            const registrationFee = ethers.parseEther("0.0002"); // Lowered fee for easier testing

            const tx = await contract.registerDoctor(
                form.name,
                form.specialization,
                form.experience,
                feeWei,
                form.hours,
                profileImageURI,
                certificateURI,
                { value: registrationFee }
            );

            toast({ title: "Transaction submitted", description: "Waiting for blockchain confirmation..." });
            await tx.wait();

            toast({ title: "Success", description: "You are now registered as a Doctor! Awaiting Admin verification." });
            router.push("/");
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
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none"></div>

                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                        <Stethoscope className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">Doctor Registration</h2>
                        <p className="text-muted-foreground text-sm">Join the decentralized medical network (Registration Fee: 0.0001 ETH)</p>
                    </div>
                </div>

                <form onSubmit={handleRegister} className="space-y-5 text-sm text-muted-foreground">
                    <div>
                        <label>Full Name</label>
                        <input required type="text" className="w-full mt-1.5 bg-background border border-border rounded-xl p-3 text-foreground focus:border-primary outline-none transition-colors"
                            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label>Specialization</label>
                            <input required type="text" className="w-full mt-1.5 bg-background border border-border rounded-xl p-3 text-foreground focus:border-primary outline-none"
                                value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} />
                        </div>
                        <div>
                            <label>Experience (Years)</label>
                            <input required type="text" className="w-full mt-1.5 bg-background border border-border rounded-xl p-3 text-foreground focus:border-primary outline-none"
                                value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label>Consultation Fee (ETH)</label>
                            <input required type="number" step="0.0001" className="w-full mt-1.5 bg-background border border-border rounded-xl p-3 text-foreground focus:border-primary outline-none"
                                value={form.fee} onChange={e => setForm({ ...form, fee: e.target.value })} />
                        </div>
                        <div>
                            <label>Available Hours (e.g. 9AM - 5PM)</label>
                            <input required type="text" className="w-full mt-1.5 bg-background border border-border rounded-xl p-3 text-foreground focus:border-primary outline-none"
                                value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1.5 block">Profile Picture</label>
                            <div className="flex items-center justify-center w-full border border-dashed border-border bg-background/50 hover:border-primary rounded-xl h-24 transition-colors cursor-pointer relative overflow-hidden group">
                                <input required type="file" accept="image/*" onChange={e => setForm({ ...form, profilePic: e.target.files[0] })} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                <div className="flex flex-col items-center justify-center text-foreground0 group-hover:text-primary">
                                    <UploadCloud className="w-6 h-6 mb-1" />
                                    <span className="text-xs px-2 text-center text-ellipsis overflow-hidden w-full whitespace-nowrap">{form.profilePic ? form.profilePic.name : "Upload Image"}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block">Medical Certificate (PDF)</label>
                            <div className="flex items-center justify-center w-full border border-dashed border-border bg-background/50 hover:border-primary rounded-xl h-24 transition-colors cursor-pointer relative overflow-hidden group">
                                <input required type="file" accept=".pdf" onChange={e => setForm({ ...form, certificate: e.target.files[0] })} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                <div className="flex flex-col items-center justify-center text-foreground0 group-hover:text-primary">
                                    <UploadCloud className="w-6 h-6 mb-1" />
                                    <span className="text-xs px-2 text-center text-ellipsis overflow-hidden w-full whitespace-nowrap">{form.certificate ? form.certificate.name : "Upload PDF"}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Button disabled={loading} className="w-full mt-6 bg-primary hover:bg-primary/90 text-foreground rounded-xl h-12 text-lg shadow-lg shadow-primary/20 font-semibold transition-all">
                        {loading ? "Processing..." : "Submit Registration (0.0001 ETH)"}
                    </Button>
                </form>
            </div>
        </div>
    );
}
