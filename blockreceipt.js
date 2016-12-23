
var is_dictionary = function (obj) {
    if(!obj) return false;
    if(Array.isArray(obj)) return false;
    if(obj.constructor != Object) return false;
    return true;
};


var blockreceipt_formal_check = function(receipt, dochash, status_update, final_callback) {
  var correct=true;
  status_update("Cheking presence of mandatory fields");
  if(!("v" in receipt)) { final_callback({'success':false, 'error': 'Cant find version in receipt'}); return;}
  if(!("data" in receipt)) { final_callback({'success':false, 'error': 'Cant find data in receipt'}); return;}
  if(!Array.isArray(receipt["data"])) { final_callback({'success':false, 'error': 'data isn`t array'}); return;}
  if(!("merkleProof" in receipt)) { final_callback({'success':false, 'error': 'Cant find merkleProof in receipt'}); return;}
  if(!Array.isArray(receipt["merkleProof"])) { final_callback({'success':false, 'error': 'MerkleProof isn`t array'}); return;}
  if(!("BTC-tx" in receipt) && !("ETH-tx" in receipt)) { final_callback({'success':false, 'error': 'Cant find bitcoin or ethereum transaction in receipt'}); return;}  

  if(!(receipt["v"]=="1")) { final_callback({'success':false, 'error': 'Unknown version of receipt'}); return;}
  if(receipt["data"][0] && !(receipt["data"][0]==dochash) ) {final_callback({'success':false, 'error': 'Hash in receipt doesn`t correspond to our document hash'}); return;}

  fullData=receipt["data"];
  fullData[0]=dochash;
  to_hash = JSON.stringify(fullData); //TODO make stable stringify

  var after_hashing_callback = function(preparedHash) {
     preparedHash=preparedHash.toString();
     if(receipt["merkleProof"].length)
         {
             leaf = receipt["merkleProof"].shift();
             leaf = new BigNumber(leaf, 16);
             ph = new BigNumber(preparedHash,16);
             sm=ph.plus(leaf)
             sm=sm.toString(16);
             CryptoJS_.SHA256(sm, function(){"progress shower"}, after_hashing_callback);
             
         }
     else 
         {
           if( ("merkleRoot" in receipt) && receipt["merkleRoot"]!=preparedHash) {
               console.log(preparedHash);
               final_callback({'success':false, 'error': 'MerkleRoot in receipt doesn`t coinside with calculated merkle root'});
               return;
           }
           status_update("Checking blockchain transaction");
           check_anchoring(preparedHash, receipt, final_callback);
         } 
  }
  var after_argon2_hashing_callback = function(result, hash){
     if(!result) { final_callback({'success':false, 'error': 'Salt in receipt doesn`t corresponds to document hash'}); return;}
     after_hashing_callback(hash)
  }


  status_update("Building merkle tree");
  if(receipt["salt"]) //argon
    {
        if(!argon_enabled){
           write_to_console("Sorry, this proof uses Argon2 hashing. Currently it works only in Google Chrome", "error");
           return;
        }
        argon2_verify(to_hash, receipt["salt"], after_argon2_hashing_callback)
    }
  else //sha
    {
       CryptoJS_.SHA256(to_hash, function(){"progress shower"}, after_hashing_callback);
    }

}


var check_anchoring = function(merkleRoot, receipt, callback) {
    if(!("BTC-tx" in receipt))
        callback({'success':false, 'error': 'Current version of checker cheks only btc-anchored receipts'});
    var extended_callback = function(success, result, time){
      if(!success){
        callback({'success':false, 'error': result});
        return;
      }
      if(!(result==merkleRoot)){
        callback({'success':false, 'error': 'Hash in tx doesn`t coresspond to merkleRoot'});
        return;
      } 
      callback({'success':true, 'anchorTime': time});
      return;
    }

    OP_ReturnBlockexplorerCom(receipt["BTC-tx"], extended_callback);
    //TODO make double check logic with blocr.io
}

function httpGetAsync(theUrl, callback)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4)
          callback(xmlHttp);
    }
    
    xmlHttp.open("GET", theUrl, true); // true for asynchronous
    xmlHttp.send(null);
}

function OP_ReturnBlockexplorerCom(txid, callback) {
  url="https://blockexplorer.com/api/tx/"+txid
  var extended_callback = function(xhr) {
    if(xhr.status==400){
      callback(false, "Bad txid");
      return;
    }    
    if(xhr.status==404){
      callback(false, "Cant find transaction");
      return;
    }
    if(!(xhr.status==200)){
      callback(false, "Unknown error");
      console.log(xhr)
      return;
    }
    o= JSON.parse(xhr.responseText);
    if(o.vout.length && o.vout[0].scriptPubKey && o.vout[0].value==0 && o.vout[0].scriptPubKey.hex && o.vout[0].scriptPubKey.hex.slice(0,2)=="6a")
      {
        l=o.vout[0].scriptPubKey.hex.length;
        callback(true, o.vout[0].scriptPubKey.hex.slice(l-64,l), o.time);
        return;
      }
    else {
      callback(false, "Not OP_Return transaction");
      return;
    }   
    
  }
  httpGetAsync(url, extended_callback);
}

function OP_ReturnBlockrIO(txid, callback) {
  url="https://btc.blockr.io/api/v1/tx/raw/"+txid
  var extended_callback = function(xhr) {
    if(xhr.status==400){
      callback(false, "Empty txid");
      return;
    }    
    if(xhr.status==404){
      callback(false, "Cant find transaction");
      return;
    }
    if(!(xhr.status==200)){
      callback(false, "Unknown error");
      console.log(xhr)
      return;
    }
    o= JSON.parse(xhr.responseText);
    o=o.data.tx
    if(o.vout.length && o.vout[0].scriptPubKey && o.vout[0].value==0 && o.vout[0].scriptPubKey.hex && o.vout[0].scriptPubKey.hex.slice(0,2)=="6a")
      {
        l=o.vout[0].scriptPubKey.hex.length;
        callback(true, o.vout[0].scriptPubKey.hex.slice(l-64,l));
        return;
      }
    else {
      callback(false, "Not OP_Return transaction");
      return;
    }   
    
  }
  httpGetAsync(url, extended_callback);
}
