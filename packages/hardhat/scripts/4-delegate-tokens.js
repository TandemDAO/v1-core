require('dotenv').config()
const { ethers } = require('hardhat')
const Token = require('../artifacts/contracts/Token.sol/Token.json')
const addresses = require('../src/addresses')

async function main() {
  const provider = ethers.getDefaultProvider('rinkeby', process.env.RINKEBY_URL)
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider)

  const tokenA = new ethers.Contract(addresses.tokenA, Token.abi, wallet)
  const tokenB = new ethers.Contract(addresses.tokenB, Token.abi, wallet)

  let tx

  tx = await tokenA.delegate(wallet.address)
  await tx.wait()

  tx = await tokenB.delegate(wallet.address)
  await tx.wait()
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
