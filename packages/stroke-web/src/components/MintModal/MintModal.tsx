import { Token } from '@/libs/stroke-nft'
import { useState } from 'react'
import * as ethers from 'ethers'
import styles from './MintModal.module.scss'

export interface MintModalResult {
  name: string
  description: string
  amount: string
}

export interface MintModalProps {
  visible: boolean
  usedTokens?: Token[]
  onSubmit?(result: MintModalResult): void
  onRequestClose?(): void
}

export const MintModal = ({
  visible,
  usedTokens = [],
  onSubmit,
  onRequestClose,
}: MintModalProps) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')

  if (!visible) {
    return null
  }

  return (
    <div className={styles.modal}>
      <div className={styles.dialog}>
        <input
          placeholder="Name"
          value={name}
          onChange={event => setName(event.target.value)}
        />
        <input
          placeholder="Description"
          value={description}
          onChange={event => setDescription(event.target.value)}
        />
        <input
          placeholder="Royalty Price (in FTM)"
          value={amount}
          onChange={event => setAmount(event.target.value)}
        />
        {usedTokens.length > 0 && (
          <div className={styles.usedTokens}>
            <div className={styles.title}>Used Tokens</div>
            <div className={styles.list}>
              {usedTokens.map(token => (
                <div className={styles.token}>
                  - {token.metadata.name}:{' '}
                  {token.royalty.amounts.reduce<number>(
                    (prev, curr) =>
                      prev + Number(ethers.utils.formatEther(curr)),
                    0,
                  )}
                  FTM
                </div>
              ))}
            </div>
          </div>
        )}
        <div className={styles.buttons}>
          <div className={styles.cancel} onClick={() => onRequestClose?.()}>
            Cancel
          </div>
          <div
            className={styles.submit}
            onClick={() =>
              onSubmit?.({
                name,
                description,
                amount,
              })
            }
          >
            Submit
          </div>
        </div>
      </div>
    </div>
  )
}
