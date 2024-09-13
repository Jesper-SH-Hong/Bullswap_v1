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
        //스마트 계약을 컴파일하면, 컴파일된 계약의 ABI, 바이트코드가 포함된 JSON 파일이 생성됨. 컨트랙트 이름으로 artifacts/contracts/Token.sol/Token.json 같은 경로에 JSON 파일이 생성.
        //즉 컴파일된 smart contract들이며, 그 contract의 이름이 내가 컴파일한 sol파일의 컨트랙트명(클래스명)임.
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


     describe("tokenToTokenSwap", async () => {
        it("correct tokenToTokenSwap", async () => {
            //기본적으로 10,000개의 Ether를 가지고 있음.
            [owner, user] = await ethers.getSigners();

            //getContractFactory() returns a JS obj that represents a smart contract factory. 내가 작성한 contract를 가져옴. Factory의 factory로서 쓰일 것.
            const FactoryFactory = await ethers.getContractFactory("Factory");
            const factory = await FactoryFactory.deploy();
            //factory 컨트랙트 deploy. 이래야 Exchange의 생성자에 들어가는 factory 주소를 알려줄 수 있음.
            await factory.deployed();

            //create GRAY Token
            const TokenFactory = await ethers.getContractFactory("Token");
            const token1 = await TokenFactory.deploy("GrayToken", "GRAY", toWei(1010));  //1000 + 10swap
            await token1.deployed();

            // create BULL Token
            const token2 = await TokenFactory.deploy("BullToken", "BULL", toWei(1000));
            await token2.deployed();

            // create/deploy gray/eth pair exchange contract
            const exchangeAddress = await factory.callStatic.createExchange(token1.address)
            await factory.createExchange(token1.address);

            // create bull/eth pair exchange contract
            const exchange2Address = await factory.callStatic.createExchange(token2.address);
            await factory.createExchange(token2.address);
            

            // add liquidity 1000/1000 to each exchange contract
            await token1.approve(exchangeAddress, toWei(1000));
            await token2.approve(exchange2Address, toWei(1000));

            const ExchangeFactory = await ethers.getContractFactory("Exchange");
            //attach를 통해 이미 배포된 exchange 컨트랙트를 Exchange 찍어낼 팩토리에 연결
            //각각의 페어 exchange에 유동성공급이 1000, 1000 완료됨.
            await ExchangeFactory.attach(exchangeAddress).addLiquidity(toWei(1000), {value: toWei(1000)})
            await ExchangeFactory.attach(exchange2Address).addLiquidity(toWei(1000), {value: toWei(1000)})

            //swap test를 위해 10개 다시 approve.
            await token1.approve(exchangeAddress, toWei(10));
            //처음 투입. GRAY 10, 최소한 받을 Bull, 중간 swap 시 이더 교환 예상량, 받을 토큰 계약(Bull)의 주소
            await ExchangeFactory.attach(exchangeAddress).tokenToTokenSwap(toWei(10), toWei(9), toWei(9), token2.address);

            //BULL token balance of user
            //GRAY, ETH 보냈는데 왜 0냐.
            console.log(toEther(await token2.balanceOf(owner.address)));
            //Exchange가 다 BULL 토큰 갖고 있음.
            console.log(toEther(await token2.balanceOf(exchangeAddress)));

            //기존 ethToToken 구현에서 msg.sender에게 보내라고 했는데, 
            //GRAY/ETH 컨트랙트가 IExchange 인터페이스로 toTokenExchangeAddress, 즉 BULL/ETH를 호출한 거임.
            //그래서 Gray/Eth exchange 컨트랙트가 msg.sender임.

            //이것의 수정을 위해 ethToTokenSwap을 ethToTokenTransfer로 수정, 전송받을 주소 명시.

        });
    });



})