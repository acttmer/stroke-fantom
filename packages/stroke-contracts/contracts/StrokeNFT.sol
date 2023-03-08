// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

struct Royalty {
  address[] recipients;
  uint256[] amounts;
}

contract StrokeNFT is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {
  mapping(uint256 => Royalty) _royalties;
  mapping(uint256 => bool) _listed;
  mapping(address => uint256) _preferred;

  constructor() ERC721("Stroke NFT", "STROKE") Ownable() {}

  function _requireTokenOwner(uint256 tokenId) internal virtual {
    require(_ownerOf(tokenId) == _msgSender(), "caller must be owner");
  }

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 firstTokenId,
    uint256 batchSize
  ) internal virtual override(ERC721, ERC721Enumerable) {
    super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
  }

  function _afterTokenTransfer(
    address from,
    address to,
    uint256 firstTokenId,
    uint256 batchSize
  ) internal virtual override(ERC721) {
    super._afterTokenTransfer(from, to, firstTokenId, batchSize);

    address owner = _ownerOf(firstTokenId);

    if (_preferred[owner] == firstTokenId) {
      delete _preferred[owner];
    }
  }

  function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
    super._burn(tokenId);
  }

  function tokenURI(uint256 tokenId)
    public
    view
    override(ERC721, ERC721URIStorage)
    returns (string memory)
  {
    return super.tokenURI(tokenId);
  }

  function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC721, ERC721Enumerable)
    returns (bool)
  {
    return super.supportsInterface(interfaceId);
  }

  function getRoyalty(uint256 tokenId) external view returns (Royalty memory) {
    _requireMinted(tokenId);

    return _royalties[tokenId];
  }

  function getListed(uint256 tokenId) external view returns (bool) {
    _requireMinted(tokenId);

    return _listed[tokenId];
  }

  function getPreferredTokenId(address owner) external view returns (uint256) {
    return _preferred[owner];
  }

  function mint(
    address to,
    string memory uri,
    bool listed,
    address recipient,
    uint256 amount,
    Royalty memory royalty
  ) external payable virtual {
    // Transfer royalty payments
    for (uint256 i = 0; i < royalty.recipients.length; i++) {
      payable(royalty.recipients[i]).transfer(royalty.amounts[i]);
    }

    uint256 tokenId = totalSupply() + 1;

    _safeMint(to, tokenId);
    _setTokenURI(tokenId, uri);

    // Set token listed
    _listed[tokenId] = listed;

    // Set token royalty by merging current recipient into the original
    Royalty memory mergedRoyalty;

    mergedRoyalty.recipients = new address[](royalty.recipients.length + 1);
    mergedRoyalty.amounts = new uint256[](royalty.recipients.length + 1);

    mergedRoyalty.recipients[0] = recipient;
    mergedRoyalty.amounts[0] = amount;

    for (uint256 i = 0; i < royalty.recipients.length; i++) {
      mergedRoyalty.recipients[i + 1] = royalty.recipients[i];
      mergedRoyalty.amounts[i + 1] = royalty.amounts[i];
    }

    _royalties[tokenId] = mergedRoyalty;
  }

  function setListed(uint256 tokenId, bool listed) external virtual {
    _requireMinted(tokenId);
    _requireTokenOwner(tokenId);

    _listed[tokenId] = listed;
  }

  function setPreferred(uint256 tokenId) external virtual {
    _requireMinted(tokenId);
    _requireTokenOwner(tokenId);

    _preferred[_msgSender()] = tokenId;
  }
}
