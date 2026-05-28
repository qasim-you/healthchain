"use client";

import { useState, useEffect } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { useWeb3Context } from "@/contexts/Web3Context";
import { 
    User, Shield, Stethoscope, Clock, FileText, BadgeCheck, Phone, Activity, HeartPulse 
} from "lucide-react";

export default function ProfilePage() {
    const { account, role, contract } = useWeb3Context();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!contract || !account || !role) {
            setLoading(false);
            return;
        }

        const fetchProfile = async () => {
            try {
                if (role === "patient") {
                    const data = await contract.patients(account);
                    setProfileData(data);
                } else if (role === "doctor") {
                    const data = await contract.doctors(account);
                    setProfileData(data);
                } else if (role === "admin") {
                    setProfileData({ name: "System Administrator", role: "admin" });
                }
            } catch (err) {
                console.error("Error fetching profile", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [contract, account, role]);

    if (loading) {
        return (
            <PageLayout title="My Profile">
                <div className="flex h-64 items-center justify-center">
                    <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </PageLayout>
        );
    }

    if (!profileData) {
        return (
            <PageLayout title="My Profile">
                <div className="flex flex-col items-center justify-center h-64 bg-card border border-border rounded-3xl shadow-xl">
                    <User className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-bold text-foreground">Profile Not Found</h3>
                    <p className="text-muted-foreground">Please make sure you are registered and connected.</p>
                </div>
            </PageLayout>
        );
    }

    const renderPatientProfile = () => (
        <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                <div className="flex flex-col items-center">
                    <div className="w-32 h-32 rounded-full bg-muted border-4 border-primary shadow-xl overflow-hidden mb-4">
                        <img 
                            src={profileData.profileImageURI || `https://api.dicebear.com/7.x/initials/svg?seed=${profileData.name}`} 
                            alt={profileData.name} 
                            className="w-full h-full object-cover" 
                        />
                    </div>
                    <div className="bg-primary/10 text-primary px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase flex items-center gap-2">
                        <User className="w-3 h-3" /> Patient
                    </div>
                </div>
                
                <div className="flex-1 space-y-6 w-full">
                    <div>
                        <h2 className="text-4xl font-extrabold text-foreground tracking-tight">{profileData.name}</h2>
                        <p className="text-sm font-mono text-muted-foreground mt-1 bg-background/50 inline-block px-3 py-1 rounded-lg border border-border">{account}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-background/50 border border-border p-4 rounded-2xl flex items-center gap-4">
                            <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl"><Activity className="w-6 h-6" /></div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Age</p>
                                <p className="text-lg font-bold text-foreground">{Number(profileData.age)} Years</p>
                            </div>
                        </div>
                        <div className="bg-background/50 border border-border p-4 rounded-2xl flex items-center gap-4">
                            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl"><HeartPulse className="w-6 h-6" /></div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Blood Group</p>
                                <p className="text-lg font-bold text-rose-400">{profileData.bloodGroup}</p>
                            </div>
                        </div>
                        <div className="bg-background/50 border border-border p-4 rounded-2xl flex items-center gap-4 md:col-span-2">
                            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl"><Shield className="w-6 h-6" /></div>
                            <div className="flex-1">
                                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Allergies</p>
                                <p className="text-md font-medium text-foreground">{profileData.allergies || "No known allergies"}</p>
                            </div>
                        </div>
                        <div className="bg-background/50 border border-border p-4 rounded-2xl flex items-center gap-4 md:col-span-2">
                            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl"><FileText className="w-6 h-6" /></div>
                            <div className="flex-1">
                                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Current Medications</p>
                                <p className="text-md font-medium text-foreground">{profileData.currentMedications || "None"}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderDoctorProfile = () => (
        <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 blur-[80px] rounded-full pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                <div className="flex flex-col items-center">
                    <div className="w-32 h-32 rounded-full bg-muted border-4 border-teal-500 shadow-xl overflow-hidden mb-4 relative">
                        <img 
                            src={profileData.profileImageURI || `https://api.dicebear.com/7.x/initials/svg?seed=${profileData.name}`} 
                            alt={profileData.name} 
                            className="w-full h-full object-cover" 
                        />
                        {profileData.isVerified && (
                            <div className="absolute bottom-1 right-1 bg-teal-500 text-white rounded-full p-1 border-2 border-card">
                                <BadgeCheck className="w-5 h-5" />
                            </div>
                        )}
                    </div>
                    <div className="bg-teal-500/10 text-teal-400 px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase flex items-center gap-2">
                        <Stethoscope className="w-3 h-3" /> Doctor
                    </div>
                </div>
                
                <div className="flex-1 space-y-6 w-full">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-4xl font-extrabold text-foreground tracking-tight">Dr. {profileData.name}</h2>
                            {profileData.isVerified && <BadgeCheck className="w-8 h-8 text-teal-500" />}
                        </div>
                        <p className="text-sm font-mono text-muted-foreground mt-2 bg-background/50 inline-block px-3 py-1 rounded-lg border border-border">{account}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-background/50 border border-border p-4 rounded-2xl flex items-center gap-4">
                            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl"><Stethoscope className="w-6 h-6" /></div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Specialization</p>
                                <p className="text-lg font-bold text-foreground">{profileData.specialization}</p>
                            </div>
                        </div>
                        <div className="bg-background/50 border border-border p-4 rounded-2xl flex items-center gap-4">
                            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl"><Clock className="w-6 h-6" /></div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Experience</p>
                                <p className="text-lg font-bold text-foreground">{profileData.experience} Years</p>
                            </div>
                        </div>
                        <div className="bg-background/50 border border-border p-4 rounded-2xl flex items-center gap-4 md:col-span-2">
                            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl"><Clock className="w-6 h-6" /></div>
                            <div className="flex-1">
                                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Available Hours</p>
                                <p className="text-md font-medium text-foreground">{profileData.availableHours}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderAdminProfile = () => (
        <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 blur-[80px] rounded-full pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
                <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-rose-500 to-orange-500 flex items-center justify-center border-4 border-card shadow-xl shadow-rose-500/30">
                    <Shield className="w-16 h-16 text-white" />
                </div>
                
                <div className="flex-1 space-y-4">
                    <div>
                        <h2 className="text-4xl font-extrabold text-foreground tracking-tight">{profileData.name}</h2>
                        <p className="text-sm font-mono text-rose-400 mt-2 bg-rose-500/10 inline-block px-3 py-1 rounded-lg border border-rose-500/20">{account}</p>
                    </div>
                    <p className="text-muted-foreground max-w-lg">
                        You have full access to the HealthChain network platform settings, including doctor verification and marketplace management.
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <PageLayout title="My Profile">
            <div className="max-w-4xl mx-auto mt-6">
                {role === "patient" && renderPatientProfile()}
                {role === "doctor" && renderDoctorProfile()}
                {role === "admin" && renderAdminProfile()}
            </div>
        </PageLayout>
    );
}
