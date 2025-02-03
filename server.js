const express = require("express");
const bodyParser = require("body-parser");
const CryptoJS = require("crypto-js");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());

class Block {
    constructor(index, previousHash, transactions, timestamp = Date.now()) {
        this.index = index;
        this.previousHash = previousHash;
        this.transactions = transactions;
        this.timestamp = timestamp;
        this.nonce = 0;
        this.hash = this.calculateHash();
    }

    calculateHash() {
        return CryptoJS.SHA256(this.index + this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce).toString();
    }

    mineBlock(difficulty) {
        let target = Array(difficulty + 1).join("0");
        while (!this.hash.startsWith(target)) {
            this.nonce++;
            this.hash = this.calculateHash();
        }
        console.log("✅ Block Mined:", this.hash);
    }
}

class Blockchain {
    constructor(difficulty = 2) {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = difficulty;
        this.pendingTransactions = [];
    }

    createGenesisBlock() {
        return new Block(0, "0", "Genesis Block");
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    minePendingTransactions(minerAddress) {
        let rewardTransaction = { sender: "System", receiver: minerAddress, amount: 100 };
        this.pendingTransactions.push(rewardTransaction);
        let block = new Block(this.chain.length, this.getLatestBlock().hash, this.pendingTransactions);
        block.mineBlock(this.difficulty);
        this.chain.push(block);
        this.pendingTransactions = [];
    }

    addTransaction(transaction) {
        if (!transaction.sender || !transaction.receiver || transaction.amount <= 0) {
            throw new Error("❌ Invalid Transaction!");
        }
        this.pendingTransactions.push(transaction);
    }

    getChain() {
        return this.chain;
    }
}

const blockchain = new Blockchain();

app.get("/api/chain", (req, res) => {
    res.json(blockchain.getChain());
});

app.post("/api/transaction", (req, res) => {
    try {
        blockchain.addTransaction(req.body);
        res.json({ message: "✅ Transaction added successfully!" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get("/api/mine", (req, res) => {
    blockchain.minePendingTransactions("ServerMiner");
    res.json({ message: "⛏️ Block mined successfully!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 KURDCOIN Blockchain API is running on port ${PORT}`);
});
