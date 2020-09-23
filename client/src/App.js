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
import './App.css';
import 'bootstrap/dist/css/bootstrap.css';


const transport = new HTTPTransport("http://localhost:8501");
const requestManager = new RequestManager([transport]);
const client = new Client(new RequestManager([transport]));
const web3 = new Web3(Web3.givenProvider);

const contractAddr = '0x4Cc0dcCa779bcd1652098C68ceC0369198562552';
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

  const [addressToDiscard, discardAddress] = React.useState();
  const [account, setAccount] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [openDiscard, setOpenDiscard] = React.useState(false);
  const [addressToVote, setAddressToVote] = React.useState([]);
  const [addressToDiscardArray, setAddressToDiscard] = React.useState([]);
  const [anchorEl, setAnchorEl] = React.useState(null);

  var signers = [];
  var nodes = {};
  var addressDescription = [];

  // Methods for handle controller selected label => Account to propose and to discard

  const handleChange = (event) => {
    setAccount(event.target.value);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleOpen = async () => {
    if (addressToVote.length < 1) {
      getAccountToVote();
      await new Promise(r => setTimeout(r, 200));
    };
    setOpen(true);
  };

  const handleChangeDiscard = (event) => {
    discardAddress(event.target.value);
  };

  const handleCloseDiscard = () => {
    setOpenDiscard(false);
  };

  const handleOpenDiscard = async () => {
    if (addressToDiscardArray.length <1) {
      checkProposals();
      await new Promise(r => setTimeout(r, 200));
    };
    setOpenDiscard(true);
  };


  //method for handle Information

  const handleClickInfo = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseInfo = () => {
    setAnchorEl(null);
  };


  // This method interact with the smart contract WhiteList.sol
  const getAccountToVote = async () => {
    const array = [];
    const accounts = await window.ethereum.enable();
    const account = accounts[0];
    const listLength = await WhiteListContract.methods.getWhiteListLength().call();
    for (let i=0; i<listLength; i++){
      let result = await WhiteListContract.methods.getWhiteNode(i).call();
      if(!alreadySigner(result[0])){
        nodes[i] = {nodeAddress: result[0], description: result[1]};
        addressToVote[i] = nodes[i].nodeAddress;
        addressDescription[i] = nodes[i].description;
      };
    };
    console.log("Account To Vote: " + nodes);
  };

  function alreadySigner(node) {
    if (signers.length < 1) getSigners();
    for (var i=0; i<signers.length; i++){
      if (signers[i] === node) return true;
    }
    return false;
  };

  // The following methods are clique method => RPC CALL
  const checkStatus = async () => {
    const result = await client.request({method: "clique_status", params: []});
    console.log("Status:")
    console.log(result);
  };

  const getSigners = async () => {
    signers = await client.request({method: "clique_getSigners", params: []});
    console.log("Singers: " + signers);
  };

  const propose = async (e, vote) => {
    await client.request({method: "clique_propose", params: [e, vote]});
    addressToDiscardArray[addressToDiscardArray.length] = e;
    console.log("Your proposal: " + e + ", "+ vote);
  };

  const discard = async (e) => {
    await client.request({method: "clique_discard", params: [e]});
    var i = addressToDiscardArray.indexOf(e);
    if(i > -1){
      addressToDiscardArray.splice(i, 1);
    }
    console.log("You just discard: " + e);
  };

  const checkProposals = async () => {
    const result = await client.request({method: "clique_proposals", params: []});
    for (let i=0; i<result.length; i++){
      addressToDiscardArray[i] = result[i];
    };
    console.log("Address already voted: " + addressToDiscardArray);
  };

  const getSnapShot = async () => {
    const result = await client.request({method: "clique_getSnapshot", params: []});
    console.log("SnapShot:");
    console.log(result);
  };


  return (
    <div className="App">
      <header className="App-header">
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
                    return <MenuItem value={addressToVote[index]}>{value} </MenuItem>
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
        <div>
        </div>
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
          <br />
          <div className="infoBtn">
            <MenuItem onClick = {getSigners}> Signers </MenuItem>
            <MenuItem onClick = {checkProposals} type="button" className = "btn btn-info"> Your proposals </MenuItem>
            <MenuItem onClick = {getAccountToVote} type="button" className = "btn btn-info"> Pending account </MenuItem>
            <MenuItem onClick = {checkStatus} type="button" className = "btn btn-info"> Status </MenuItem>
            <MenuItem onClick = {getSnapShot} type="button" className = "btn btn-info"> SnapShot </MenuItem>
          </div>
      </header>
    </div>  
  );
}

export default App;

/*
<button onClick = {getSigners} type="button" className = "btn btn-info"> Get Signers </button>
          <button onClick = {checkStatus} type="button" className = "btn btn-info"> Check Status </button>
          <button onClick = {checkProposals} type="button" className = "btn btn-info"> Check Proposals </button>
          <button onClick = {getSnapShot} type="button" className = "btn btn-info"> Get SnapShot </button>
          <button onClick = {getAccountToVote} type="button" className = "btn btn-info">getAccounts </button>
          */