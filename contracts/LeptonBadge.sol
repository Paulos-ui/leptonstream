// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// LeptonStream earning badge — a soulbound (non-transferable) ERC-721.
// A creator mints/upgrades their badge by presenting an EIP-712 attestation
// signed by the trusted `attester` (the LeptonStream backend), which only signs
// a tier the creator has actually earned. One token per holder; its tier is
// upgraded in place. Built on OpenZeppelin v5.
//
// Deploy (Remix or Foundry) to Arc Testnet (chainId 5042002) with the
// constructor `attester` = the public address of ATTESTER_PRIVATE_KEY.
// Then set NEXT_PUBLIC_BADGE_ADDRESS to the deployed address.

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract LeptonBadge is ERC721, EIP712 {
    using ECDSA for bytes32;
    using Strings for uint256;

    address public immutable attester;
    uint256 public nextId = 1;

    mapping(address => uint8) public tierOf;     // holder => current tier (1..4)
    mapping(address => uint256) public tokenIdOf; // holder => their token id (0 = none)
    mapping(uint256 => uint8) public tokenTier;  // token id => tier
    mapping(address => uint256) public nonces;   // replay protection

    bytes32 private constant CLAIM_TYPEHASH =
        keccak256("Claim(address to,uint8 tier,uint256 nonce)");

    string[5] private TIER_NAMES = ["Unranked", "Glow", "Shine", "Blaze", "Supernova"];

    event BadgeClaimed(address indexed holder, uint256 indexed tokenId, uint8 tier);

    constructor(address _attester)
        ERC721("LeptonStream Badge", "LSB")
        EIP712("LeptonBadge", "1")
    {
        require(_attester != address(0), "attester=0");
        attester = _attester;
    }

    /// Mint or upgrade the caller's badge to `tier`, authorized by `sig`.
    function claim(uint8 tier, bytes calldata sig) external {
        require(tier >= 1 && tier <= 4, "bad tier");
        require(tier > tierOf[msg.sender], "no higher tier");

        bytes32 structHash =
            keccak256(abi.encode(CLAIM_TYPEHASH, msg.sender, tier, nonces[msg.sender]));
        bytes32 digest = _hashTypedDataV4(structHash);
        require(digest.recover(sig) == attester, "bad attestation");

        nonces[msg.sender] += 1;
        tierOf[msg.sender] = tier;

        uint256 id = tokenIdOf[msg.sender];
        if (id == 0) {
            id = nextId++;
            tokenIdOf[msg.sender] = id;
            tokenTier[id] = tier;
            _safeMint(msg.sender, id);
        } else {
            tokenTier[id] = tier;
        }
        emit BadgeClaimed(msg.sender, id, tier);
    }

    function tokenURI(uint256 id) public view override returns (string memory) {
        _requireOwned(id);
        uint8 tier = tokenTier[id];
        string memory name = TIER_NAMES[tier];
        string memory json = string(
            abi.encodePacked(
                '{"name":"LeptonStream Badge #', id.toString(),
                ' - ', name,
                '","description":"An earned, soulbound badge reflecting a creator\\u2019s per-second support on LeptonStream.",',
                '"attributes":[{"trait_type":"Tier","value":"', name,
                '"},{"trait_type":"Level","value":', uint256(tier).toString(), '}]}'
            )
        );
        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }

    // ---- Soulbound: allow mint (from==0) but block transfers ----------------
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        require(from == address(0) || to == address(0), "soulbound: non-transferable");
        return super._update(to, tokenId, auth);
    }
}
