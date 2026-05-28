"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../config";

export const useWeb3 = () => {
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [contract, setContract] = useState(null);
    const [account, setAccount] = useState("");
    const [isWalletConnected, setIsWalletConnected] = useState(false);
    const [role, setRole] = useState(null); // 'admin', 'doctor', 'patient', 'unregistered', 'error'
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        // Rehydrate connection on reload
        if (typeof window !== "undefined" && window.ethereum) {
            window.ethereum.on("accountsChanged", (accounts) => {
                if (accounts.length > 0) {
                    connectWallet();
                } else {
                    disconnectWallet();
                }
            });
            window.ethereum.on("chainChanged", () => {
                window.location.reload();
            });
        }
    }, []);

    const connectWallet = async () => {
        try {
            setErrorMessage("");
            if (typeof window.ethereum === "undefined") {
                alert("Please install MetaMask to use this application.");
                return null;
            }

            // Auto-switch to Sepolia Testnet (11155111 = 0xaa36a7)
            try {
                await window.ethereum.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: "0xaa36a7" }],
                });
            } catch (switchError) {
                if (switchError.code === 4902) {
                    await window.ethereum.request({
                        method: "wallet_addEthereumChain",
                        params: [{
                            chainId: "0xaa36a7",
                            chainName: "Sepolia test network",
                            nativeCurrency: { name: "SepoliaETH", symbol: "SEP", decimals: 18 },
                            rpcUrls: ["https://rpc.sepolia.org"],
                            blockExplorerUrls: ["https://sepolia.etherscan.io"]
                        }],
                    });
                }
            }

            const newProvider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await newProvider.send("eth_requestAccounts", []);
            const newSigner = await newProvider.getSigner();

            const newContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, newSigner);

            setAccount(accounts[0]);
            setProvider(newProvider);
            setSigner(newSigner);
            setContract(newContract);
            setIsWalletConnected(true);

            // Verify user role
            await checkUserRole(newContract, accounts[0]);

            return accounts[0];
        } catch (error) {
            console.error("Failed to connect wallet:", error);
            setRole("error");
            setErrorMessage(error?.reason || error?.message || JSON.stringify(error) || "Wallet connection error");
            return null;
        }
    };

    const disconnectWallet = () => {
        setAccount("");
        setProvider(null);
        setSigner(null);
        setContract(null);
        setIsWalletConnected(false);
        setRole(null);
        setErrorMessage("");
    };

    const checkUserRole = async (healthcareContract, userAddress) => {
        if (!healthcareContract) return;

        try {
            const adminAddress = await healthcareContract.admin();
            if (userAddress.toLowerCase() === adminAddress.toLowerCase()) {
                setRole("admin");
                return;
            }

            const doctorData = await healthcareContract.doctors(userAddress);
            if (doctorData.isRegistered) {
                setRole("doctor");
                return;
            }

            const patientData = await healthcareContract.patients(userAddress);
            if (patientData.isRegistered) {
                setRole("patient");
                return;
            }

            setRole("unregistered");
        } catch (error) {
            console.error("Error determining user role:", error);
            setRole("error");
            setErrorMessage(error?.reason || error?.message || JSON.stringify(error) || "Failed to contact contract");
        }
    };

    return {
        provider,
        signer,
        contract,
        account,
        isWalletConnected,
        connectWallet,
        disconnectWallet,
        role,
        errorMessage
    };
};
