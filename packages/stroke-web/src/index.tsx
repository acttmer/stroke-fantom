import { Web3Modal } from '@web3modal/react'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { WagmiConfig } from 'wagmi'
import './index.scss'
import {
  ethereumClient,
  wagmiClient,
  WALLET_CONNECT_PROJECT_ID,
} from './libs/ethers'
import DrawPage from './pages/draw'
import MainPage from './pages/main'
import PresentPage from './pages/present'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <WagmiConfig client={wagmiClient}>
      <RouterProvider
        router={createBrowserRouter([
          { path: '/', element: <MainPage /> },
          { path: '/draw', element: <DrawPage /> },
          { path: '/present/:tokenId', element: <PresentPage /> },
        ])}
      />
      <Web3Modal
        projectId={WALLET_CONNECT_PROJECT_ID}
        ethereumClient={ethereumClient}
      />
    </WagmiConfig>
  </React.StrictMode>,
)
