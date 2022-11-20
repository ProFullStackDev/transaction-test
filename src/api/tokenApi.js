import { ethers } from 'ethers';
import router from '../router';
import pairAbi from '../abi/pair/pancakePairAbi.json';

const getReserves = async (pairContract) => { // address of pair contract
    let reserves = await pairContract.getReserves();
    let tokens = [await pairContract.token0(), await pairContract.token1()];
    return { reserves, tokens };
}

const getAmountOut = async (routerContract, ...parameters) => {    //parameters: amountIn, reserveIn, reserveOut
    let amountOut = await routerContract.getAmountOut(...parameters);
    return amountOut;
}

const getAmountsOut = async (transferred, index) => {
    let pairContract = new ethers.Contract(transferred[index].receiver, pairAbi, global.provider);
    try {
        let symbol = await pairContract.symbol();
        let routerContract = router[symbol];
        let amountOut = await routerContract.getAmountsOut(transferred[index].amount, [transferred[index].token, transferred[index + 1].token]);
        return amountOut[1];
    }
    catch {
        return transferred[index + 1].amount;
    }
}

export { getReserves, getAmountOut, getAmountsOut };