// This function should determ which type of protocol user use

var classificator = function(){
    receipt = checker_state["receipt"]
    write_to_console("Trying to classificate receipt");
    try {
      receipt = JSON.parse(receipt);
    }
    catch(err) {
        write_to_console("Cant recognize receipt type, assume OTS", "error");
        ots_wrapper();
    }
    if(receipt["v"] && receipt["data"] && receipt["merkleProof"]) {
        write_to_console("Blockreceipt detected");
        blockreceipt_wrapper();
    } else if(receipt["ots1"] && receipt["txHash"] && receipt["merkle"]) {
        write_to_console("EternityWall detected");
        eternitywall_wrapper();
    } else if(receipt["@context"] && receipt["type"] && receipt["type"].slice(0,10)=="Chainpoint") {
        write_to_console("Chainpoint detected");
        chainpoint_wrapper();
    } else if(receipt.header["chainpoint_version"] && receipt.header["chainpoint_version"].slice(0,2)=="1.") {
        write_to_console("Chainpoint 1.x detected");
        chainpoint1x_wrapper();
    } else {
        write_to_console("Unknown receipt format", "error");
    }
}

var blockreceipt_wrapper = function(){
        receipt = checker_state["receipt"];
        receipt = JSON.parse(receipt);
        var result_processor = function(o){
          if(!o.success) {
            write_to_console(o.error, 'error');
            setTimeout(function() { 
                  alert("Checking failed: " +o.error);
             }, 1);
          }
          else {
                 var date = new Date();
                 date.setTime(o.anchorTime*1000);
            write_to_console("Receipt proves file existence at " +date.toLocaleDateString()+" "+ date.toLocaleTimeString(), 'success');
            setTimeout(function() { 
                  alert("Receipt proves file existence at " +date.toLocaleDateString()+" "+ date.toLocaleTimeString());
             }, 1);
           
            setTimeout( clear_console, 8*1000); // clear console
            //clear files
            Dropzone.forElement("#for-file").removeAllFiles();
            Dropzone.forElement("#for-receipt").removeAllFiles();
            document.getElementById("jsonstamp").value= "";
          }
        }
        var process_hash_of_file = function(hash){
          hash=hash.toString();
          reset_progressbar();
          blockreceipt_formal_check(receipt, hash, write_to_console, result_processor)
        }
        CryptoJS_.SHA256(checker_state["file"], update_progressbar, process_hash_of_file);
}

var eternitywall_wrapper = function(){
        receipt = checker_state["receipt"];
        receipt = JSON.parse(receipt);
        var process_hash_of_file = function(hash){
          hash=hash.toString();
          reset_progressbar();
           eternitywall_verify(receipt, hash);
        }
    CryptoJS_.SHA256(checker_state["file"], update_progressbar, process_hash_of_file);
}

var chainpoint_wrapper = function(){
        receipt = checker_state["receipt"];
        receipt = JSON.parse(receipt);
        var process_hash_of_file = function(hash){
          hash=hash.toString();
          reset_progressbar();
          chainpoint_verify(receipt, hash);
        }
    CryptoJS_.SHA256(checker_state["file"], update_progressbar, process_hash_of_file);
}

var chainpoint1x_wrapper = function(){
    receipt = checker_state["receipt"];
    receipt = JSON.parse(receipt);
    var process_hash_of_file = function(hash){
        hash=hash.toString();
        reset_progressbar();
        chainpoint1x_verify(receipt, hash);
    }
    CryptoJS_.SHA256(checker_state["file"], update_progressbar, process_hash_of_file);
}



//=========================================================
// Bunch of very ugly solutions, should be corrected asap


var errorStore = [];
var oldf = console.error;
console.error = function(){
   errorStore.push(arguments);
   oldf.apply(console, arguments);
}


const OpenTimestamps = require('javascript-opentimestamps');
hexToBytes = function (hex) {
  const bytes = [];
  for (let c = 0; c < hex.length; c += 2) {
    bytes.push(parseInt(hex.substr(c, 2), 16));
  }
  return bytes;
};

function OTSverify(ots, hash) {
	console.log('0%','Verify');
    // Check parameters
	const bytesOts = ots;
	const bytesHash = new Uint8Array(hexToBytes(hash));
	// OpenTimestamps command
	const verifyPromise = OpenTimestamps.verify(bytesOts, bytesHash, true);
	verifyPromise.then(result => {
		if (result === undefined) {
                        write_to_console('Pending or Bad attestation', 'error');
			//upgrade(ots, hash);
		} else {
                        write_to_console('Bitcoin attests data existed as of ' + (new Date(result * 1000)), 'success');
		}
	}
).catch(err => {
  for (let eI = 0; eI < errorStore.length; eI += 1) {
    write_to_console(errorStore[eI][0], 'error');
  }
})
;
}
var ots_wrapper = function(){
    errorStore = [];
    receipt = checker_state["receipt"];
    var process_hash_of_file = function(hash){
        hash=hash.toString();
        reset_progressbar();
        OTSverify(receipt, hash);
    }
    CryptoJS_.SHA256(checker_state["file"], update_progressbar, process_hash_of_file);
}
