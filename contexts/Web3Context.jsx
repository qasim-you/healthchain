"use client";
import { createContext, useContext } from "react";
import { useWeb3 } from "../hooks/useWeb3";

export const Web3Context = createContext(null);

export const useWeb3Context = () => useContext(Web3Context);

export const Web3Provider = ({ children }) => {
    const web3State = useWeb3();

    return (
        <Web3Context.Provider value={web3State}>
            {children}
        </Web3Context.Provider>
    );
};
