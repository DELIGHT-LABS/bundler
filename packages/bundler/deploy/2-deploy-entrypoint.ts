import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { ethers } from 'hardhat'
import { deployEntryPoint, getEntryPointAddress } from '@account-abstraction/utils'

// deploy entrypoint - but only on debug network..
const deployEP: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const epAddr = getEntryPointAddress()
  if (await ethers.provider.getCode(epAddr) !== '0x') {
    console.log('EntryPoint already deployed at', epAddr)
    return
  }

  await deployEntryPoint(ethers.provider)
  console.log('Deployed EntryPoint at', epAddr)
}

export default deployEP
