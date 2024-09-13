import { ethers } from "ethers";
import { Factory__factory } from "../constants/typechain-types";
import { FACTORY_ADDRESSES } from "../constants/addresses";

export function getProvider() {
  //calling metamask a.k.a. window.ethereum
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  return provider;
}

export function getSigner() {
  const provider = getProvider();
  const signer = provider.getSigner();
  return signer;
}

export function getFactoryContract(networkId: number) {
  //use typechain 
  return Factory__factory.connect(FACTORY_ADDRESSES[networkId], getSigner());
}
