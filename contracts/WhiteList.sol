pragma solidity >=0.4.22 <0.8.0;

/**
 * @title WhiteList
 * @dev Vote white node
 */

contract WhiteList {
    
    address owner;

    struct WhiteNode {
        address node;
        string description;
    }
    
    struct Signer {
        address signer;
        address[] whiteNodesVoted;
    }

    mapping(address => WhiteNode) whitenodes;
    WhiteNode[] public whitelist;
    
    mapping(address => Signer) signers;
    Signer[] public signersList;
    
    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }
    
    modifier onlySigner {
        require(signers[msg.sender].signer == msg.sender || msg.sender == owner);
        _;
    }
    
    constructor() public {
        owner = msg.sender;
    }
    
    event newRequestAdded(address nodeAddress, string description);
    
    /** 
     * @dev Add a node in pending
     * @param _address of node to add into whitelist
     */ 
    function addNode(address _address, string memory _description) public onlyOwner {
        whitenodes[_address].node = _address;
        whitenodes[_address].description = _description;
        whitelist.push(whitenodes[_address]);
        emit newRequestAdded(_address, _description);
    }

    /** 
     * @dev Return whitelist's length
     */
    function getWhiteListLength() public view returns (uint){
        return whitelist.length;
    }
    
    /** 
     * @dev Return white node in position i
     */
    function getWhiteNode(uint i) public view returns (address, string memory) {
        return (whitelist[i].node, whitelist[i].description);
    }
    
     /** 
     * @dev Add a signer into contract
     * @param _address of node to add into signers
     */ 
    function addSigner(address _address) public onlyOwner {
        signers[_address].signer = _address;
        signersList.push(signers[_address]);
    }
    
    /** 
     * @dev Add the node that the signer voted
     * @param _address of node to add into voted list of signer
     */ 
    function whiteNodeVoted(address _address) public onlySigner {
        signers[msg.sender].whiteNodesVoted.push(_address); 
    }

    /** 
     * @dev Return signer's list of voted nodes 
     */ 
    function getVotedNodes() public onlySigner view returns (address[] memory) {
        return signers[msg.sender].whiteNodesVoted;
    }
    
}