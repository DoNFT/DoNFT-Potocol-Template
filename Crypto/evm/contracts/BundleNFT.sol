//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

import "contracts/EffectsAllowList.sol";
import "contracts/IBundleNFT.sol";

// Errors:
// E01: mintItem is not permitted
// E02: Operation is not permitted
// E03: The token you are trying to remove has a special role
// E04: One of NFTs you asked to remove does not exist in the bundle
// E05: ERC721: transfer of token that is not own
// E06: ERC721Metadata: Bundeled tokens query for nonexistent token
// E07: Bundling requires original + modifier or nothing
// E08: AllowList disallows that configuration
// E09: Bundle fee not paid

contract BundleNFT is
    IBundleNFT,
    Initializable,
    OwnableUpgradeable,
    ERC721URIStorageUpgradeable,
    ERC721EnumerableUpgradeable
{
    mapping(uint256 => NFT[]) public bundles;

    mapping(uint256 => uint256) public parentBundle;

    event MintMessage(uint256 message);

    uint256 public constant bundleBaseFee = 15000000000000000; // 0.015 Ether
    uint256 public constant MintFeeCoeff = 1; // 1 * bundleBaseFee.
    uint256 public constant CreateBundleFeeCoeff = 2;
    uint256 public constant UnbundleFeeCoeff = 2;

    address payable public constant doNftWallet =
        payable(0x8fb1d5e8f4dda65302F904Cd8C7F3d09A1130E0d);

    function initialize(string memory name_, string memory symbol_)
        public
        initializer
    {
        __Ownable_init();
        __ERC721_init(name_, symbol_);
        __ERC721URIStorage_init();
        __ERC721Enumerable_init();
    }

    function bundle(NFT[] memory _tokens)
        public
        payable
        override
        returns (uint256)
    {
        _checkFees(CreateBundleFeeCoeff);

        uint256 tokenId = uint256(keccak256(abi.encode(_tokens)));
        uint256 tokensLen = _tokens.length;
        for (uint256 i = 0; i < tokensLen; ) {
            _tokens[i].token.safeTransferFrom(
                msg.sender,
                address(this),
                _tokens[i].tokenId
            );
            bundles[tokenId].push(_tokens[i]); // todo: verify safety
            unchecked {
                ++i;
            }
        }

        _safeMint(msg.sender, tokenId);
        emit MintMessage(tokenId);
        return tokenId;
    }

    function mintItem(
        address to,
        uint256 tokenId,
        string memory uri
    ) public payable returns (uint256) {
        require(!_exists(tokenId));
        _checkFees(MintFeeCoeff);

        _safeMint(to, tokenId);
        emit MintMessage(tokenId);
        _setTokenURI(tokenId, uri);

        return tokenId;
    }

    function mintItem(address to, string memory uri)
        public
        payable
        returns (uint256)
    {
        uint256 tokenId = uint256(keccak256(abi.encode(uri)));
        while (_exists(tokenId)) {
            tokenId += 1;
        }
        return mintItem(to, tokenId, uri);
    }

    // Compare tokens without TokenRole.
    function isEqual(NFT memory nft1, NFT memory nft2)
        internal
        pure
        returns (bool)
    {
        return (keccak256(abi.encodePacked(nft1.token, nft1.tokenId)) ==
            keccak256(abi.encodePacked(nft2.token, nft2.tokenId)));
    }

    /**
     * @dev Bundle multiple NFTs into a merged token with new content.
     */
    function bundleWithTokenURI(NFT[] memory _tokens, string memory _tokenURI)
        public
        payable
        returns (uint256)
    {
        uint256 tokenId = bundle(_tokens);
        _setTokenURI(tokenId, _tokenURI);
        return tokenId;
    }

    /**
     * @dev Disassemble a bundle token.
     */
    function unbundle(uint256 _tokenId) public payable override {
        require(ownerOf(_tokenId) == msg.sender, "E05");
        _checkFees(UnbundleFeeCoeff);

        NFT[] memory _bundle = bundles[_tokenId];
        uint256[] memory _newBundle = new uint256[](_bundle.length);
        uint256 _newBundleSize = 0;
        _burn(_tokenId);
        delete (bundles[_tokenId]);
        for (uint256 i = 0; i < _bundle.length; i++) {
            (
                bool success,
            ) = address(_bundle[i].token).call( // This creates a low level call to the token
                    abi.encodePacked( // This encodes the function to call and the parameters to pass to that function
                        bytes4(
                            keccak256(
                                bytes(
                                    "safeTransferFrom(address,address,uint256)"
                                )
                            )
                        ), // This is the function identifier of the function we want to call
                        abi.encode(
                            address(this),
                            msg.sender,
                            _bundle[i].tokenId
                        ) // This encodes the parameter we want to pass to the function
                    )
                );
            if (!success) {
                _newBundle[_newBundleSize] = i;
                _newBundleSize += 1;
            } else {
                _unsetParent(_bundle[i]);
            }
        }
        if (_newBundleSize > 0) {
            _safeMint(msg.sender, _tokenId);
            for (uint256 i = 0; i < _newBundleSize; i++) {
                bundles[_tokenId].push(_bundle[_newBundle[i]]); // todo: verify safety
            }
        }
    }

    /**
     * @dev Whenever an {IERC721} `tokenId` token is transferred to this contract via {IERC721-safeTransferFrom}
     * by `operator` from `from`, this function is called.
     *
     * It must return its Solidity selector to confirm the token transfer.
     * If any other value is returned or the interface is not implemented by the recipient, the transfer will be reverted.
     *
     * The selector can be obtained in Solidity with `IERC721.onERC721Received.selector`.
     */
    function onERC721Received(
        address, /* operator */
        address, /* from */
        uint256, /* tokenId */
        bytes calldata /* data */
    ) external pure returns (bytes4) {
        // todo: revert if this is not called within `bundle`
        return this.onERC721Received.selector;
    }

    /**
     * @dev Base URI for computing {tokenURI}. If set, the resulting URI for each
     * token will be the concatenation of the `baseURI` and the `tokenId`. Empty
     * by default, can be overriden in child contracts.
     */
    function _baseURI() internal pure override returns (string memory) {
        return "";
    }

    /**
     * @dev Withdraw all fees to the owner address
     */
    function withdrawFees() public onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    /**
     * @dev Returns list on NFTs in bundle NFT by tokenId
     */
    function bundeledTokensOf(uint256 _tokenId)
        public
        view
        returns (NFT[] memory)
    {
        require(_exists(_tokenId));
        return bundles[_tokenId];
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
        returns (bool)
    {
        return
            interfaceId == type(IBundleNFT).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    )
        internal
        virtual
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
    {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _burn(uint256 tokenId)
        internal
        virtual
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
    {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
        returns (string memory)
    {
        return ERC721URIStorageUpgradeable.tokenURI(tokenId);
    }

    function _checkFees(uint256 coeff) internal {
        require(msg.value >= bundleBaseFee * coeff);

        uint256 amount = (msg.value / denominator) * doNftShare;
        doNftWallet.transfer(amount);

        // Contract owner's fee just remains on a contract, and could be withdrawn later
    }

    function _isBundledToken(NFT memory token) internal view returns (bool) {
        return _exists(token.tokenId) && address(token.token) == address(this);
    }

    function _maybeSetParent(NFT memory token, uint256 parentTokenId) internal {
        if (!_isBundledToken(token)) return;
        parentBundle[token.tokenId] = parentTokenId;
    }

    function _unsetParent(NFT memory token) internal {
        if (!_isBundledToken(token)) return;
        delete parentBundle[token.tokenId];
    }
}
