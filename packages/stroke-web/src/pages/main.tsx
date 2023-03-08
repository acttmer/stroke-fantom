import { Web3Button } from '@web3modal/react'
import { useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import styles from './main.module.scss'

export default () => {
  const { isConnected } = useAccount()
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <div className={styles.title}>Stroke Social</div>

      {isConnected ? (
        <div className={styles.draw} onClick={() => navigate('/draw')}>
          Let's Draw
        </div>
      ) : (
        <Web3Button />
      )}
    </div>
  )
}
