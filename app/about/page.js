import { Building2, Rocket, Globe2 } from "lucide-react";

export default function AboutUsPage() {
    return (
        <div className="min-h-screen bg-background py-20 px-4 relative">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-20">
                    <h1 className="text-4xl md:text-6xl font-black text-foreground mb-6">
                        Building the <span className="text-primary italic">Trust Layer</span> of Healthcare
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        We are a team of visionary engineers, medical doctors, and blockchain native builders dedicated to stripping out intermediaries from healthcare.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-20">
                    <div>
                        <h2 className="text-3xl font-bold text-foreground mb-4">Our Mission</h2>
                        <p className="text-lg text-muted-foreground mb-6">
                            By 2030, we envision a world where patients have extreme sovereignty over their medical data. Through mathematical proofs and cryptography, we align patient privacy with universal access.
                        </p>
                        <div className="flex gap-4">
                            <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-3 w-1/2">
                                <Rocket className="text-primary w-8 h-8" />
                                <div>
                                    <h4 className="font-bold text-foreground block">Founded</h4>
                                    <span className="text-muted-foreground text-sm">2026</span>
                                </div>
                            </div>
                            <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-3 w-1/2">
                                <Building2 className="text-primary w-8 h-8" />
                                <div>
                                    <h4 className="font-bold text-foreground block">HQ</h4>
                                    <span className="text-muted-foreground text-sm">Decentralized</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="relative aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden bg-muted border border-border flex items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-primary/20"></div>
                        <Globe2 size={120} className="text-primary/30" />
                    </div>
                </div>
            </div>
        </div>
    );
}
