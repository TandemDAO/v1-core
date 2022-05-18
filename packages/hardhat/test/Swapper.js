const { expect } = require('chai')
const { assert } = require('console')
const { ethers } = require('hardhat')
const { isRegExp } = require('lodash')

let owner, proposer, holderA, holderB
let swapper, tokenA, tokenB
const tokenASwapAmount = 100,
  tokenBSwapAmount = 200,
  mintAmount = 1000

describe('Swapper', function () {
  beforeEach(async function () {
    ;[owner, proposer, holderA, holderB] = await ethers.getSigners()

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
          holderA.address,
          tokenA.address,
          tokenASwapAmount,
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
          holderA.address,
          tokenA.address,
          tokenASwapAmount,
          holderB.address,
          tokenB.address,
          tokenBSwapAmount,
          0,
          4,
        )
    })

    it('cannot be called with an invalid proposal id', async () => {
      //TODO: make this test pass
      //await expect(swapper.cancel(3)).to.be.reverted;
      expect(true).to.equal(false)
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
      for (let i = 0; i < 4; i++) {
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
          holderA.address,
          tokenA.address,
          tokenASwapAmount,
          holderB.address,
          tokenB.address,
          tokenBSwapAmount,
          0,
          4,
        )
    })

    it('cannot be called with invalid proposal id', async () => {
      //TODO: make this pass
      expect(true).to.equal(false)
    })

    it('cannot be approved by arbitrary address', async () => {
      await expect(swapper.connect(proposer).approve(0)).to.be.revertedWith('Swapper: caller not allowed')
    })

    it('should allow one of the parties to approve the proposal', async () => {
      await tokenA.connect(holderA).approve(swapper.address, tokenASwapAmount)

      expect(await tokenA.balanceOf(holderA.address)).to.equal(mintAmount)

      await expect(swapper.connect(holderA).approve(0)).to.emit(swapper, 'DealApproved').withArgs(0, holderA.address)

      expect(await tokenA.balanceOf(holderA.address)).to.equal(mintAmount - tokenASwapAmount)
      expect(await tokenA.balanceOf(swapper.address)).to.equal(tokenASwapAmount)
    })

    it('status is pending after one party approved ', async () => {
      // expect deal.Status == Status.Pending
      expect(true).to.equal(false)
    })

    it('should allow the other party to approve the proposal', async () => {
      await tokenB.connect(holderB).approve(swapper.address, tokenBSwapAmount)

      expect(await tokenB.balanceOf(holderB.address)).to.equal(mintAmount)

      await expect(swapper.connect(holderB).approve(0)).to.emit(swapper, 'DealApproved').withArgs(0, holderB.address)

      expect(await tokenB.balanceOf(holderB.address)).to.equal(mintAmount - tokenBSwapAmount)
      expect(await tokenB.balanceOf(swapper.address)).to.equal(tokenBSwapAmount)
    })

    it('status is approved after both parties approved ', async () => {
      // expect deal.Status == Status.Approved
      expect(true).to.equal(false)
    })
  })

  describe('claim swap', function () {
    beforeEach(async () => {
      await swapper
        .connect(proposer)
        .propose(
          holderA.address,
          tokenA.address,
          tokenASwapAmount,
          holderB.address,
          tokenB.address,
          tokenBSwapAmount,
          10,
          4,
        )
    })

    it('cannot claim a proposal which has not been approved', async () => {
      await expect(swapper.claim(0)).to.be.revertedWith('Swapper: the deal has not been approved by both parties')
    })

    it('cannot claim before the vesting period ends', async () => {
      await tokenA.connect(holderA).approve(swapper.address, tokenASwapAmount)
      await tokenB.connect(holderB).approve(swapper.address, tokenBSwapAmount)
      await swapper.connect(holderA).approve(0)
      await swapper.connect(holderB).approve(0)

      await expect(swapper.claim(0)).to.be.revertedWith('Swapper: vesting period is not over')
    })

    it('should perform token swap after the vesting period of an approved proposal', async () => {
      await tokenA.connect(holderA).approve(swapper.address, tokenASwapAmount)
      await tokenB.connect(holderB).approve(swapper.address, tokenBSwapAmount)
      await swapper.connect(holderA).approve(0)
      await swapper.connect(holderB).approve(0)

      for (let i = 0; i < 10; i++) {
        await hre.ethers.provider.send('evm_mine')
      }

      // Holders do not own each other's tokens yet
      expect(await tokenA.balanceOf(holderB.address)).to.equal(0)
      expect(await tokenB.balanceOf(holderA.address)).to.equal(0)

      // Swap ammount is stored into the contract
      expect(await tokenA.balanceOf(swapper.address)).to.equal(tokenASwapAmount)
      expect(await tokenB.balanceOf(swapper.address)).to.equal(tokenBSwapAmount)

      await swapper.claim(0)

      // Holders now own each other's tokens
      expect(await tokenA.balanceOf(holderB.address)).to.equal(tokenASwapAmount)
      expect(await tokenB.balanceOf(holderA.address)).to.equal(tokenBSwapAmount)

      // Contract is empty
      expect(await tokenA.balanceOf(swapper.address)).to.equal(0)
      expect(await tokenB.balanceOf(swapper.address)).to.equal(0)
    })
  })
})
