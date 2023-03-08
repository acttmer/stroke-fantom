import { ethers } from 'hardhat'

async function main() {
  const StrokeNFTFactory = await ethers.getContractFactory('StrokeNFT')
  const StrokeNFT = await StrokeNFTFactory.deploy()

  await StrokeNFT.deployed()

  console.log(StrokeNFT)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
