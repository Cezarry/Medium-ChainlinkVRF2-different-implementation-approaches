//SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";

abstract contract Common {
    VRFCoordinatorV2Interface internal _vrfCoordinator;
    uint64 internal _subscriptionId;
    bytes32 internal _keyHash;
    uint32 internal _callbackGasLimit = 300000;
    uint16 internal _requestConfirmations = 3;

    mapping(uint256 => uint256[]) public requestRandomModuloNumbers;

    function getRequestRandomModuloNumbers(uint256 requestId) public view returns(uint256[] memory) {
        return requestRandomModuloNumbers[requestId];
    }

    function _getRandomNumber(uint256 _seed, uint256 _limit)
        internal
        pure
        returns (uint256)
    {
        return _seed % _limit;
    }
}