"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useWeb3Context } from "@/contexts/Web3Context";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { uploadFileToIPFS } from "@/utils/ipfs";
import { Send, Hash, MessageCircle, Search, ShieldCheck, Mic } from "lucide-react";

export default function ChatClient() {
    const { contract, account, role } = useWeb3Context();
    const { toast } = useToast();

    const [partnerAddr, setPartnerAddr] = useState("");
    const [activePartner, setActivePartner] = useState("");
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [attachedFile, setAttachedFile] = useState(null);
    const [selectedFileName, setSelectedFileName] = useState("");
    const [isUploadingFile, setIsUploadingFile] = useState(false);
    const [recording, setRecording] = useState(false);

    const scrollRef = useRef(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchMessages = async (addr) => {
        if (!contract || !addr) return;
        setLoading(true);
        try {
            const msgs = await contract.getMessages(addr);
            setMessages(msgs);
            setActivePartner(addr);
            setTimeout(scrollToBottom, 150);
        } catch (error) {
            console.error(error);
            toast({ title: "Failed to load chat", description: "Invalid address or unauthorized.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const [contacts, setContacts] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (!contract || !role) return;
        const fetchContacts = async () => {
            try {
                if (role === "patient") {
                    const docs = await contract.getAllDoctors();
                    setContacts(docs.filter(d => d.isVerified).map(d => ({
                        wallet: d.wallet,
                        name: `Dr. ${d.name}`,
                        desc: d.specialization,
                        image: d.profileImageURI
                    })));
                } else if (role === "doctor") {
                    const pCount = await contract.patientCount();
                    const pts = [];
                    for (let i = 0; i < Number(pCount); i++) {
                        const addr = await contract.patientAddresses(i);
                        const pt = await contract.patients(addr);
                        if (pt.isRegistered) {
                            pts.push({
                                wallet: pt.wallet,
                                name: pt.name,
                                desc: "Registered Patient",
                                image: pt.profileImageURI
                            });
                        }
                    }
                    setContacts(pts);
                }
            } catch (err) {
                console.error("Failed to load contacts:", err);
            }
        };
        fetchContacts();
    }, [contract, role]);

    useEffect(() => {
        if (!contract || !account) return;

        const onMessageSent = (sender, receiver) => {
            if (receiver.toLowerCase() === account.toLowerCase()) {
                const contact = contacts.find(c => c.wallet.toLowerCase() === sender.toLowerCase());
                const senderName = contact ? contact.name : `${sender.slice(0, 6)}...`;

                toast({
                    title: "New Message",
                    description: `You have a new secure message from ${senderName}.`,
                });

                if (activePartner && sender.toLowerCase() === activePartner.toLowerCase()) {
                    fetchMessages(activePartner);
                }
            }
        };

        contract.on("MessageSent", onMessageSent);
        return () => {
            contract.off("MessageSent", onMessageSent);
        };
    }, [contract, account, activePartner, contacts, toast]);

    const handleSelectContact = (addr) => {
        setPartnerAddr(addr);
        fetchMessages(addr);
    };

    const searchParams = useSearchParams();
    useEffect(() => {
        const partner = searchParams?.get?.("partner");
        if (partner && contract) {
            handleSelectContact(partner);
        }
    }, [searchParams, contract]);

    const formatMessage = (text) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\n/g, "<br/>");
    };

    const renderMessageContent = (content) => {
        let payload = null;
        try {
            payload = JSON.parse(content);
        } catch (error) {
            payload = null;
        }

        if (payload?.type === "file") {
            return (
                <div className="space-y-2">
                    <p className="font-semibold text-sm text-foreground">Document</p>
                    <a
                        href={payload.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-100 border border-slate-200 text-slate-900 text-sm hover:bg-slate-200 transition-colors"
                    >
                        <span className="font-medium truncate">{payload.name}</span>
                        <span className="text-xs text-slate-500">Open</span>
                    </a>
                </div>
            );
        }

        if (payload?.type === "audio") {
            return (
                <div className="space-y-2">
                    <p className="font-semibold text-sm text-foreground">Voice Message</p>
                    <audio controls src={payload.url} className="w-full rounded-2xl border border-slate-200 bg-white" />
                </div>
            );
        }

        return <div dangerouslySetInnerHTML={{ __html: formatMessage(content) }} className="whitespace-pre-wrap" />;
    };

    const sendBlockchainMessage = async (content) => {
        const tx = await contract.sendMessage(activePartner, content);
        toast({ title: "Encrypting & Sending..." });
        await tx.wait();
    };

    const sendAudioMessage = async (file) => {
        if (!contract || !activePartner) return;
        setSending(true);
        try {
            const url = await uploadFileToIPFS(file);
            const audioPayload = JSON.stringify({
                type: "audio",
                name: file.name,
                url,
                mime: file.type
            });
            await sendBlockchainMessage(audioPayload);
            setAttachedFile(null);
            setSelectedFileName("");
            fetchMessages(activePartner);
            toast({ title: "Voice message sent" });
        } catch (error) {
            console.error(error);
            toast({ title: "Voice Message Failed", description: error?.message || "Unable to send voice message.", variant: "destructive" });
        } finally {
            setSending(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAttachedFile(file);
        setSelectedFileName(file.name);
    };

    const clearAttachment = () => {
        setAttachedFile(null);
        setSelectedFileName("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleRecordVoice = async () => {
        if (recording) {
            mediaRecorderRef.current?.stop();
            return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            toast({ title: "Voice not supported", description: "Your browser does not support audio recording.", variant: "destructive" });
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            audioChunksRef.current = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            recorder.onstop = async () => {
                setRecording(false);
                stream.getTracks().forEach((track) => track.stop());
                const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                const file = new File([blob], `voice-message-${Date.now()}.webm`, { type: "audio/webm" });
                await sendAudioMessage(file);
            };

            recorder.onerror = (event) => {
                console.error("Recording error:", event);
                setRecording(false);
                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorderRef.current = recorder;
            recorder.start();
            setRecording(true);
            toast({ title: "Recording voice message", description: "Tap again to stop and send." });
        } catch (error) {
            console.error(error);
            toast({ title: "Recording Failed", description: "Please allow microphone access." , variant: "destructive" });
            setRecording(false);
        }
    };

    const filteredContacts = contacts.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.wallet.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSend = async (e) => {
        e.preventDefault();
        if (!contract || !activePartner || (!newMessage.trim() && !attachedFile)) return;
        setSending(true);
        setIsUploadingFile(false);

        try {
            if (attachedFile) {
                setIsUploadingFile(true);
                const url = await uploadFileToIPFS(attachedFile);
                const filePayload = JSON.stringify({
                    type: "file",
                    name: attachedFile.name,
                    url,
                    mime: attachedFile.type
                });
                await sendBlockchainMessage(filePayload);
                clearAttachment();
                toast({ title: "Document sent" });
            }

            if (newMessage.trim()) {
                await sendBlockchainMessage(newMessage.trim());
                setNewMessage("");
            }

            fetchMessages(activePartner);
        } catch (error) {
            console.error(error);
            toast({ title: "Message Failed", description: error?.reason || error.message || error?.message, variant: "destructive" });
        } finally {
            setSending(false);
            setIsUploadingFile(false);
        }
    };

    const activeContactDetails = contacts.find(c => c.wallet.toLowerCase() === activePartner.toLowerCase());

    return (
        <div className="flex h-[calc(100vh-140px)] gap-6">

            {/* Sidebar: Contacts List */}
            <div className="w-80 bg-card border border-border rounded-3xl p-6 flex flex-col shadow-2xl relative overflow-hidden shrink-0">
                <div className="absolute -top-20 -left-20 w-48 h-48 bg-primary/10 blur-[50px] rounded-full pointer-events-none"></div>

                <h3 className="text-xl font-bold text-foreground mb-4 relative z-10 flex items-center gap-2">
                    <MessageCircle className="w-6 h-6 text-teal-400" /> Contacts
                </h3>
                
                <div className="relative z-10 mb-4 shrink-0">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input 
                        type="text" 
                        placeholder={`Search ${role === "patient" ? "doctors" : "patients"}...`} 
                        className="w-full bg-background border border-border pl-10 pr-4 py-3 rounded-2xl text-foreground outline-none focus:border-teal-500 text-sm transition-colors"
                        value={searchQuery} 
                        onChange={e => setSearchQuery(e.target.value)} 
                    />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 relative z-10 pr-1 styled-scrollbar">
                    {contacts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground">
                            <span className="animate-spin border-2 border-primary border-t-transparent rounded-full w-6 h-6 mb-2"></span>
                            <p className="text-sm">Loading directory...</p>
                        </div>
                    ) : filteredContacts.length === 0 ? (
                        <p className="text-sm text-center text-muted-foreground mt-8">No match found.</p>
                    ) : (
                        filteredContacts.map((c, i) => (
                            <button 
                                key={i} 
                                onClick={() => handleSelectContact(c.wallet)}
                                className={`w-full text-left p-3 rounded-2xl border flex items-center gap-3 transition-all duration-200 ${activePartner === c.wallet ? "bg-teal-500/10 border-teal-500/30 scale-[1.02] shadow-sm" : "bg-background/50 border-transparent hover:bg-background hover:border-teal-500/20"}`}
                            >
                                <div className="w-10 h-10 rounded-full bg-muted overflow-hidden shrink-0">
                                    <img src={c.image || `https://api.dicebear.com/7.x/initials/svg?seed=${c.name}`} alt={c.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="overflow-hidden flex-1">
                                    <p className="font-semibold text-sm text-foreground truncate">{c.name}</p>
                                    <p className="text-[10px] text-teal-400 uppercase tracking-wider truncate">{c.desc}</p>
                                </div>
                                {activePartner === c.wallet && <div className="w-2 h-2 rounded-full bg-teal-400 shrink-0 shadow-[0_0_8px_rgba(45,212,191,0.8)]"></div>}
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 bg-card border border-border rounded-3xl flex flex-col shadow-2xl overflow-hidden relative">
                {activePartner ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-20 border-b border-border bg-background/50 flex items-center px-8 shrink-0 relative z-10 backdrop-blur-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-muted">
                                    <img src={activeContactDetails?.image || `https://api.dicebear.com/7.x/initials/svg?seed=${activeContactDetails?.name}`} alt="Profile" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground text-lg leading-tight">{activeContactDetails?.name || "Unknown"}</h3>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono mt-0.5">
                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                        <span>Secured: {activePartner.slice(0, 6)}...{activePartner.slice(-4)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Messages Box */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 relative z-10 scroll-smooth bg-[url('/noise.png')] bg-repeat opacity-[0.99]">
                            {messages.length === 0 ? (
                                <div className="m-auto flex flex-col items-center text-center text-muted-foreground p-6 max-w-sm">
                                    <div className="w-16 h-16 rounded-full bg-teal-500/10 flex items-center justify-center mb-4">
                                        <MessageCircle className="w-8 h-8 text-teal-500/50" />
                                    </div>
                                    <p>Start a secure, end-to-end encrypted conversation with {activeContactDetails?.name}.</p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => {
                                    const isMe = msg.sender.toLowerCase() === account.toLowerCase();
                                    const time = new Date(Number(msg.timestamp) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                    return (
                                        <div key={idx} className={`flex max-w-[75%] ${isMe ? "self-end" : "self-start"}`}>
                                            {!isMe && (
                                                <div className="w-8 h-8 rounded-full overflow-hidden bg-muted mr-2 shrink-0 self-end mb-5">
                                                    <img src={activeContactDetails?.image || `https://api.dicebear.com/7.x/initials/svg?seed=${activeContactDetails?.name}`} alt="Profile" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                                <div className={`px-5 py-3.5 rounded-2xl shadow-sm text-[15px] leading-relaxed ${isMe ? "bg-teal-600 text-white rounded-br-sm shadow-teal-600/20" : "bg-muted border border-border text-foreground rounded-bl-sm"}`}>
                                                    {renderMessageContent(msg.content)}
                                                </div>
                                                <span className="text-[10px] text-muted-foreground font-semibold mt-1.5 px-1">{time}</span>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Box */}
                        <div className="p-4 bg-background/80 border-t border-border shrink-0 relative z-10 backdrop-blur-xl">
                            <form onSubmit={handleSend} className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="Type a secure message..." 
                                        className="flex-1 bg-card border border-border px-6 py-4 rounded-full text-foreground outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all placeholder-slate-500 text-sm shadow-inner"
                                        value={newMessage} 
                                        onChange={e => setNewMessage(e.target.value)} 
                                    />

                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-14 h-14 rounded-full bg-slate-100 border border-border text-slate-700 flex items-center justify-center hover:bg-slate-200 transition-colors"
                                        title="Attach document"
                                    >
                                        <Hash className="w-5 h-5" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleRecordVoice}
                                        className={`w-14 h-14 rounded-full ${recording ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-700"} border border-border flex items-center justify-center hover:bg-slate-200 transition-colors`}
                                        title={recording ? "Stop recording" : "Record voice message"}
                                    >
                                        <Mic className="w-5 h-5" />
                                    </button>

                                    <Button type="submit" disabled={sending || isUploadingFile} className="w-14 h-14 rounded-full bg-teal-500 hover:bg-teal-400 text-white shrink-0 shadow-[0_0_20px_-5px_rgba(20,184,166,0.5)] transition-all transform hover:scale-105 active:scale-95">
                                        {sending ? <span className="animate-spin border-2 border-white/30 border-t-white rounded-full w-6 h-6"></span> : <Send className="w-5 h-5 ml-1" />}
                                    </Button>
                                </div>

                                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />

                                {attachedFile && (
                                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{selectedFileName}</p>
                                            <p className="text-xs text-slate-500">Document ready to send</p>
                                        </div>
                                        <button type="button" onClick={clearAttachment} className="text-xs text-rose-600 hover:underline">Remove</button>
                                    </div>
                                )}
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="m-auto flex flex-col items-center justify-center text-muted-foreground p-8 text-center h-full relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/5 blur-[100px] rounded-full pointer-events-none"></div>
                        <div className="w-24 h-24 rounded-full bg-card border border-border flex items-center justify-center mb-6 shadow-xl relative z-10">
                            <MessageCircle className="w-10 h-10 text-teal-500/40" />
                        </div>
                        <h4 className="text-2xl font-bold text-foreground mb-3 relative z-10">Decentralized Messaging</h4>
                        <p className="max-w-md leading-relaxed relative z-10">Connect your wallet with your counterpart address. All chats are routed through the EVM blockchain ensuring total immutability and verified identity.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
