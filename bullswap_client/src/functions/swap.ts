import { ethers, BigNumber } from "ethers";
import {
  getTokenBalanceAndSymbol,
  getAccountBalance,
  getTokenExchangeAddressFromFactory,
} from "../utils/ethers";

//실제 유니스왑도 이렇게 Frontend에서 Slippage등 고려해서 백엔드로 넘겨줌.

export async function getEthToTokenOutputAmount(
  inputValue: string,
  tokenAddress: string,
  networkId: number
) {
  const [EthReserve, TokenReserve] = await getReserves(tokenAddress, networkId);
  console.log(inputValue);
  console.log(EthReserve);
  console.log(TokenReserve);

  //formatEther한 거 원복. 다시 Big Number로
  return getOutputAmount(
    ethers.utils.parseEther(inputValue),
    ethers.utils.parseEther(EthReserve),
    ethers.utils.parseEther(TokenReserve)
  );
}

async function getReserves(tokenAddress: string, networkId: number) {
  const exchangeAddress = await getTokenExchangeAddressFromFactory(
    tokenAddress,
    networkId
  );
  //pool의, 즉 exchange 어드레스의 이더 밸런스..
  const ethReserve = (await getAccountBalance(exchangeAddress)).balance;
  const tokenReserve = (
    await getTokenBalanceAndSymbol(exchangeAddress, tokenAddress)
  ).balance;

  return [ethReserve, tokenReserve];
}

function getOutputAmount(
  inputAmount: BigNumber,
  inputReserve: BigNumber,
  outputReserve: BigNumber
) {
  const inputAmountWithFee = inputAmount.mul(BigNumber.from(99));
  const numerator = inputAmountWithFee.mul(outputReserve);
  const denominator = inputReserve
    .mul(BigNumber.from(100))
    .add(inputAmountWithFee);
  console.log(ethers.utils.formatEther(numerator.div(denominator)));
  return numerator.div(denominator);
}

export function calculateSlippage(slippage: number, amount: BigNumber) {
  //200/10000 = 2%
  const offset = amount.mul(slippage).div(BigNumber.from(10000));
  const minimum = amount.sub(offset);
  const maximum = amount.add(offset);

  return {
    minimum: minimum,
    maximum: maximum,
  };
}
