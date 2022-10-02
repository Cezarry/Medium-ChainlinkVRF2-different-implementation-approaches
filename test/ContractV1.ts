import { expect } from "chai";
import { ethers } from "hardhat";
import { ContractV1, VRFCoordinatorV2Mock } from "../typechain-types";
import {
  randomNumber,
  baseFee,
  gasPriceLink,
  subscriptionId,
  keyHash,
} from "./consts";

describe("ContractV1 tests", function () {
  let vrfCoordinatorV2Mock: VRFCoordinatorV2Mock;
  let contractV1: ContractV1;

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

    const contractV1Contract = await ethers.getContractFactory("ContractV1");
    contractV1 = await contractV1Contract.deploy(
      vrfCoordinatorV2Mock.address,
      keyHash,
      subscriptionId
    );
    await contractV1.deployed();

    await vrfCoordinatorV2Mock.addConsumer(subscriptionId, contractV1.address);
  });
  it("Should fulfill request random modulo numbers", async function () {
    await contractV1.createVrfRequest(1);
    await vrfCoordinatorV2Mock.fulfillRandomWordsWithOverride(
      1,
      contractV1.address,
      [randomNumber]
    );
    const requestRandomModuloNumbers =
      await contractV1.getRequestRandomModuloNumbers(1);
    for (let i = 0; i < 18; i++) {
      expect(requestRandomModuloNumbers[i]).to.eq(randomNumber % (i + 1));
    }
  });
});
