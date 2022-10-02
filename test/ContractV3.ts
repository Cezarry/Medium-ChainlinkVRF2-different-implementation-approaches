import { expect } from "chai";
import { ethers } from "hardhat";
import { ContractV3, VRFCoordinatorV2Mock } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  randomNumber,
  baseFee,
  gasPriceLink,
  subscriptionId,
  keyHash,
} from "./consts";

describe("ContractV3 tests", function () {
  let vrfCoordinatorV2Mock: VRFCoordinatorV2Mock;
  let contractV3: ContractV3;
  let address: SignerWithAddress;
  const abiCoder = new ethers.utils.AbiCoder();

  beforeEach(async () => {
    [address] = await ethers.getSigners();

    const vrfCoordinatorV2MockContract = await ethers.getContractFactory(
      "VRFCoordinatorV2Mock"
    );
    vrfCoordinatorV2Mock = await vrfCoordinatorV2MockContract.deploy(
      baseFee,
      gasPriceLink
    );
    await vrfCoordinatorV2Mock.deployed();

    await vrfCoordinatorV2Mock.createSubscription();
    await vrfCoordinatorV2Mock.fundSubscription(
      subscriptionId,
      ethers.utils.parseEther("1")
    );

    const contractV3Contract = await ethers.getContractFactory("ContractV3");
    contractV3 = await contractV3Contract.deploy(
      vrfCoordinatorV2Mock.address,
      keyHash,
      subscriptionId
    );
    await contractV3.deployed();

    await vrfCoordinatorV2Mock.addConsumer(subscriptionId, contractV3.address);
  });
  it("Should do Function One step by step", async function () {
    // Step 1
    await contractV3.functionOneRequest();
    let functionOneStruct = await contractV3.getFunctionOneStruct(
      address.address
    );
    expect(functionOneStruct.requestId).to.eq(1);
    expect(functionOneStruct.requestor).to.eq(address.address);
    expect(functionOneStruct.state).to.eq(0);
    expect(functionOneStruct.randomWords.length).to.eq(1);
    expect(functionOneStruct.randomWords[0]).to.eq(1);

    let request = await contractV3.requests(1);
    expect(request.requestId).to.eq(1);
    expect(request.callbackType).to.eq(0);
    expect(request.parameters).to.eq(
      abiCoder.encode(["address"], [address.address])
    );

    // Step 2
    await vrfCoordinatorV2Mock.fulfillRandomWordsWithOverride(
      1,
      contractV3.address,
      [randomNumber]
    );
    functionOneStruct = await contractV3.getFunctionOneStruct(address.address);
    expect(functionOneStruct.state).to.eq(1);
    expect(functionOneStruct.randomWords[0]).to.eq(randomNumber);

    request = await contractV3.requests(1);
    expect(request.requestId).to.eq(0);
    expect(request.callbackType).to.eq(0);
    expect(request.parameters).to.eq("0x");

    // Step 3
    await contractV3.functionOneComplete();
    functionOneStruct = await contractV3.getFunctionOneStruct(address.address);
    expect(functionOneStruct.requestId).to.eq(0);
    expect(functionOneStruct.requestor).to.eq(ethers.constants.AddressZero);
    expect(functionOneStruct.state).to.eq(0);
    expect(functionOneStruct.randomWords.length).to.eq(0);

    const requestRandomModuloNumbers =
      await contractV3.getRequestRandomModuloNumbers(1);
    for (let i = 0; i < 18; i++) {
      expect(requestRandomModuloNumbers[i]).to.eq(randomNumber % (i + 1));
    }
  });
  // it("Should do Function Two step by step", async function () {
  //   // Step 1
  //   await contractV3.functionTwoRequest();
  //   let functionTwoStruct = await contractV3.getFunctionTwoStruct(
  //     address.address
  //   );
  //   expect(functionTwoStruct.requestId).to.eq(1);
  //   expect(functionTwoStruct.requestor).to.eq(address.address);
  //   expect(functionTwoStruct.state).to.eq(0);
  //   expect(functionTwoStruct.randomWords.length).to.eq(1);
  //   expect(functionTwoStruct.randomWords[0]).to.eq(1);

  //   let request = await contractV3.requests(1);
  //   expect(request.requestId).to.eq(1);
  //   expect(request.callbackType).to.eq(1);
  //   expect(request.parameters).to.eq(
  //     abiCoder.encode(["address"], [address.address])
  //   );

  //   // Step 2
  //   await vrfCoordinatorV2Mock.fulfillRandomWordsWithOverride(
  //     1,
  //     contractV3.address,
  //     [randomNumber]
  //   );
  //   functionTwoStruct = await contractV3.getFunctionTwoStruct(address.address);
  //   expect(functionTwoStruct.state).to.eq(1);
  //   expect(functionTwoStruct.randomWords[0]).to.eq(randomNumber);

  //   request = await contractV3.requests(1);
  //   expect(request.requestId).to.eq(0);
  //   expect(request.callbackType).to.eq(0);
  //   expect(request.parameters).to.eq("0x");

  //   // Step 3
  //   await contractV3.functionTwoComplete();
  //   functionTwoStruct = await contractV3.getFunctionTwoStruct(address.address);
  //   expect(functionTwoStruct.requestId).to.eq(0);
  //   expect(functionTwoStruct.requestor).to.eq(ethers.constants.AddressZero);
  //   expect(functionTwoStruct.state).to.eq(0);
  //   expect(functionTwoStruct.randomWords.length).to.eq(0);

  //   const requestRandomModuloNumbers =
  //     await contractV3.getRequestRandomModuloNumbers(1);
  //   for (let i = 0; i < 18; i++) {
  //     const modulo = i + 2;
  //     expect(requestRandomModuloNumbers[i]).to.eq(randomNumber % modulo);
  //   }
  // });
});
