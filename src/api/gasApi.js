import pancakeSwapAbi from '../abi/pair/pancakePairAbi.json';
import { BigNumber } from 'ethers';
import { ethers } from "ethers";
const Web3 = require('web3');
const web3 = new Web3("https://bsc-dataseed1.binance.org");
let tokenAbi = [
    { "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
];

const estimateGas = async (tokensTransferred) => {
    let totalGas = 0;
    const amountOutMin = 0;
    const WBNB_ = BigNumber.from("0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c"); //WBNB 
    const T_buy = BigNumber.from("0x36953b5ec00a13edceceb3af258d034913d2a79d"); //TOKEN BUY
    const My_Wallet__ = "0x3A7bf1305D0561b4E0363E6a262096c77C7CB5Db";
    const tokenContract = new web3.eth.Contract(pancakeSwapAbi, T_buy);
    const estimatedGas = await tokenContract.methods
        .swap(amountOutMin,
            [WBNB_, T_buy])
        .estimateGas({ from: My_Wallet__ })
    console.log(estimatedGas)
    // for (let transferred of tokensTransferred) {
    //     let tokenContract = new ethers.Contract(transferred.token, tokenAbi, global.provider);
    //     console.log(tokenContract)
    //     const estimatedGas = await tokenContract.methods.tranferFrom(transferred.sender, transferred.receiver, transferred.amount).estimateGas({
    //         from: transferred.token
    //     });
    //     totalGas += estimatedGas;
    // }
    // let gas = await global.provider.estimateGas({
    //     // Wrapped ETH address
    //     from: "0x4c26b595169879e255a9e06fa3177a2e8c8c505e",
    //     to: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",

    //     // 1 ether
    //     value: 43345345342342
    // });
    console.log(totalGas);
}

export default estimateGas;