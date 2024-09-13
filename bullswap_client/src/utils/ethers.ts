import { ethers } from "ethers";


export function getProvider() {
    //calling metamask a.k.a. window.ethereum
    const provider = new ethers.BrowserProvider(window.ethereum);
    return provider;
}