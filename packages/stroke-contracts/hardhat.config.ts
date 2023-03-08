import '@nomicfoundation/hardhat-toolbox'
import { config as dotenvConfig } from 'dotenv'
import { HardhatUserConfig } from 'hardhat/config'

dotenvConfig()

const config: HardhatUserConfig = {
  solidity: '0.8.17',
  defaultNetwork: 'fantom_testnet',
  networks: {
    fantom_testnet: {
      url: 'https://rpc.ankr.com/fantom_testnet',
      accounts: [process.env.PRIVATE_KEY!],
    },
  },
}

export default config
