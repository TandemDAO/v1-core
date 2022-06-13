const { expect } = require('chai')
const { assert } = require('console')
const { ethers } = require('hardhat')

let owner, proposer, holderA, holderB
let swapper, tokenA, tokenB
const tokenASwapAmount = 100,
  tokenBSwapAmount = 200,
  mintAmount = 1000

describe('Swapper', function () {
  beforeEach(async function () {
    ;[owner, proposer, holderA, holderB, executorA, executorB] = await ethers.getSigners()

    const swapperFactory = await ethers.getContractFactory('Swapper')
    swapper = await swapperFactory.deploy()

    const tokenFactory = await ethers.getContractFactory('Token')
    tokenA = await tokenFactory.deploy('TokenA', 'TKA')
    tokenB = await tokenFactory.deploy('TokenB', 'TKB')

    tokenA.mint(holderA.address, mintAmount)
    tokenB.mint(holderB.address, mintAmount)
  })

  it('deployment check', async function () {
    expect(await tokenA.name()).to.equal('TokenA')
    expect(await tokenB.name()).to.equal('TokenB')

    expect(await tokenA.balanceOf(holderA.address)).to.equal(mintAmount)
    expect(await tokenB.balanceOf(holderB.address)).to.equal(mintAmount)
  })

  describe('create proposal', function () {
    it('should allow an arbitrary address to create a proposal', async () => {
      const tx = await swapper
        .connect(proposer)
        .propose(
          executorA.address,
          holderA.address,
          tokenA.address,
          tokenASwapAmount,
          executorB.address,
          holderB.address,
          tokenB.address,
          tokenBSwapAmount,
          0,
          0,
        )
      const receipt = await tx.wait()

      expect(receipt.events[0].event).to.equal('DealCreated')
    })
  })

  describe('cancel proposal', function () {
    beforeEach(async () => {
      await swapper
        .connect(proposer)
        .propose(
          executorA.address,
          holderA.address,
          tokenA.address,
          tokenASwapAmount,
          executorB.address,
          holderB.address,
          tokenB.address,
          tokenBSwapAmount,
          0,
          4,
        )
    })

    it('cannot cancel before the deadline is reached', async () => {
      await expect(swapper.cancel(0)).to.be.revertedWith('Swapper: acceptance period is not over')
    })

    it('cannot cancel an approved proposal', async () => {
      await tokenA.connect(holderA).approve(swapper.address, tokenASwapAmount)
      await tokenB.connect(holderB).approve(swapper.address, tokenBSwapAmount)
      await swapper.connect(holderA).approve(0)
      await swapper.connect(holderB).approve(0)

      await expect(swapper.cancel(0)).to.be.revertedWith('Swapper: deal is no longer pending')
    })

    it('should be able to cancel after the deadline is reached', async () => {
      for (let i = 0; i < 6; i++) {
        await hre.ethers.provider.send('evm_mine')
      }

      const tx = await swapper.cancel(0)
      const receipt = await tx.wait()

      expect(receipt.events[0].event).to.equal('DealCanceled')
    })

    it('should return funds when canceled', async () => {
      for (let i = 0; i < 4; i++) {
        await hre.ethers.provider.send('evm_mine')
      }

      expect(await tokenA.balanceOf(holderA.address)).to.equal(mintAmount)

      await tokenA.connect(holderA).approve(swapper.address, tokenASwapAmount)
      await swapper.connect(holderA).approve(0)

      expect(await tokenA.balanceOf(holderA.address)).to.equal(mintAmount - tokenASwapAmount)
      expect(await tokenA.balanceOf(swapper.address)).to.equal(tokenASwapAmount)

      await swapper.cancel(0)

      expect(await tokenA.balanceOf(holderA.address)).to.equal(mintAmount)
      expect(await tokenA.balanceOf(swapper.address)).to.equal(0)
    })
  })

  describe('approve proposal', function () {
    beforeEach(async () => {
      await swapper
        .connect(proposer)
        .propose(
          executorA.address,
          holderA.address,
          tokenA.address,
          tokenASwapAmount,
          executorB.address,
          holderB.address,
          tokenB.address,
          tokenBSwapAmount,
          0,
          4,
        )
    })

    it("must be approved by one of the deal's accounts", async () => {
      await expect(swapper.connect(proposer).approve(0)).to.be.revertedWith('Swapper: caller not allowed')
    })

    it('should return true when a single account approve', async () => {
      await tokenA.connect(holderA).approve(swapper.address, tokenASwapAmount)
      expect(await swapper.connect(holderA).approve(0))
    })

    it('should emit event when both accounts have approved', async () => {
      await tokenA.connect(holderA).approve(swapper.address, tokenASwapAmount)
      await swapper.connect(holderA).approve(0)

      await tokenB.connect(holderB).approve(swapper.address, tokenBSwapAmount)
      await expect(swapper.connect(holderB).approve(0)).to.emit(swapper, 'DealApproved').withArgs(0, holderB.address)
    })
  })

  describe('claim tokens', () => {
    describe('when deal is Pending', () => {
      beforeEach(async () => {
        await swapper
          .connect(proposer)
          .propose(
            executorA.address,
            holderA.address,
            tokenA.address,
            tokenASwapAmount,
            executorB.address,
            holderB.address,
            tokenB.address,
            tokenBSwapAmount,
            0,
            4,
          )
        await tokenA.connect(holderA).approve(swapper.address, tokenASwapAmount)
        await tokenB.connect(holderB).approve(swapper.address, tokenBSwapAmount)
        await swapper.connect(holderA).approve(0)
      })
      it('should revert if status is pending', async () => {
        await expect(swapper.connect(executorA).claim(0)).to.be.revertedWith('Swapper: deal must be Approved')
      })
    })

    describe('when deadline not past', () => {
      beforeEach(async () => {
        await swapper
          .connect(proposer)
          .propose(
            executorA.address,
            holderA.address,
            tokenA.address,
            tokenASwapAmount,
            executorB.address,
            holderB.address,
            tokenB.address,
            tokenBSwapAmount,
            2,
            10,
          )
        await tokenA.connect(holderA).approve(swapper.address, tokenASwapAmount)
        await tokenB.connect(holderB).approve(swapper.address, tokenBSwapAmount)
        await swapper.connect(holderA).approve(0)
        await swapper.connect(holderB).approve(0)
      })
      it('should revert because deadline is not past', async () => {
        await expect(swapper.connect(executorA).claim(0)).to.be.revertedWith('Swapper: deadline is not past')
      })
    })

    describe('when vesting is 0', () => {
      beforeEach(async () => {
        await swapper
          .connect(proposer)
          .propose(
            executorA.address,
            holderA.address,
            tokenA.address,
            tokenASwapAmount,
            executorB.address,
            holderB.address,
            tokenB.address,
            tokenBSwapAmount,
            0,
            4,
          )
        await tokenA.connect(holderA).approve(swapper.address, tokenASwapAmount)
        await tokenB.connect(holderB).approve(swapper.address, tokenBSwapAmount)
        await swapper.connect(holderA).approve(0)
        await swapper.connect(holderB).approve(0)
      })
      it('should revert if caller is not one the accounts', async () => {
        await expect(swapper.connect(proposer).claim(0)).to.be.revertedWith('Swapper: caller not allowed')
      })
      it(`should return the full tokenB amount (${tokenBSwapAmount})`, async () => {
        await hre.ethers.provider.send('evm_mine')
        expect(await swapper.connect(executorA).callStatic.claim(0)).to.equal(tokenBSwapAmount)
      })
      it(`should return the full tokenA amount (${tokenASwapAmount})`, async () => {
        await hre.ethers.provider.send('evm_mine')
        expect(await swapper.connect(executorB).callStatic.claim(0)).to.equal(tokenASwapAmount)
      })
      it('should emit the dealClaimed event', async () => {
        await swapper.connect(executorA).claim(0)

        await expect(swapper.connect(executorB).claim(0)).to.emit(swapper, 'DealClaimed').withArgs(0, holderB.address)
      })
    })

    describe('when vesting is > 0', () => {
      beforeEach(async () => {
        await swapper
          .connect(proposer)
          .propose(
            executorA.address,
            holderA.address,
            tokenA.address,
            tokenASwapAmount,
            executorB.address,
            holderB.address,
            tokenB.address,
            tokenBSwapAmount,
            5,
            5,
          )
        await tokenA.connect(holderA).approve(swapper.address, tokenASwapAmount)
        await tokenB.connect(holderB).approve(swapper.address, tokenBSwapAmount)
        await swapper.connect(holderA).approve(0)
        await swapper.connect(holderB).approve(0)
      })
      it(`should return the vested amount for first block ${tokenASwapAmount / 5}`, async () => {
        // 4 blocks + 1 block mined = 5 blocks
        for (let i = 0; i < 2; i++) {
          await hre.ethers.provider.send('evm_mine')
        }
        expect(await swapper.connect(executorB).callStatic.claim(0)).to.equal(tokenASwapAmount / 5)
      })
      it(`should transfer ${tokenBSwapAmount / 5} tokens within ERC20`, async () => {
        await hre.ethers.provider.send('evm_mine')

        await swapper.connect(executorA).claim(0)

        // Holders now own each other's tokens
        expect(await tokenB.balanceOf(holderA.address)).to.equal(tokenBSwapAmount / 5)

        // Contract's token balance is zero
        expect(await tokenB.balanceOf(swapper.address)).to.equal(tokenBSwapAmount - tokenBSwapAmount / 5)
      })
    })
  })

  describe('change executor', () => {
    beforeEach(async () => {
      await swapper
        .connect(proposer)
        .propose(
          executorA.address,
          holderA.address,
          tokenA.address,
          tokenASwapAmount,
          executorB.address,
          holderB.address,
          tokenB.address,
          tokenBSwapAmount,
          2,
          10,
        )
    })
    it('should emit ExecutorChanged', async () => {
      await expect(swapper.connect(holderA).changeExecutor(0, proposer.address))
        .to.emit(swapper, 'ExecutorChanged')
        .withArgs(0, holderA.address, executorA.address, proposer.address)
    })
    it('should authorize only accounts to change executors', async () => {
      await expect(swapper.connect(proposer).changeExecutor(0, proposer.address)).to.be.revertedWith(
        'Swapper: caller not allowed',
      )
    })
  })
})
