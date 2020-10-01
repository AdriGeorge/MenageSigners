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


const transport = new HTTPTransport("http://localhost:8501");
const requestManager = new RequestManager([transport]);
const client = new Client(new RequestManager([transport]));
const web3 = new Web3(Web3.givenProvider);

const contractAddr = '0xeDc3A86474dde032468de4Ae0CF938698A68BBEC';
const WhiteListContract = new web3.eth.Contract(contract, contractAddr);


function App() {

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
  const [votedList, setVotedList] = React.useState({whitenode: '', vote: ''});

  var votedListCopy = {};
  var nodes = {};
  //var votedList = {};
  var proposals = {};

  // Methods for handle controller selected label => Account to propose and to discard

  function handleChange (event) {
    setAccount(event.target.value);
  };

  function handleClose () {
    setOpen(false);
  };

  async function handleOpen () {
    if (addressToVote.length < 1) {
      getAccountToVote();
      //await new Promise(r => setTimeout(r, 200));
    };
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

  // This method interact with the smart contract WhiteList.sol
  async function getAccountToVote (e) {
    const listLength = await WhiteListContract.methods.getWhiteListLength().call();
    console.log("list length: " + listLength )
    var addressToVoteCopy = [];
    var addressDescriptionCopy = [];
    for (let i=0; i<listLength; i++){
      let result = await WhiteListContract.methods.getWhiteNode(i).call();
      if(!alreadySigner(result[0])){
        nodes[i] = {nodeAddress: result[0], description: result[1]};
        addressToVoteCopy[i] = nodes[i].nodeAddress;
        addressDescriptionCopy[i] = nodes[i].description;
      };
    };
    setAddressToVote(addressToVoteCopy);
    setAddressDescription(addressDescriptionCopy);
    console.log("addDesc " + addressDescription);
  };

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
    setSigners(result);
    console.log("signers:")
    console.log(signers);
  };


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



  async function checkProposals (e) {
    const result = await client.request({method: "clique_proposals", params: []});
    console.log(result);
    proposals = result;
    console.log("Address already voted: " + proposals);
  };

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
      votedListCopy[i] = {whiteNode: result[0], vote: result[1]};
    }; 
    setVotedList(votedListCopy) 

    console.log(votedList[0])

    var lastNodeVoted = document.getElementById("lastNodeVoted");
    if(update != 1){
      console.log("info che mi serve " + lastNodeVoted.style.display)
      if(lastNodeVoted.style.display === 'none' || lastNodeVoted.style.display === "") {
        console.log("sono qua")
        lastNodeVoted.style.display = "block";
      } else {
        lastNodeVoted.style.display = "none";
      }
      console.log("info che mi serve2 " + lastNodeVoted.style.display)
    } else {
      var votelist0 = document.getElementById("lastNodeVoted");

    }
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
    getVoteList(1);
  };

  function updateVoteList() {
    console.log("sono quaaaaa")
    getVoteList(1);
  }

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
            <div id="lastNodeVoted" onChange={updateVoteList}>
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