import pancakePairAbi from '../abi/pair/pancakePairAbi.json';
import pancakeRouterAbi from '../abi/router/pancakeRouterAbi.json';
import biRouterAbi from '../abi/router/biRouterAbi.json';
const { ethers } = require("ethers");
const routerAddress = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
let routerContract = new ethers.Contract(routerAddress, pancakeRouterAbi, global.provider);
const router1 = "0xC0788A3aD43d79aa53B09c2EaCc313A787d1d607";
let contract1 = new ethers.Contract(router1, pancakeRouterAbi, global.provider);
const biRouter = "0x3a6d8cA21D1CF76F653A67577FA0D27453350dD8";
let contract2 = new ethers.Contract(biRouter, biRouterAbi, global.provider);
let contract3 = new ethers.Contract(biRouter, pancakeRouterAbi, global.provider);

const getReserves = async (address) => { // address of pair contract
    let pairContract = new ethers.Contract(address, pancakePairAbi, global.provider);
    let reserves = await pairContract.getReserves();
    let tokens = [await pairContract.token0(), await pairContract.token1()];
    return { reserves, tokens };
}

const getAmountOut = async (...parameters) => {    //parameters: amountIn, reserveIn, reserveOut
    let amountOut = await routerContract.getAmountOut(...parameters);
    return amountOut;
}

const getAmountsOut = async (transferred, index) => {
    let amountOut = await routerContract.getAmountsOut(transferred[index].amount, [transferred[index].token, transferred[index + 1].token]);
    if (index == 1) {
        amountOut = await contract1.getAmountsOut(transferred[index].amount, [transferred[index].token, transferred[index + 1].token]);
        // let out = await contract3.getAmountsOut(transferred[index].amount, [transferred[index].token, transferred[index + 1].token]);
        // console.log(amountOut, out);
    }
    return amountOut[1];
}

export { getReserves, getAmountOut, getAmountsOut };