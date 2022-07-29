//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract TestingNFT is ERC721, ERC721Pausable {
    constructor(address firstHolder, uint16 amount) ERC721("TestingNFT", "tNFT") {
        for (uint16 i = 0; i < amount; ++i) {
            _safeMint(firstHolder, i);
        }
    }

    /**
     * override(ERC721, ERC721Enumerable, ERC721Pausable) 
     * here you're overriding _beforeTokenTransfer method of
     * three Base classes namely ERC721, ERC721Enumerable, ERC721Pausable
     * */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal
      override(ERC721, ERC721Pausable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    /** ONLY FOR TESTING PURPOSES THIS METHOD DOES NOT HAVE ANY AUTHORIZATION CHECKS. */
    function pause() public {
        _pause();
    }
    function unpause() public {
        _unpause();
    }
}
