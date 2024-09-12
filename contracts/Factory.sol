//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "hardhat/console.sol";

import "./Exchange.sol";

contract Factory {

    mapping(address => address) tokenToExchange;

    //returns: address of the paired ERC20
    function createExchange(address _token) public returns (address) {

        //new Exchange => createExchange
        //Exchange 컨트랙트는 현재 디렉토리에 우리가 만든 것.
        Exchange exchange = new Exchange(_token);
        tokenToExchange[_token] = address(exchange);

        return address(exchange);
    }


    function getExchange(address _token) public view returns (address) {
        return tokenToExchange[_token];
    }
}