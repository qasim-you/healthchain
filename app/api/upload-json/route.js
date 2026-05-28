import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const body = await request.json();
        const jwt = process.env.NEXT_PUBLIC_PINATA_JWT;

        if (!jwt) {
            return NextResponse.json({ error: "Pinata JWT not configured on server" }, { status: 500 });
        }

        const pinataRes = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${jwt}`,
            },
            body: JSON.stringify(body),
        });

        if (!pinataRes.ok) {
            const errorData = await pinataRes.json();
            return NextResponse.json({ error: errorData }, { status: pinataRes.status });
        }

        const data = await pinataRes.json();
        const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || "https://gateway.pinata.cloud/ipfs/";
        return NextResponse.json({ url: `${gatewayUrl}${data.IpfsHash}`, hash: data.IpfsHash });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
