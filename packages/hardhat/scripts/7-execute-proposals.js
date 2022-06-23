const { ethers } = require('hardhat')
const Token = require('../artifacts/contracts/Token.sol/Token.json')
const Swapper = require('../artifacts/contracts/Swapper.sol/Swapper.json')
const Governance = require('../artifacts/contracts/Governance.sol/Governance.json')

require('dotenv').config()

const TOKEN_A_AMOUNT = constants.tokenA_amount
const TOKEN_B_AMOUNT = constants.tokenB_amount
const DEAL_ID = constants.dealId
const PROPOSAL_DESCRIPTION = constants.proposal_description

async function main() {
  const provider = ethers.getDefaultProvider('rinkeby', process.env.RINKEBY_URL)

  // MAKE SURE YOUR WALLET HAS GOT GOVERNANCE TOKENS
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider)

  const tokenA = new ethers.Contract(addresses.tokenA, Token.abi, wallet)
  const tokenB = new ethers.Contract(addresses.tokenB, Token.abi, wallet)
  const govA = new ethers.Contract(addresses.govA, Governance.abi, wallet)
  const govB = new ethers.Contract(addresses.govB, Governance.abi, wallet)
  const swapper = new ethers.Contract(addresses.swapper, Swapper.abi, wallet)

  let tokenA_approveCalldata = tokenA.interface.encodeFunctionData('approve', [
    addresses.swapper,
    ethers.utils.parseEther(TOKEN_A_AMOUNT),
  ])
  let tokenB_approveCalldata = tokenB.interface.encodeFunctionData('approve', [
    addresses.swapper,
    ethers.utils.parseEther(TOKEN_B_AMOUNT),
  ])
  let deal_approveCalldata = swapper.interface.encodeFunctionData('approve', [DEAL_ID])

  let tx

  console.log(
    "WARNING: If transactions are failing make sure you've updated the call arguments with the correct values",
  )

  console.log('Executing GovA proposal...')
  tx = await govA.execute(
    [addresses.tokenA, addresses.swapper],
    [0, 0],
    [tokenA_approveCalldata, deal_approveCalldata],
    ethers.utils.id(PROPOSAL_DESCRIPTION),
    {
      gasLimit: 21000000,
    },
  )

  await tx.wait()
  console.log('Executing GovB proposal')

  tx = await govB.execute(
    [addresses.tokenB, addresses.swapper],
    [0, 0],
    [tokenB_approveCalldata, deal_approveCalldata],
    ethers.utils.id(PROPOSAL_DESCRIPTION),
    {
      gasLimit: 21000000,
    },
  )

  await tx.wait()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
