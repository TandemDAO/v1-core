const { ethers } = require('hardhat')
const Swapper = require('../artifacts/contracts/Swapper.sol/Swapper.json')

require('dotenv').config()

async function main() {
  const provider = ethers.getDefaultProvider('rinkeby', process.env.RINKEBY_URL)

  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider)

  const contract = new ethers.Contract('0x5eBbf8731F968B488256234b7d074C8E1f171051', Swapper.abi, wallet)

  const executorA = '0x74a557dfe5516F97acc8565a39E3d86226769fE3'
  const executorB = '0x74a557dfe5516F97acc8565a39E3d86226769fE3'
  const dealMemberA = '0x03DE7E9780ce250c0E5527AeeF6123FeF3c4Ac8F'
  const dealMemberB = '0xBcc6165132bE5FA3D2fB09F64DcFFEb8A62DA123'
  const tokenA = '0x9D4c1981915D330836b687259a021A1968489637'
  const tokenB = '0x9a488e4647b0B5d5E7fa2b00Fcd99a99F52351Ec'
  const amountA = ethers.utils.parseEther('5') // param * 1e18
  const amountB = ethers.utils.parseEther('8') // param * 1e18
  const vesting = 200
  const deadline = 200

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

  await tx.wait()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
