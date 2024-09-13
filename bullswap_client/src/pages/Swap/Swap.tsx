import { Link } from "react-router-dom";
import { Button, InputAdornment, TextField } from "@mui/material";
import SwapVerticalCircleIcon from "@mui/icons-material/SwapVerticalCircle";
import { useState } from "react";
import { fromWei, getExchangeContract, onEthToTokenSwap } from "../../utils/ethers";
import {
  calculateSlippage,
  getEthToTokenOutputAmount,
} from "../../functions/swap";
import { GRAY_ADDRESS } from "../../constants/addresses";

export function Swap(props: any) {
  const networkId = props.network;
  const [inputValue, setInputValue] = useState<string>("");
  const [outputValue, setOutputValue] = useState<string>("");

  //2% slippage
  const slippage = 200;

  function handleInput(event: any) {
    setInputValue(event.target.value);
  }

  // function onSwap() {
  //   //cpmm calculation logic
  //   onEthToTokenSwap();
  // }

  async function getOutputAmount() {
    const output = await getEthToTokenOutputAmount(
      inputValue,
      GRAY_ADDRESS,
      networkId
    );
    const outputWithSlippage = calculateSlippage(slippage, output).minimum; //_minToken!
    setOutputValue(fromWei(outputWithSlippage)); //divide by 10^18
  }

  return (
    <div>
      <div>
        <TextField
          value={inputValue}
          onChange={handleInput}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">ETH</InputAdornment>
            ),
          }}
          variant="standard"
        />
      </div>

      <SwapVerticalCircleIcon />
      <div>
        <TextField
          value={outputValue}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">GRAY</InputAdornment>
            ),
          }}
          variant="standard"
        />
      </div>

      <Button color="primary" variant="contained">
        Swap
      </Button>
    </div>
  );
}
