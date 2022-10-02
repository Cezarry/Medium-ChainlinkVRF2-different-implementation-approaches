import { expect } from "chai";
import { ethers } from "hardhat";
import { ContractV2, VRFCoordinatorV2Mock } from "../typechain-types";
import {
  randomNumber,
  baseFee,
  gasPriceLink,
  subscriptionId,
  keyHash,
} from "./consts";

describe("ContractV2 tests", function () {
  let vrfCoordinatorV2Mock: VRFCoordinatorV2Mock;
  let contractV2: ContractV2;

  beforeEach(async () => {
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

    const contractV2Contract = await ethers.getContractFactory("ContractV2");
    contractV2 = await contractV2Contract.deploy(
      vrfCoordinatorV2Mock.address,
      keyHash,
      subscriptionId
    );
    await contractV2.deployed();

    await vrfCoordinatorV2Mock.addConsumer(subscriptionId, contractV2.address);
  });
  it("Should fulfill request random modulo numbers", async function () {
    await contractV2.createVrfRequest(1);
    await vrfCoordinatorV2Mock.fulfillRandomWordsWithOverride(
      1,
      contractV2.address,
      [randomNumber]
    );
    await contractV2.completeFlow(1);
    const requestRandomModuloNumbers =
      await contractV2.getRequestRandomModuloNumbers(1);
    for (let i = 0; i < 18; i++) {
      expect(requestRandomModuloNumbers[i]).to.eq(randomNumber % (i + 1));
    }
  });
});
