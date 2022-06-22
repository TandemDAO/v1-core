// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import '@openzeppelin/contracts/governance/Governor.sol';
import '@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol';
import '@openzeppelin/contracts/governance/extensions/GovernorVotes.sol';

contract Governance is Governor, GovernorCountingSimple, GovernorVotes {
    constructor(string memory _name, IVotes _token) Governor(_name) GovernorVotes(_token) {}

    function votingDelay() public pure override returns (uint256) {
        return 0; // blocks
    }

    function votingPeriod() public pure override returns (uint256) {
        return 40; //  blocks
    }

    function quorum(uint256 blockNumber) public pure override returns (uint256) {
        return 1;
    }

    function proposalThreshold() public pure override returns (uint256) {
        return 1;
    }
}
