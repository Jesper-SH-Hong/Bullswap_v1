import { ethers } from "hardhat"
import { expect } from "chai";

//컴파일로 생성된 내 smart contract의 typechain-types/contracts/Exchange, token.ts를 import
import { Exchange } from "../typechain-types/contracts/Exchange"
import { Token } from "../typechain-types/contracts/Token";
import { BigNumber } from "ethers";

//ERC20은 매번 10^18 단위를 사용. 1ETH = 10^18 WEI
const toWei = (value: number) => ethers.utils.parseEther(value.toString());
const toEther = (value: BigNumber) => ethers.utils.formatEther(value);
const getBalance = ethers.provider.getBalance;

describe("Exchange", () => {
    let owner: any;
    let user: any;
    let exchange: Exchange;
    let token: Token;

    beforeEach(async () => {

        //기본적으로 10,000개의 Ether를 가지고 있음.
        [owner, user] = await ethers.getSigners();
        //Token 컨트랙트 배포
        const TokenFactory = await ethers.getContractFactory("Token");
        //GrayToken이라는 이름의 토큰을 1,000,000개 배포
        token = await TokenFactory.deploy("GrayToken", "GRAY", toWei(1000000));
        await token.deployed();

        //Exchange 컨트랙트 배포
        const ExchangeFactory = await ethers.getContractFactory("Exchange");
        exchange = await ExchangeFactory.deploy(token.address);
        await exchange.deployed();
    });

    describe("addLiquidity", async () => {
        it("add liquidity", async () => {
          //GRAY Token 계약이 exchange 계약에게 1000 GRAY approve
          await token.approve(exchange.address, toWei(1000));
          //내가 만든 GRAY 토큰(ERC20)과 1000개의 ETH를 exchange 계약에게 넣어서 Pool 형성.
          await exchange.addLiquidity(toWei(1000), { value: toWei(1000) });
          //exchange 계약에게 1000개의 ETH 토큰이 있음
          expect(await getBalance(exchange.address)).to.equal(toWei(1000));
          //GRAY토큰이 exchange 계약 주소에도 1000개 잘 있음.
          expect(await token.balanceOf(exchange.address)).to.equal(toWei(1000));
        });
      });

    describe("getTokenPrice", async() => {
        it("correct get Token Price", async() => {
            await token.approve(exchange.address, toWei(1000));
            await exchange.addLiquidity(toWei(1000), { value: toWei(1000) });
            
            const tokenReserve = await token.balanceOf(exchange.address);
            const etherReserve = await getBalance(exchange.address);

            // GRAY Price
            // Expect 1ETH per 1GRAY
            expect(
                (await exchange.getPrice(tokenReserve, etherReserve))
            ).to.eq(1);
        })
    })

    //참고만 toETH로 환산하는 건 
    describe("EthToTokenSwap", async() => {
        it("correct EthToTokenSwap", async() => {

            await token.approve(exchange.address, toWei(1000));
            await exchange.addLiquidity(toWei(1000), { value: toWei(1000) });
            
            //SWAP은 새로운 유저가 온다 가정. 1개의 이더를 스왑.
            await exchange.connect(user).ethToTokenSwap({ value: toWei(1) });
            //유저는 token 즉 gray 밸런스가 1개겠지.
            expect(
                (toEther(await token.balanceOf(user.address)))
            ).to.equal("1.0");
            // GRAY 잔고는 exchange 계약에선 1개를 유저와 스왑했으니 999개 남았을 거야.
            // 문제는 GAS FEE로 항상 에러날 수 있음.. 9998999....blabla
            expect(
                (toEther(await token.balanceOf(exchange.address)))
            ).to.eq("999.0");


            //getBalance는 항상 이더 잔고를 가져오는 함수
            expect(
                (toEther(await getBalance(exchange.address)))
            ).to.eq("1001.0");
            
        })
    })
})