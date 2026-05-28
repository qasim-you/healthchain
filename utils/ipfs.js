// Upload via server-side API route to avoid JWT encoding issues in browser
export const uploadFileToIPFS = async (file) => {
    if (!file) return null;
    try {
        console.log("Uploading file via /api/upload route...");
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(`Upload Error (${res.status}): ${JSON.stringify(errorData)}`);
        }

        const data = await res.json();
        console.log("File uploaded to IPFS:", data);
        return data.url;
    } catch (error) {
        console.error("Error uploading file to IPFS:", error);
        throw new Error(error.message || "IPFS Upload failed");
    }
};

export const uploadJSONToIPFS = async (jsonData) => {
    try {
        const res = await fetch("/api/upload-json", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(jsonData),
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(`JSON Upload Error (${res.status}): ${JSON.stringify(errorData)}`);
        }

        const data = await res.json();
        console.log("JSON metadata uploaded to IPFS:", data);
        return data.url;
    } catch (error) {
        console.error("Error uploading JSON metadata to IPFS:", error);
        throw error;
    }
};
