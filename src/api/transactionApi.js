import { ethers, BigNumber } from 'ethers';
import { toast } from 'react-hot-toast';

window.BigNumber = BigNumber;
const RPC_ADDRESS = "https://bsc-dataseed1.binance.org";
global.provider = new ethers.providers.JsonRpcProvider(RPC_ADDRESS);

const parseAddress = (address) => {
    //40bytes long => 24bytes are filled with zeros
    return "0x" + address.substr(26);
}

const parsePrices = (data) => {
    data = data.replace("0x", "");
    let input = removeZeros(data.substr(0, 128));
    let output = removeZeros(data.substr(128));
    return [input, output];
}

const removeZeros = (data) => {
    return data.replace(/0{10,}/, "").replace(/0{10,}/, "");
}

const getTokensTransferred = async (hash) => {
    let transaction;
    try {
        transaction = await global.provider.getTransactionReceipt(hash);
        toast.success("Transaction loaded.");
    }
    catch {
        toast.error("Invalid transaction hash detected!");
        return {
            tokensTransferred: null,
            transactionFee: null,
            contract: null
        }
    }
    console.log(transaction)
    let transferred = [];
    for (let i = 0; i < transaction.logs.length; i++) {
        let log = transaction.logs[i];
        if (log.topics.length === 3) {
            transferred.push({
                sender: parseAddress(log.topics[1]),
                receiver: parseAddress(log.topics[2]),
                token: log.address,
                amount: BigNumber.from(log.data)
            });
        }
        else {
            i++;
        }
    }
    let transactionFee = transaction.gasUsed.mul(transaction.effectiveGasPrice);
    let contract = transaction.to.toLowerCase();
    return {
        tokensTransferred: transferred,
        transactionFee,
        contract
    }
}

const getSwaps = async (hash) => {
    const transaction = await global.provider.getTransactionReceipt(hash);
    console.log(transaction);
    let swaps = [];
    for (let i = 0; i < transaction.logs.length; i++) {
        if (transaction.logs[i].topics.length === 1) {
            let log = transaction.logs[i + 1];
            swaps.push([parseAddress(log.topics[1]), parseAddress(log.topics[2]), parsePrices(log.data)]);
            i++;
        }
    }
    return swaps;
}

export { getTokensTransferred, getSwaps };