import "@nomiclabs/hardhat-waffle";
import "@nomicfoundation/hardhat-toolbox";
import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: "0.8.9",
  networks: {
    //to fix gas fee for awhile for testing.(still will be changed since ETH price is volatile)
    hardhat: {
      gas: 12000000,
      gasPrice: 875000000,
    },
  }
};

export default config;
