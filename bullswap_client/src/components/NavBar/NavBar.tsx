import { Link } from "react-router-dom";
import { Button } from "@mui/material";

export function NavBar(props: any) {
  return (
    <div>
      <Button>
        <Link to="/">Home</Link>
      </Button>
      <Button>
        <Link to="/liquidity">Liquidity</Link>
      </Button>
    </div>
  );
}
