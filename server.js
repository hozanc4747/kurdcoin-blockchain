const express = require("express");
const bodyParser = require("body-parser");
const CryptoJS = require("crypto-js");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());

class Block {
    constructor(index, previousHash, transactions, tokens, timestamp = Date.now()) {
        this.index = index;
        this.previousHash = previousHash;
        this.transactions = transactions;
        this.tokens = tokens;
        this.timestamp = timestamp;
        this.nonce = 0;
        this.hash = this.calculateHash();
    }

    calculateHash() {
        return CryptoJS.SHA256(this.index + this.previousHash + this.timestamp + JSON.stringify(this.transactions) + JSON.stringify(this.tokens) + this.nonce).toString();
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
        this.tokens = {};
    }

    createGenesisBlock() {
        return new Block(0, "0", [], {});
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    minePendingTransactions(minerAddress) {
        if (this.pendingTransactions.length === 0) {
            return { error: "🚫 لا توجد معاملات جديدة للتعدين!" };
        }

        let rewardTransaction = { sender: "System", receiver: minerAddress, amount: 100 };
        this.pendingTransactions.push(rewardTransaction);

        let block = new Block(this.chain.length, this.getLatestBlock().hash, this.pendingTransactions, this.tokens);
        block.mineBlock(this.difficulty);
        this.chain.push(block);

        this.pendingTransactions = [];
        return { message: "⛏️ Block mined successfully!" };
    }

    addTransaction(transaction) {
        if (!transaction.sender || !transaction.receiver || transaction.amount <= 0) {
            throw new Error("❌ معاملة غير صالحة!");
        }
        this.pendingTransactions.push(transaction);
    }

    createToken(name, supply) {
        if (this.tokens[name]) {
            return { error: "❌ العملة موجودة بالفعل!" };
        }
        this.tokens[name] = { totalSupply: supply, balances: {} };
        return { message: `✅ تم إنشاء عملة ${name} بنجاح!` };
    }

    transferToken(sender, receiver, amount, tokenName) {
        if (!this.tokens[tokenName]) {
            return { error: "❌ العملة غير موجودة!" };
        }
        if (!this.tokens[tokenName].balances[sender] || this.tokens[tokenName].balances[sender] < amount) {
            return { error: "❌ رصيد غير كافٍ!" };
        }

        this.tokens[tokenName].balances[sender] -= amount;
        if (!this.tokens[tokenName].balances[receiver]) {
            this.tokens[tokenName].balances[receiver] = 0;
        }
        this.tokens[tokenName].balances[receiver] += amount;
        return { message: `✅ تم تحويل ${amount} من ${tokenName} بنجاح!` };
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
        res.json({ message: "✅ تمت إضافة المعاملة بنجاح!" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get("/api/mine", (req, res) => {
    res.json(blockchain.minePendingTransactions("ServerMiner"));
});

app.post("/api/create-token", (req, res) => {
    const { name, supply } = req.body;
    res.json(blockchain.createToken(name, supply));
});

app.post("/api/transfer-token", (req, res) => {
    const { sender, receiver, amount, tokenName } = req.body;
    res.json(blockchain.transferToken(sender, receiver, amount, tokenName));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 KURDCOIN Blockchain API يعمل على المنفذ ${PORT}`);
});
