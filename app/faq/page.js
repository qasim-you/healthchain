"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function FAQPage() {
    const faqs = [
        { question: "How is my medical data cryptographically secured?", answer: "We use a combination of IPFS for decentralized storage and Ethereum smart contracts to manage access permissions. Only wallets you explicitly approve can decrypt your data." },
        { question: "Can I migrate my entire medical history?", answer: "Yes, our MVP allows patients and doctors to construct a permanent ledger. You can import legacy data securely and attach it to your public wallet identity." },
        { question: "What happens if I lose my private key?", answer: "As with all true non-custodial decentralized applications, your private key is your only access. We are integrating advanced Account Abstraction (ERC-4337) to allow social recovery in the future." },
        { question: "Why target Startup Funding built on Web3?", answer: "Web3 represents the next major paradigm shift in tech. For biotech and health-tech funding, maintaining immutable integrity of clinical data is paramount. We solve this instantly." }
    ];

    const [openIdx, setOpenIdx] = useState(null);

    return (
        <div className="min-h-screen bg-background flex flex-col items-center py-24 px-4">
            <div className="max-w-3xl w-full text-center mb-16">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">Frequently Asked Questions</h1>
                <p className="text-lg text-muted-foreground">Everything you need to know about the product and billing.</p>
            </div>

            <div className="max-w-3xl w-full space-y-4">
                {faqs.map((faq, idx) => (
                    <div 
                        key={idx} 
                        className={`bg-card border transition-all duration-300 rounded-2xl overflow-hidden ${openIdx === idx ? 'border-primary/50 shadow-lg shadow-primary/5' : 'border-border'}`}
                    >
                        <button 
                            className="w-full px-6 py-5 flex items-center justify-between focus:outline-none"
                            onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                        >
                            <span className="font-semibold text-lg text-left text-foreground">{faq.question}</span>
                            <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${openIdx === idx ? 'rotate-180 text-primary' : ''}`} />
                        </button>
                        <div className={`px-6 overflow-hidden transition-all duration-300 ${openIdx === idx ? 'max-h-40 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}>
                            <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
