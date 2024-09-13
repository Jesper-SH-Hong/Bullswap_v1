//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

interface IExchange {
    //interface: external !!
    function ethToTokenSwap(uint256 _minTokens) external payable;
    function ethToTokenTransfer(
        uint _minTokens,
        address _recipient
    ) external payable;
}
