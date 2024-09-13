import { Link } from "react-router-dom";
import { Button } from "@mui/material";
import { CreateExchange } from "./CreateExchange";

export function Liquidity(props: any) {

  const {network, active} = props;
  
  return (
    <div>
      LIQUIDITY PAGE
      <CreateExchange networkId={network} active={active}></CreateExchange>
    </div>
  );
}
