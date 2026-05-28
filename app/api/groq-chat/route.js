import { Groq } from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req) {
    try {
        const { messages } = await req.json();

        const systemMessage = {
            role: "system",
            content: `You are the AI Personal Assistant for HealthChain, a decentralized healthcare platform.
Your job is to warmly welcome first-time users and guide them (patients and doctors) on how to use the platform.
- To connect a wallet: Tell them to click "Connect Wallet" at the top right. They need the MetaMask extension installed.
- For Patients: Guide them that they can register their profile, view verified doctors, book appointments securely, and buy medicines.
- For Doctors: Guide them that they must register with their details and upload their medical certificate. The Admin will verify them. Once verified, they can manage appointments and prescribe medicines.
Keep responses concise, professional, friendly, and helpful. Format with short paragraphs or bullet points for readability.`
        };

        const chatCompletion = await groq.chat.completions.create({
            messages: [systemMessage, ...messages],
            model: "llama-3.1-8b-instant", // Fast and free model
            temperature: 0.7,
            max_tokens: 500,
        });

        return new Response(JSON.stringify({ 
            reply: chatCompletion.choices[0]?.message?.content 
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error("Groq API Error:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch response" }), { status: 500 });
    }
}
