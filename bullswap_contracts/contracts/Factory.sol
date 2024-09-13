//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "hardhat/console.sol";

import "./Exchange.sol";

contract Factory {
    mapping(address => address) tokenToExchange;

    //indexed는 event에서 사용되며, 이벤트 로그는 블록체인 상에 저장되지만, 기본적으로 모든 로그는 검색이 불가능합니다. 그러나 indexed로 선언된 파라미터는 검색 가능한 필드가 되어, 블록체인에서 해당 파라미터로 이벤트를 빠르게 필터링 가능.
    event NewExchange(address indexed token, address indexed exchange);

    //returns: address of the paired ERC20
    function createExchange(address _token) public returns (address) {
        //address(0)는 이더리움에서 제로 주소. "아무도 아닌 주소", 할당된 주소가 없음..
        require(_token != address(0), "Invalid token address");

        //new Exchange로 내가 정의했던 새로운 Exchange 컨트랙트 배포.
        //new로 호출 시 내부적으로 'create' OPcode => EVM creates new contract.
        //cf) uniswap v2 'create2' => can get specific address by giving salt, etc.
        //Exchange exchange 컨트랙트의 내용은 우리가 정의한 .sol 파일.
        Exchange exchange = new Exchange(_token);

        require(
            tokenToExchange[_token] == address(0),
            "Exchange already exists"
        );
        tokenToExchange[_token] = address(exchange);

        return address(exchange);
    }

    function getExchange(address _token) public view returns (address) {
        return tokenToExchange[_token];
    }
}
