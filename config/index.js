import HealthcareJSON from "./Healthcare.json";

export const CONTRACT_ADDRESS = "0x9b35B0fAAaAF0c76F0C53a04Bf287056CA7c51a6";
export const CONTRACT_ABI = HealthcareJSON.abi;

export const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY;
export const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;
export const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;
export const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL; // e.g. https://gateway.pinata.cloud/ipfs/
