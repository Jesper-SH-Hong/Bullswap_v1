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

    describe("addInitialLiquidity", async () => {
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

        describe("addLiquidity", async () => {
        it("add liquidity", async () => {
          await token.approve(exchange.address, toWei(500));
          await exchange.addLiquidity(toWei(500), { value: toWei(1000) });
          expect(await getBalance(exchange.address)).to.equal(toWei(1000));
          expect(await token.balanceOf(exchange.address)).to.equal(toWei(500));


          await token.approve(exchange.address, toWei(100));
          await exchange.addLiquidity(toWei(100), { value: toWei(200) });
          expect(await getBalance(exchange.address)).to.equal(toWei(1200));
          expect(await token.balanceOf(exchange.address)).to.equal(toWei(600));

          
        });
      });

      describe("removeLiquidity", async () => {
        it("remove liquidity", async () => {
          await token.approve(exchange.address, toWei(500));
          await exchange.addLiquidity(toWei(500), { value: toWei(1000) });
          expect(await getBalance(exchange.address)).to.equal(toWei(1000));
          expect(await token.balanceOf(exchange.address)).to.equal(toWei(500));

          await token.approve(exchange.address, toWei(100));
          await exchange.addLiquidity(toWei(100), { value: toWei(200) });

          //v1은 ETH 기준으로 LP이니, 전체 Liquidity가 1200. 그것도 다 내가 넣은 거.
          expect(await getBalance(exchange.address)).to.equal(toWei(1200));
          expect(await token.balanceOf(exchange.address)).to.equal(toWei(600));

          //그중 600개의 LP를 제거하면, 풀에도 1200:600 => 600:300 (동일 비율)로 남아야 함.
          await exchange.removeLiquidity(toWei(600));
          expect(await getBalance(exchange.address)).to.equal(toWei(600));
          expect(await token.balanceOf(exchange.address)).to.equal(toWei(300));


        });
      });

    describe("getTokenPrice", async() => {
        it("correct get Token Price", async() => {
            await token.approve(exchange.address, toWei(1000));
            await exchange.addLiquidity(toWei(1000), { value: toWei(1000) });
            
            //GRAY
            const tokenReserve = await token.balanceOf(exchange.address);
            const etherReserve = await getBalance(exchange.address);

            // GRAY Price
            // expect(
            //     (await exchange.getPrice(tokenReserve, etherReserve))
            // ).to.eq(1);
        })
    })

    //참고만 toETH로 환산하는 건 
    describe("EthToTokenSwap", async() => {
        it("correct EthToTokenSwap", async() => {

            await token.approve(exchange.address, toWei(4000));

            //excnage 계약에 4000 GRAY와 1000 ETH를 넣어서 Pool 형성
            await exchange.addLiquidity(toWei(4000), { value: toWei(1000) });
            
            //어떤 유저가 SWAP을 하고자 1ETH를 보내면 몇 그레이 받을까.
            //현재 풀 상태가 4:1이니 4000*1/(1000+1) 즉 3.996을 받으면 최선이나,
            //slippage 고려해서 최소 3.99 Token은 풀이 보유해야 함을 상정.
            await exchange.connect(user).ethToTokenSwap(toWei(3.99), {value: toWei(1)});

            console.log(toEther(await token.balanceOf(user.address)));


            //이하 x + y = k인 CSMM 로직...
            // //유저는 token 즉 gray 밸런스가 1개겠지.
            // expect(
            //     (toEther(await token.balanceOf(user.address)))
            // ).to.equal("1.0");
            // // GRAY 잔고는 exchange 계약에선 1개를 유저와 스왑했으니 999개 남았을 거야.
            // // 문제는 GAS FEE로 항상 에러날 수 있음.. 9998999....blabla
            // expect(
            //     (toEther(await token.balanceOf(exchange.address)))
            // ).to.eq("999.0");


            // //getBalance는 항상 이더 잔고를 가져오는 함수
            // expect(
            //     (toEther(await getBalance(exchange.address)))
            // ).to.eq("1001.0");
            
        })
    })


    describe("getOutputAmount", async() => {
        it("correct getOutputAmount", async() => {
            //4:1 ratio for GRAY:ETH for testing
            await token.approve(exchange.address, toWei(4000));
            await exchange.addLiquidity(toWei(4000), { value: toWei(1000) });
            //1ETH to how many GRAY
            const outputAmount = await exchange.getOutputAmount(toWei(1), getBalance(exchange.address), token.balanceOf(exchange.address));
            
            //slippage... expected 4 GRAY but got 3.996 GRAY
            //극단적으로 10만 ETH해도, xy = k 곡선상 GRAY pool이 0로 고갈되진 못함.
            //유동성 k가 크거나, 거래 input이 작아야 slippage가 작아짐.
            //1000ETH 교환하면 4000GRAY 아닌 2000개 밖에 못 받음..
            console.log("outputAmount: ", outputAmount);
            console.log(toEther(outputAmount));
        })
    })


    
})