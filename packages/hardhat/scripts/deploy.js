const main = async () => {
  const Swapper = await ethers.getContractFactory("Swapper");
  const swapper = await Swapper.deploy();

  await swapper.deployed();

  console.log("Swapper deployed to:", swapper.address);
}
  
const runMain = async () => {
  try {
    await main()
    process.exit(0)
  } catch (error) {
    console.log(error)
    process.exit(1)
  }
}

runMain()