//Global variable which store receipt and file(file hash)
var checker_state = {};

var checker_state_on_change = function() {
  if (checker_state["file"] && checker_state["receipt"])
    document.getElementById("verify-button").className="btn btn-success";
  else
    document.getElementById("verify-button").className="btn btn-disabled";
}



var update_progressbar = function(percent) {
    var p100 = ((percent * 100).toFixed(0));
    if ($("#progressbar-placeholder").html().length==0) { $("#progressbar-placeholder").append("<progress max='100' value='0'>Hash progress</progress>")}
    $("#progressbar-placeholder progress").attr("value", p100);
  };
var reset_progressbar = function(percent) {
    $("#progressbar-placeholder").empty();
  };

// _____________________________________________________________________________________
// _________________________________   Dropzones   _____________________________________
// _____________________________________________________________________________________
pt = '\
                        <div id="dz-template">\
                              <div>\
                                <span class="preview"><img data-dz-thumbnail /></span>\
                              </div>\
                              <p class="name" data-dz-name></p>\
                              <button data-dz-remove> <span>Delete</span> </button>\
                        </div>\
'

Dropzone.options.forFile = {
  autoProcessQueue: false,
  uploadMultiple: false,
  createImageThumbnails: true,
  maxFiles:1,
  previewsContainer: "#dropzonePreview",
  previewTemplate: pt,
  thumbnailWidth:'70',
  thumbnailHeight:'70',
  init: function() { 
     this.on("addedfile", function(file) {
       var reader = new FileReader();
       reader.onload = function(e) {
        // We cant immidiately hash file, because for some protocols method of hashing depends on receipt
        //hash=CryptoJS.SHA256(e.target.result, update_progressbar, process_hash_of_file);
        checker_state["file"] = e.target.result;
        checker_state_on_change();
       }     
       //this.removeFile(file)
       reader.readAsBinaryString(file);    
     });  
     this.on("removedfile", function(file) {
          checker_state["file"]=null;
        checker_state_on_change();
     });
     this.on("maxfilesexceeded", function(file) {
            this.removeAllFiles();
            this.addFile(file);
     });
  },
};

Dropzone.options.forReceipt = {
  autoProcessQueue: false,
  uploadMultiple: false,
  previewsContainer: "#dropzonePreview2",
  previewTemplate: pt,
  maxFiles:1,
  init: function() { 
     this.on("addedfile", function(file) {


       var reader = new FileReader();
       reader.onload = function(e) {
        //process_receipt(JSON.parse(e))
        checker_state["receipt"] = e.target.result;
        checker_state_on_change();
       }     
       //this.removeFile(file)
       reader.readAsBinaryString(file);    
     });  
     this.on("removedfile", function(file) {
          checker_state["receipt"]=null;
        checker_state_on_change();
     });
     this.on("maxfilesexceeded", function(file) {
            this.removeAllFiles();
            this.addFile(file);
     });
  },
};

var textarea_change = function(){
  checker_state["receipt"]= document.getElementById("jsonstamp").value;
  checker_state_on_change();
}
// Receipt area
$(window).on('load', function() {
	var area = document.getElementById("jsonstamp");
	if (area.addEventListener) {
	  area.addEventListener('input', textarea_change, false);
	} else if (area.attachEvent) {
	  area.attachEvent('onpropertychange', textarea_change);
	}
})

// _____________________________________________________________________________________

// _____________________________________________________________________________________

var write_to_console = function(text, type){
  console_area = document.getElementById("console");
  switch(type){
  case "success":
     console_area.innerHTML+="</br>"+'<font color="green">'+text+'</font>';
     break;
  case "error":
     console_area.innerHTML+="</br>"+'<font color="red">'+text+'</font>';
     break;
  default:
    console_area.innerHTML+="</br>"+text;  
  }
}

var clear_console = function() {
  console_area = document.getElementById("console");
  console_area.innerHTML = "Check debug:"
}

