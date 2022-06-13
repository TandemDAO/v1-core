// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import '@openzeppelin/contracts/governance/Governor.sol';
import '@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol';
import '@openzeppelin/contracts/governance/extensions/GovernorVotes.sol';

contract Governance is Governor, GovernorCountingSimple, GovernorVotes {
    constructor(string memory _name, IVotes _token) Governor(_name) GovernorVotes(_token) {}

    function votingDelay() public pure override returns (uint256) {
        return 0; // 1 block
    }

    function votingPeriod() public pure override returns (uint256) {
        return 4; // 1 week
    }

    function quorum(uint256 blockNumber) public pure override returns (uint256) {
        return 1;
    }

    function proposalThreshold() public pure override returns (uint256) {
        return 1;
    }
}
