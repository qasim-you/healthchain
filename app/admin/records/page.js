"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import PageLayout from "@/components/layout/PageLayout";
import { useWeb3Context } from "@/contexts/Web3Context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
    Users, Stethoscope, Pill, CalendarCheck, Wallet, 
    Search, ClipboardList, CheckCircle2, XCircle, 
    ArrowRightLeft, Activity, Info, Download, ShieldAlert
} from "lucide-react";

export default function AdminRecords() {
    const { contract } = useWeb3Context();
    const { toast } = useToast();
    
    // Core data states
    const [stats, setStats] = useState({
        doctors: 0,
        patients: 0,
        medicines: 0,
        appointments: 0,
        revenue: "0"
    });
    const [doctors, setDoctors] = useState([]);
    const [patients, setPatients] = useState([]);
    const [medicines, setMedicines] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [purchases, setPurchases] = useState([]);
    
    // UI Loading & Action states
    const [loading, setLoading] = useState(true);
    const [withdrawLoading, setWithdrawLoading] = useState(false);
    
    // Search states
    const [searchDoc, setSearchDoc] = useState("");
    const [searchPat, setSearchPat] = useState("");
    const [searchMed, setSearchMed] = useState("");
    const [searchLedger, setSearchLedger] = useState("");

    const fetchData = async () => {
        if (!contract) return;
        setLoading(true);
        try {
            // 1. Get overall platform stats
            const statsData = await contract.getPlatformStats();
            const currentStats = {
                doctors: Number(statsData[0]),
                patients: Number(statsData[1]),
                medicines: Number(statsData[2]),
                appointments: Number(statsData[3]),
                revenue: ethers.formatEther(statsData[4])
            };
            setStats(currentStats);

            // 2. Fetch Doctors
            const docs = await contract.getAllDoctors();
            setDoctors(docs);

            // Create doctor mapping for quick lookup (address -> name)
            const docMap = {};
            docs.forEach(d => {
                docMap[d.wallet.toLowerCase()] = {
                    name: d.name,
                    fee: d.consultationFee
                };
            });

            // 3. Fetch Medicines (Inventory)
            const meds = await contract.getAllMedicines();
            setMedicines(meds);

            const medMap = {};
            meds.forEach(m => {
                medMap[Number(m.id)] = {
                    name: m.name,
                    price: m.price,
                    discount: Number(m.discount)
                };
            });

            // 4. Fetch Patients in parallel
            const patientsList = [];
            const patientPromises = [];
            for (let i = 0; i < currentStats.patients; i++) {
                patientPromises.push(
                    (async () => {
                        const addr = await contract.patientAddresses(i);
                        const data = await contract.patients(addr);
                        return {
                            wallet: addr,
                            name: data.name,
                            age: Number(data.age),
                            bloodGroup: data.bloodGroup,
                            allergies: data.allergies,
                            currentMedications: data.currentMedications,
                            profileImageURI: data.profileImageURI,
                            generalConsultant: data.generalConsultant,
                            isRegistered: data.isRegistered
                        };
                    })()
                );
            }
            const resolvedPatients = await Promise.all(patientPromises);
            setPatients(resolvedPatients);

            // Create patient mapping for quick lookup (address -> name)
            const patMap = {};
            resolvedPatients.forEach(p => {
                patMap[p.wallet.toLowerCase()] = p.name;
            });

            // 5. Fetch Appointments in parallel
            const appointmentPromises = [];
            for (let i = 1; i <= currentStats.appointments; i++) {
                appointmentPromises.push(
                    (async () => {
                        const appt = await contract.appointments(i);
                        const dAddress = appt.doctor.toLowerCase();
                        const pAddress = appt.patient.toLowerCase();
                        
                        return {
                            id: Number(appt.id),
                            patientWallet: appt.patient,
                            patientName: patMap[pAddress] || "Unregistered Patient",
                            doctorWallet: appt.doctor,
                            doctorName: docMap[dAddress]?.name || "Unknown Doctor",
                            consultationFee: docMap[dAddress]?.fee || 0n,
                            time: appt.time,
                            note: appt.note,
                            isCompleted: appt.isCompleted
                        };
                    })()
                );
            }
            const resolvedAppts = await Promise.all(appointmentPromises);
            setAppointments(resolvedAppts.reverse()); // Latest appointments first

            // 6. Fetch historical medicine purchases (events)
            try {
                const purchaseEvents = await contract.queryFilter(contract.filters.MedicinePurchased(), 0, "latest");
                const resolvedPurchases = purchaseEvents.map(event => {
                    const patientAddr = event.args[0];
                    const medId = Number(event.args[1]);
                    const qty = Number(event.args[2]);
                    
                    const medInfo = medMap[medId];
                    const rawPrice = medInfo ? medInfo.price : 0n;
                    const discount = medInfo ? medInfo.discount : 0;
                    
                    // Calculate cost matching smart contract formula:
                    // cost = med.price * quantity
                    // discountAmount = (cost * med.discount) / 100
                    // finalPrice = cost - discountAmount
                    const cost = rawPrice * BigInt(qty);
                    const discountAmount = (cost * BigInt(discount)) / 100n;
                    const finalPrice = cost - discountAmount;

                    return {
                        patientWallet: patientAddr,
                        patientName: patMap[patientAddr.toLowerCase()] || "Unknown Patient",
                        medicineId: medId,
                        medicineName: medInfo ? medInfo.name : `Medicine #${medId}`,
                        quantity: qty,
                        totalPaid: ethers.formatEther(finalPrice),
                        txHash: event.transactionHash,
                        blockNumber: event.blockNumber
                    };
                });
                setPurchases(resolvedPurchases.reverse()); // Latest purchases first
            } catch (eventError) {
                console.warn("Failed to fetch events from provider, displaying empty transaction ledger list.", eventError);
            }

        } catch (error) {
            console.error("Error loading registry data:", error);
            toast({
                title: "Failed to load records",
                description: error?.reason || error.message || "Smart contract connection error",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [contract]);

    const handleWithdraw = async () => {
        if (!contract) return;
        if (Number(stats.revenue) <= 0) {
            toast({
                title: "Cannot Withdraw",
                description: "There is no revenue accumulated in the platform contract currently.",
                variant: "destructive"
            });
            return;
        }

        setWithdrawLoading(true);
        try {
            const tx = await contract.withdrawPlatformRevenue();
            toast({
                title: "Transaction Submitted",
                description: "Withdrawing accumulated revenue to your wallet..."
            });
            await tx.wait();
            toast({
                title: "Success",
                description: "Accumulated ETH successfully withdrawn to admin account!"
            });
            fetchData();
        } catch (error) {
            console.error("Withdrawal error:", error);
            toast({
                title: "Withdrawal Failed",
                description: error?.reason || error.message || "Transaction reverted",
                variant: "destructive"
            });
        } finally {
            setWithdrawLoading(false);
        }
    };

    // Filter Logic
    const filteredDoctors = doctors.filter(doc => 
        doc.name.toLowerCase().includes(searchDoc.toLowerCase()) ||
        doc.specialization.toLowerCase().includes(searchDoc.toLowerCase()) ||
        doc.wallet.toLowerCase().includes(searchDoc.toLowerCase())
    );

    const filteredPatients = patients.filter(pat => 
        pat.name.toLowerCase().includes(searchPat.toLowerCase()) ||
        pat.wallet.toLowerCase().includes(searchPat.toLowerCase()) ||
        pat.bloodGroup.toLowerCase().includes(searchPat.toLowerCase())
    );

    const filteredMedicines = medicines.filter(med => 
        med.name.toLowerCase().includes(searchMed.toLowerCase()) ||
        med.manufacturer.toLowerCase().includes(searchMed.toLowerCase()) ||
        med.category.toLowerCase().includes(searchMed.toLowerCase())
    );

    const filteredAppointments = appointments.filter(appt => 
        appt.patientName.toLowerCase().includes(searchLedger.toLowerCase()) ||
        appt.doctorName.toLowerCase().includes(searchLedger.toLowerCase()) ||
        appt.patientWallet.toLowerCase().includes(searchLedger.toLowerCase()) ||
        appt.doctorWallet.toLowerCase().includes(searchLedger.toLowerCase())
    );

    const filteredPurchases = purchases.filter(p => 
        p.patientName.toLowerCase().includes(searchLedger.toLowerCase()) ||
        p.medicineName.toLowerCase().includes(searchLedger.toLowerCase()) ||
        p.patientWallet.toLowerCase().includes(searchLedger.toLowerCase())
    );

    const cards = [
        { title: "Registered Doctors", value: stats.doctors, icon: Stethoscope, bg: "bg-rose-500/10", border: "border-rose-500/20", color: "text-rose-400" },
        { title: "Registered Patients", value: stats.patients, icon: Users, bg: "bg-teal-500/10", border: "border-teal-500/20", color: "text-teal-400" },
        { title: "Inventory Medicines", value: stats.medicines, icon: Pill, bg: "bg-violet-500/10", border: "border-violet-500/20", color: "text-violet-400" },
        { title: "Consultations", value: stats.appointments, icon: CalendarCheck, bg: "bg-amber-500/10", border: "border-amber-500/20", color: "text-amber-400" },
    ];

    return (
        <PageLayout requiredRole="admin" title="Platform Registry & Ledger">
            <div className="space-y-8">
                
                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {cards.map((card, i) => {
                        const Icon = card.icon;
                        return (
                            <Card key={i} className={`hover:border-primary/40 border ${card.border} transition-colors bg-card shadow-sm`}>
                                <CardContent className="p-6 flex items-center gap-5">
                                    <div className={`w-12 h-12 rounded-2xl ${card.bg} flex items-center justify-center shrink-0`}>
                                        <Icon className={`w-6 h-6 ${card.color}`} />
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground font-medium text-xs uppercase tracking-wider">{card.title}</p>
                                        <h3 className="text-2xl font-bold mt-1 text-foreground">{loading ? "..." : card.value}</h3>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* ── Financial Revenue Panel ── */}
                <Card className="border border-border/80 bg-card/60 backdrop-blur-md relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/5 blur-[100px] rounded-full pointer-events-none"></div>
                    <CardHeader className="pb-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                                    <Wallet className="w-5 h-5 text-rose-400" /> Platform Revenue Management
                                </CardTitle>
                                <CardDescription className="text-muted-foreground text-sm">
                                    Track smart contract funds generated from doctor registration fees (100% platform) and consultation bookings (10% commission).
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-4 bg-muted/30 px-6 py-3 rounded-2xl border border-border/40">
                                <div>
                                    <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Contract Balance</p>
                                    <p className="text-2xl font-black text-rose-400 font-mono">{loading ? "..." : stats.revenue} ETH</p>
                                </div>
                                <Button 
                                    onClick={handleWithdraw} 
                                    disabled={withdrawLoading || Number(stats.revenue) <= 0}
                                    className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-lg shadow-rose-500/20 px-5 font-semibold h-11"
                                >
                                    {withdrawLoading ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    ) : (
                                        <>
                                            <Download className="w-4 h-4 mr-2" /> Withdraw Fees
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* ── Main Tabbed Registry ── */}
                <Tabs defaultValue="patients" className="space-y-6">
                    <div className="border-b border-border/55 pb-2">
                        <TabsList className="bg-muted/40 p-1 border border-border/45 rounded-xl h-11">
                            <TabsTrigger value="patients" className="rounded-lg px-4 font-medium text-sm data-[state=active]:bg-background">
                                <Users className="w-4 h-4 mr-2" /> Patients Directory
                            </TabsTrigger>
                            <TabsTrigger value="doctors" className="rounded-lg px-4 font-medium text-sm data-[state=active]:bg-background">
                                <Stethoscope className="w-4 h-4 mr-2" /> Doctors Directory
                            </TabsTrigger>
                            <TabsTrigger value="inventory" className="rounded-lg px-4 font-medium text-sm data-[state=active]:bg-background">
                                <Pill className="w-4 h-4 mr-2" /> Pharmacy Inventory
                            </TabsTrigger>
                            <TabsTrigger value="ledger" className="rounded-lg px-4 font-medium text-sm data-[state=active]:bg-background">
                                <ArrowRightLeft className="w-4 h-4 mr-2" /> Payment Ledger
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* ───── TAB: PATIENTS ───── */}
                    <TabsContent value="patients" className="outline-none">
                        <Card className="bg-card border border-border rounded-2xl shadow-md">
                            <CardHeader className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-lg font-bold">Registered Patients</CardTitle>
                                    <CardDescription>Verify patient profiles, medical backgrounds, and general consultants.</CardDescription>
                                </div>
                                <div className="relative w-full md:w-80">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search patient name, blood group, or wallet..."
                                        value={searchPat}
                                        onChange={(e) => setSearchPat(e.target.value)}
                                        className="pl-10 rounded-xl bg-background/50 focus-visible:ring-primary border-border h-10 text-sm"
                                    />
                                </div>
                            </CardHeader>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-muted/20">
                                        <TableRow>
                                            <TableHead className="px-6 py-4 font-semibold">Patient</TableHead>
                                            <TableHead className="px-6 py-4 font-semibold">Age</TableHead>
                                            <TableHead className="px-6 py-4 font-semibold">Blood Group</TableHead>
                                            <TableHead className="px-6 py-4 font-semibold">General Consultant</TableHead>
                                            <TableHead className="px-6 py-4 font-semibold">Allergies</TableHead>
                                            <TableHead className="px-6 py-4 font-semibold">Current Medications</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="divide-y divide-border/30">
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan="6" className="py-10 text-center text-muted-foreground">Loading blockchain registry...</TableCell>
                                            </TableRow>
                                        ) : filteredPatients.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan="6" className="py-10 text-center text-muted-foreground">
                                                    {patients.length === 0 ? "No patients registered yet." : "No matching patients found."}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredPatients.map((pat, idx) => (
                                                <TableRow key={idx} className="hover:bg-muted/10 transition-colors">
                                                    <TableCell className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <img 
                                                                src={pat.profileImageURI || `https://api.dicebear.com/7.x/adventurer/svg?seed=${pat.name}`}
                                                                className="w-10 h-10 rounded-xl object-cover bg-muted/30 border border-border"
                                                                alt="avatar" 
                                                            />
                                                            <div>
                                                                <p className="font-semibold text-foreground leading-none">{pat.name}</p>
                                                                <p className="font-mono text-[10px] text-muted-foreground mt-1.5 bg-muted/40 px-2 py-0.5 rounded-md inline-block">
                                                                    {pat.wallet.slice(0, 8)}...{pat.wallet.slice(-6)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 font-medium text-foreground">{pat.age} yrs</TableCell>
                                                    <TableCell className="px-6 py-4">
                                                        <Badge variant="outline" className="bg-teal-500/10 text-teal-400 border-teal-500/25 px-2 py-0.5 rounded">
                                                            {pat.bloodGroup}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-foreground text-sm">
                                                                {doctors.find(d => d.wallet.toLowerCase() === pat.generalConsultant.toLowerCase())?.name || "Dr. Assigned"}
                                                            </span>
                                                            <span className="font-mono text-[9px] text-muted-foreground mt-0.5">
                                                                {pat.generalConsultant.slice(0, 6)}...{pat.generalConsultant.slice(-4)}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 text-muted-foreground text-sm max-w-[200px] truncate" title={pat.allergies}>
                                                        {pat.allergies || "None declared"}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 text-muted-foreground text-sm max-w-[200px] truncate" title={pat.currentMedications}>
                                                        {pat.currentMedications || "None"}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                    </TabsContent>

                    {/* ───── TAB: DOCTORS ───── */}
                    <TabsContent value="doctors" className="outline-none">
                        <Card className="bg-card border border-border rounded-2xl shadow-md">
                            <CardHeader className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-lg font-bold">Registered Doctors</CardTitle>
                                    <CardDescription>Oversee medical professionals, credentials, fees, and verification status.</CardDescription>
                                </div>
                                <div className="relative w-full md:w-80">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search doctor name, specialty, or wallet..."
                                        value={searchDoc}
                                        onChange={(e) => setSearchDoc(e.target.value)}
                                        className="pl-10 rounded-xl bg-background/50 focus-visible:ring-primary border-border h-10 text-sm"
                                    />
                                </div>
                            </CardHeader>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-muted/20">
                                        <TableRow>
                                            <TableHead className="px-6 py-4 font-semibold">Doctor</TableHead>
                                            <TableHead className="px-6 py-4 font-semibold">Specialization</TableHead>
                                            <TableHead className="px-6 py-4 font-semibold">Experience</TableHead>
                                            <TableHead className="px-6 py-4 font-semibold">Consultation Fee</TableHead>
                                            <TableHead className="px-6 py-4 font-semibold">Availability</TableHead>
                                            <TableHead className="px-6 py-4 font-semibold text-center">Credentials</TableHead>
                                            <TableHead className="px-6 py-4 font-semibold text-right">Verification</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="divide-y divide-border/30">
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan="7" className="py-10 text-center text-muted-foreground">Loading blockchain registry...</TableCell>
                                            </TableRow>
                                        ) : filteredDoctors.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan="7" className="py-10 text-center text-muted-foreground">
                                                    {doctors.length === 0 ? "No doctors registered yet." : "No matching doctors found."}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredDoctors.map((doc, idx) => (
                                                <TableRow key={idx} className="hover:bg-muted/10 transition-colors">
                                                    <TableCell className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <img 
                                                                src={doc.profileImageURI || `https://api.dicebear.com/7.x/initials/svg?seed=${doc.name}`}
                                                                className="w-10 h-10 rounded-full object-cover bg-muted/30 border border-border"
                                                                alt="avatar" 
                                                            />
                                                            <div>
                                                                <p className="font-semibold text-foreground leading-none">{doc.name}</p>
                                                                <p className="font-mono text-[10px] text-muted-foreground mt-1.5 bg-muted/40 px-2 py-0.5 rounded-md inline-block">
                                                                    {doc.wallet.slice(0, 8)}...{doc.wallet.slice(-6)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4">
                                                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none font-semibold px-2.5 py-0.5 rounded">
                                                            {doc.specialization}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 text-muted-foreground font-medium text-sm">{doc.experience}</TableCell>
                                                    <TableCell className="px-6 py-4 font-mono font-bold text-foreground">{ethers.formatEther(doc.consultationFee)} ETH</TableCell>
                                                    <TableCell className="px-6 py-4 text-emerald-400 font-medium text-sm">{doc.availableHours || "Not specified"}</TableCell>
                                                    <TableCell className="px-6 py-4 text-center">
                                                        {doc.certificateURI ? (
                                                            <a 
                                                                href={doc.certificateURI} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="inline-block text-xs font-semibold text-teal-400 hover:text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 px-3 py-1.5 rounded-lg border border-teal-500/20 transition-all"
                                                            >
                                                                View PDF
                                                            </a>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">N/A</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 text-right">
                                                        {doc.isVerified ? (
                                                            <Badge variant="outline" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 px-3 py-1 font-semibold">
                                                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active KYC
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-rose-500/15 text-rose-400 border-rose-500/30 px-3 py-1 font-semibold">
                                                                <XCircle className="w-3.5 h-3.5 mr-1" /> Unverified
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                    </TabsContent>

                    {/* ───── TAB: MEDICINE INVENTORY ───── */}
                    <TabsContent value="inventory" className="outline-none">
                        <Card className="bg-card border border-border rounded-2xl shadow-md">
                            <CardHeader className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-lg font-bold">Marketplace Pharmacy Stock</CardTitle>
                                    <CardDescription>Track inventory status, unit prices, manufacturing details, and promotional discounts.</CardDescription>
                                </div>
                                <div className="relative w-full md:w-80">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search medicine name, manufacturer, or class..."
                                        value={searchMed}
                                        onChange={(e) => setSearchMed(e.target.value)}
                                        className="pl-10 rounded-xl bg-background/50 focus-visible:ring-primary border-border h-10 text-sm"
                                    />
                                </div>
                            </CardHeader>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-muted/20">
                                        <TableRow>
                                            <TableHead className="px-6 py-4 font-semibold w-16">ID</TableHead>
                                            <TableHead className="px-6 py-4 font-semibold">Medicine</TableHead>
                                            <TableHead className="px-6 py-4 font-semibold">Category</TableHead>
                                            <TableHead className="px-6 py-4 font-semibold">Dosage</TableHead>
                                            <TableHead className="px-6 py-4 font-semibold">Base Price</TableHead>
                                            <TableHead className="px-6 py-4 font-semibold">Promo Discount</TableHead>
                                            <TableHead className="px-6 py-4 font-semibold">Net Price</TableHead>
                                            <TableHead className="px-6 py-4 font-semibold">Current Stock</TableHead>
                                            <TableHead className="px-6 py-4 font-semibold text-right">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="divide-y divide-border/30">
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan="9" className="py-10 text-center text-muted-foreground">Loading blockchain inventory...</TableCell>
                                            </TableRow>
                                        ) : filteredMedicines.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan="9" className="py-10 text-center text-muted-foreground">
                                                    {medicines.length === 0 ? "No medicines added to marketplace yet." : "No matching medicines found."}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredMedicines.map((med, idx) => {
                                                const rawPrice = Number(ethers.formatEther(med.price));
                                                const discount = Number(med.discount);
                                                const netPrice = rawPrice - (rawPrice * discount) / 100;
                                                const isOutOfStock = Number(med.stockQuantity) <= 0;

                                                return (
                                                    <TableRow key={idx} className="hover:bg-muted/10 transition-colors">
                                                        <TableCell className="px-6 py-4 font-mono font-bold text-muted-foreground">#{Number(med.id)}</TableCell>
                                                        <TableCell className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <img 
                                                                    src={med.imageURI || "https://placehold.co/100x100/1e293b/a8b8d8?text=Medicine"}
                                                                    className="w-10 h-10 rounded-lg object-cover bg-muted/30 border border-border"
                                                                    alt={med.name} 
                                                                />
                                                                <div>
                                                                    <p className="font-semibold text-foreground leading-none">{med.name}</p>
                                                                    <p className="text-[10px] text-muted-foreground mt-1">Mfg: {med.manufacturer}</p>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4">
                                                            <Badge variant="secondary" className="bg-muted text-muted-foreground font-medium rounded">
                                                                {med.category}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 text-muted-foreground text-sm font-medium">{med.dosage}</TableCell>
                                                        <TableCell className="px-6 py-4 font-mono text-muted-foreground text-sm">{rawPrice.toFixed(4)} ETH</TableCell>
                                                        <TableCell className="px-6 py-4">
                                                            {discount > 0 ? (
                                                                <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-bold">
                                                                    {discount}% OFF
                                                                </Badge>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground">0%</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 font-mono font-bold text-primary">{netPrice.toFixed(4)} ETH</TableCell>
                                                        <TableCell className="px-6 py-4">
                                                            {isOutOfStock ? (
                                                                <span className="text-xs font-semibold text-rose-400 bg-rose-500/10 px-2 py-1 rounded">Out of stock</span>
                                                            ) : (
                                                                <span className="font-medium text-foreground text-sm">{Number(med.stockQuantity)} units</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 text-right">
                                                            {med.isActive ? (
                                                                <Badge className="bg-teal-500/10 text-teal-400 border-none font-semibold px-2 py-0.5 rounded">Active</Badge>
                                                            ) : (
                                                                <Badge className="bg-muted text-muted-foreground border-none font-semibold px-2 py-0.5 rounded">Disabled</Badge>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                    </TabsContent>

                    {/* ───── TAB: PAYMENT LEDGER ───── */}
                    <TabsContent value="ledger" className="outline-none">
                        <Tabs defaultValue="appointments" className="space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/20 p-2.5 rounded-xl border border-border/40">
                                <TabsList className="bg-background/80 border border-border/45 rounded-lg p-0.5 h-9">
                                    <TabsTrigger value="appointments" className="rounded-md px-4 py-1 text-xs font-semibold">
                                        Consultation Bookings
                                    </TabsTrigger>
                                    <TabsTrigger value="purchases" className="rounded-md px-4 py-1 text-xs font-semibold">
                                        Marketplace Sales
                                    </TabsTrigger>
                                </TabsList>
                                <div className="relative w-full md:w-72">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search by wallet address or name..."
                                        value={searchLedger}
                                        onChange={(e) => setSearchLedger(e.target.value)}
                                        className="pl-9 rounded-lg bg-background/50 focus-visible:ring-primary border-border h-8.5 text-xs"
                                    />
                                </div>
                            </div>

                            {/* ── Sub-tab Content: Appointment Bookings ── */}
                            <TabsContent value="appointments" className="mt-0">
                                <Card className="bg-card border border-border rounded-xl shadow-md overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-muted/10">
                                                <TableRow>
                                                    <TableHead className="px-6 py-4 font-semibold w-16">ID</TableHead>
                                                    <TableHead className="px-6 py-4 font-semibold">Patient</TableHead>
                                                    <TableHead className="px-6 py-4 font-semibold">Doctor Payout</TableHead>
                                                    <TableHead className="px-6 py-4 font-semibold">Schedule Time</TableHead>
                                                    <TableHead className="px-6 py-4 font-semibold text-right">Fee Split Details</TableHead>
                                                    <TableHead className="px-6 py-4 font-semibold text-right">Platform Fee (10%)</TableHead>
                                                    <TableHead className="px-6 py-4 font-semibold text-right">Doctor Payout (90%)</TableHead>
                                                    <TableHead className="px-6 py-4 font-semibold text-center w-28">Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody className="divide-y divide-border/30">
                                                {loading ? (
                                                    <TableRow>
                                                        <TableCell colSpan="8" className="py-8 text-center text-muted-foreground">Syncing appointments from Ethereum ledger...</TableCell>
                                                    </TableRow>
                                                ) : filteredAppointments.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan="8" className="py-8 text-center text-muted-foreground">
                                                            {appointments.length === 0 ? "No consultation fees logged." : "No matching consultation fees found."}
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    filteredAppointments.map((appt, idx) => {
                                                        const fee = Number(ethers.formatEther(appt.consultationFee));
                                                        const platformCut = fee * 0.1;
                                                        const doctorCut = fee * 0.9;
                                                        
                                                        return (
                                                            <TableRow key={idx} className="hover:bg-muted/10 transition-colors">
                                                                <TableCell className="px-6 py-4 font-mono font-bold text-muted-foreground">#{appt.id}</TableCell>
                                                                <TableCell className="px-6 py-4">
                                                                    <div className="flex flex-col">
                                                                        <span className="font-semibold text-foreground text-sm">{appt.patientName}</span>
                                                                        <span className="font-mono text-[9px] text-muted-foreground mt-0.5">{appt.patientWallet.slice(0, 6)}...{appt.patientWallet.slice(-4)}</span>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="px-6 py-4">
                                                                    <div className="flex flex-col">
                                                                        <span className="font-semibold text-foreground text-sm">{appt.doctorName}</span>
                                                                        <span className="font-mono text-[9px] text-muted-foreground mt-0.5">{appt.doctorWallet.slice(0, 6)}...{appt.doctorWallet.slice(-4)}</span>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="px-6 py-4 text-emerald-400 font-medium text-sm">{appt.time}</TableCell>
                                                                <TableCell className="px-6 py-4 text-right font-mono font-bold text-foreground">{fee.toFixed(4)} ETH</TableCell>
                                                                <TableCell className="px-6 py-4 text-right font-mono text-rose-400 font-bold bg-rose-500/5">{platformCut.toFixed(4)} ETH</TableCell>
                                                                <TableCell className="px-6 py-4 text-right font-mono text-teal-400 font-bold bg-teal-500/5">{doctorCut.toFixed(4)} ETH</TableCell>
                                                                <TableCell className="px-6 py-4 text-center">
                                                                    {appt.isCompleted ? (
                                                                        <Badge className="bg-emerald-500/10 text-emerald-400 border-none font-semibold text-[10px] px-2 py-0.5 rounded">Consulted</Badge>
                                                                    ) : (
                                                                        <Badge className="bg-amber-500/10 text-amber-400 border-none font-semibold text-[10px] px-2 py-0.5 rounded">Booked</Badge>
                                                                    )}
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </Card>
                            </TabsContent>

                            {/* ── Sub-tab Content: Pharmacy Sales ── */}
                            <TabsContent value="purchases" className="mt-0">
                                <Card className="bg-card border border-border rounded-xl shadow-md overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-muted/10">
                                                <TableRow>
                                                    <TableHead className="px-6 py-4 font-semibold">Buyer (Patient)</TableHead>
                                                    <TableHead className="px-6 py-4 font-semibold">Medicine Purchased</TableHead>
                                                    <TableHead className="px-6 py-4 font-semibold text-center">Units Purchased</TableHead>
                                                    <TableHead className="px-6 py-4 font-semibold text-right">Total Platform Revenue</TableHead>
                                                    <TableHead className="px-6 py-4 font-semibold text-right">Tx Transaction Hash</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody className="divide-y divide-border/30">
                                                {loading ? (
                                                    <TableRow>
                                                        <TableCell colSpan="5" className="py-8 text-center text-muted-foreground">Parsing purchase logs from Ethereum network...</TableCell>
                                                    </TableRow>
                                                ) : filteredPurchases.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan="5" className="py-8 text-center text-muted-foreground">
                                                            {purchases.length === 0 ? "No pharmacy sales transactions logged yet." : "No matching sales transactions found."}
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    filteredPurchases.map((purchase, idx) => (
                                                        <TableRow key={idx} className="hover:bg-muted/10 transition-colors">
                                                            <TableCell className="px-6 py-4">
                                                                <div className="flex flex-col">
                                                                    <span className="font-semibold text-foreground text-sm">{purchase.patientName}</span>
                                                                    <span className="font-mono text-[9px] text-muted-foreground mt-0.5">{purchase.patientWallet.slice(0, 8)}...{purchase.patientWallet.slice(-6)}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="px-6 py-4">
                                                                <span className="font-semibold text-foreground text-sm">{purchase.medicineName}</span>
                                                                <span className="block text-[10px] text-muted-foreground mt-0.5">Medicine ID: #{purchase.medicineId}</span>
                                                            </TableCell>
                                                            <TableCell className="px-6 py-4 text-center text-foreground font-medium">{purchase.quantity} units</TableCell>
                                                            <TableCell className="px-6 py-4 text-right font-mono font-bold text-rose-400 bg-rose-500/5">{purchase.totalPaid} ETH</TableCell>
                                                            <TableCell className="px-6 py-4 text-right">
                                                                <a 
                                                                    href={`https://sepolia.etherscan.io/tx/${purchase.txHash}`} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="font-mono text-xs text-primary hover:underline hover:text-primary/80"
                                                                >
                                                                    {purchase.txHash.slice(0, 10)}...{purchase.txHash.slice(-8)}
                                                                </a>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </TabsContent>
                </Tabs>

            </div>
        </PageLayout>
    );
}
