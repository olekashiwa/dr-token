const path = require('path');
const fs = require('fs');


const DRTCoin = require('./build/DRTCoin.json');
const Web3 = require('web3');

// LOAD PARAMETERS --------------------------------
const ETHNODE_FILEPATH = path.resolve(__dirname) + '/PARAMS/ethereum_node.txt'
const PWD_FILEPATH = path.resolve(__dirname) + '/PARAMS/owner_pwd.txt'
const ACCOUNTSAMOUNTS_FILEPATH = path.resolve(__dirname) + '/OUTPUTS/generated_input_accounts_amounts.txt'
const CONTRACTADDRESS_FILEPATH = path.resolve(__dirname) + '/OUTPUTS/smart-contract-address.txt'

// set parameters -------------------------------------------------
var urlEthereumNode = require('fs').readFileSync(ETHNODE_FILEPATH, 'utf-8')
var ownerPassword = require('fs').readFileSync(PWD_FILEPATH, 'utf-8')
var contractAddress = require('fs').readFileSync(CONTRACTADDRESS_FILEPATH, 'utf-8')
console.log('urlEthereumNode = ' + urlEthereumNode)
console.log('ownerPwd = ' + ownerPassword)
console.log('filePathAccountsAmounts = ' + ACCOUNTSAMOUNTS_FILEPATH)
console.log('contractAddress = ' + contractAddress)

let web3 = new Web3(new Web3.providers.HttpProvider(urlEthereumNode))
console.log('Web3 OK')


var drtCcontract = web3.eth.contract(DRTCoin.abi).at(contractAddress);

web3.personal.unlockAccount(web3.eth.accounts[0], ownerPassword)
console.log('unlockAccount OK')
web3.eth.defaultAccount = web3.eth.accounts[0];


drtCcontract.getAddressBalance(web3.eth.accounts[0], function(error, result){
        if (!error) {
            console.log("OWNER: getAddressBalance worked : " + result);          
        } else {
            console.log(error);
        }
});
console.log('')

//var vaddr = []
//var vamounts = []
//var viced = []
var lines = require('fs').readFileSync(ACCOUNTSAMOUNTS_FILEPATH, 'utf-8')
    .split('\n');

    

var dict = [];
var dictIced = [];

var vmatchOK = []
var vmatchErr = []
var totalAssigned = parseInt(0)
var multDecimals = 100000000

for (var i=0; i<lines.length; i++) {
  var vv = lines[i].split(",");
  if(vv.length == 3){   
    var userAddress = vv[0];
    var userAmount = parseInt(vv[1])* multDecimals; // decimals = 8
    var isIced = parseInt(vv[2]) == 0;

//console.log(userAddress  + "isIced = " + isIced )

    if(isIced == false){
        dict[userAddress] = userAmount;
        drtCcontract.getAddressAndBalance(userAddress, function(error, result){
            if (!error) {

                retAddress = result[0];
                retAmount = parseInt(result[1]);

                console.log("getAddressBalance called : " + retAmount + " tokens found for " + userAddress+ " ----  good = " + parseInt(dict[retAddress])); 

                if( retAmount === parseInt(dict[retAddress]) ){
                    totalAssigned +=retAmount
                    var strOk = retAddress + "  -  AMOUNT MATCHING OK = " + retAmount + " ->  numTokensAssigned = " + totalAssigned;                    
                    vmatchOK.push(strOk)
                }else{
                    var strErr = "!!!!  INVESTOR INVESTOR ERROR ERROR ERROR:  " + retAddress + "  -  amount MISMATCH ERROR = " + retAmount;
                    console.log(strErr)
                    vmatchErr.push(strErr)
                }
            } else {
                console.log(error);
            }
        });
    } 
    else
    {
        dictIced[userAddress] = userAmount;
        drtCcontract.getIcedInfos(userAddress, function(error, result){
            if (!error) {
                icedAddr = result[0];
		balance = parseInt(result[1]);
                frosted = parseInt(result[2]);
                defrosted = parseInt(result[3]);
		balanceAttendue = parseInt(dictIced[icedAddr]) * 20 / 100

		//console.log("dictIced[icedAddr] = " + parseInt(dictIced[icedAddr]))
                console.log("getIcedInfos called => balanceAttendue: " + balanceAttendue + " - balance: " + balance + ", frosted: " + frosted + ", defrosted: " + defrosted); 
		
                if( balance === balanceAttendue ){
                    totalAssigned +=((frosted + defrosted)*multDecimals)
                    var strOk = icedAddr + "  -  AMOUNT MATCHING OK = " + balance + " ->  numTokensAssigned = " + totalAssigned;                    
                    vmatchOK.push(strOk)
                }else{
                    var strErr = "!!!!  ICED ICED ERROR ERROR ERROR:  " + userAddress+ "  - amount MISMATCH ERROR = " + balance + " attendue = " + balanceAttendue;
                    console.log(strErr)
                    vmatchErr.push(strErr)
                }
            } else {
                console.log(error);
            }
        });
    }
   
  }
}

const NUMTOKENSENT_FILEPATH = path.resolve(__dirname) + '/OUTPUTS/generated_number_of_tokens.txt'
var sentNumberOfToken = parseInt(require('fs').readFileSync(NUMTOKENSENT_FILEPATH, 'utf-8'))
sentNumberOfToken = sentNumberOfToken * multDecimals;

var cnt=0
var waitTimerID = setInterval(function() {
        if(cnt==0){console.log('')}
        if(totalAssigned === sentNumberOfToken){
            
            console.log('')
            console.log('CHECK OK : all tokens were correctly assigned')
            vmatchOK.forEach(function(item) {
                console.log(item);
            });
            console.log('')
            console.log('CHECK NUMBER of TOKEN OK: SENT = ' + sentNumberOfToken + ' - READ in blockchain = ' + totalAssigned );
            console.log('')
            console.log('END -----------------------------------------------')
            clearInterval(waitTimerID)
        }else{
            console.log('check in progress please wait... => ' + totalAssigned + ' of '+ sentNumberOfToken);
        }        
        cnt++;
}, 2000);


