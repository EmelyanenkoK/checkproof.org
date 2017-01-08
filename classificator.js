// This function should determ which type of protocol user use

var classificator = function(){
    receipt = checker_state["receipt"]
    write_to_console("Trying to classificate receipt");
    try {
      receipt = JSON.parse(receipt);
    }
    catch(err) {
      write_to_console("Unknown receipt format", "error");
    }
    if(receipt["v"] && receipt["data"] && receipt["merkleProof"]) {
        write_to_console("Blockreceipt detected");
        blockreceipt_wrapper();
    }
    if(receipt["ots1"] && receipt["txHash"] && receipt["merkle"]) {
        write_to_console("EternityWall detected");
        eternitywall_wrapper();
    }
    if(receipt["@context"] && receipt["type"] && receipt["type"].slice(0,10)=="Chainpoint") {
        write_to_console("Chainpoint detected");
        chainpoint_wrapper();
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
