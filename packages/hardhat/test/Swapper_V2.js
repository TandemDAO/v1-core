const { expect } = require('chai')
const { assert } = require('console')
const { ethers } = require('hardhat')
const { isRegExp } = require('lodash')
const { MockProvider, deployMockContract, deployContract } = require('ethereum-waffle')
const ERC20 = require('../artifacts/contracts/Token.sol/Token.json')
const Swapper = require('../artifacts/contracts/Swapper.sol/Swapper.json')

let owner, proposer, memberA, memberB
let swapper, mockTokenA, mockTokenB
const tokenASwapAmount = 100,
  tokenBSwapAmount = 200,
  mintAmount = 1000

describe('Swapper', function () {
  beforeEach(async () => {
    ;[owner, proposer, memberA, memberB, executorA, executorB] = new MockProvider().getWallets()
    //await ethers.getSigners();
    mockTokenA = await deployMockContract(owner, ERC20.abi)
    mockTokenB = await deployMockContract(owner, ERC20.abi)

    const swapperFactory = await ethers.getContractFactory('Swapper')
    swapper = await swapperFactory.deploy()
    await swapper.deployed()

    // swapper = await deployContract(owner, Swapper, []);
    // console.log("Swapper contract", swapper);
  })

  describe('cancel()', () => {
    //const {arbitrary, memberA, memberB, mockTokenA, mockTokenB, contract} = await setup();
    beforeEach(async () => {
      await swapper
        .connect(proposer)
        .propose(
          executorA.address,
          memberA.address,
          mockTokenA.address,
          tokenASwapAmount,
          executorB.address,
          memberB.address,
          mockTokenA.address,
          tokenBSwapAmount,
          0,
          4,
        )
    })

    describe('when status is not pending', () => {
      it('should revert', async () => {
        await mockTokenA.mock.allowance.returns(ethers.utils.parseEther(tokenASwapAmount.toString()))
        await mockTokenB.mock.allowance.returns(ethers.utils.parseEther(tokenBSwapAmount.toString()))
        await mockTokenA.mock.transferFrom.returns(true)
        await mockTokenB.mock.transferFrom.returns(true)

        await swapper.connect(memberA).approve(0)
        await swapper.connect(memberB).approve(0)

        await expect(swapper.cancel(0)).to.be.revertedWith('Swapper: deal is no longer pending')
      })
    })

    // describe('when status is not pending', async () => {

    //   describe('when deadline is not past', async () => {
    //     // it should revert
    //   })

    //   describe('when deadline is past', async () => {

    //     describe('when tokenA not deposited', async () => {

    //       describe('when tokenB not deposited', async () => {
    //         // it should change state, emit event, check balance
    //       })

    //       describe('when tokenB deposited', async () => {
    //         describe('when transfer failed', async () => {
    //           // revert
    //         })

    //         describe('when transfer successful', async () => {
    //           // change state, emit event, tokenB balance is 0
    //         })
    //       })
    //     })

    //     describe('when tokenA deposited', async () => {

    //       describe('when tokenB not deposited', async () => {

    //       })

    //       describe('when tokenB deposited', async () => {

    //       })
    //     })
    //   })
    // })
  })
})
