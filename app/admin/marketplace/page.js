"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import PageLayout from "@/components/layout/PageLayout";
import { useWeb3Context } from "@/contexts/Web3Context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, UploadCloud, Pill, Info } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { uploadFileToIPFS } from "@/utils/ipfs";
import { useToast } from "@/hooks/use-toast";

export default function AdminMarketplace() {
    const { contract } = useWeb3Context();
    const { toast } = useToast();
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const [form, setForm] = useState({
        name: "", manufacturer: "", category: "Antibiotics",
        dosage: "", price: "", stockQuantity: "", discount: "0", sideEffects: "",
        imageFile: null,
    });

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

    const handleAddMedicine = async (e) => {
        e.preventDefault();
        setIsAdding(true);
        try {
            let imageURI = "";
            if (form.imageFile) {
                toast({ title: "Uploading image to IPFS..." });
                imageURI = await uploadFileToIPFS(form.imageFile);
            }

            const priceWei = ethers.parseEther(form.price.toString());

            const tx = await contract.addMedicine(
                form.name,
                form.manufacturer,
                form.category,
                form.dosage,
                priceWei,
                form.stockQuantity,
                form.discount,
                form.sideEffects,
                imageURI
            );

            toast({ title: "Transaction submitted", description: "Waiting for confirmation..." });
            await tx.wait();

            toast({ title: "Success", description: "Medicine added successfully to marketplace." });
            setIsDialogOpen(false);
            setForm({
                name: "", manufacturer: "", category: "Antibiotics",
                dosage: "", price: "", stockQuantity: "", discount: "0", sideEffects: "",
                imageFile: null,
            });
            fetchMedicines();
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <PageLayout requiredRole="admin" title="Global Marketplace">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">Inventory Management</h2>
                    <p className="text-foreground0 font-medium">Add and monitor decentralized pharmacy stock</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger className="" asChild>
                        <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/25 h-11 px-6">
                            <Plus className="w-5 h-5 mr-2" /> Add New Medicine
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-card border-border text-foreground h-auto ">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">Add Medicine</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddMedicine} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-sm text-muted-foreground font-medium">
                            <div className="col-span-1 sm:col-span-2">
                                <label>Medicine Name</label>
                                <input required type="text" className="w-full mt-1 bg-background border border-border rounded-lg p-3 text-foreground focus:border-primary outline-none"
                                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div>
                                <label>Manufacturer</label>
                                <input required type="text" className="w-full mt-1 bg-background border border-border rounded-lg p-3 text-foreground focus:border-primary outline-none"
                                    value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} />
                            </div>
                            <div>
                                <label>Category</label>
                                <select className="w-full mt-1 bg-background border border-border rounded-lg p-3 text-foreground focus:border-primary outline-none"
                                    value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                                    <option>Antibiotics</option>
                                    <option>Painkillers</option>
                                    <option>Supplements</option>
                                    <option>Cardiovascular</option>
                                    <option>Neurology</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div>
                                <label>Dosage</label>
                                <input required type="text" placeholder="e.g. 500mg" className="w-full mt-1 bg-background border border-border rounded-lg p-3 text-foreground focus:border-primary outline-none"
                                    value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} />
                            </div>
                            <div>
                                <label>Price (ETH)</label>
                                <input required type="number" step="0.0001" placeholder="0.01" className="w-full mt-1 bg-background border border-border rounded-lg p-3 text-foreground focus:border-primary outline-none"
                                    value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                            </div>
                            <div>
                                <label>Stock Quantity</label>
                                <input required type="number" className="w-full mt-1 bg-background border border-border rounded-lg p-3 text-foreground focus:border-primary outline-none"
                                    value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} />
                            </div>
                            <div>
                                <label>Discount (%)</label>
                                <input required type="number" min="0" max="100" className="w-full mt-1 bg-background border border-border rounded-lg p-3 text-foreground focus:border-primary outline-none"
                                    value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
                            </div>
                            <div className="col-span-1 sm:col-span-2">
                                <label>Side Effects (Comma separated)</label>
                                <textarea required className="w-full mt-1 bg-background border border-border rounded-lg p-3 text-foreground focus:border-primary outline-none"
                                    value={form.sideEffects} onChange={(e) => setForm({ ...form, sideEffects: e.target.value })} />
                            </div>
                            <div className="col-span-1 sm:col-span-2">
                                <label>Medicine Image (IPFS)</label>
                                <div className="mt-1 flex items-center justify-center w-full border-2 border-dashed border-border hover:border-primary bg-background/50 rounded-xl h-24 transition-colors cursor-pointer relative overflow-hidden group">
                                    <input type="file" required onChange={(e) => setForm({ ...form, imageFile: e.target.files[0] })} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                    <div className="flex flex-col items-center justify-center text-muted-foreground group-hover:text-primary">
                                        <UploadCloud className="w-8 h-8 mb-1" />
                                        <span>{form.imageFile ? form.imageFile.name : "Click to upload image file"}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-1 sm:col-span-2 mt-4">
                                <Button type="submit" disabled={isAdding} className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 rounded-xl shadow-lg">
                                    {isAdding ? "Processing..." : "Submit to Blockchain"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading ? (
                    Array(4).fill(0).map((_, i) => (
                        <div key={i} className="h-80 bg-card border border-border rounded-3xl animate-pulse"></div>
                    ))
                ) : medicines.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-foreground0 flex flex-col items-center">
                        <Pill className="w-16 h-16 opacity-20 mb-4" />
                        <p>No medicines found in the marketplace.</p>
                    </div>
                ) : (
                    medicines.map((med, idx) => (
                        <div key={idx} className="bg-card border border-border rounded-3xl overflow-hidden hover:border-border transition-all flex flex-col">
                            <div className="p-4 bg-white/5 relative group">
                                {med.discount > 0 && (
                                    <div className="absolute top-4 right-4 bg-rose-500 text-foreground text-xs font-bold px-2 py-1 rounded-lg z-10">
                                        {Number(med.discount)}% OFF
                                    </div>
                                )}
                                <img src={med.imageURI || "https://placehold.co/400x300/1e293b/a8b8d8?text=Medicine"} alt={med.name} className="w-full h-48 object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500" />
                            </div>
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-xl font-bold text-foreground">{med.name}</h3>
                                    <Badge className="bg-muted text-muted-foreground">{med.category}</Badge>
                                </div>
                                <p className="text-muted-foreground text-sm mb-4">By {med.manufacturer} • {med.dosage}</p>

                                <div className="mt-auto pt-4 border-t border-border/50 flex justify-between items-end">
                                    <div>
                                        <p className="text-xs text-foreground0 font-medium mb-1">Price</p>
                                        <p className="text-lg font-bold text-primary">{ethers.formatEther(med.price)} ETH</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-foreground0 font-medium mb-1">Stock</p>
                                        <p className="text-sm font-semibold text-muted-foreground">{Number(med.stockQuantity)} units</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </PageLayout>
    );
}
