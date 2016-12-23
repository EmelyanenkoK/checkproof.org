# Portable proof of existence checker
Aim of this project is creating of portable checker of proofs of existence (timestamps, receipts) which use blockchains as basement. Feel free to contribute!

#Some details
##Console
There is 'debug console' on the page and js functions `write_to_console("message", null/'success'/'error')` and `clear_console()` to interact with it.
##Cryptography
This application uses 2 version of CryptoJS 3.1.2 library. First one vanila from `https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.2/*` declared as `CryptoJS` and second one modified by Manuel Araoz(allows to show progress of hashing) declared as `CryptoJS_`.
Source of Argon2 hashing library is https://github.com/antelle/argon2-browser, however only PNaCL implementation used, because all other implementations are too time-consuming. Problem with this decision, that library works only in Google Chrome
##Tabs and classificator
Not finished yet. Desired behaviour - on `General Checker` tab try to detect protocol and if failed try all of them, on 'specific' tab check only with specific method.
