import {
  EthereumClient,
  modalConnectors,
  walletConnectProvider,
} from '@web3modal/ethereum'
import { configureChains, createClient } from 'wagmi'
import { fantomTestnet } from 'wagmi/chains'

export const WALLET_CONNECT_PROJECT_ID = import.meta.env
  .VITE_WALLET_CONNECT_PROJECT_ID as string

const chains = [
  {
    ...fantomTestnet,
    rpcUrls: {
      default: { http: ['https://rpc.ankr.com/fantom_testnet'] },
      public: { http: ['https://rpc.ankr.com/fantom_testnet'] },
    },
  },
]

const { provider } = configureChains(chains, [
  walletConnectProvider({ projectId: WALLET_CONNECT_PROJECT_ID }),
])

export const wagmiClient = createClient({
  autoConnect: true,
  connectors: modalConnectors({
    projectId: WALLET_CONNECT_PROJECT_ID,
    version: '1',
    appName: 'Stroke',
    chains,
  }),
  provider,
})

export const ethereumClient = new EthereumClient(wagmiClient, chains)
