const { ethers } = require('hardhat')
const Governance = require('../artifacts/contracts/Governance.sol/Governance.json')
const addresses = require('../src/addresses')
const constants = require('./0-constants')

require('dotenv').config()

async function main() {
  const provider = ethers.getDefaultProvider('rinkeby', process.env.RINKEBY_URL)

  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider)

  const govA = new ethers.Contract(addresses.govA, Governance.abi, wallet)
  const govB = new ethers.Contract(addresses.govB, Governance.abi, wallet)

  const AGAINST = 0
  const FOR = 1
  const ABSTAIN = 2

  const GOV1_PROPOSAL_ID = constants.govA_proposalId
  const GOV2_PROPOSAL_ID = constants.govB_proposalId

  let tx

  console.log(
    "WARNING: If transactions are failing make sure you've updated the call arguments with the correct values",
  )

  console.log('Voting on DAO A proposal')
  tx = await govA.castVote(GOV1_PROPOSAL_ID, FOR)
  await tx.wait()

  console.log('Voting on DAO B proposal')

  tx = await govB.castVote(GOV2_PROPOSAL_ID, FOR)
  await tx.wait()

  console.log('All done.')
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
