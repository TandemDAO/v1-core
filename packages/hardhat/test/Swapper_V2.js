const { expect } = require('chai')
const { ethers } = require('hardhat')
const { MockProvider, deployMockContract } = require('ethereum-waffle')
const ERC20 = require('../artifacts/contracts/Token.sol/Token.json')

let owner, proposer, memberA, memberB
let swapper, mockTokenA, mockTokenB
const tokenASwapAmount = 100,
  tokenBSwapAmount = 200,
  mintAmount = 1000

describe('Swapper', function () {
  beforeEach(async () => {
    ;[owner, proposer, memberA, memberB, executorA, executorB] = await ethers.getSigners()

    mockTokenA = await deployMockContract(owner, ERC20.abi)
    mockTokenB = await deployMockContract(owner, ERC20.abi)

    const swapperFactory = await ethers.getContractFactory('Swapper')
    swapper = await swapperFactory.deploy()
    await swapper.deployed()
  })

  describe('cancel()', () => {
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
          mockTokenB.address,
          tokenBSwapAmount,
          0,
          4,
        )
    })

    describe('when status is NOT pending', () => {
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

    describe('when status is pending', () => {
      describe('when acceptance period is NOT past', () => {
        it('should revert', async () => {
          await expect(swapper.cancel(0)).to.be.revertedWith('Swapper: acceptance period is not over')
        })
      })

      describe('when acceptance period is past', () => {
        beforeEach(async () => {
          for (let i = 0; i < 4; i++) {
            await hre.ethers.provider.send('evm_mine')
          }
        })

        describe('when member A has NOT approved', () => {
          describe('when member2 has NOT approved', () => {
            it('should emit deal canceled event', async () => {
              await expect(swapper.cancel(0)).to.emit(swapper, 'DealCanceled')
            })
          })

          describe('when member2 has approved', () => {
            // beforeEach(() => {
            // })
            // it('should emit deal canceled event', async () => {
            //   await expect(swapper.cancel(0)).to.emit(swapper, 'DealCanceled');
            // })
          })
        })
      })
    })
  })
})
