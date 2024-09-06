//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Exchange {
    //member var. 상태.
    //ERC20 컨트랙트와 상호작용하기 위해 IERC20 인터페이스를 사용.
    IERC20 token;

    // _token은 토큰 컨트랙트 주소.
    //IERC20()은 새로운 인스턴스의 생성이 아니라 _token에 배포된 컨트랙트가 ERC20 인터페이스를 따르고 있다면,
    //지금 이 Exchange 컨트랙트가 상호작용 할 수 있게 해주는 것.
    constructor(address _token) {
        token = IERC20(_token);
        //SWAP pool 생성 시 이더리움과 어떤 토큰을 pair할 지 주소를 입력하는 것.
    }

    // 토큰을 넣지만 ETH도 페어로 받기 때문에 payable.
    // msg.sender는 보내는 사람의 주소. 나.
    // address(this)는 이 컨트랙트의 주소.
    // tokenAmount는 유동성 공급을 위해 토큰을 넣는 양.
    // address(this)인 contract가 내 토큰을 가져가는 함수임.
    // transfer로 구현하면 ERC20 토큰 컨트랙트를 직접 호출하는 건데,
    // 이 함수는 exchange 컨트랙트가 주체이니 땡겨오는 걸로.
    function addLiquidity(uint256 _tokenAmount) public payable {
        token.transferFrom(msg.sender, address(this), _tokenAmount);
    }

    //함수호출자에게 이더 전송하고, 토큰도 전송해라.
    //제대로 적용하려면 LP 토큰을 구해서 전체 토큰 개수와
    //이 사람에게 줘야할 토큰 개수를 계산해야 함.
    //추후 구현 예정.
    // function removeLiquidity() public {
    //     msg.sender.transfer(ethAmount);
    //     token.transfer(msg.sender, _tokenAmount);
    // }

    // ETH -> ERC20 SWAP.
    // ETH를 받고 token을 뱉으니 payable
    // _minTokens는 최소한의 토큰 수량. slippage 고려.
    function ethToTokenSwap(uint256 _minTokens) public payable {
        uint256 inputAmount = msg.value;

        //payable 키워드로 인해 이미 이 함수 실행 시 내 주소에서 ETH가 넘어온 상태.내 address에선 inputAmount만큼 빠진 것을 반영해야 함
        //address(this).balance 찍어보면 swap시 input이 이미 추가되어 있음.

        //output은 이 Contract의 토큰 잔고.
        uint256 outputAmount = getOutputAmount(
            inputAmount,
            address(this).balance - inputAmount,
            token.balanceOf(address(this))
        );

        require(outputAmount >= _minTokens, "Insufficient outputAmount");

        //transfer token out. IERC20 인터페이스야 msg.sender에게 output만큼 보내라.
        IERC20(token).transfer(msg.sender, outputAmount);
    }

    ////SMM
    // function getPrice(
    //     uint256 inputReserve,
    //     uint256 outputReserve
    // ) public pure returns (uint256) {
    //     uint256 numerator = inputReserve;
    //     uint256 denominator = outputReserve;
    //     return numerator / denominator;
    // }

    //inputReserve는 풀의 input 토큰 잔고(x), outputReserve는 output 토큰 잔고(y). inputAmount가 delta x.
    //delta y를 찾는 함수.
    function getOutputAmount(
        uint256 inputAmount,
        uint256 inputReserve,
        uint256 outputReserve
    ) public pure returns (uint256) {
        uint256 numerator = inputAmount * outputReserve;
        uint256 denominator = inputReserve + inputAmount;
        return numerator / denominator;
    }
}
