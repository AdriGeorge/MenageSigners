import React, { useState } from 'react';
import Web3 from 'web3';
import { contract } from './abi/abis';
import './App.css';
import { RequestManager, HTTPTransport, Client } from "@open-rpc/client-js";
import 'bootstrap/dist/css/bootstrap.css';
import { makeStyles } from '@material-ui/core/styles';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';


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

  var node = {};
  var addressDescription = [];

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


  // The following method interact with the smart contract WhiteList.sol
  const getAccountToVote = async () => {
    const array = [];
    const accounts = await window.ethereum.enable();
    const account = accounts[0];
    const listLength = await WhiteListContract.methods.getWhiteListLength().call();
    for (let i=0; i<listLength; i++){
      let result = await WhiteListContract.methods.getWhiteNode(i).call();
      node[i] = {nodeAddress: result[0], description: result[1]};
      addressToVote[i] = node[i].nodeAddress;
      addressDescription[i] = node[i].description;
    };
    console.log(node);
  };

  // The following methods are clique method 
  const checkStatus = async () => {
    const result = await client.request({method: "clique_status", params: []});
    console.log(result);
    console.log("status")
  };

  const getSigners = async () => {
    const result = await client.request({method: "clique_getSigners", params: []});
    console.log(result);
    console.log("getSigners");
  };

  const propose = async (e, vote) => {
    const result = await client.request({method: "clique_propose", params: [e, vote]});
    addressToDiscardArray[addressToDiscardArray.length] = e;
    console.log(result);
    console.log("propose" + e + ", "+ vote);
  };

  const discard = async(e) => {
    const result = await client.request({method: "clique_discard", params: [e]});
    var i = addressToDiscardArray.indexOf(e);
    if(i > -1){
      addressToDiscardArray.splice(i, 1);
    }
    console.log(result);
    console.log("discard: " + e);
  };

  const checkProposals = async() => {
    const result = await client.request({method: "clique_proposals", params: []});
    console.log(result);
    console.log("checkProposals")
    for (let i=0; i<result.length; i++){
      addressToDiscardArray[i] = result[i];
    };
    console.log("address: " + addressToDiscardArray);
  };

  const getSnapShot = async () => {
    const result = await client.request({method: "clique_getSnapshot", params: []});
    console.log(result);
    console.log("getSnapShot")
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
                    return <MenuItem value={addressToVote[index]}>{value}</MenuItem>
                  })}
                </Select>
              </FormControl>
          </label>
          <label>
            <button type="button" className="btn btn-success" onClick={ e => propose(account, true)}> 
              Accept 
            </button>
            <button type="button" className="btn btn-danger" onClick={ e => propose(account, false)}>
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
          <button type="button" className="btn btn-warning" onClick={ e => discard(addressToDiscard)}>
            Discard
          </button>
          <br/>
        <label>
          <button onClick = {getSigners} type="button" className = "btn btn-info"> Get Signers </button>
          <button onClick = {checkStatus} type="button" className = "btn btn-info"> Check Status </button>
          <button onClick = {checkProposals} type="button" className = "btn btn-info"> Check Proposals </button>
          <button onClick = {getSnapShot} type="button" className = "btn btn-info"> Get SnapShot </button>
          <button onClick = {getAccountToVote} type="button" className = "btn btn-info">getAccounts </button>
        </label>
      </header>
    </div>  
  );
}

export default App;

