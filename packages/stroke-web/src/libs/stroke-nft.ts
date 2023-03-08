import { BigNumber, BigNumberish, Signer } from 'ethers'
import { StrokeNFT__factory } from 'stroke-contracts/typechain-types'
import { getIPFSMetadataJSON, nftStorage } from './ipfs'

export const STROKE_NFT_CONTRACT_ADDRESS = import.meta.env
  .VITE_STROKE_NFT_CONTRACT_ADDRESS as string

export const StrokeNFTFactory = new StrokeNFT__factory()
export const StrokeNFT = StrokeNFTFactory.attach(STROKE_NFT_CONTRACT_ADDRESS)

export interface Token {
  id: number
  metadata: {
    name: string
    description: string
    image: string
  }
  royalty: {
    recipients: string[]
    amounts: BigNumberish[]
  }
  listed: boolean
}

export const getToken = async (signer: Signer, tokenId: number) => {
  const session = StrokeNFT.connect(signer)

  const uri = await session.tokenURI(tokenId)
  const metadata = await getIPFSMetadataJSON(uri)

  const royalty = await session.getRoyalty(tokenId)
  const listed = await session.getListed(tokenId)

  return {
    id: tokenId,
    metadata,
    royalty,
    listed,
  } as Token
}

export const getAllTokens = async (signer: Signer) => {
  const totalSupply = await StrokeNFT.connect(signer).totalSupply()
  const tokens = []

  for (let tokenId = 1; tokenId <= totalSupply.toNumber(); tokenId++) {
    tokens.push(await getToken(signer, tokenId))
  }

  return tokens
}

export const uploadTokenMetadata = async (
  name: string,
  description: string,
  image: File,
) => {
  const { url } = await nftStorage.store({
    name,
    description,
    image,
  })

  return url
}

export const mintToken = async (
  signer: Signer,
  uri: string,
  listed: boolean,
  recipient: string,
  amount: BigNumberish,
  royalty: {
    recipients: string[]
    amounts: BigNumberish[]
  },
) => {
  const session = StrokeNFT.connect(signer)
  const totalSupply = await session.totalSupply()

  const value = royalty.amounts.reduce(
    (prev, curr) => BigNumber.from(prev).add(BigNumber.from(curr)),
    BigNumber.from(0),
  )

  const tx = await session.mint(
    signer.getAddress(),
    uri,
    listed,
    recipient,
    amount,
    royalty,
    { value },
  )

  await tx.wait()

  return totalSupply.toNumber() + 1
}

export const getTokenOwner = (signer: Signer, tokenId: number) => {
  return StrokeNFT.connect(signer).ownerOf(tokenId)
}

export const getPreferredTokenId = (signer: Signer, owner: string) => {
  return StrokeNFT.connect(signer).getPreferredTokenId(owner)
}

export const setPreferred = async (signer: Signer, tokenId: number) => {
  await StrokeNFT.connect(signer).setPreferred(tokenId)
}
