"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWeb3Context } from "@/contexts/Web3Context";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck, Stethoscope, HeartPulse,
  Activity, Hexagon, ArrowRight, Zap, Wallet,
  Lock, MessageSquare, ClipboardList, CheckCircle2, Server, Database, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
});

export default function LandingPage() {
  const router = useRouter();
  const { account, isWalletConnected, connectWallet, role, errorMessage } = useWeb3Context();
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (!isWalletConnected || !role) return;
    const routes = { admin: "/admin", doctor: "/doctor", patient: "/patient" };
    if (routes[role]) router.push(routes[role]);
  }, [isWalletConnected, role, router]);

  const handleConnect = async () => {
    setIsConnecting(true);
    await connectWallet();
    setIsConnecting(false);
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-y-auto selection:bg-primary/25 pb-16">
      
      {/* ── Ambient Background Blobs ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-primary/10 blur-[130px]" />
        <div className="absolute top-[600px] -right-40 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[200px] -left-40 w-[500px] h-[500px] rounded-full bg-destructive/5 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* ── Header / Navigation Bar ── */}
      <header className="relative z-50 border-b border-border bg-background/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/25">
              <Hexagon className="w-5 h-5 text-white fill-white/20" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground leading-none tracking-tight">HealthChain</p>
              <p className="text-[10px] font-semibold tracking-widest text-primary mt-0.5 uppercase">Blockchain EMR</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground font-medium">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#rosters" className="hover:text-foreground transition-colors">Rosters</a>
            <a href="#integrity" className="hover:text-foreground transition-colors">Contract Integrity</a>
          </div>

          <div>
            {isWalletConnected ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border text-xs text-muted-foreground font-mono">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                {account ? `${account.slice(0, 6)}…${account.slice(-4)}` : "Connected"}
              </div>
            ) : (
              <Button onClick={handleConnect} disabled={isConnecting} size="sm" className="bg-primary hover:bg-primary/95 text-primary-foreground rounded-full">
                {isConnecting ? "Connecting..." : "Connect Portal"}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero / CTA Section ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-12 md:pt-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column: Heading & Authentication Interface */}
        <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
          
          <motion.div {...fadeUp(0)} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium tracking-wide">
            <Hexagon className="w-3.5 h-3.5 fill-primary/20" />
            Decentralized Medical Ledger Ecosystem
          </motion.div>

          <motion.h1 {...fadeUp(0.1)} className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Sovereign & Immutable <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/60">
              Electronic Health Records
            </span>
          </motion.h1>

          <motion.p {...fadeUp(0.15)} className="text-base md:text-lg text-muted-foreground font-light leading-relaxed max-w-2xl">
            Empowering patients with absolute cryptographic ownership over their clinical histories. Secure messaging, transparent appointment booking, and verified professional registries.
          </motion.p>

          <div className="pt-4 flex justify-center lg:justify-start">
            <AnimatePresence mode="wait">
              {/* Connection Error */}
              {errorMessage && (
                <motion.div
                  key="error"
                  {...fadeUp(0)}
                  className="w-full max-w-md p-5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive space-y-3 text-left"
                >
                  <p className="font-semibold text-base">Connection Reverted</p>
                  <p className="text-xs font-mono opacity-75 break-all">{errorMessage}</p>
                  <Button onClick={() => window.location.reload()} className="w-full bg-destructive hover:bg-destructive/90 text-white rounded-xl h-10">
                    Reset Session
                  </Button>
                </motion.div>
              )}

              {/* Wallet Not Connected */}
              {!errorMessage && !isWalletConnected && (
                <motion.div key="connect" {...fadeUp(0.2)} className="flex flex-col items-center lg:items-start gap-4">
                  <Button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    size="lg"
                    className="h-13 px-8 rounded-xl text-base font-semibold bg-gradient-to-r from-primary to-primary/70 hover:from-primary/90 hover:to-primary/65 text-primary-foreground shadow-xl shadow-primary/25 transition-all hover:shadow-primary/40 hover:scale-[1.02]"
                  >
                    <Wallet className="mr-2 h-5 w-5" />
                    {isConnecting ? "Establishing Handshake..." : "Connect MetaMask"}
                    {!isConnecting && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                  <p className="text-xs text-muted-foreground font-mono">
                    Requires Sepolia Network • Safe & Sovereign
                  </p>
                </motion.div>
              )}

              {/* Connected & Unregistered Selection */}
              {!errorMessage && isWalletConnected && role === "unregistered" && (
                <motion.div key="register" {...fadeUp(0)} className="w-full max-w-lg space-y-5 text-left">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-foreground">Complete Ledger Registration</h3>
                    <p className="text-sm text-muted-foreground">Select your node profile identity to proceed:</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => router.push("/register/patient")}
                      className="group flex flex-col items-start gap-3 p-5 rounded-2xl border border-border bg-card/40 hover:bg-card/80 hover:border-destructive/40 transition-all duration-200 cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center group-hover:bg-destructive/20 transition-colors">
                        <HeartPulse className="h-5 w-5 text-destructive" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">Patient Profile</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Control EMR records & secure consultant links.</p>
                      </div>
                    </button>

                    <button
                      onClick={() => router.push("/register/doctor")}
                      className="group flex flex-col items-start gap-3 p-5 rounded-2xl border border-border bg-card/40 hover:bg-card/80 hover:border-primary/40 transition-all duration-200 cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Stethoscope className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">Medical Doctor</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Diagnose patients, write Rx, handle consults.</p>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Connected & Unverified Doctor Pending KYC Status */}
              {!errorMessage && isWalletConnected && role === "unverified_doctor" && (
                <motion.div
                  key="unverified_doctor"
                  {...fadeUp(0)}
                  className="w-full max-w-md p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-foreground space-y-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 animate-pulse">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-amber-500">Verification Pending</h3>
                      <p className="text-[11px] text-muted-foreground">KYC review in progress</p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your practitioner profile has been successfully registered. The platform administrator is reviewing your medical certificate and credentials. You will gain access as soon as your account is verified.
                  </p>

                  <div className="bg-background/80 border border-border p-4 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Wallet Keys Linked</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Professional Profile Submitted</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-4 h-4 text-amber-500 animate-spin" />
                      <span className="text-amber-500 font-semibold">Awaiting Administrator Review</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground pt-1 border-t border-border">
                    <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> SECURE LEDGER ID</span>
                    <span>PENDING VERIFICATION</span>
                  </div>
                </motion.div>
              )}

              {/* Authing Redirect */}
              {!errorMessage && isWalletConnected && role && role !== "unregistered" && role !== "unverified_doctor" && (
                <motion.div key="auth" {...fadeUp(0)} className="flex items-center gap-3 text-primary text-sm font-medium bg-primary/5 border border-primary/10 px-4 py-3 rounded-2xl">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                  Resolving role access from Ethereum smart contract...
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Interactive Tech Visual Mockup */}
        <div className="lg:col-span-5 relative z-10 flex justify-center">
          <div className="relative w-full max-w-sm aspect-[4/5] bg-card/60 border border-border rounded-[32px] p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[40px] rounded-full pointer-events-none group-hover:bg-primary/20 transition-colors"></div>
            
            {/* Mock Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Block Ledger Active</span>
              </div>
              <Activity className="w-4 h-4 text-primary" />
            </div>

            {/* Mock Profile Card Info */}
            <div className="space-y-4 my-6">
              <div className="bg-background/80 border border-border p-4 rounded-2xl flex gap-3 items-center">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                  DR
                </div>
                <div className="overflow-hidden">
                  <h4 className="font-bold text-sm text-foreground">Dr. Alexander Vance</h4>
                  <p className="text-[10px] text-muted-foreground truncate">Cardiology • General Consultant</p>
                </div>
              </div>

              {/* Prescriptions mockup */}
              <div className="bg-background/80 border border-border p-4 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-[10px] text-muted-foreground border-b border-border pb-1">
                  <span>Rx Record</span>
                  <span className="text-primary font-mono">0x9b35...51a6</span>
                </div>
                <p className="text-xs font-bold text-foreground">Metoprolol Succinate 50mg</p>
                <p className="text-[10px] text-muted-foreground">Dosage: 1 Tablet daily after meals</p>
              </div>
            </div>

            {/* Mock footer statistics */}
            <div className="border-t border-border pt-4 flex justify-between items-center text-[10px] font-mono text-muted-foreground">
              <span>GAS ESTIMATE: OPTIMAL</span>
              <span className="text-primary">EMR SEALED V2</span>
            </div>
          </div>
        </div>

      </section>

      {/* ── Features Pillars Section ── */}
      <section id="features" className="max-w-7xl mx-auto px-6 mt-32 relative z-10 scroll-mt-24">
        <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Technical Foundations</h2>
          <p className="text-muted-foreground text-sm">Secure architecture that guarantees transparency, non-repudiation, and auditability.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card/30 border border-border p-8 rounded-3xl relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl w-fit mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Immutable Ledgers</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Medical histories, diagnostic files, and Rx logs are signed on-chain, rendering records immune to fraud or retroactive updates.</p>
          </div>

          <div className="bg-card/30 border border-border p-8 rounded-3xl relative overflow-hidden group hover:border-primary/35 transition-all duration-300">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl w-fit mb-6">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Cryptographic Keys</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Patient accounts retain total control over doctor rosters and general consultants. Authorizations can be configured or updated securely.</p>
          </div>

          <div className="bg-card/30 border border-border p-8 rounded-3xl relative overflow-hidden group hover:border-destructive/30 transition-all duration-300">
            <div className="p-3 bg-destructive/10 text-destructive rounded-2xl w-fit mb-6">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">P2P Consultations</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Secure end-to-end messaging channels between consulting patients and verified professionals directly integrated with Metamask signature verification.</p>
          </div>
        </div>
      </section>

      {/* ── Actor Workflow Rosters Section ── */}
      <section id="rosters" className="max-w-7xl mx-auto px-6 mt-32 relative z-10 scroll-mt-24">
        <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Sovereign Ecosystem Roster</h2>
          <p className="text-muted-foreground text-sm">Optimized client layers that map directly to the smart contract operations.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Patient Card */}
          <div className="bg-card/20 border border-border rounded-3xl p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold uppercase tracking-widest">
                Patients
              </div>
              <h3 className="text-xl font-bold text-foreground">Patient Ledger</h3>
              <p className="text-sm text-muted-foreground">Self-custody of diagnostic logs. Patients select verified consultants, book appointments, receive drug prescriptions, and message their primary health caretakers.</p>
            </div>
            <ul className="mt-8 space-y-2.5 text-xs text-muted-foreground border-t border-border pt-6">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Select general consultants</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Verify digital Rx lists</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Control records availability</li>
            </ul>
          </div>

          {/* Doctor Card */}
          <div className="bg-card/20 border border-border rounded-3xl p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-widest">
                Practitioners
              </div>
              <h3 className="text-xl font-bold text-foreground">Practitioner Console</h3>
              <p className="text-sm text-muted-foreground">Practitioner interface that allows verified medical specialists to view pending consultations, sign medical updates, publish digital Rx authorizations, and chat with consulting patients.</p>
            </div>
            <ul className="mt-8 space-y-2.5 text-xs text-muted-foreground border-t border-border pt-6">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Update authorized diagnostics</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Review booked appointments</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Prescribe medications</li>
            </ul>
          </div>

          {/* Admin Card */}
          <div className="bg-card/20 border border-border rounded-3xl p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-widest">
                Administrators
              </div>
              <h3 className="text-xl font-bold text-foreground">Governance Desk</h3>
              <p className="text-sm text-muted-foreground">Platform integrity dashboard. Verifies doctor practitioner licensing, oversees global records stats, manages the pharmaceutical marketplace items inventory, and confirms listings.</p>
            </div>
            <ul className="mt-8 space-y-2.5 text-xs text-muted-foreground border-t border-border pt-6">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Verify practitioner licensing</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Inventory management</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Monitor block metrics</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── integrity Section ── */}
      <section id="integrity" className="max-w-7xl mx-auto px-6 mt-32 relative z-10 scroll-mt-24">
        <div className="bg-card/40 border border-border rounded-[40px] p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-80 h-80 bg-primary/5 blur-[80px] rounded-full pointer-events-none"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Cryptographic Ledger Integrity</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                HealthChain guarantees zero single points of failure. By binding clinic registrations, messages, and appointments to gas-optimized Solidity smart contracts, the system eliminates middlemen, reduces medical record discrepancies, and guarantees sovereign data integrity.
              </p>
              <div className="flex flex-wrap gap-4 text-xs font-mono text-primary">
                <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-muted border border-border">
                  <Database className="w-4 h-4" /> SECURE RECORDS
                </div>
                <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-muted border border-border">
                  <Server className="w-4 h-4" /> NO INTERMEDIARIES
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card/85 border border-border p-6 rounded-2xl text-center space-y-1">
                <span className="text-2xl font-bold text-primary font-mono">100%</span>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Decentralized Storage</p>
              </div>
              <div className="bg-card/85 border border-border p-6 rounded-2xl text-center space-y-1">
                <span className="text-2xl font-bold text-primary font-mono">0ms</span>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Message Lag</p>
              </div>
              <div className="bg-card/85 border border-border p-6 rounded-2xl text-center space-y-1">
                <span className="text-2xl font-bold text-destructive font-mono">SECURE</span>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Patient Cryptography</p>
              </div>
              <div className="bg-card/85 border border-border p-6 rounded-2xl text-center space-y-1">
                <span className="text-2xl font-bold text-primary font-mono">ACTIVE</span>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Ecosystem Verifier</p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}