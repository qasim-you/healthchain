"use client";

import { useEffect, useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { useWeb3Context } from "@/contexts/Web3Context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, UserX, FileText } from "lucide-react";

export default function VerifyDoctors() {
    const { contract } = useWeb3Context();
    const { toast } = useToast();
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDoctors = async () => {
        if (!contract) return;
        try {
            const docs = await contract.getAllDoctors();
            setDoctors(docs);
        } catch (error) {
            console.error("Error fetching doctors:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDoctors();
    }, [contract]);

    const handleVerify = async (wallet, status) => {
        try {
            const tx = await contract.verifyDoctor(wallet, status);
            await tx.wait();
            toast({
                title: "Success",
                description: `Doctor ${status ? "Verified" : "Rejected"} Successfully.`,
            });
            fetchDoctors();
        } catch (error) {
            console.error(error);
            toast({
                title: "Transaction Failed",
                description: error?.reason || error.message,
                variant: "destructive",
            });
        }
    };

    return (
        <PageLayout requiredRole="admin" title="KYC / Verify Doctors">
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-border flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Pending verifications</h2>
                        <p className="text-muted-foreground text-sm mt-1">Approve professionals to join the ecosystem</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-background/50 text-muted-foreground text-sm uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">Doctor</th>
                                <th className="px-6 py-4 font-semibold">Specialization</th>
                                <th className="px-6 py-4 font-semibold">Experience</th>
                                <th className="px-6 py-4 font-semibold">Certificate</th>
                                <th className="px-6 py-4 font-semibold w-64 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 text-foreground">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-foreground0">Loading doctors...</td>
                                </tr>
                            ) : doctors.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-foreground0">No doctors registered yet.</td>
                                </tr>
                            ) : (
                                doctors.map((doc, idx) => (
                                    <tr key={idx} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img src={doc.profileImageURI || `https://api.dicebear.com/7.x/initials/svg?seed=${doc.name}`}
                                                    className="w-10 h-10 rounded-full object-cover bg-muted" alt="avatar" />
                                                <div>
                                                    <p className="font-semibold text-foreground">{doc.name}</p>
                                                    <p className="text-xs text-foreground0 bg-muted px-2 py-0.5 rounded-full inline-block mt-1">
                                                        {doc.wallet.slice(0, 6)}...{doc.wallet.slice(-4)}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-muted-foreground">{doc.specialization}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{doc.experience}</td>
                                        <td className="px-6 py-4">
                                            <a href={doc.certificateURI} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-primary hover:text-primary transition-colors bg-primary/10 px-3 py-1.5 rounded-lg w-fit">
                                                <FileText className="w-4 h-4" /> View PDF
                                            </a>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {doc.isVerified ? (
                                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1">
                                                    Verified
                                                </Badge>
                                            ) : (
                                                <div className="flex items-center gap-2 justify-center">
                                                    <Button size="sm" onClick={() => handleVerify(doc.wallet, true)}
                                                        className="bg-primary hover:bg-primary/90 text-foreground rounded-lg">
                                                        <UserCheck className="w-4 h-4 mr-1.5" /> Approve
                                                    </Button>
                                                    <Button size="sm" variant="destructive" onClick={() => handleVerify(doc.wallet, false)}
                                                        className="rounded-lg">
                                                        <UserX className="w-4 h-4 mr-1.5" /> Reject
                                                    </Button>
                                                </div>
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
