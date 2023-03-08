import { LoadingModal } from '@/components/LoadingModal'
import { getIPFSURL } from '@/libs/ipfs'
import {
  getPreferredTokenId,
  getToken,
  getTokenOwner,
  setPreferred,
  Token,
} from '@/libs/stroke-nft'
import * as ethers from 'ethers'
import { useEffect, useLayoutEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAccount, useSigner } from 'wagmi'
import styles from './present.module.scss'

export default () => {
  const navigate = useNavigate()
  const { tokenId: tokenId_ } = useParams()

  const tokenId = parseInt(tokenId_!)

  const { data: signer } = useSigner()
  const { isConnected, address } = useAccount()

  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState<Token>()
  const [tokenOwner, setTokenOwner] = useState<string>()
  const [preferredTokenId, setPreferredTokenId] = useState<number>()

  useLayoutEffect(() => {
    if (!isConnected) {
      navigate('/')
    }
  }, [isConnected, navigate])

  useEffect(() => {
    if (signer && tokenId && address) {
      getToken(signer, tokenId).then(setToken)
      getTokenOwner(signer, tokenId).then(setTokenOwner)
      getPreferredTokenId(signer, address).then(id =>
        setPreferredTokenId(id.toNumber()),
      )
    }
  }, [signer, tokenId, address])

  return (
    <div className={styles.page}>
      <LoadingModal visible={loading} />
      {token && (
        <div className={styles.token}>
          <img
            key={token.id}
            src={getIPFSURL(token.metadata.image)}
            alt={token.metadata.name}
          />

          <div className={styles.name}>{token.metadata.name}</div>
          <div className={styles.description}>{token.metadata.description}</div>
          <div className={styles.royalty}>
            <div className={styles.title}>Royalty Recipients</div>
            {token.royalty.recipients.map((recipient, index) => (
              <div key={index} className={styles.item}>
                {recipient}:{' '}
                {ethers.utils.formatEther(token.royalty.amounts[index])}FTM
              </div>
            ))}
          </div>

          {address === tokenOwner && preferredTokenId !== tokenId && (
            <div
              className={styles.setPreferred}
              onClick={() => {
                if (!signer) return

                setLoading(true)
                setPreferred(signer, tokenId).then(() => {
                  setPreferredTokenId(tokenId)
                  setLoading(false)
                })
              }}
            >
              Set as Preferred
            </div>
          )}
        </div>
      )}
    </div>
  )
}
