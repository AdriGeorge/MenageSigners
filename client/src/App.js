import React, { useState } from 'react';
import Web3 from 'web3';
import { RequestManager, HTTPTransport, Client } from "@open-rpc/client-js";
import { contract } from './abi/abis';
import { makeStyles } from '@material-ui/core/styles';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import Menu from '@material-ui/core/Menu';
import { Button, Navbar, Nav } from 'react-bootstrap';
import './App.css';
import 'bootstrap/dist/css/bootstrap.css';


// rpc of your node -> for rpc call (clique methods)
const transport = new HTTPTransport("http://localhost:8508");
const requestManager = new RequestManager([transport]);
const client = new Client(new RequestManager([transport]));
const web3 = new Web3(Web3.givenProvider);

const contractAddr = '0xd6aB24610fEb60Afb9942297839a8E855E99D5f0';
const WhiteListContract = new web3.eth.Contract(contract, contractAddr);
var x = true;

function App() {
  if(x){
    console.log("sono qua")
    getSigners()
    checkProposals();
    getAccountToVote();
    loginCheck()
    x = false;
  }


  const useStyles = makeStyles((theme) => ({
    button: {
      display: 'block',
      marginTop: theme.spacing(2),
      },
      formControl: {
        margin: theme.spacing(1),
        minWidth: 500,
      },
    }));

  const classes = useStyles();

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [open, setOpen] = React.useState(false);
  const [openDiscard, setOpenDiscard] = React.useState(false);
  const [addressToDiscard, setAddressToDiscard] = React.useState();
  const [account, setAccount] = React.useState('');
  const [addressToVote, setAddressToVote] = React.useState([]);
  const [addressDescription, setAddressDescription] = React.useState([]);
  const [proposals, setProposals] = React.useState([]);
  const [signers, setSigners] = React.useState([]);
  const [votedList, setVotedList] = React.useState({whitenode: '', vote: ''});
  const [myAccountMeta, setMyAccount] = React.useState('');

  // Methods for handle controller selected label => Account to propose and to discard

  function handleChange (event) {
    setAccount(event.target.value);
  };

  function handleClose () {
    setOpen(false);
    getAccountToVote();
  };

  async function handleOpen () {
      getAccountToVote();
      setOpen(true);
  };


  function handleChangeDiscard (event) {
    setAddressToDiscard(event.target.value);
  };


  function handleCloseDiscard () {
    setOpenDiscard(false);
  };

  async function handleOpenDiscard () {
    checkProposals();
    setOpenDiscard(true);
  };


  //method for handle Information

  function handleClickInfo (event) {
    setAnchorEl(event.currentTarget);
  };

  function handleCloseInfo () {
    setAnchorEl(null);
  };


  async function loginCheck(){
    const accounts = await window.ethereum.enable();
    console.log(accounts[0])
    setMyAccount(accounts[0]);
    console.log("my account" + myAccountMeta);
  }


  // This method interact with the smart contract WhiteList.sol
  async function getAccountToVote (e) {
    checkProposals();
    const listLength = await WhiteListContract.methods.getWhiteListLength().call();
    //console.log("list length: " + listLength )
    var nodes = {};
    var addressToVoteCopy = [];
    var addressDescriptionCopy = [];
    for (let i=0; i<listLength; i++){
      let result = await WhiteListContract.methods.getWhiteNode(i).call();
      console.log("account signer: " +result[0]);
      if(!alreadySigner(result[0]) && !alreadyVoted(result[0])){
        nodes[i] = {nodeAddress: result[0], description: result[1]};
        addressToVoteCopy[i] = nodes[i].nodeAddress;
        addressDescriptionCopy[i] = nodes[i].description;
        //console.log(nodes[i]);
      };
    };
    setAddressToVote(addressToVoteCopy);
    setAddressDescription(addressDescriptionCopy);
    console.log(addressToVote)
    //console.log("my account" + myAccountMeta);
  };


  function alreadyVoted(address){
    checkProposals();
    //console.log("address " + address + " proposals " + proposals[0])
    for(var i=0; i<proposals.length; i++){
      console.log("Sono nel for ")
      if(proposals[i].toString().toLowerCase() === address.toString().toLowerCase()){
        console.log("true");
        return true;
       }
    }
    console.log("sono false ")
    return false;
  }

  function alreadySigner(node) {
    if (signers.length < 1) getSigners();
    for (var i=0; i<signers.length; i++){
      if (signers[i].toString().toLowerCase() === node.toString().toLowerCase()) return true;
    }
    return false;
  };

  // The following methods are clique method => RPC CALL

  async function getSigners () {
    const result = await client.request({method: "clique_getSigners", params: []}); 
    setSigners(result);
    console.log(result);
    console.log("questi sono i signers");
  };

  async function propose (e, vote) {
    if(!signers.includes(myAccountMeta)){
      alert("You are not a signer!");
      return;
    }
    await client.request({method: "clique_propose", params: [e, vote]});
    setAccount("");
    getAccountToVote();
    voteNode(e, vote.toString());
  };

  async function discard (e) {
    console.log("you want to discard:" + e);
    await client.request({method: "clique_discard", params: [e]});
    setAddressToDiscard("");
    checkProposals();
    getAccountToVote();
  };

  async function checkProposals (e) {
    const result = await client.request({method: "clique_proposals", params: []});
    setProposals(Object.keys(result));
  }


  // method for render information about current signers

  async function getInfoSigners() {
    getSigners();
    var info = document.getElementById("infoSigner");
    console.log(info.style.display)
    if(info.style.display === "" || info.style.display === "none") {
      info.style.display = "block";
    } else {
      info.style.display = "none";
    }
  };

  // get signer's vote list
  async function getVoteList (update) {
    getSigners();
    var votedListCopy = {};
    const accounts = await window.ethereum.enable();
    const account = accounts[0];
    console.log(accounts);
    const listLength = await WhiteListContract.methods.getVotedListLength().call({
      from: accounts[0]
    });
    for (let i=0; i<listLength; i++){
      let result = await WhiteListContract.methods.getVotedNode(i).call({
        from: accounts[0]
      });
      votedListCopy[i] = {whiteNode: result[0], vote: result[1]};
    }; 
    setVotedList(votedListCopy) 
    var lastNodeVoted = document.getElementById("lastNodeVoted");
    if(update !== 1){
      if(lastNodeVoted.style.display === 'none' || lastNodeVoted.style.display === "") {
        lastNodeVoted.style.display = "block";
      } else {
        lastNodeVoted.style.display = "none";
      }
    };
  };

  // push node voted into node voted list of signer in contract
  async function voteNode (addressOf, vote) {
    const accounts = await window.ethereum.enable();
    const account = accounts[0];
    console.log(addressOf + ", " + vote);
    const result = await WhiteListContract.methods.vote(addressOf, vote).send({
      from: accounts[0]
    });
    console.log(result);
    console.log("added to contract" + addressOf + ", " + vote);
    document.getElementById("lastNodeVoted").innerHtml = "Refreshing";
    if (vote) addSigner(addressOf);
    getVoteList(1);
    getSigners();
  };


  async function addSigner(addressToAdd) {
    const accounts = await window.ethereum.enable();
    const account = accounts[0];
    if(signers.includes(addressToAdd)){
      console.log("add signer into contract");
      await WhiteListContract.methods.addSigner(addressToAdd).send({
        from: accounts[0]
      });
    }
  }

  loginCheck();

  return (
    <div className="App">
      <div className="App-body">
        <div id="login2">Logged as : </div>
        <div id="login"> {myAccountMeta}</div>
        <section id="vote">
          Account to propose:
          <label>
            <FormControl className={classes.formControl}>
              <InputLabel id="demo-controlled-open-select-label">Account</InputLabel>
              <Select
                labelId="demo-controlled-open-select-label"
                id="demo-controlled-open-select"
                open={open}
                onClose={handleClose}
                onOpen={handleOpen}
                value={account}
                onChange={handleChange}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {addressToVote.map((value, index) => {
                  return <MenuItem value={addressToVote[index]}>{value}, {addressDescription[index]} </MenuItem>
                })}
              </Select>
            </FormControl>
          </label>
          <label>
            <button type="button" className="btn btn-outline-success" onClick={ e => propose(account, true)}> 
              Accept 
            </button>
            <button type="button" className="btn btn-outline-danger" onClick={ e => propose(account, false)}>
              Denied
            </button>
          </label>
          <br/>
          Account to discard:
          <label>
            <FormControl className={classes.formControl}>
              <InputLabel id="demo-controlled-open-select-label">Account</InputLabel>
              <Select
                labelId="demo-controlled-open-select-label"
                id="demo-controlled-open-select"
                open={openDiscard}
                onClose={handleCloseDiscard}
                onOpen={handleOpenDiscard}
                value={addressToDiscard}
                onChange={handleChangeDiscard}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {proposals.map((value, index) => {
                  return <MenuItem value={proposals[index]}>{value}</MenuItem>
                })}
              </Select>
            </FormControl>
          </label>
          <button type="button" className="btn btn-outline-warning" onClick={ e => discard(addressToDiscard)}>
            Discard
          </button>
        </section>  
        <section id="information">
          <div className="lastNodeVoted">
            <div id="lastNodeVoted">
              <h3>Your vote list: </h3>
              <ol>
                {Object.entries(votedList).map(([key, value], i) => {
                  return (
                    <li>
                      <div key = {key}>
                        <div id="text">address:</div> {value.whiteNode}, <div id="text">Your vote:</div> {value.vote}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>
          </div>
          <div className="infoSigner">
            <div id="infoSigner">
              <h3> List of signers </h3>
              <ul>
                {signers.map((value, i) => {
                  return (
                    <li value={signers[i]}>{value}</li>
                  )
                })}
              </ul>
            </div>
          </div>
        </section>
      </div>
      <footer className="infoMenu">
        <Navbar collapseOnSelect expand="lg" bg="dark" variant="dark">
          <Navbar.Toggle aria-controls="responsive-navbar-nav" />
          <Navbar.Collapse id="responsive-navbar-nav">
            <Nav className="mr-auto">
              <MenuItem onClick = {getVoteList}> Votes List </MenuItem>
              <MenuItem onClick = {getInfoSigners}> Signers list </MenuItem>
            </Nav>
          </Navbar.Collapse>
        </Navbar>
      </footer> 
    </div>  
  );
}

export default App;