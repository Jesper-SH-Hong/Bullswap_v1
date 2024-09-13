import { ethers } from "hardhat"
import { expect } from "chai";

import { Exchange } from "../typechain-types/contracts/Exchange"
import { Token } from "../typechain-types/contracts/Token";
import { Factory } from "../typechain-types/contracts/Factory";

import { BigNumber } from "ethers";

const toWei = (value: number) => ethers.utils.parseEther(value.toString());
const toEther = (value: BigNumber) => ethers.utils.formatEther(value);
const getBalance = ethers.provider.getBalance;

describe("Factory", () => {
    let owner: any;
    let user: any;
    let factory: Factory;
    let token: Token;

    beforeEach(async () => {

        //기본적으로 10,000개의 Ether를 가지고 있음.
        [owner, user] = await ethers.getSigners();
        const TokenFactory = await ethers.getContractFactory("Token");
        token = await TokenFactory.deploy("GrayToken", "GRAY", toWei(50));
        await token.deployed();

        const FactoryFactory = await ethers.getContractFactory("Factory");
        factory = await FactoryFactory.deploy();
        await factory.deployed();
    });

    describe("deploy Factory Contract", async () => {
        it("correct deploy factory", async () => {

            //callStatic은 트랜잭션을 시뮬레이션할 뿐, 스마트 컨트랙트의 상태를 변경하지 않으므로((예: createExchange 내의 새로운 Exchange 컨트랙트 생성 X), createExchange 함수를 통해 새로운 Exchange 컨트랙트를 생성하는 것을 시뮬레이션만 하고, 실제로는 그 결과를 블록체인에 반영 X. gas fee X.
            // callStatic은 블록체인에 기록되지 않는 읽기 전용 시뮬레이션일 뿐임.
            const exchangeAddress = await factory.callStatic.createExchange(token.address);
            console.log(exchangeAddress);
            // 따라서 아래 코드는 0000..만을 출력함. callStatic이었으므로 factory contract에 저장된 값이 없는 거임.
            // new Factory는 로컬에서 실행되고 실제 주소도 반환했을 것이나, 블록체인에 기록되지 않았음. 이를 위해선 callStatic을 빼고 실제 Transaction을 발생시켜야 함.
            //트랜잭션이 필요한 작업(예: 상태 변경, 컨트랙트 생성)을 실제로 실행하려면 트랜잭션을 통해 호출해야 함.
            console.log(await factory.getExchange(token.address));
            await factory.createExchange(token.address);
            expect(await factory.getExchange(token.address)).eq(exchangeAddress);
            // expect(await factory.getToken(exchangeAddress)).eq(token.address);
            
        });
    });

})