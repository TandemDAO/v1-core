require('@nomiclabs/hardhat-waffle')

module.exports = {
  solidity: '0.8.6',
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      gas: 'auto',
    },
  },
}
