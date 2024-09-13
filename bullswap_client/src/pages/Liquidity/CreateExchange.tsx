import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { useState } from "react";
import { getFactoryContract } from "../../utils/ethers";

export function CreateExchange(props: any) {
  const { networkId, active } = props;
  const [newExchangeToken, setNewExchangeToken] = useState<string>("");

  const handleNewExchangeTokenChange = (event: any) => {
    setNewExchangeToken(event.target.value);
  };

  const handleCreateExchange = async () => {
    if (!active) {
      alert("Please connect your wallet");
      return;
    }
    // using Sepolia network
    // new Contract(abi).method()..로 난리치고 메서드 보려고 컨트랙트 까봊 ㅣ않아도.
    // typechain-types로 복붙만 해놓으면 함수가 추천으로 달라붙음.
    getFactoryContract(networkId).createExchange(newExchangeToken);
  };

  return (
    <div>
      {/* get ERC20 Token Address */}
      <TextField
        label="ERC20 Token Address"
        onChange={handleNewExchangeTokenChange}
      ></TextField>
      <Button onClick={handleCreateExchange}>Create Exchange</Button>
    </div>
  );
}
