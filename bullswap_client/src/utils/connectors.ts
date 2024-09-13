import { InjectedConnector } from "@web3-react/injected-connector";

export const injected = new InjectedConnector({
  //chainID  -> 1: mainnet, sepolia:11155111
  supportedChainIds: [1, 11155111],
});
