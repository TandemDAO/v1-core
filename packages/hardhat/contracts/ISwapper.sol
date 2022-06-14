// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

interface ISwapper {
    enum Status {
        Pending,
        Approved,
        Claimed,
        Canceled
    }

    event DealCreated(
        uint256 indexed dealId,
        address executor1,
        address account1,
        address token1,
        uint256 amount1,
        address executor2,
        address account2,
        address token2,
        uint256 amount2,
        uint256 startDate,
        uint256 vesting,
        uint256 deadline
    );

    event DealApproved(uint256 indexed dealId, address caller);

    event DealClaimed(uint256 indexed dealId, address caller);

    event DealCanceled(uint256 indexed dealId, address caller);

    event ExecutorChanged(uint dealId, address caller, address oldExecutor, address newExecutor);

    /**
     * @dev Creates a new Deal after Transfer at address `token1`
     * of `amount1` tokens from the caller's account to Swapper contract.
     *
     * This requires the caller to have approved Swpper contract for `amount1`
     * to be transfered
     *
     * Returns a boolean value indicating whether the operation succeeded
     * and the id of the Deal created.
     *
     * Emits a {DealCreated} event.
     */
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
    ) external returns (uint256);

    /**
     * @dev Update the Deal status to `Approved` after Transfer token of
     * amount set in the Deal for second account.
     *
     * This requires the account2 to have approved Swapper contract for
     * the amount2 in the Deal at address token2.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {DealApproved} event.
     */
    function approve(uint256 id) external returns (bool);

    /**
     * @dev Send the amount of tokens to the Deal stakeholders.
     * This requires the vesting period set in the Deal to be over.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {DealClaimed} event.
     */
    function claim(uint256 id) external returns (uint256);

    /**
     * @dev Cancel the Deal proposal after the acceptance period is over.
     * This requires only the proposer to be the function caller and the
     * deal to be still pending which means not yet accepted by the other
     * stakeholder.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {DealCanceled} event.
     */
    function cancel(uint256 id) external returns (bool);

    /**
     * @dev Change the executor of a specific Deal.
     * This requires only one of the account defined in the Deal to be
     * the function caller. Account can only change their respective
     * executor.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {ExecutorChanged} event.
     */
    function changeExecutor(uint256 id, address executor) external returns (bool);
}
