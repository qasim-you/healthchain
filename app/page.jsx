"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWeb3Context } from "@/contexts/Web3Context";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck, Stethoscope, HeartPulse,
  Activity, Hexagon, ArrowRight, Zap, Wallet
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
});

const FEATURES = [
  { icon: ShieldCheck, label: "Zero-Knowledge KYC", color: "text-emerald-400" },
  { icon: Zap, label: "Smart Contracts", color: "text-teal-400" },
  { icon: Stethoscope, label: "Verified Professionals", color: "text-cyan-400" },
];

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
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden flex flex-col items-center justify-center selection:bg-teal-500/25">

      {/* ── Ambient Background ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-teal-500/10 blur-[130px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-emerald-500/8 blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-cyan-500/6 blur-[80px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <main className="relative z-10 flex flex-col items-center text-center px-6 py-16 w-full max-w-3xl mx-auto">

        {/* ── Top Badge ── */}
        <motion.div {...fadeUp(0)} className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-medium tracking-wide">
            <Hexagon className="w-3.5 h-3.5 fill-teal-500/20" />
            HealthChain · Blockchain EMR
          </div>
        </motion.div>

        {/* ── Hero Icon ── */}
        <motion.div {...fadeUp(0.1)} className="mb-8">
          <div className="relative mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-2xl shadow-teal-500/30">
            <Activity className="w-10 h-10 text-white" />
            <span className="absolute inset-0 rounded-2xl animate-ping bg-teal-400/20" />
          </div>
        </motion.div>

        {/* ── Headline ── */}
        <motion.h1 {...fadeUp(0.15)} className="text-5xl md:text-6xl font-extrabold tracking-tight leading-none mb-5">
          <span className="bg-clip-text text-transparent bg-gradient-to-br from-foreground via-foreground to-foreground/50">
            Future of
          </span>
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400">
            Healthcare
          </span>
        </motion.h1>

        {/* ── Subtitle ── */}
        <motion.p {...fadeUp(0.2)} className="text-base md:text-lg text-muted-foreground max-w-xl font-light leading-relaxed mb-10">
          A fully decentralized healthcare ecosystem powered by Blockchain, Web3, and AI. Secure medical records, global marketplace, and verifiable professionals.
        </motion.p>

        {/* ── CTA Area ── */}
        <AnimatePresence mode="wait">

          {/* Error State */}
          {errorMessage && (
            <motion.div
              key="error"
              {...fadeUp(0)}
              className="w-full max-w-md p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 space-y-3"
            >
              <p className="font-semibold text-base">Connection Error</p>
              <p className="text-sm font-mono opacity-75 break-all">{errorMessage}</p>
              <Button
                onClick={() => window.location.reload()}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-xl h-10"
              >
                Reset & Try Again
              </Button>
            </motion.div>
          )}

          {/* Connect Wallet */}
          {!errorMessage && !isWalletConnected && (
            <motion.div key="connect" {...fadeUp(0.25)} className="flex flex-col items-center gap-4">
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                size="lg"
                className="h-13 px-8 rounded-full text-base font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white shadow-xl shadow-teal-500/25 transition-all hover:shadow-teal-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Wallet className="mr-2 h-5 w-5" />
                {isConnecting ? "Connecting..." : "Connect Wallet"}
                {!isConnecting && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
              <p className="text-xs text-muted-foreground">
                MetaMask required · Your keys, your data
              </p>
            </motion.div>
          )}

          {/* Unregistered — Choose Role */}
          {!errorMessage && isWalletConnected && role === "unregistered" && (
            <motion.div key="register" {...fadeUp(0)} className="w-full max-w-lg space-y-5">
              <div className="space-y-1">
                <h3 className="text-xl font-semibold text-foreground">Join the Ecosystem</h3>
                <p className="text-sm text-muted-foreground">Choose your role to get started</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => router.push("/register/patient")}
                  className="group flex flex-col items-center gap-3 p-6 rounded-2xl border border-border bg-muted/40 hover:bg-muted/70 hover:border-teal-500/40 transition-all duration-200 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center group-hover:bg-rose-500/20 transition-colors">
                    <HeartPulse className="h-6 w-6 text-rose-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">Register as Patient</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Access your health records</p>
                  </div>
                </button>

                <button
                  onClick={() => router.push("/register/doctor")}
                  className="group flex flex-col items-center gap-3 p-6 rounded-2xl border border-border bg-muted/40 hover:bg-muted/70 hover:border-teal-500/40 transition-all duration-200 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center group-hover:bg-teal-500/20 transition-colors">
                    <Stethoscope className="h-6 w-6 text-teal-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">Register as Doctor</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Manage patients & prescriptions</p>
                  </div>
                </button>
              </div>

              {/* Wallet address pill */}
              {account && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border text-xs text-muted-foreground font-mono">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                  {account.slice(0, 6)}…{account.slice(-4)}
                </div>
              )}
            </motion.div>
          )}

          {/* Authenticating */}
          {!errorMessage && isWalletConnected && role && role !== "unregistered" && (
            <motion.div key="auth" {...fadeUp(0)} className="flex items-center gap-3 text-teal-400 text-sm font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
              Authenticating identity on-chain…
            </motion.div>
          )}

        </AnimatePresence>

        {/* ── Feature Badges ── */}
        <motion.div {...fadeUp(0.35)} className="mt-20 flex flex-wrap items-center justify-center gap-4">
          {FEATURES.map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border text-sm text-muted-foreground hover:border-teal-500/30 hover:text-foreground transition-colors">
              <Icon className={`h-4 w-4 ${color}`} />
              {label}
            </div>
          ))}
        </motion.div>

      </main>
    </div>
  );
}