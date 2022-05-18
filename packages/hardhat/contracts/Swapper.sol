// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import './ISwapper.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/utils/Counters.sol';

contract Swapper is ISwapper {
    using Counters for Counters.Counter;
    Counters.Counter private _dealId;

    // TODO: refacto this ugly struct
    struct Deal {
        address account1;
        address account2;
        address token1;
        address token2;
        uint256 amount1;
        uint256 amount2;
        uint256 startDate;
        uint256 vesting;
        uint256 deadline;
        bool account1Approved;
        bool account2Approved;
        Status status;
    }
    mapping(uint256 => Deal) private _deals;

    mapping(address => mapping(address => uint256)) private _balances;

    function propose(
        address account1,
        address token1,
        uint256 amount1,
        address account2,
        address token2,
        uint256 amount2,
        uint256 vesting,
        uint256 deadline
    ) external override returns (bool, uint256) {
        uint256 id = _dealId.current();
        _deals[id] = Deal({
            account1: account1,
            account2: account2,
            token1: token1,
            token2: token2,
            amount1: amount1,
            amount2: amount2,
            startDate: block.number,
            vesting: vesting,
            deadline: deadline,
            account1Approved: false,
            account2Approved: false,
            status: Status.Pending
        });
        _dealId.increment();

        emit DealCreated(account1, token1, amount1, account2, token2, amount2, block.number, vesting, deadline);

        return (true, id);
    }

    function approve(uint256 id) external override returns (bool) {
        Deal storage deal = _deals[id];

        require(msg.sender == deal.account1 || msg.sender == deal.account2, 'Swapper: caller not allowed');

        if (msg.sender == deal.account1) {
            if (deal.account1Approved) {
                revert('Swapper: caller has already approved the deal');
            }
            _transfer(msg.sender, deal.token1, deal.amount1);
            deal.account1Approved = true;
            emit DealApproved(id, msg.sender);
        } else {
            if (deal.account2Approved) {
                revert('Swapper: caller has already approved the deal');
            }
            _transfer(msg.sender, deal.token2, deal.amount2);
            deal.account2Approved = true;
            emit DealApproved(id, msg.sender);
        }

        if (deal.account1Approved && deal.account2Approved) {
            deal.status = Status.Approved;
        }

        return true;
    }

    function claim(uint256 id) external override returns (bool) {
        Deal storage deal = _deals[id];

        require(deal.status == Status.Approved, 'Swapper: the deal has not been approved by both parties');
        require(block.number >= deal.startDate + deal.vesting, 'Swapper: vesting period is not over');

        IERC20(deal.token1).transfer(deal.account2, deal.amount1);
        IERC20(deal.token2).transfer(deal.account1, deal.amount2);

        deal.status = Status.Claimed;

        emit DealClaimed(id, msg.sender);

        return true;
    }

    function cancel(uint256 id) external override returns (bool) {
        Deal storage deal = _deals[id];

        require(deal.status == Status.Pending, 'Swapper: deal is no longer pending');
        require(block.number >= deal.startDate + deal.deadline, 'Swapper: acceptance period is not over');

        if (IERC20(deal.token1).balanceOf(address(this)) >= deal.amount1) {
            IERC20(deal.token1).transfer(deal.account1, deal.amount1);
        }

        if (IERC20(deal.token2).balanceOf(address(this)) >= deal.amount2) {
            IERC20(deal.token2).transfer(deal.account2, deal.amount2);
        }

        deal.status = Status.Canceled;

        emit DealCanceled(id, msg.sender);

        return true;
    }

    function _transfer(
        address account,
        address token,
        uint256 amount
    ) private {
        uint256 allowance = IERC20(token).allowance(account, address(this));
        require(allowance >= amount, 'Swapper: needs allowance');

        bool success = IERC20(token).transferFrom(account, address(this), amount);
        require(success, 'Swapper: token transfer has failed');

        _balances[account][token] = amount;
    }
}
