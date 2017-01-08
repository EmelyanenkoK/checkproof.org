//Copied with little changes from https://github.com/RCasatta/independent-notarization-verifier/blob/gh-pages/script.js
//All rights belong to Riccardo Casatta

function chainpoint_verify(stamp, hash) {
  //https://insight.bitpay.com/api/tx/58d560400c7eb74ac2a3800951ae31713c3d190140216a2f2b6bcde8093f936a
  var stampAndDocumentMatchCheck;
  if( stamp.targetHash == hash ) {
    write_to_console("Document hash matches the one in the receipt");
    stampAndDocumentMatchCheck=true;
  } else {
    write_to_console("Document DOES NOT MATCH the one which the receipt refer to", "error");
    stampAndDocumentMatchCheck=false;
    return;
  }

  var siblingsMatchCheck;
  var siblings=stamp.proof;
  var current=stamp.targetHash;
  console.log(siblings);

  for(var i=0;i<siblings.length;i++) {
    var s=siblings[i];
    left = "left" in s;
    sibling = s["left"] || s["right"] 
    sibling = CryptoJS.enc.Hex.parse(sibling);
    current = CryptoJS.enc.Hex.parse(current);
    var toHash;
    if(left) {
      toHash=sibling+current;
    } else {
      toHash=current+sibling;
    }
    //console.log(sibling, left);
    var toHashBin = CryptoJS.enc.Hex.parse(toHash);
    current = CryptoJS.SHA256( toHashBin ).toString(CryptoJS.enc.Hex);
  }
  console.log(current); 
  var root= current;
  console.log("root=" + root);

  if(root==stamp.merkleRoot) {
    write_to_console("Merkle root derived from hash and merkle proof matches the one in the receipt");
    siblingsMatchCheck=true;
  } else {
    write_to_console("Merkle root derived from hash and merkle proof DOES NOT MATCH the one in the receipt","error");
    siblingsMatchCheck=false;
  }

  //CryptoJS.SHA256();


    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        console.log( xhr.responseText );
        var data = JSON.parse(xhr.responseText);

        var timeMatchCheck=true;
        /*if(data.blocktime == stamp.timestamp){
          write_to_console("Timestamp from the block matches the one in the stamp " + new Date(stamp.timestamp*1000));
          timeMatchCheck=true;
        } else {
          write_to_console("Timestamp from the block " + new Date(data.blocktime*1000) + " DOES NOT MATCH the one in the stamp " + new Date(stamp.timestamp*1000), "false");
          timeMatchCheck=false;
        }*/

        var rootMatchCheck=false;
        
        for(var i=0;i<data.vout.length;i++) {
          var current = data.vout[i];
          var hex = current.scriptPubKey.hex ;
          if(hex.startsWith("6a")) { //is op_return
            if(true ) {  //is EWC || XEW
              if(hex.substring(4) == stamp.merkleRoot ) {
                write_to_console("Merkle root " + stamp.merkleRoot + " matches what found in the bitcoin transaction " + stamp.anchors[0].sourceId);
                rootMatchCheck=true;
                break;
              }
            }
          }
        }
        if(!rootMatchCheck) {
          write_to_console("Merkle root " +stamp.merkleRoot + " DOES NOT MATCH what found in the bitcoin transaction", "error");
        }

        var finalCheck=document.getElementById('finalCheck');
        if( stampAndDocumentMatchCheck && siblingsMatchCheck && timeMatchCheck && rootMatchCheck) {
          write_to_console("CONGRATULATIONS your documents and the stamp are valid","success");

          
            setTimeout( clear_console, 8*1000); // clear console
            //clear files
            Dropzone.forElement("#for-file").removeAllFiles();
            Dropzone.forElement("#for-receipt").removeAllFiles();
            document.getElementById("jsonstamp").value= "";
        } else {
          write_to_console("SORRY your documents and the receipt did not pass some checks", "error");

        }
      }
    };
    xhr.open('GET', 'https://insight.bitpay.com/api/tx/' + stamp.anchors[0].sourceId);
    xhr.send();
}


