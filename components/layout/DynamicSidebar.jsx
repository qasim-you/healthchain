"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWeb3Context } from "@/contexts/Web3Context";
import {
    LayoutDashboard, Pill, Users, Stethoscope,
    CalendarCheck, ClipboardList, MessageSquare,
    LogOut, Hexagon, HeartPlus, Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sidebar, SidebarHeader, SidebarContent, SidebarGroup,
    SidebarGroupContent, SidebarMenu, SidebarMenuItem,
    SidebarMenuButton, SidebarFooter, SidebarRail,
    useSidebar
} from "@/components/ui/sidebar";
import {
    Tooltip, TooltipContent, TooltipTrigger
} from "@/components/ui/tooltip";

const ROLE_NAV_LINKS = {
    admin: [
        { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { name: "Verify Doctors", href: "/admin/verify", icon: Users },
        { name: "Marketplace", href: "/admin/marketplace", icon: Pill },
    ],
    doctor: [
        { name: "Dashboard", href: "/doctor", icon: LayoutDashboard },
        { name: "Appointments", href: "/doctor/appointments", icon: CalendarCheck },
        { name: "Patients", href: "/doctor/patients", icon: ClipboardList },
        { name: "Prescriptions", href: "/doctor/prescribe", icon: HeartPlus },
        { name: "Chat", href: "/chat", icon: MessageSquare },
    ],
    patient: [
        { name: "Dashboard", href: "/patient", icon: LayoutDashboard },
        { name: "Find Doctor", href: "/patient/doctors", icon: Stethoscope },
        { name: "My Records", href: "/patient/records", icon: ClipboardList },
        { name: "Pharmacy", href: "/medicine", icon: Pill },
        { name: "Chat", href: "/chat", icon: MessageSquare },
    ],
};

const ROLE_COLORS = {
    admin: "text-rose-400   bg-rose-500/10   border-rose-500/20",
    doctor: "text-teal-400   bg-teal-500/10   border-teal-500/20",
    patient: "text-primary bg-primary/10 border-primary/20",
};

function Logo() {
    const { state } = useSidebar();
    const collapsed = state === "collapsed";

    return (
        <div className="flex items-center gap-3 px-3 py-2">
            {/* Icon — always visible */}
            <div className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600
                            flex items-center justify-center shadow-lg shadow-teal-500/25">
                <Hexagon className="w-5 h-5 text-white fill-white/20" />
            </div>

            {/* Text — hidden when collapsed */}
            {!collapsed && (
                <div className="overflow-hidden">
                    <p className="text-sm font-bold text-foreground leading-none tracking-tight">
                        HealthChain
                    </p>
                    <p className="text-[10px] font-semibold tracking-widest text-teal-500 mt-0.5 uppercase">
                        Blockchain EMR
                    </p>
                </div>
            )}
        </div>
    );
}

function AccountCard({ account, role }) {
    const { state } = useSidebar();
    const collapsed = state === "collapsed";
    const badge = ROLE_COLORS[role] || ROLE_COLORS.patient;

    const shortAddr = account
        ? `${account.slice(0, 6)}…${account.slice(-4)}`
        : "Not Connected";

    if (collapsed) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="mx-auto w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-cyan-600
                                    flex items-center justify-center cursor-default shadow-md shadow-teal-500/20">
                        <Wallet className="w-4 h-4 text-white" />
                    </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                    <p className="font-mono text-xs">{shortAddr}</p>
                    <p className="text-xs capitalize text-muted-foreground">{role}</p>
                </TooltipContent>
            </Tooltip>
        );
    }

    return (
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                        bg-muted/50 border border-border">
            <div className="shrink-0 w-9 h-9 rounded-full bg-gradient-to-br
                            from-teal-400 to-cyan-600 flex items-center justify-center
                            shadow-md shadow-teal-500/20">
                <Wallet className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold font-mono text-foreground truncate">
                    {shortAddr}
                </p>
                <span className={`inline-block mt-0.5 text-[10px] font-semibold
                                  uppercase tracking-wider px-2 py-0.5 rounded-full
                                  border ${badge}`}>
                    {role}
                </span>
            </div>
        </div>
    );
}

export default function DynamicSidebar() {
    const pathname = usePathname();
    const { role, disconnectWallet, account } = useWeb3Context();
    const links = ROLE_NAV_LINKS[role] || [];

    return (
        <Sidebar collapsible="icon" className="border-r border-border bg-background">

            {/* ── Header ── */}
            <SidebarHeader className="px-3 pt-5 pb-4 border-b border-border">
                <Logo />
            </SidebarHeader>

            {/* ── Nav ── */}
            <SidebarContent className="px-2 py-4">
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu className="space-y-0.5">
                            {links.map((link) => {
                                const isActive = pathname === link.href;
                                const Icon = link.icon;
                                return (
                                    <SidebarMenuItem key={link.name}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            tooltip={link.name}
                                            className={`
                                                group relative h-10 rounded-lg px-3
                                                transition-all duration-150
                                                ${isActive
                                                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                                }
                                            `}
                                        >
                                            <Link href={link.href} className="flex items-center gap-3">
                                                <Icon className="w-[18px] h-[18px] shrink-0" />
                                                <span className="font-medium text-sm truncate">
                                                    {link.name}
                                                </span>
                                                {/* active pill accent */}
                                                {isActive && (
                                                    <span className="absolute right-2 w-1.5 h-1.5
                                                                     rounded-full bg-primary-foreground/60" />
                                                )}
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* ── Footer ── */}
            <SidebarFooter className="px-3 py-4 border-t border-border space-y-2">
                <Link href="/profile" className="block hover:opacity-80 transition-opacity">
                    <AccountCard account={account} role={role ?? "patient"} />
                </Link>

                <SidebarMenuButton
                    tooltip="Disconnect"
                    onClick={() => {
                        disconnectWallet();
                        window.location.href = "/";
                    }}
                    className="w-full h-10 rounded-lg px-3 text-rose-500
                               hover:bg-rose-500/10 hover:text-rose-400
                               transition-colors duration-150 cursor-pointer"
                >
                    <LogOut className="w-[18px] h-[18px] shrink-0" />
                    <span className="font-medium text-sm">Disconnect</span>
                </SidebarMenuButton>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}