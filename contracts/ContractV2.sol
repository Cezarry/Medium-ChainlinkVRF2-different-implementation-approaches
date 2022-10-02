//SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "./Common.sol";

contract ContractV2 is Common, VRFConsumerBaseV2 {
    mapping(uint256 => uint256[]) public requestsRandomWords;

     constructor(
        address vrfCoordinatorAddress,
        bytes32 keyHash,
        uint64 subscriptionId
    )
        VRFConsumerBaseV2(vrfCoordinatorAddress)
    {
        _vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorAddress);
        _keyHash = keyHash;
        _subscriptionId = subscriptionId;
    }

    function createVrfRequest(
        uint32 randomWordsCount
    ) external {
        uint256 requestId = _vrfCoordinator.requestRandomWords(
            _keyHash,
            _subscriptionId,
            _requestConfirmations,
            _callbackGasLimit,
            randomWordsCount
        );
        requestsRandomWords[requestId].push(1);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords)
        internal
        override
    {
        requestsRandomWords[requestId][0] = randomWords[0];
    }

    function completeFlow(uint256 requestId) external {
        uint256[] memory randomWords = requestsRandomWords[requestId];
        requestRandomModuloNumbers[requestId] = new uint256[](18);
        for(uint i = 0; i < 18; i++) {
            requestRandomModuloNumbers[requestId][i] = _getRandomNumber(randomWords[0], i +1 );
        }
    }
}