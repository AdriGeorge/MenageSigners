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
  const [addressDescription, setAddressDescription] = React.useState([]);
  const [addressToDiscardArray, setAddressToDiscard] = React.useState([]);
  const [descriptionToDiscardArray, setDescriptionsToDiscard] = React.useState([]);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [signers, setSigners] = React.useState([]);


  var nodes = {};

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
      //await new Promise(r => setTimeout(r, 200));
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
      //await new Promise(r => setTimeout(r, 300));
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
  const getAccountToVote = async (e) => {
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

  const getSigners = async (e) => {
    const result = await client.request({method: "clique_getSigners", params: []});
    setSigners(result);
    console.log("Singers: " + signers);
  };

  const propose = async (e, vote) => {
    await client.request({method: "clique_propose", params: [e, vote]});
    addressToDiscardArray[addressToDiscardArray.length] = e;
    console.log("Your proposal: " + e + ", " + vote);
    setAccount("");
  };

  function getDescription(account) {
    for(var i=0; i<nodes.length; i++){
      if (nodes[i].nodeAddress === account) return nodes[i].description;
    }
    return null;
  };

  const discard = async (e) => {

    await client.request({method: "clique_discard", params: [e]});
    var i = addressToDiscardArray.indexOf(e);
    if(i > -1){
      addressToDiscardArray.splice(i, 1);
      descriptionToDiscardArray.splice(i, 1);
    }
    console.log("You just discard: " + e);
    setAddressToDiscard([]);
  };

  const checkProposals = async (e) => {
    const result = await client.request({method: "clique_proposals", params: []});
    for (let i=0; i<result.length; i++){
      addressToDiscardArray[i] = result[i];
    };
    console.log("Address already voted: " + addressToDiscardArray);
  };

  // method for render information about current signers

  function getInfo() {
    getSigners();
    var info = document.getElementById("info");
    console.log(info.style.display)
    if(info.style.display === "" ) {
      info.style.display = "block";
    } else {
      info.style.display = "";
    }
  };

  return (
    <div className="App">
      <div className="App-body">
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
          </div>
          <div className="info">
            <div id="info">
              {signers.map((value, i) => {
                return <li value={signers[i]}>{value}</li>
              })}
              <br />
              <div id="howMany">
              Right now there are {signers.length} signers.
              </div>
            </div>
          </div>
          <footer className="infoMenu">
            <Navbar collapseOnSelect expand="lg" bg="dark" variant="dark">
              <Navbar.Toggle aria-controls="responsive-navbar-nav" />
              <Navbar.Collapse id="responsive-navbar-nav">
                <Nav className="mr-auto">
                  <MenuItem onClick = {getInfo}> Current Signer </MenuItem>
                </Nav>
              </Navbar.Collapse>
            </Navbar>
          </footer> 
    </div>  
  );
}

export default App;