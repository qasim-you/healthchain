import { Lightbulb, Shield, Zap, Globe } from "lucide-react";

export default function ConceptPage() {
    const concepts = [
        { icon: Shield, title: "Immutable Security", desc: "Your health records are stored directly on the blockchain, guaranteeing censorship resistance, extreme privacy, and cryptographically secured data." },
        { icon: Zap, title: "Lightning Fast Access", desc: "No more waiting for centralized servers. Using decentralized storage networks, your data scales instantly across the globe with minimal latency." },
        { icon: Globe, title: "Interoperability", desc: "A universal medical ledger meaning you can take your medical history to any clinic, any doctor, anywhere in the world." },
        { icon: Lightbulb, title: "Next-Gen Funding", desc: "Designed to attract modern investors, our architecture proves that decentralized health systems are the key to the future of biotech funding." }
    ];

    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center py-24 px-4 overflow-x-hidden">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[150px] -z-10 mix-blend-screen"></div>

            <div className="max-w-5xl w-full text-center xl:text-left mb-20 flex flex-col xl:flex-row items-center gap-12">
                <div className="flex-1 space-y-6">
                    <h1 className="text-5xl md:text-7xl font-extrabold text-foreground tracking-tighter">
                        The Core <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary">Concept</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                        Reimagining the entire global healthcare infrastructure through decentralized networks and zero-knowledge proofs.
                    </p>
                </div>
                <div className="flex-1 w-full relative">
                    <div className="aspect-video rounded-3xl bg-card border border-border shadow-2xl overflow-hidden relative flex items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent"></div>
                        <Lightbulb size={80} className="text-primary opacity-50" />
                    </div>
                </div>
            </div>

            <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
                {concepts.map((item, idx) => (
                    <div key={idx} className="group bg-card border border-border p-8 rounded-3xl hover:border-primary/50 hover:shadow-2xl transition-all duration-300">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <item.icon className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-4">{item.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            {item.desc}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
