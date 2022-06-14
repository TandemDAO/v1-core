require('dotenv').config()

async function main() {
  const Swapper = await hre.ethers.getContractFactory('Swapper')
  const swapper = await Swapper.deploy()
  await swapper.deployed()
  console.log('Swapper deployed to: ', swapper.address)
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
