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
        string[] vote;
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
     * @param _address of node to add into vote list of signer
     * @param _vote description of the whitenode
     */ 
    function vote(address _address, string memory _vote) public onlySigner {
        signers[msg.sender].whiteNodesVoted.push(_address);
        signers[msg.sender].vote.push(_vote);
    }
    
    /** 
     * @dev Return a signer vote in index i
     */ 
    function getVotedNode(uint i) public onlySigner view returns (address, string memory) {
        return (signers[msg.sender].whiteNodesVoted[i], signers[msg.sender].vote[i]);
    }
    
    /** 
     * @dev Return length of signer's vote list
     */ 
    function getVotedListLength() public onlySigner view returns (uint) {
        return signers[msg.sender].whiteNodesVoted.length;
    }
}