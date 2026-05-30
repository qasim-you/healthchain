"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import PageLayout from "@/components/layout/PageLayout";
import { useWeb3Context } from "@/contexts/Web3Context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Ethereum, Stethoscope, Search, Sparkles } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function FindDoctor() {
    const { contract } = useWeb3Context();
    const { toast } = useToast();
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [form, setForm] = useState({ date: "", time: "", note: "" });
    const [booking, setBooking] = useState(false);

    const fetchDoctors = async () => {
        if (!contract) return;
        try {
            const allDocs = await contract.getAllDoctors();
            setDoctors(allDocs.filter(d => d.isVerified));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDoctors();
    }, [contract]);

    const handleBook = async (e) => {
        e.preventDefault();
        if (!contract || !selectedDoctor) return;
        setBooking(true);

        try {
            const feeWei = selectedDoctor.consultationFee;
            const combinedTime = `${form.date} ${form.time}`;

            const tx = await contract.bookAppointment(
                selectedDoctor.wallet,
                combinedTime,
                form.note,
                { value: feeWei }
            );

            toast({ title: "Booking sent", description: "Waiting for blockchain confirmation..." });
            await tx.wait();

            toast({ title: "Appointment booked!", description: "Check your dashboard for updates." });
            setSelectedDoctor(null);
            setForm({ date: "", time: "", note: "" });
        } catch (error) {
            console.error(error);
            toast({ title: "Booking Failed", description: error?.reason || error.message, variant: "destructive" });
        } finally {
            setBooking(false);
        }
    };

    return (
        <PageLayout requiredRole="patient" title="Find a Specialist">
            <div className="flex justify-between items-center mb-8 relative z-10">
                <div>
                    <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Ecosystem Specialists</h2>
                    <p className="text-muted-foreground mt-2">Book a consultation directly. 10% platform fee applied.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground0 w-5 h-5" />
                    <input type="text" placeholder="Search specialization..." className="bg-card border border-border text-foreground placeholder-slate-500 rounded-full h-12 pl-12 pr-6 w-72 focus:ring-2 focus:ring-primary outline-none transition-all" />
                </div>
            </div>

            {/* Grok AI Recommendation Banner */}
            {!loading && doctors.length > 0 && (
                (() => {
                    // Simple local Grok Intelligence: Suggest the most experienced doctor
                    const topDoc = [...doctors].sort((a, b) => parseInt(b.experience) - parseInt(a.experience))[0];
                    return (
                        <div className="mb-8 p-1 rounded-3xl bg-gradient-to-r from-primary via-secondary to-accent animate-pulse relative z-10">
                            <div className="bg-card rounded-[22px] p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 border border-border/50">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/30 shrink-0">
                                    <Sparkles className="w-8 h-8 text-primary" />
                                </div>
                                <div className="flex-1 text-center sm:text-left">
                                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                                        <h3 className="text-lg font-bold text-foreground">Grok AI Suggestion</h3>
                                        <Badge className="bg-primary text-white border-none py-0.5 px-2">Top Match</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Based on on-chain analytics, we highly recommend <b>{topDoc.name}</b> for an expert consultation. They hold the highest verified clinical experience in the network ({topDoc.experience} Years as a {topDoc.specialization}).
                                    </p>
                                </div>
                                <Button onClick={() => setSelectedDoctor(topDoc)} className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shrink-0 mt-4 sm:mt-0 px-6">
                                    Book {topDoc.name} Now
                                </Button>
                            </div>
                        </div>
                    );
                })()
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading ? (
                    Array(4).fill(0).map((_, i) => <div key={i} className="h-72 bg-card rounded-3xl animate-pulse border border-border" />)
                ) : doctors.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-foreground0">
                        <Stethoscope className="w-16 h-16 opacity-30 mx-auto mb-4" />
                        <p>No verified doctors found in the network.</p>
                    </div>
                ) : (
                    doctors.map((doc, idx) => (
                        <div key={idx} className="bg-card border border-border rounded-3xl p-6 shadow-xl flex flex-col items-center text-center relative overflow-hidden group hover:border-primary/50 transition-all">
                            <div className="w-24 h-24 mb-4 rounded-full border-4 border-border bg-muted overflow-hidden relative z-10 group-hover:border-primary transition-colors">
                                <img src={doc.profileImageURI || `https://api.dicebear.com/7.x/initials/svg?seed=${doc.name}`} alt={doc.name} className="w-full h-full object-cover" />
                            </div>
                            <Badge className="bg-primary/10 text-primary border-none mb-3 px-3 relative z-10">{doc.specialization}</Badge>
                            <h3 className="text-xl font-bold text-foreground relative z-10">{doc.name}</h3>
                            <p className="text-muted-foreground text-sm mt-1 mb-4 relative z-10">{doc.experience} Years Experience</p>

                            <div className="w-full bg-background rounded-2xl p-4 mb-5 text-left border border-border/50 relative z-10">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-foreground0">Consultation Fee</span>
                                    <span className="font-bold text-primary">{ethers.formatEther(doc.consultationFee)} ETH</span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-foreground0">
                                    <span>Available Hours</span>
                                    <span className="text-muted-foreground">{doc.availableHours}</span>
                                </div>
                            </div>

                            <Button onClick={() => setSelectedDoctor(doc)} className="w-full mt-auto bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg relative z-10">
                                Book Consultation
                            </Button>
                        </div>
                    ))
                )}
            </div>

            <Dialog open={!!selectedDoctor} onOpenChange={(open) => !open && setSelectedDoctor(null)}>
                <DialogContent className="bg-card border-border text-foreground sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold mb-1">Book Appointment</DialogTitle>
                        <p className="text-muted-foreground text-sm">Consultation with {selectedDoctor?.name}</p>
                    </DialogHeader>

                    <form onSubmit={handleBook} className="mt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-muted-foreground mb-1.5 block">Date</label>
                                <input type="date" required className="w-full bg-background border border-border rounded-xl p-3 text-foreground focus:border-primary outline-none"
                                    value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground mb-1.5 block">Time</label>
                                <input type="time" required className="w-full bg-background border border-border rounded-xl p-3 text-foreground focus:border-primary outline-none"
                                    value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm text-muted-foreground mb-1.5 block">Symptom Note</label>
                            <textarea required placeholder="Describe your symptoms briefly..." rows="3" className="w-full bg-background border border-border rounded-xl p-3 text-foreground focus:border-primary outline-none"
                                value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
                        </div>

                        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex justify-between items-center">
                            <span className="text-primary font-medium">Total Payable</span>
                            <span className="text-xl font-bold text-primary">{selectedDoctor && ethers.formatEther(selectedDoctor.consultationFee)} ETH</span>
                        </div>

                        <Button disabled={booking} className="w-full h-12 bg-primary hover:bg-primary/90 text-lg font-semibold rounded-xl mt-4">
                            {booking ? "Confirming via Wallet..." : "Pay & Book"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </PageLayout>
    );
}
