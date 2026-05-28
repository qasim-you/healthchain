import { Users, FileUser, Network } from "lucide-react";

export default function JoinUsPage() {
    return (
        <div className="min-h-screen bg-background relative flex flex-col items-center py-20 px-4">
            {/* Background embellishments */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-primary/10 to-transparent blur-[100px] rounded-full -z-10"></div>
            
            <div className="text-center max-w-2xl mb-16">
                <h1 className="text-5xl font-extrabold text-foreground mb-6">Join the <span className="text-primary border-b-4 border-primary">Revolution</span></h1>
                <p className="text-xl text-muted-foreground">Whether you're a decentralized tech enthusiast, a doctor, or an investor, we define the next generation of healthcare.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
                
                <div className="bg-card border border-border p-8 rounded-3xl flex flex-col items-center text-center hover:-translate-y-2 transition-transform duration-300">
                    <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                        <Users className="w-10 h-10 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3">For Medical Professionals</h3>
                    <p className="text-muted-foreground flex-1">Register as a verified doctor to take secure consultations globally.</p>
                    <button className="mt-6 text-blue-500 font-semibold hover:underline">Apply Here &rarr;</button>
                </div>

                <div className="bg-card border border-primary/50 shadow-[0_0_30px_-10px] shadow-primary/30 p-8 rounded-3xl flex flex-col items-center text-center hover:-translate-y-2 transition-transform duration-300 transform scale-105">
                    <div className="absolute -top-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">Urgent Role</div>
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 mt-2">
                        <Network className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3">Blockchain Evangelist</h3>
                    <p className="text-muted-foreground flex-1">Help us onboard the masses to decentralized healthcare tracking.</p>
                    <button className="mt-6 w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold">See Openings</button>
                </div>

                <div className="bg-card border border-border p-8 rounded-3xl flex flex-col items-center text-center hover:-translate-y-2 transition-transform duration-300">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                        <FileUser className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3">For Investors</h3>
                    <p className="text-muted-foreground flex-1">Discover our seed-round prospectus and tokenomics design.</p>
                    <button className="mt-6 text-emerald-500 font-semibold hover:underline">View Pitch Deck &rarr;</button>
                </div>

            </div>
        </div>
    );
}
