//modified antelle.github.io/argon2-browser/
var moduleEl = null;
var listener = null;
var results = [];
var argon_enabled = !(!navigator.mimeTypes['application/x-pnacl']);

window.onload = function() {
    moduleEl = document.createElement('embed');
    moduleEl.setAttribute('name', 'argon2');
    moduleEl.setAttribute('id', 'pnacl-argon2');
    moduleEl.setAttribute('width', '0');
    moduleEl.setAttribute('height', '0');
    moduleEl.setAttribute('src', 'argon2.nmf');
    moduleEl.setAttribute('type', 'application/x-pnacl');
    listener = document.getElementById('pnaclListener');

    listener.addEventListener('error', function() { console.log('Error'); }, true);
    listener.addEventListener('crash', function() { console.log('Crash'); }, true);

    listener.appendChild(moduleEl);
    moduleEl.offsetTop; // required by PNaCl

};

//Example
var test_mass={
        pass: 'password',
        salt: 'somesalt',
        time: 1,
        mem: 1024,
        hashLen: 32,
        parallelism: 1,
        type: 1
    };


function addEventListenerOnce(target, type, listener) {
    target.addEventListener(type, function fn(event) {
        target.removeEventListener(type, fn);
        listener(event);
    },
    true);
}



var argon2_pnacl = function (mass, callback) {

  if (!navigator.mimeTypes['application/x-pnacl']) {
        return console.log('PNaCl is not supported by your browser'); //TODO Make pop-up
  }
  if(callback==null) {callback = function(){}}
  startTime = Date.now()  
  moduleEl.postMessage(mass);
  listener.addEventListener('message', function(e) {
        console.log("Result: ", e);
        var encoded = e.data.encoded;
        var hash = e.data.hash;
        if (e.data.res) {
            console.log('Error: ' + e.data.res + ': ' + e.data.error);
        } else {
            console.log('Encoded: ' + encoded);
            console.log('Hash: ' + hash);
            console.log('Elapsed: ' + (Date.now() - startTime) + 'ms');
            callback(e.data)
        }
    }, true);
}

// removeEventListener doesn't work, I don't know why.
// We are using dirty hack: keep list of already worked listeners
list_used_listeners = {};

var argon2_verify_pnacl = function (mass, callback) {

  if (!navigator.mimeTypes['application/x-pnacl']) {
        return console.log('PNaCl is not supported by your browser'); //TODO Make pop-up
  }
  //listener = $('pnaclListener');
  if(callback==null) {callback = function(){}}
  startTime = Date.now()  
  moduleEl.postMessage(mass);
  function response_action(unique_tag,e) {
        if(list_used_listeners[unique_tag])
            return;
        list_used_listeners[unique_tag]=true;
        console.log("Result: ", e);
        var encoded = e.data.encoded;
        var hash = e.data.hash;
        if (!e.data.res) {
            console.log('Error: ' + e.data.res + ': ' + e.data.error + ' '+ e.data.message);
        }
            callback(e.data);
        
        //listener.outerHTML=listener.outerHTML;//.removeEventListener("message", response_action);
   }
  //listener.addEventListener("message", response_action, true);
  var d = new Date();
  var n = d.getTime();
  addEventListenerOnce(listener, 'message', response_action.bind(null, n));
  //listener.one('message', response_action);
}

function base64toHEX(base64) {
  var raw = atob(base64);
  var HEX = '';
  for ( i = 0; i < raw.length; i++ ) {
    var _hex = raw.charCodeAt(i).toString(16)
    HEX += (_hex.length==2?_hex:'0'+_hex);
  }
  return HEX.toUpperCase();
}


function b64_to_utf8(str) {
    return decodeURIComponent(escape(window.atob(str)));
}


// hash - string which we want to hash, `password` for example
// encodedString - argon2 string like $argon2i$v=19$m=1024,t=1,p=1$c29tZXNhbHQ$lUZsxPkvh0lUYX7sCqEZXSKYCr1iXlysRHY646nLarc
var argon2_verify = function(password, encodedString, callback) {

  elements = encodedString.split('$');
  if (elements[1]=='argon2d')
    { type=0; }
  if (elements[1]=='argon2i')
    { type=1; }
  argon_mass = { 'method': 'argon2_verify','type': type, 'encodedString': encodedString, 'pass': password, hashLen: 32};
  var enhanced_callback = function(data)
     {
       callback(data.res, base64toHEX(elements[elements.length-1]));
     }
  argon2_verify_pnacl(argon_mass, enhanced_callback);
}


