pragma solidity >=0.4.22 <0.8.0;

/**
 * @title SetSigners
 * @dev Set & change owner
 */

contract WhiteList {
    
    address owner;

    struct WhiteNode {
        address node;
        string description;
    }

    mapping(address => WhiteNode) whitenodes;
    WhiteNode[] public whitelist;
    
    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }
    
    constructor() public {
        owner = msg.sender;
    }
    
    
    /** 
     * @dev Add a signer
     * @param _address of signer
     */ 
    function addSigner(address _address, string memory _description) public onlyOwner {
        whitenodes[_address].node = _address;
        whitenodes[_address].description = _description;
        whitelist.push(whitenodes[_address]);
    }

    /** 
     * @dev Return whitelist's length
     */
    function getWhiteListLength() public view returns (uint){
        return whitelist.length;
    }

    function getWhiteNode(uint i) public view returns (address, string memory) {
        return (whitelist[i].node, whitelist[i].description);
    }
    
}