import { MessageSquare, Send } from "lucide-react";

export default function MessagePage() {
    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center py-20 px-4">
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 mix-blend-screen"></div>
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[100px] -z-10 mix-blend-screen"></div>
            
            <div className="max-w-4xl w-full text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary mb-6">
                    <MessageSquare size={16} />
                    <span className="text-sm font-medium">Secure Communication</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-extrabold text-foreground tracking-tight mb-6">
                    Connect With Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary">Experts</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    A decentralized messaging platform connecting you directly with medical professionals seamlessly and securely.
                </p>
            </div>

            <div className="w-full max-w-3xl bg-card border border-border rounded-3xl p-8 shadow-2xl backdrop-blur-md">
                <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">Your Name</label>
                            <input type="text" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" placeholder="John Doe" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">Wallet Address</label>
                            <input type="text" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" placeholder="0x..." />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Your Message</label>
                        <textarea rows="5" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none" placeholder="How can we help you?"></textarea>
                    </div>
                    <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_-5px_var(--tw-shadow-color)] shadow-primary/50">
                        <Send size={20} />
                        Send Secure Message
                    </button>
                </div>
            </div>
        </div>
    );
}
