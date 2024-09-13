//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

//일단 getExchange만 우리 Factory contract에서 쓰겠음.
interface IFactory {
    //interface의 visiblity는 항상 external.
    function getExchange(address _token) external view returns (address);
}
