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

console.log("1")

const transport = new HTTPTransport("http://localhost:8501");
const requestManager = new RequestManager([transport]);
const client = new Client(new RequestManager([transport]));
const web3 = new Web3(Web3.givenProvider);

const contractAddr = '0xeDc3A86474dde032468de4Ae0CF938698A68BBEC';
const WhiteListContract = new web3.eth.Contract(contract, contractAddr);

console.log("2")

function App() {

  console.log("3")

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
  const [addressToDiscard, setAddressToDiscard] = React.useState();
  const [account, setAccount] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [openDiscard, setOpenDiscard] = React.useState(false);
  const [addressToVote, setAddressToVote] = React.useState([]);
  const [addressDescription, setAddressDescription] = React.useState([]);
  const [addressToDiscardArray, setAddressToDiscardArray] = React.useState([]);
  const [descriptionToDiscardArray, setDescriptionsToDiscard] = React.useState([]);
  const [signers, setSigners] = React.useState([]);
  const [votedList, setVotedList] = React.useState({});

  var nodes = {};
  //var votedList = {};
  var proposals = {};

  console.log("4")
  // Methods for handle controller selected label => Account to propose and to discard

  function handleChange (event) {
    setAccount(event.target.value);
  };

  console.log("5")

  function handleClose () {
    setOpen(false);
  };

  console.log("6")

  async function handleOpen () {
    if (addressToVote.length < 1) {
      getAccountToVote();
      //await new Promise(r => setTimeout(r, 200));
    };
    setOpen(true);
  };

  console.log("7")

  function handleChangeDiscard (event) {
    setAddressToDiscard(event.target.value);
  };

  console.log("8")

  function handleCloseDiscard () {
    setOpenDiscard(false);
  };

  console.log("9")

  async function handleOpenDiscard () {
    checkProposals();
    console.log("handle ofpen discard");
      //await new Promise(r => setTimeout(r, 300));
    setOpenDiscard(true);
  };


  //method for handle Information

  function handleClickInfo (event) {
    setAnchorEl(event.currentTarget);
  };

  function handleCloseInfo () {
    setAnchorEl(null);
  };

  console.log("10")

  // This method interact with the smart contract WhiteList.sol
  async function getAccountToVote (e) {
    const listLength = await WhiteListContract.methods.getWhiteListLength().call();
    console.log("list length: " + listLength )
    for (let i=0; i<listLength; i++){
      let result = await WhiteListContract.methods.getWhiteNode(i).call();
      if(!alreadySigner(result[0])){
        nodes[i] = {nodeAddress: result[0], description: result[1]};
        addressToVote[i] = nodes[i].nodeAddress;
        addressDescription[i] = nodes[i].description;
      };
    };
    console.log("addDesc " + addressDescription);
  };

  console.log("11")

  function alreadySigner(node) {
    if (signers.length < 1) getSigners();
    for (var i=0; i<signers.length; i++){
      if (signers[i] === node) return true;
    }
    return false;
  };

  // The following methods are clique method => RPC CALL

  async function getSigners () {
    console.log("Sono entrato qua 2");
    const result = await client.request({method: "clique_getSigners", params: []});
    await new Promise(r => setTimeout(r, 300));
    setSigners(result);
    console.log("signers:")
    console.log(signers);
  };

  console.log("12")

  async function propose (e, vote) {
    await client.request({method: "clique_propose", params: [e, vote]});
    console.log("Your proposal: " + e + ", " + vote);
    setAccount("");
    addressToDiscardArray.push(e);
    voteNode(e, vote.toString());
  };

  function getDescription(account) {
    for(var i=0; i<nodes.length; i++){
      if (nodes[i].nodeAddress === account) return nodes[i].description;
    }
    return null;
  };

  async function discard (e) {
    await client.request({method: "clique_discard", params: [e]});
    var i = addressToDiscardArray.indexOf(e);
    if(i > -1){
      addressToDiscardArray.splice(i, 1);
      descriptionToDiscardArray.splice(i, 1);
    }
    console.log("You just discard: " + e);
    setAddressToDiscard("");
    checkProposals();
  };

  console.log("13")

  async function checkProposals (e) {
    const result = await client.request({method: "clique_proposals", params: []});
    console.log(result);
    proposals = result;
    console.log("Address already voted: " + proposals);
  };

  // method for render information about current signers

  async function getInfo() {
    console.log("CAZZ CI FACCCI OQUA");
    await getSigners();

    var info = document.getElementById("infoSigner");
    console.log(info.style.display)
    if(info.style.display === "" || info.style.display === "none") {
      info.style.display = "block";
    } else {
      info.style.display = "none";
    }
  };

  console.log("14")

  async function getInformation() {
    getInfo();
    getVoteList();
  }

  // get signer's vote list

  async function getVoteList () {
    console.log("Sono entrato qua 1");
    await getSigners();
    console.log("Ora sono qua 3");
    const accounts = await window.ethereum.enable();
    const account = accounts[0];
    const listLength = await WhiteListContract.methods.getVotedListLength().call({
      from: accounts[0]
    });
    for (let i=0; i<listLength; i++){
      let result = await WhiteListContract.methods.getVotedNode(i).call({
        from: accounts[0]
      });
      votedList[i] = {whiteNode: result[0], vote: result[1]};
    };    
    var lastNodeVoted = document.getElementById("lastNodeVoted");
    console.log(votedList)
    console.log("info che mi serve " + lastNodeVoted.style.display)
    if(lastNodeVoted.style.display === 'none' || lastNodeVoted.style.display === "") {
      console.log("sono qua")
      lastNodeVoted.style.display = "block";
    } else {
      lastNodeVoted.style.display = "none";
    }
    console.log("info che mi serve2 " + lastNodeVoted.style.display)
  };

  console.log("15")
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
    getVoteList();
  };

  
  console.log("ciao sto per chiamare getSigner");

  console.log("16")
  return (
    <div className="App">
      <div className="App-body">
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
                {addressToDiscardArray.map((value, index) => {
                  return <MenuItem value={addressToDiscardArray[index]}>{value}</MenuItem>
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
            <div id="infoSigner">
              <h6> List of signers </h6>
              <ul>
                {signers.map((value, i) => {
                  return (
                    <li value={signers[i]}>{value}</li>
                  )
                })}
              </ul>
            </div>
        </section>
      </div>
      <footer className="infoMenu">
        <Navbar collapseOnSelect expand="lg" bg="dark" variant="dark">
          <Navbar.Toggle aria-controls="responsive-navbar-nav" />
          <Navbar.Collapse id="responsive-navbar-nav">
            <Nav className="mr-auto">
              <MenuItem onClick = {getInformation}> Information </MenuItem>
            </Nav>
          </Navbar.Collapse>
        </Navbar>
      </footer> 
    </div>  
  );
}

export default App;