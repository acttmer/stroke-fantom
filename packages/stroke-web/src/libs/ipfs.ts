import { NFTStorage } from 'nft.storage'

const NFT_STORAGE_TOKEN = import.meta.env.VITE_NFT_STORAGE_TOKEN as string

export const nftStorage = new NFTStorage({ token: NFT_STORAGE_TOKEN })

export const getIPFSURL = (uri: string) => {
  const replaced = uri.replace('ipfs://', '')

  return `https://nftstorage.link/ipfs/${replaced}`
}

export const getIPFSMetadataJSON = async (uri: string) => {
  const res = await fetch(getIPFSURL(uri))

  return res.json()
}
