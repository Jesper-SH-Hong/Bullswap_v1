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
  //typechain-types로 컴파일해온 Factory__factory를 사용하여 Factory contract에 연결
  //solidity의 contracts들은 typechain컴파일 시 __factory로 끝나는 파일이 생성되는듯.
  //typechain의 connect는 solidity의 attach가 하던 것처럼 배포된 컨트랙트에 연결.
  return Factory__factory.connect(FACTORY_ADDRESSES[networkId], getSigner());
}
