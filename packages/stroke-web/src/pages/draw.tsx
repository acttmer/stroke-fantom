import {
  DrawingBoard,
  DrawingBoardMode,
  DrawingBoardRef,
  DrawingElement,
} from '@/components/DrawingBoard'
import { LoadingModal } from '@/components/LoadingModal'
import { MintModal } from '@/components/MintModal'
import { getIPFSURL } from '@/libs/ipfs'
import {
  getAllTokens,
  mintToken,
  Token,
  uploadTokenMetadata,
} from '@/libs/stroke-nft'
import classNames from 'classnames'
import * as ethers from 'ethers'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount, useSigner } from 'wagmi'
import styles from './draw.module.scss'

export default () => {
  const navigate = useNavigate()

  const { data: signer } = useSigner()
  const { isConnected } = useAccount()

  const [loading, setLoading] = useState(false)
  const [mintModalVisible, setMintModalVisible] = useState(false)

  const [tokens, setTokens] = useState<Token[]>()
  const [usedTokens, setUsedTokens] = useState<Token[]>([])

  const [mode, setMode] = useState<DrawingBoardMode>('path')
  const [strokeColor, setStrokeColor] = useState('#000000')

  const drawingBoardRef = useRef<DrawingBoardRef>(null)

  useEffect(() => {
    if (signer) {
      getAllTokens(signer).then(setTokens)
    }
  }, [signer])

  useEffect(() => {
    if (tokens) {
      console.log(tokens)
    }
  }, [tokens])

  useLayoutEffect(() => {
    if (!isConnected) {
      navigate('/')
    }
  }, [isConnected, navigate])

  const mint = async (name: string, description: string, amount: string) => {
    if (!signer) return

    console.log(name)
    console.log(description)
    console.log(amount)

    const image = drawingBoardRef.current!.exportAsSvg()
    const uri = await uploadTokenMetadata(name, description, image)

    console.log(uri)

    const tokenId = await mintToken(
      signer,
      uri,
      true,
      await signer.getAddress(),
      ethers.utils.parseEther(amount),
      usedTokens.length > 0
        ? {
            recipients: usedTokens
              .map(token => token.royalty.recipients)
              .flat()
              .flat(),
            amounts: usedTokens
              .map(token => token.royalty.amounts)
              .flat()
              .flat(),
          }
        : {
            recipients: [],
            amounts: [],
          },
    )

    navigate(`/present/${tokenId}`)
  }

  return (
    <div className={styles.page}>
      <MintModal
        visible={mintModalVisible}
        usedTokens={usedTokens}
        onSubmit={({ name, description, amount }) => {
          console.log()
          setMintModalVisible(false)
          setLoading(true)
          mint(name, description, amount).then(() => setLoading(false))
        }}
        onRequestClose={() => setMintModalVisible(false)}
      />
      <LoadingModal visible={loading} />
      <div className={styles.collection}>
        <div className={styles.title}>Token Marketplace</div>
        <div className={styles.tokens}>
          {tokens &&
            tokens.map(token => (
              <div
                key={token.id}
                className={styles.token}
                onClick={() => {
                  setLoading(true)
                  fetch(getIPFSURL(token.metadata.image))
                    .then(res => res.text())
                    .then(content => {
                      setLoading(false)
                      setUsedTokens([...usedTokens, token])

                      const template = document.createElement('template')
                      template.innerHTML = content

                      const svg = template.content.children[0] as SVGSVGElement

                      Array.from(svg.children).forEach(node => {
                        drawingBoardRef.current!.insertElement(
                          node as DrawingElement,
                        )
                      })
                    })
                    .catch(() => setLoading(false))
                }}
              >
                <img
                  key={token.id}
                  src={getIPFSURL(token.metadata.image)}
                  alt={token.metadata.name}
                />
                <div className={styles.info}>
                  <div className={styles.name}>{token.metadata.name}</div>
                  <div className={styles.description}>
                    {token.metadata.description}
                  </div>
                  <div className={styles.amount}>
                    {ethers.utils.formatEther(
                      token.royalty.amounts.reduce(
                        (prev, curr) => ethers.BigNumber.from(prev).add(curr),
                        ethers.BigNumber.from(0),
                      ),
                    )}
                    FTM
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
      <div className={styles.minter}>
        <DrawingBoard
          ref={drawingBoardRef}
          className={styles.board}
          viewBox="0 0 500 500"
          mode={mode}
          strokeColor={strokeColor}
        />
        <div className={styles.toolbar}>
          <div className={styles.modes}>
            {['path', 'rect', 'ellipse', 'circle'].map(mode_ => (
              <div
                key={mode_}
                className={classNames(
                  styles.mode,
                  mode === mode_ && styles.selected,
                )}
                onClick={() => setMode(mode_ as DrawingBoardMode)}
              >
                {mode_}
              </div>
            ))}
          </div>
        </div>
        <div className={styles.colors}>
          {[
            '#000000',
            '#FF6900',
            '#FCB900',
            '#7BDCB5',
            '#00D084',
            '#8ED1FC',
            '#0693E3',
            '#ABB8C3',
            '#EB144C',
            '#F78DA7',
            '#9900EF',
          ].map(color => (
            <div
              key={color}
              className={classNames(
                styles.color,
                strokeColor === color && styles.selected,
              )}
              style={{
                backgroundColor: color,
              }}
              onClick={() => setStrokeColor(color)}
            >
              {strokeColor === color ? '✓' : null}
            </div>
          ))}
        </div>
        <div className={styles.tips}>
          <div className={styles.tip}>
            <span className={styles.key}>Backspace</span>: Delete selection
          </div>
          <div className={styles.tip}>
            <span className={styles.key}>= (EQ)</span>: Increase scale by 10%
          </div>
          <div className={styles.tip}>
            <span className={styles.key}>- (MINUS)</span>: Decrease scale by 10%
          </div>
        </div>
        <div className={styles.mint} onClick={() => setMintModalVisible(true)}>
          Mint
        </div>
      </div>
    </div>
  )
}
