//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./interfaces/IFactory.sol";
import "./interfaces/IExchange.sol";

event TokenPurchase(
    address indexed buyer,
    uint256 indexed eth_sold,
    uint256 indexed tokens_bought
);
event EthPurchase(
    address indexed buyer,
    uint256 indexed tokens_sold,
    uint256 indexed eth_bought
);
event AddLiquidity(
    address indexed provider,
    uint256 indexed eth_amount,
    uint256 indexed token_amount
);
event RemoveLiquidity(
    address indexed provider,
    uint256 indexed eth_amount,
    uint256 indexed token_amount
);

// Exchange handles the liquidity pool and token swaps.
contract Exchange is ERC20 {
    IERC20 token;
    IFactory factory; //배포된 컨트랙트의 함수를 읽어올 땐 인터페이스 정의해서 얻어와야 함.

    //LP토큰의 이름과 심볼. mint, burn 시 어차피 이름 ,심볼 안 쓰므로 걍 겹쳐도되서 일단 상수로 해도 됨.
    constructor(address _token) ERC20("Gray Uniswap V2", "GUNI-V2") {
        token = IERC20(_token);
        //SWAP pool 생성 시 ETH과 어떤 토큰을 pair할 지 주소를 입력하는 것.
        factory = IFactory(msg.sender);
    }

    // Frontend: slippage included. 최대 얼만큼을 pool에 넣을지.
    function addLiquidity(uint256 _maxToken) public payable {
        //exchange 컨트랙트의 전체 LP토큰 liquidity
        //uniswap v1에선 최초에 공급한 ETH량과 같게 LP를 발행했음.
        //v2부터는 ERC20-ERC20 페어도 지원, 그 중 작은 쪽을 기준으로 LP토큰을 발행.
        uint256 totalLiquidity = totalSupply();

        if (totalLiquidity > 0) {
            //ETH와 페어인 토큰 또한 기존 풀의 비율을 유지할 만큼의 양을 공급해야 함.

            uint256 ethReserve = address(this).balance - msg.value;
            uint256 tokenReserve = token.balanceOf(address(this));
            //공급된 ETH에 맞춰 채워야할 Token량
            uint256 tokenAmount = (msg.value * tokenReserve) / ethReserve;

            //내가 Pool에 맞춰서 송금해야할 토큰량이, 계산된 토큰량보다 적으면 안됨.
            require(_maxToken >= tokenAmount, "Insufficient tokenAmount");

            //내가 이더와 페어로 입력한 이 토큰량을 이 contract에게 공급.
            token.transferFrom(msg.sender, address(this), tokenAmount);

            //내가 보내는 ETH가 현재풀에서 얼마나 차지를 하는지. 그에 맞게 LP토큰을 발행받음.
            uint256 liquidityMinted = (totalLiquidity * msg.value) / ethReserve;
            //민팅. 발행되는 LP토큰
            _mint(msg.sender, liquidityMinted);
        } else {
            //LP토큰 전무. 최초. 유동성이 없는 케이스.

            //초기 유동성은 이 컨트랙트의 이더 잔고. 이미 payable로 받았을테니.
            uint256 initialLiquidity = address(this).balance;

            //공급할 유동성 토큰. FE단에서 핸들링
            uint256 tokenAmount = _maxToken;
            //LP토큰 mint. 유동성 공급자인 호출자(나)에게 발급.
            _mint(msg.sender, initialLiquidity);

            //내가 이더와 페어로 입력한 이 토큰량을 이 contract에게 공급.
            token.transferFrom(msg.sender, address(this), tokenAmount);
        }
    }

    //유동성 제거. 내가 LP 공급후 받았던 LP 토큰 반납. => 이 컨트랙트는 해당 LP 토큰 소각
    function removeLiquidity(uint256 _lpTokenAmount) public {
        require(_lpTokenAmount > 0);

        uint256 totalLiquidity = totalSupply();
        uint256 ethToReceive = (_lpTokenAmount * address(this).balance) /
            totalLiquidity;
        uint256 tokenToReceive = (_lpTokenAmount *
            token.balanceOf(address(this))) / totalLiquidity;

        //해당 주소의 토큰 destroy.
        _burn(msg.sender, _lpTokenAmount);

        //sender, 즉 나에게 이더 보내주쇼
        payable(msg.sender).transfer(ethToReceive);
        token.transfer(msg.sender, tokenToReceive);
    }

    // ETH -> ERC20 SWAP.
    // ETH를 받으니 payable, 그를 바탕으로 Token(Gray) 뱉을 것
    function ethToTokenSwap(uint256 _minTokens) public payable {
        ethToToken(_minTokens, msg.sender);
    }

    //ETH -> ERC20 SWAP. ERC20-ERC20 SWAP 시 BULL이 중간 GRAY/ETH로 오배송 되는 문제 해결.
    function ethToTokenTransfer(
        uint _minTokens,
        address _recipient
    ) public payable {
        require(_recipient != address(0), "Invalid recipient address");
        ethToToken(_minTokens, _recipient);
    }

    //호출하는 함수들이 payable들이라 딱히 이 함수가 payable이 아니어도 됨. 아니라면 얘가 payable.
    function ethToToken(uint _minTokens, address _recipient) private {
        uint256 inputAmount = msg.value;

        uint256 outputAmount = getOutputAmountWithFee(
            inputAmount,
            //Payable keyword already included msg.value(=inputAmount) in address(this).balance.
            address(this).balance - inputAmount,
            token.balanceOf(address(this))
        );

        require(outputAmount >= _minTokens, "Insufficient outputAmount");
        emit TokenPurchase(_recipient, msg.value, outputAmount);
        IERC20(token).transfer(_recipient, outputAmount);
    }

    // ERC20 -> ETH SWAP.
    function tokenToEthSwap(uint256 _tokenSold, uint256 _minEth) public {
        //output은 이 Contract의 토큰 잔고.
        uint256 outputAmount = getOutputAmountWithFee(
            _tokenSold,
            token.balanceOf(address(this)),
            address(this).balance
        );

        require(outputAmount >= _minEth, "Insufficient outputAmount");

        //Contract야 _tokenSold만큼 땅겨와라.
        IERC20(token).transferFrom(msg.sender, address(this), _tokenSold);

        //기본적으로 msg.sender는 address 타입, 즉 non-payable 주소입니다. 이더를 msg.sender에게 보내려면 이 주소를 payable 타입으로 변환해줘야 합니다.
        payable(msg.sender).transfer(outputAmount);
    }

    function tokenToTokenSwap(
        uint256 _tokenSold,
        //최종 스왑 시 받는 ERC20 Token값. FE에서 계산되서 올 것.
        uint256 _minTokenBought,
        //중간 swap 시 조건으로 필요한 최소 Eth량.
        uint256 _minEthBought,
        address _tokenAddress
    ) public {
        //현 상태에선 내가 교환받고자 하는 ERC20(BULL)의 exchange 컨트랙트 주소를 알 수 없음.
        //exchange 주소는 factory contract를 거쳐 얻어옴.
        address toTokenExchangeAddress = factory.getExchange(_tokenAddress);

        //ERC20 ->ETH. Uniswap V1: ERC20 -> ETH(not actual swap. internal calc.) -> ERC20
        //중간 SWAP 시 ETH 교환 예산량.
        uint256 ethOutputAmount = getOutputAmount(
            _tokenSold,
            token.balanceOf(address(this)),
            address(this).balance
        );
        //FE UI로부터 고지한 최소한의 Eth 갯수보다 커야.
        require(ethOutputAmount >= _minEthBought, "Insufficient outputAmount");

        //GRAY를 GRAY->ETH exchange 컨트랙트로 보냄.
        require(token.transferFrom(msg.sender, address(this), _tokenSold));

        //기존의 ethToToken은 IERC20 인터페이스야 msg.sender에게 output만큼 보내라.였음.
        //문제는 BULL 토큰을 받기 위해선 지금 이 컨트랙트에서 BULL-ETH 스왑 함수를 호출할 방법이 없음.
        //새로운 인터페이스를 정의, 호출해서 거기서 스왑 함수를 호출해야 함.
        // 그래서 IERC20(token).transfer(msg.sender, outputAmount); 말고 IExchange.
        //ETH <-> BULL exchange의 주소임.
        //msg.sender는 이 tokenToToken의 호출자. 즉 유저.
        IExchange(toTokenExchangeAddress).ethToTokenTransfer{
            value: ethOutputAmount
        }(_minTokenBought, msg.sender);
    }

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

    //fee 1%
    function getOutputAmountWithFee(
        uint256 inputAmount,
        uint256 inputReserve,
        uint256 outputReserve
    ) public pure returns (uint256) {
        //fee 1%
        uint256 inputAmountWithFee = inputAmount * 99;
        uint256 numerator = inputAmountWithFee * outputReserve;
        //교환 비율 맞추기 위해. delta x를 각 reserve에 곱해줌.
        uint256 denominator = inputReserve * 100 + inputAmountWithFee;
        //1%를 덜 주면서 풀의 각 Reserve는 더 느는 것.
        return numerator / denominator;
    }
}
