require('dotenv').config()

async function main() {
  const Swapper = await hre.ethers.getContractFactory('Swapper')
  const swapper = await Swapper.deploy()
  await swapper.deployed()
  console.log('Swapper deployed to: ', swapper.address)
  console.log('IMPORTANT: Add swapper address to /packages/hardhat/src/addresses.js')
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
