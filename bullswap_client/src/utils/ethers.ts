import { BigNumber, ethers } from "ethers";
import {
  Exchange__factory,
  Factory__factory,
  Token__factory,
} from "../constants/typechain-types";
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
  //solidity의 contracts들은 typechain컴파일 시 factories에 __factory로 끝나는 파일들도 생성함.
  //typechain의 connect는 solidity의 attach가 하던 것처럼 배포된 컨트랙트에 연결.
  return Factory__factory.connect(FACTORY_ADDRESSES[networkId], getSigner());
}

export async function getTokenExchangeAddressFromFactory(
  tokenAddress: string,
  networkId: number
) {
  console.log("token: " + tokenAddress);
  return getFactoryContract(networkId).getExchange(tokenAddress);
}

export async function getTokenBalanceAndSymbol(
  accountAddress: string,
  tokenAddress: string
) {
  //배포한 ERC20 토큰(GRAY) 컨트랙트 주소와 연결. symbol과 balance를 리턴
  const token = Token__factory.connect(tokenAddress, getSigner());
  const symbol = await token.symbol();
  //이 어카운트의 ERC20 토큰(GRAY) 잔고를 가져옴
  const balance = await token.balanceOf(accountAddress);
  return {
    symbol: symbol,
    balance: ethers.utils.formatEther(balance),
  };
}

export function getExchangeContract(exchangeAddress: string) {
  //exchange contract address를 받아와서 연결. promise를 리턴
  return Exchange__factory.connect(exchangeAddress, getSigner());
}

//_minToken은 BigNumberish였으므로.. 기본단위가 10^18
export async function onEthToTokenSwap(
  inputAmount: BigNumber,
  outputAmount: BigNumber,
  tokenAddress: string,
  networkId: number
) {
  const exchangeAddress =
    await getFactoryContract(networkId).getExchange(tokenAddress);
  getExchangeContract(exchangeAddress).ethToTokenSwap(outputAmount, {
    value: inputAmount,
  });
}

export async function getAccountBalance(accountAddress: string) {
  const provider = getProvider();
  const balance = await provider.getBalance(accountAddress);
  return {
    balance: ethers.utils.formatEther(balance),
    symbol: "ETH",
  };
}

export function fromWei(to: BigNumber) {
  return ethers.utils.formatEther(to);
}
