import ClipLoader from 'react-spinners/ClipLoader'
import styles from './LoadingModal.module.scss'

export interface LoadingModalProps {
  visible: boolean
}

export const LoadingModal = ({ visible }: LoadingModalProps) => {
  if (!visible) {
    return null
  }

  return (
    <div className={styles.modal}>
      <div className={styles.dialog}>
        <ClipLoader />
      </div>
    </div>
  )
}
