// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import './ISwapper.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import 'hardhat/console.sol';

contract Swapper is ISwapper {
    using Counters for Counters.Counter;
    Counters.Counter private _dealId;
    mapping(uint256 => mapping(address => uint256)) private _withdrawals;
    // TODO: refacto this ugly struct
    struct Deal {
        address executor1;
        address executor2;
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
        address executor1,
        address account1,
        address token1,
        uint256 amount1,
        address executor2,
        address account2,
        address token2,
        uint256 amount2,
        uint256 vesting,
        uint256 deadline
    ) external override returns (uint256) {
        uint256 id = _dealId.current();
        _deals[id] = Deal({
            executor1: executor1,
            executor2: executor2,
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

        emit DealCreated(
            id,
            executor1,
            account1,
            token1,
            amount1,
            executor2,
            account2,
            token2,
            amount2,
            block.number,
            vesting,
            deadline
        );

        return (id);
    }

    function approve(uint256 id) external override returns (bool) {
        Deal storage deal = _deals[id];
        require(deal.status == Status.Pending, 'Swapper: deal is no longer pending');
        require(msg.sender == deal.account1 || msg.sender == deal.account2, 'Swapper: caller not allowed');

        if (msg.sender == deal.account1) {
            require(!deal.account1Approved, 'Swapper: caller has already approved the deal');
            _transfer(msg.sender, deal.token1, deal.amount1);
            deal.account1Approved = true;
        } else {
            require(!deal.account2Approved, 'Swapper: caller has already approved the deal');
            _transfer(msg.sender, deal.token2, deal.amount2);
            deal.account2Approved = true;
        }

        if (deal.account1Approved && deal.account2Approved) {
            deal.status = Status.Approved;
            emit DealApproved(id, msg.sender);
        }

        return true;
    }

    function cancel(uint256 id) external override returns (bool) {
        Deal storage deal = _deals[id];

        require(deal.status == Status.Pending, 'Swapper: deal is no longer pending');
        require(block.number >= deal.startDate + deal.deadline, 'Swapper: acceptance period is not over');

        if (deal.account1Approved) {
            _withdraw(deal.account1, deal.account1, deal.token1, deal.amount1);
        }
        if (deal.account2Approved) {
            _withdraw(deal.account2, deal.account2, deal.token2, deal.amount2);
        }

        deal.status = Status.Canceled;

        emit DealCanceled(id, msg.sender);

        return true;
    }

    function claim(uint256 id) external override returns (uint256) {
        Deal storage deal = _deals[id];

        require(deal.startDate + deal.deadline <= block.number, 'Swapper: deadline is not past');
        require(deal.status == Status.Approved, 'Swapper: deal must be Approved');
        require(msg.sender == deal.executor1 || msg.sender == deal.executor2, 'Swapper: caller not allowed');

        address account = msg.sender == deal.executor1 ? deal.account1 : deal.account2;
        uint256 dealAmount = msg.sender == deal.executor1 ? deal.amount2 : deal.amount1;
        address token = msg.sender == deal.executor1 ? deal.token2 : deal.token1;
        require(_withdrawals[id][account] < dealAmount, 'Swapper: amount already claimed');

        uint256 amount;

        if (deal.vesting > 0) {
            uint256 deadlineBlock = deal.startDate + deal.deadline;
            uint256 vestedBlock = deal.startDate + deal.deadline + deal.vesting;
            uint256 blocks = block.number >= vestedBlock ? deal.vesting : block.number - deadlineBlock;
            amount = ((dealAmount / deal.vesting) * blocks) - _withdrawals[id][account];

            if (block.number >= vestedBlock) {
                amount += dealAmount - _withdrawals[id][account] - amount;
            }
        } else {
            amount = dealAmount;
        }

        _withdrawals[id][account] += amount;

        if (_withdrawals[id][deal.account1] == deal.amount2 && _withdrawals[id][deal.account2] == deal.amount1) {
            deal.status = Status.Claimed;
            emit DealClaimed(id, account);
        }

        bool success = IERC20(token).transfer(account, amount);
        require(success, 'Swapper: token transfer has failed');

        return amount;
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

    function _withdraw(
        address from,
        address to,
        address token,
        uint256 amount
    ) private {
        require(_balances[from][token] >= amount, 'Swapper: not enough token in balance');

        _balances[from][token] = _balances[from][token] - amount;

        IERC20(token).transfer(to, amount);
    }
}
