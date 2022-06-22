const { ethers } = require('hardhat')
const Swapper = require('../artifacts/contracts/Swapper.sol/Swapper.json')
const addresses = require('../src/addresses')

require('dotenv').config()

async function main() {
  const provider = ethers.getDefaultProvider('rinkeby', process.env.RINKEBY_URL)

  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider)

  const contract = new ethers.Contract('0x1b3cD50ccDE152234F1E8B8229e8550E1cB3aB69', Swapper.abi, wallet)

  const executorA = wallet.address
  const executorB = wallet.address
  const dealMemberA = addresses.govA
  const dealMemberB = addresses.govB
  const tokenA = addresses.tokenA
  const tokenB = addresses.tokenB
  const amountA = ethers.utils.parseEther('50') // param * 1e18
  const amountB = ethers.utils.parseEther('80') // param * 1e18
  const vesting = 10
  const deadline = 10

  console.log('Creating deal...')
  let tx = await contract.propose(
    executorA,
    dealMemberA,
    tokenA,
    amountA,
    executorB,
    dealMemberB,
    tokenB,
    amountB,
    vesting,
    deadline,
  )
  receipt = await tx.wait()

  console.log(receipt.logs)
  console.log('Done.')
  console.log('One more thing to do here. Fetch the dealId from the CREATED event above and add it to ./0-constants.js')
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
