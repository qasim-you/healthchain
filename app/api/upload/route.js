import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file");

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const jwt = process.env.NEXT_PUBLIC_PINATA_JWT;

        if (!jwt) {
            return NextResponse.json({ error: "Pinata JWT not configured" }, { status: 500 });
        }

        // Forward the file to Pinata
        const pinataFormData = new FormData();
        pinataFormData.append("file", file);

        const pinataRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${jwt}`,
            },
            body: pinataFormData,
        });

        if (!pinataRes.ok) {
            const errorData = await pinataRes.json();
            console.error("Pinata error:", errorData);
            return NextResponse.json({ error: errorData }, { status: pinataRes.status });
        }

        const data = await pinataRes.json();
        const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || "https://gateway.pinata.cloud/ipfs/";
        const fileUrl = `${gatewayUrl}${data.IpfsHash}`;

        return NextResponse.json({ url: fileUrl, hash: data.IpfsHash });
    } catch (error) {
        console.error("Upload API error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
