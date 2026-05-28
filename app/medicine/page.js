"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import PageLayout from "@/components/layout/PageLayout";
import { useWeb3Context } from "@/contexts/Web3Context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Pill, Search, ShoppingCart } from "lucide-react";

export default function Marketplace() {
    const { contract, role } = useWeb3Context();
    const { toast } = useToast();
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [buyingProcess, setBuyingProcess] = useState(null); // id of buying medicine

    const fetchMedicines = async () => {
        if (!contract) return;
        try {
            const data = await contract.getAllMedicines();
            setMedicines(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMedicines();
    }, [contract]);

    const handleBuy = async (medicineId, priceEther, discount) => {
        if (!contract || role !== "patient") {
            toast({ title: "Unauthorized", description: "Only patients can buy directly from market", variant: "destructive" });
            return;
        }

        setBuyingProcess(medicineId);
        try {
            // Calculate final price natively based on JS to send the right ETH value
            const cost = Number(priceEther) * 1; // qty = 1 for now
            const discountAmount = (cost * Number(discount)) / 100;
            const finalPrice = cost - discountAmount;
            const payableAmount = ethers.parseEther(finalPrice.toString());

            const tx = await contract.buyMedicine(medicineId, 1, { value: payableAmount });

            toast({ title: "Processing transaction..." });
            await tx.wait();

            toast({ title: "Purchase clear!", description: "Medicine purchased successfully." });
            fetchMedicines(); // To update stock
        } catch (error) {
            console.error(error);
            toast({ title: "Purchase failed", description: error?.reason || error.message, variant: "destructive" });
        } finally {
            setBuyingProcess(null);
        }
    };

    return (
        <PageLayout title="Decentralized Pharmacy">
            <div className="flex justify-between items-center mb-8 relative z-10">
                <div>
                    <h2 className="text-3xl font-extrabold text-foreground tracking-tight">On-Chain Pharmacy</h2>
                    <p className="text-muted-foreground mt-2">Buy verifiable medicines directly using crypto.</p>
                </div>
                <div className="relative hidden md:block">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground0 w-5 h-5" />
                    <input type="text" placeholder="Search medicines..." className="bg-card border border-border text-foreground placeholder-slate-500 rounded-full h-12 pl-12 pr-6 w-72 focus:ring-2 focus:ring-primary outline-none transition-all" />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
                {loading ? (
                    Array(8).fill(0).map((_, i) => (
                        <div key={i} className="h-80 bg-card border border-border rounded-3xl animate-pulse"></div>
                    ))
                ) : medicines.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-foreground0 flex flex-col items-center">
                        <Pill className="w-16 h-16 opacity-20 mb-4" />
                        <p>No medicines available in the marketplace yet.</p>
                    </div>
                ) : (
                    medicines.map((med, idx) => {
                        const priceEther = ethers.formatEther(med.price);
                        const isOutOfStock = Number(med.stockQuantity) <= 0;

                        return (
                            <div key={idx} className={`bg-card border border-border rounded-3xl overflow-hidden transition-all flex flex-col ${isOutOfStock ? "opacity-60" : "hover:border-primary/50 shadow-xl"}`}>
                                <div className="p-4 bg-white/5 relative group">
                                    {Number(med.discount) > 0 && !isOutOfStock && (
                                        <div className="absolute top-4 right-4 bg-rose-500 text-foreground text-xs font-bold px-2 py-1 rounded-lg z-10 shadow-lg">
                                            {Number(med.discount)}% OFF
                                        </div>
                                    )}
                                    {isOutOfStock && (
                                        <div className="absolute top-4 left-4 bg-amber-500 text-foreground text-xs font-bold px-3 py-1.5 rounded-lg z-10 uppercase tracking-widest">
                                            Out of Stock
                                        </div>
                                    )}
                                    <div className="aspect-[4/3] w-full relative rounded-2xl overflow-hidden border border-border/50">
                                        <img src={med.imageURI || "https://placehold.co/400x300/1e293b/a8b8d8?text=Medicine"} alt={med.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    </div>
                                </div>

                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-bold text-foreground">{med.name}</h3>
                                        <Badge className="bg-muted text-muted-foreground border-none">{med.category}</Badge>
                                    </div>

                                    <p className="text-muted-foreground text-sm mb-4">By {med.manufacturer} • {med.dosage}</p>

                                    <p className="text-xs text-foreground0 line-clamp-2 mb-6">{med.sideEffects}</p>

                                    <div className="mt-auto pt-4 border-t border-border/50 flex flex-col gap-4">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-xs text-foreground0 font-medium mb-1">Price per unit</p>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-xl font-bold text-primary">{priceEther} ETH</h4>
                                                    {Number(med.discount) > 0 && <span className="text-sm text-foreground0 line-through">{(Number(priceEther) / (1 - Number(med.discount) / 100)).toFixed(4)} ETH</span>}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-foreground0 font-medium mb-1">Stock left</p>
                                                <p className="text-sm font-semibold text-muted-foreground">{Number(med.stockQuantity)} units</p>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={() => handleBuy(med.id, priceEther, med.discount)}
                                            disabled={isOutOfStock || buyingProcess === med.id || role !== "patient"}
                                            className="w-full h-12 bg-primary hover:bg-primary/90 text-foreground rounded-xl shadow-lg relative overflow-hidden group">
                                            <ShoppingCart className="w-4 h-4 mr-2" />
                                            {buyingProcess === med.id ? "Processing..." : isOutOfStock ? "Unavailable" : "Buy Medicine"}
                                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0"></div>
                                            <div className="absolute inset-0 bg-primary -z-10"></div>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </PageLayout>
    );
}
