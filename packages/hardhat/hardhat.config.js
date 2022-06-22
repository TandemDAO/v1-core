require('dotenv').config()
require('@nomiclabs/hardhat-waffle')
require('hardhat-gas-reporter')
require('@nomiclabs/hardhat-etherscan')

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: '0.8.6',
  defaultNetwork: 'hardhat',
  networks: {
    localhost: {
      url: 'http://localhost:8545',
      chainId: 31337,
    },
    rinkeby: {
      url: process.env.RINKEBY_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
  etherscan: {
    apyKey: process.env.ETHERSCAN_KEY,
  },
  gasReporter: {
    currency: 'USD',
    gasPrice: 15,
  },
}
