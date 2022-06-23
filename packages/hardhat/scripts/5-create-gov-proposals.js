const { ethers } = require('hardhat')
const Token = require('../artifacts/contracts/Token.sol/Token.json')
const Swapper = require('../artifacts/contracts/Swapper.sol/Swapper.json')
const Governance = require('../artifacts/contracts/Governance.sol/Governance.json')
const addresses = require('../src/addresses')
const constants = require('./0-constants')
require('dotenv').config()

async function main() {
  const provider = ethers.getDefaultProvider('rinkeby', process.env.RINKEBY_URL)

  // MAKE SURE YOUR WALLET HOLDS GOVERNANCE TOKENS
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider)

  const tokenA = new ethers.Contract(addresses.tokenA, Token.abi, wallet)
  const tokenB = new ethers.Contract(addresses.tokenB, Token.abi, wallet)
  const govA = new ethers.Contract(addresses.govA, Governance.abi, wallet)
  const govB = new ethers.Contract(addresses.govB, Governance.abi, wallet)
  const swapper = new ethers.Contract(addresses.swapper, Swapper.abi, wallet)

  const TOKEN_A_AMOUNT = constants.tokenA_amount
  const TOKEN_B_AMOUNT = constants.tokenB_amount
  const DEAL_ID = constants.dealId
  const PROPOSAL_DESCRIPTION = constants.proposal_description

  let tokenA_approveCalldata = tokenA.interface.encodeFunctionData('approve', [
    addresses.swapper,
    ethers.utils.parseEther(TOKEN_A_AMOUNT),
  ])
  let tokenB_approveCalldata = tokenB.interface.encodeFunctionData('approve', [
    addresses.swapper,
    ethers.utils.parseEther(TOKEN_B_AMOUNT),
  ])
  let deal_approveCalldata = swapper.interface.encodeFunctionData('approve', [DEAL_ID])

  let tx, receipt

  console.log(
    "WARNING: If transactions are failing make sure you've updated the call arguments with the correct values.",
  )

  //Then create proposals
  console.log('Creating proposal for DAO A')
  tx = await govA.propose(
    [tokenA.address, addresses.swapper],
    [0, 0],
    [tokenA_approveCalldata, deal_approveCalldata],
    PROPOSAL_DESCRIPTION,
    {
      gasLimit: 21000000,
    },
  )
  receipt = await tx.wait()
  console.log('================ BEGINNING OF GOV A PROPOSAL LOGS =====================')
  console.log(receipt.logs)
  console.log('================ END OF GOV A PROPOSAL LOGS =====================')

  console.log('Creating proposal for DAO B')
  tx = await govB.propose(
    [tokenB.address, addresses.swapper],
    [0, 0],
    [tokenB_approveCalldata, deal_approveCalldata],
    PROPOSAL_DESCRIPTION,
    {
      gasLimit: 21000000,
    },
  )
  receipt = await tx.wait()

  console.log('================ BEGINNING OF GOV B PROPOSAL LOGS =====================')
  console.log(receipt.logs)
  console.log('================ END OF GOV B PROPOSAL LOGS =====================')

  console.log(
    'All done. One more thing to do: get the ids of BOTH governance proposals from the logs above and add them to 0-constants.js',
  )
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
