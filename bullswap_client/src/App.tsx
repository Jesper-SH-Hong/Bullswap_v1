import React from 'react';
import logo from './logo.svg';
import './App.css';
import { useWeb3React } from '@web3-react/core';
import { error } from 'console';
import { injected } from './utils/connectors';


//chainId: whch blockchain network the user is connected to mainnet / testnet?
const { chainId, account, active, activate, deactivate } = useWeb3React();

function handleConnect() {
  if(active) {  //connected
    deactivate();
    return;
  }
  
  //injected: which network to support?
  activate(injected, (error) => {
    if(error) {
      alert(error);
    }})
}


function App() {
   return (
    <div className="App">
       <div>
        <p>Account: {account}</p>
        <p>ChainId: {chainId}</p>
      </div>
      <div>
        <button onClick={handleConnect}>{active ? 'DisConnect' : 'Connect'}</button>
      </div>

    </div>
  );
}

export default App;
