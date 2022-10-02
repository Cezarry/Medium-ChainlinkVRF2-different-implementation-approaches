//SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "./Common.sol";

contract ContractV3 is Common, VRFConsumerBaseV2 {
    error InvalidState();
    error InvalidRequestId();
    error InvalidCallbackType();

    struct FunctionOneStruct {
        address requestor;
        uint256 requestId;
        uint256[] randomWords;
        CallbackState state;
    }

    struct FunctionTwoStruct {
        address requestor;
        uint256 requestId;
        uint256[] randomWords;
        CallbackState state;
    }

    enum CallbackState {
        NEW,
        AWAITING_COMPLETE
    }

    enum CallbackType {
        FUNCTION_ONE,
        FUNCTION_TWO
    }

    struct Callback {
        uint256 requestId;
        CallbackType callbackType;
        bytes parameters;
    }

    mapping(uint256 => Callback) public requests;

    mapping(address => FunctionOneStruct) public requestorFunctionOne;
    mapping(address => FunctionTwoStruct) public requestorFunctionTwo;

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
        uint32 randomWordsCount,
        bytes memory parameters,
        CallbackType callbackType
    ) internal returns(uint256) {
        uint256 requestId = _vrfCoordinator.requestRandomWords(
            _keyHash,
            _subscriptionId,
            _requestConfirmations,
            _callbackGasLimit,
            randomWordsCount
        );
        requests[requestId] = Callback(requestId, callbackType, parameters);

        return requestId;
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords)
        internal
        override
    {
        Callback memory callback = requests[requestId];
        if (callback.callbackType == CallbackType.FUNCTION_ONE) {
            address param = abi.decode(callback.parameters, (address));
            FunctionOneStruct storage data = requestorFunctionOne[param];
            if(data.requestId != requestId) {
                revert InvalidRequestId();
            }
            if(data.state != CallbackState.NEW) {
                revert InvalidState();
            }
            data.randomWords = randomWords;
            data.state = CallbackState.AWAITING_COMPLETE;
        } else if (callback.callbackType == CallbackType.FUNCTION_TWO) {
            address param = abi.decode(callback.parameters, (address));
            FunctionTwoStruct storage data = requestorFunctionTwo[param];
            if(data.requestId != requestId) {
                revert InvalidRequestId();
            }
            if(data.state != CallbackState.NEW) {
                revert InvalidState();
            }
            data.randomWords = randomWords;
            data.state = CallbackState.AWAITING_COMPLETE;        
        } else {
            revert InvalidCallbackType();
        }

        delete requests[requestId];
    }

    // -----------------------------------------------------------------------------
    // FUNCTION ONE
    // -----------------------------------------------------------------------------
    function functionOneRequest() external {
        bytes memory parameters = abi.encode(msg.sender);
        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = 1;
        uint256 requestId = createVrfRequest(1, parameters, CallbackType.FUNCTION_ONE);
        requestorFunctionOne[msg.sender] = FunctionOneStruct(msg.sender, requestId, randomWords, CallbackState.NEW);
    }

    function functionOneComplete() external {
        FunctionOneStruct memory data = requestorFunctionOne[msg.sender];
        if(data.state != CallbackState.AWAITING_COMPLETE) {
            revert InvalidState();
        }
        uint256[] memory randomWords = data.randomWords;
        requestRandomModuloNumbers[data.requestId] = new uint256[](18);
        for(uint i = 0; i < 18; i++) {
            requestRandomModuloNumbers[data.requestId][i] = _getRandomNumber(randomWords[0], i + 1);
        }
        delete requestorFunctionOne[msg.sender];
    }

    function getFunctionOneStruct(address requestor) external view returns (FunctionOneStruct memory) {
        return requestorFunctionOne[requestor];
    }

    // -----------------------------------------------------------------------------
    // FUNCTION TWO
    // -----------------------------------------------------------------------------
    function functionTwoRequest() external {
        bytes memory parameters = abi.encode(msg.sender);
        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = 1;
        uint256 requestId = createVrfRequest(1, parameters, CallbackType.FUNCTION_TWO);
        requestorFunctionTwo[msg.sender] = FunctionTwoStruct(msg.sender, requestId, randomWords, CallbackState.NEW);
    }

    function functionTwoComplete() external {
        FunctionTwoStruct memory data = requestorFunctionTwo[msg.sender];
        if(data.state != CallbackState.AWAITING_COMPLETE) {
            revert InvalidState();
        }
        uint256[] memory randomWords = data.randomWords;
        requestRandomModuloNumbers[data.requestId] = new uint256[](18);
        for(uint i = 0; i < 18; i++) {
            requestRandomModuloNumbers[data.requestId][i] = _getRandomNumber(randomWords[0], i + 2);
        }
        delete requestorFunctionTwo[msg.sender];
    }

    function getFunctionTwoStruct(address requestor) external view returns (FunctionTwoStruct memory) {
        return requestorFunctionTwo[requestor];
    }
}