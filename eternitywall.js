//Copied with little changes from https://github.com/RCasatta/independent-notarization-verifier/blob/gh-pages/script.js
//All rights belong to Riccardo Casatta

function eternitywall_verify(stamp, hash) {
  //https://insight.bitpay.com/api/tx/58d560400c7eb74ac2a3800951ae31713c3d190140216a2f2b6bcde8093f936a
  var stampAndDocumentMatchCheck;
  if( stamp.merkle.hash == hash ) {
    write_to_console("Document hash matches the one in the stamp");
    stampAndDocumentMatchCheck=true;
  } else {
    write_to_console("Document DOES NOT MATCH the one which the stamp refer to", "error");
    stampAndDocumentMatchCheck=false;
    return;
  }

  var siblingsMatchCheck;
  var merkle=stamp.merkle;
  var index=merkle.index;
  var siblings=merkle.siblings;
    var current=merkle.hash;
  console.log(siblings);

  for(var i=0;i<siblings.length;i++) {
    var s=siblings[i];
    var toHash;
    if(index%2==0) {
      toHash=current+s;
    } else {
      toHash=s+current;
    }
    var toHashBin = CryptoJS.enc.Hex.parse(toHash);
    current = CryptoJS.SHA256( CryptoJS.SHA256(toHashBin) ).toString(CryptoJS.enc.Hex);
    index=index>>1;
  }
  var root= current.match(/.{1,2}/g).reverse().join("");
  console.log("root=" + root);

  if(root==merkle.root) {
    write_to_console("Merkle root derived from hash and siblings matches the one in the stamp");
    siblingsMatchCheck=true;
  } else {
    write_to_console("Merkle root derived from hash and siblings DOES NOT MATCH the one in the stamp","error");
    siblingsMatchCheck=false;
  }

  //CryptoJS.SHA256();


    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        console.log( xhr.responseText );
        var data = JSON.parse(xhr.responseText);

        var timeMatchCheck=false;
        if(data.blocktime == stamp.timestamp){
          write_to_console("Timestamp from the block matches the one in the stamp " + new Date(stamp.timestamp*1000));
          timeMatchCheck=true;
        } else {
          write_to_console("Timestamp from the block " + new Date(data.blocktime*1000) + " DOES NOT MATCH the one in the stamp " + new Date(stamp.timestamp*1000), "false");
          timeMatchCheck=false;
        }

        var rootMatchCheck=false;
        
        for(var i=0;i<data.vout.length;i++) {
          var current = data.vout[i];
          var hex = current.scriptPubKey.hex ;
          if(hex.startsWith("6a")) { //is op_return
            if(hex.substring(4).startsWith("455743")  || hex.substring(4).startsWith("584557") ) {  //is EWC || XEW
              if(hex.substring(10) == stamp.merkle.root ) {
                write_to_console("Merkle root " + stamp.merkle.root + " matches what found in the bitcoin transaction " + stamp.txHash);
                rootMatchCheck=true;
                break;
              }
            }
          }
        }
        if(!rootMatchCheck) {
          write_to_console("Merkle root " + stamp.merkle.root + " DOES NOT MATCH what found in the bitcoin transaction", "false");
        }

        var finalCheck=document.getElementById('finalCheck');
        if( stampAndDocumentMatchCheck && siblingsMatchCheck && timeMatchCheck && rootMatchCheck) {
          write_to_console("CONGRATULATIONS your documents and the stamp are valid","success");

            setTimeout(function() { 
                  alert("Receipt proves file existence at " +date.toLocaleDateString()+" "+ date.toLocaleTimeString());
             }, 1);
           
            setTimeout( clear_console, 8*1000); // clear console
            //clear files
            Dropzone.forElement("#for-file").removeAllFiles();
            Dropzone.forElement("#for-receipt").removeAllFiles();
            document.getElementById("jsonstamp").value= "";
        } else {
          write_to_console("SORRY your documents and the stamp did not pass some checks", "error");

        }
      }
    };
    xhr.open('GET', 'https://insight.bitpay.com/api/tx/' + stamp.txHash);
    xhr.send();
}


