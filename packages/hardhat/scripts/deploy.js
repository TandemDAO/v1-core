require('dotenv').config()

async function main() {
  /*
    ===========================================================
    ================= Deploy all contracts ====================
    ===========================================================
    */

  const Token = await hre.ethers.getContractFactory('Token')
  const tokenA = await Token.deploy('TokenA', 'TKA')
  await tokenA.deployed()
  console.log('TokenA deployed to:', tokenA.address)

  const tokenB = await Token.deploy('TokenB', 'TKB')
  await tokenB.deployed()
  console.log('TokenB deployed to:', tokenB.address)

  const Governance = await hre.ethers.getContractFactory('Governance')
  const governorA = await Governance.deploy('Governor A', tokenA.address)
  await governorA.deployed()
  console.log('Governor A deployed to:', governorA.address)

  const governorB = await Governance.deploy('Governor B', tokenB.address)
  await governorB.deployed()
  console.log('Governor B deployed to:', governorB.address)

  const Swapper = await hre.ethers.getContractFactory('Swapper')
  const swapper = await Swapper.deploy()
  await swapper.deployed()
  console.log('Swapper deployed to: ', swapper.address)

  /*
    ================= Mint tokens to Governance contracts ===============
    */

  await tokenA.mint(governorA.address, 1000000)
  await tokenB.mint(governorB.address, 1000000)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
