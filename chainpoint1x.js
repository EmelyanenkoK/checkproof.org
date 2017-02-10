function chainpoint1x_verify(receipt, hash) {

    /*
     * Check that document target hash and receipt target hash match
     */

    var receiptMatchHash;
    if (receipt.target.target_hash == hash) {
        write_to_console("Document hash matches the one targeted by the receipt");
        receiptMatchHash = true;
    } else {
        write_to_console("Document hash DOES NOT MATCH the one targeted by the receipt", "error");
        receiptMatchHash = false;
    }

    /*
     * Check that the Merkle proof is valid
     */

    var merkleRoot;
    var validMerkleProof = false;

    // If there is no Merkle proof, the Merkle root must be the target hash
    if (receipt.target.target_proof.length == 0) {
        merkleRoot = receipt.target.target_hash;
    }

    // If there is a Merkle proof, compute the Merkle root from the target hash and the Merkle proof
    else {

        // Start from target hash
        var target = receipt.target.target_hash;

        // For all branches of the Merkle proof
        for (var i = 0; i < receipt.target.target_proof.length; i++) {

            // Check that the branch contains the target hash or the previous branch's parent
            var branch = receipt.target.target_proof[i];
            if (branch.left !== target && branch.right !== target) {
                write_to_console("A Merkle branch doesn't contain the target hash or the previous branch's parent", "error");
                validMerkleProof = false;
                break;
            }

            // Check that the parent is the SHA256(left + right)
            var parent = CryptoJS.SHA256(branch.left + branch.right).toString(CryptoJS.enc.Hex);
            if (branch.parent !== parent) {
                write_to_console("A Merkle branch parent is not SHA256(left + right)", "error");
                validMerkleProof = false;
                break;

            }

            // Current branch parent is the target of the next branch
            target = parent;
        }

        // Last branch parent must be the Merkle root
        merkleRoot = target;
    }

    // Check that receipt's Merkle root matches the one computed
    if (merkleRoot != receipt.header.merkle_root) {
        write_to_console("Merkle root derived from hash and merkle proof DOES NOT MATCH the one in the receipt", "error");
        validMerkleProof = false;
    } else {
        write_to_console("Merkle root derived from hash and merkle proof matches the one in the receipt");
        validMerkleProof = true;
    }

    /*
     * Check that the targetted Bitcoin transaction contains the Merkle root
     */

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            var data = JSON.parse(xhr.responseText);
            var receiptMatchTx = false;
            for (var i = 0; i < data.vout.length; i++) {
                var current = data.vout[i];
                var hex = current.scriptPubKey.hex;
                if (hex.startsWith("6a")) { //is op_return
                    if (true) {
                        if (hex.substring(4) == receipt.header.merkle_root) {
                            write_to_console("Merkle root " + receipt.header.merkle_root + " matches the OP_RETURN of the Bitcoin transaction " + receipt.header.tx_id);
                            receiptMatchTx = true;
                            break;
                        }
                    }
                }
            }

            if (!receiptMatchTx) {
                write_to_console("Merkle root " + receipt.header.merkle_root + " DOES NOT MATCH what found in the Bitcoin transaction", "error");
            }

            if (receiptMatchHash && validMerkleProof && receiptMatchTx) {
                write_to_console("CONGRATULATIONS your documents and the receipt are valid", "success");
            } else {
                write_to_console("SORRY your documents and the receipt did not pass some checks", "error");
            }
        }
    };
    xhr.open('GET', 'https://insight.bitpay.com/api/tx/' + receipt.header.tx_id);
    xhr.send();
}


