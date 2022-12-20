import { ethers, BigNumber } from 'ethers';
import { toast } from 'react-hot-toast';

window.BigNumber = BigNumber;
const RPC_ADDRESS = "https://bsc-dataseed1.binance.org";
const tokenAbi = [
	{ "inputs": [], "name": "symbol", "outputs": [{ "name": "", "type": "string" }], "payable": false, "stateMutability": "view", "type": "function" }
];

global.provider = new ethers.providers.JsonRpcProvider(RPC_ADDRESS);

const parseAddress = (address) => {
	//40bytes long => 24bytes are filled with zeros
	return "0x" + address.substr(26);
}

const getTokenSymbol = async (address) => {
	const tokenContract = new ethers.Contract(address, tokenAbi, global.provider);
	return await tokenContract.symbol();
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

const filterTransaction = (transferred) => {
	let senders = transferred.map(transfer => transfer.sender);
	return transferred.filter(transfer => {
		if (senders.indexOf(transfer.receiver) !== -1) return true;
		else return false;
	});
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
	let transferred = [];
	for (let i = 0; i < transaction.logs.length; i++) {
		let log = transaction.logs[i];
		if (log.topics.length === 3) {
			try {
			var symbol = await getTokenSymbol(log.address);
			} catch {
				continue;
			}
			transferred.push({
				sender: parseAddress(log.topics[1]),
				receiver: parseAddress(log.topics[2]),
				token: log.address,
				amount: BigNumber.from(log.data),
				symbol: symbol
			});
			let nextLog = transaction.logs[i + 1];
			if (nextLog && log.topics[1] === nextLog.topics[1] && log.topics[2] === nextLog.topics[2]) i++;
		}
		if (log.topics.length === 1) i++;
	}
	transferred = filterTransaction(transferred);
	console.log(transferred);
	let gasUsed = transaction.gasUsed;
	let gasPrice = transaction.effectiveGasPrice;
	let contract = transaction.to.toLowerCase();
	return {
		tokensTransferred: transferred,
		gasUsed,
		gasPrice,
		contract
	}
}

const getSwaps = async (hash) => {
	const transaction = await global.provider.getTransactionReceipt(hash);
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