<p align='center'>
  Welcome to Tandem DAO git repository. <br/><br/>
  <img src='./assets/tandem-logo.png' width='300'/> 
</p>

<details>
  <summary> Git flow </summary>
  
This is our [git flow](FLOW.md)
</details>

<details>
  <summary> Usage </summary>

First install dependencies:

```shell
yarn install
```

### Compile

Compile smart contracts with hardhat compile:

```shell
$ yarn compile
```

### Lint

Actually run lint:sol and prettier. Lint solidity code:

```shell
$ yarn lint
```

### Test

Run the Mocha/Chai tests:

```shell
$ yarn test
```

### How to call contract from hardhat console

```
const provider = new ethers.providers.JsonRpcProvider() // using default http://localhost:8545
const signer = new ethers.Wallet(privkey, provider)
const osSkill = await ethers.getContractAt('OsSkill', contractAddress, signer)
const out = await osSkill.balanceOf(walletAddress) // or any contract's function
console.log(out)
```

### Hardhat Commands

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
node scripts/sample-script.js
npx hardhat help
```

</details>

<details>
  <summary> Roadmap  </summary>

- (wip)
</details>
