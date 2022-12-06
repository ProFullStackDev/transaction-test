import { ethers } from 'ethers';
import router from '../router';
import pairAbi from '../abi/pair/pancakePairAbi.json';
import stableCoins from './stablecoins';

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
	const pairContract = new ethers.Contract(transferred[index].receiver, pairAbi, global.provider);
	try {
		const stableCoinList = Object.values(stableCoins);
		const [token0, token1] = [transferred[index].token, transferred[index + 1].token];
		const index0 = stableCoinList.indexOf(token0.toLowerCase());
		const index1 = stableCoinList.indexOf(token1.toLowerCase());
		let amount;
		if (index0 !== 0 && index1 !== 0 && index0 !== index1) {
			const symbol = "Stable";
			const contract = router[symbol];
			amount = await contract.get_dy(index0, index1, transferred[index].amount);
		} else {
			const symbol = await pairContract.symbol();
			const routerContract = router[symbol];
			amount = await routerContract.getAmountsOut(transferred[index].amount, [token0, token1])[1];
		}
		return 4.459581014164950729;
	}
	catch (e) {
		return transferred[index + 1].amount;
	}
}

const getRefund = async (assetTransfer, paybackTransfer) => {
	//considering the 0.03% as the fee
	const amountOut = assetTransfer.amount.mul(10003).div(10000);
	try {
		const pairContract = new ethers.Contract(paybackTransfer.receiver, pairAbi, global.provider);
		const symbol = await pairContract.symbol();
		const routerContract = router[symbol];
		console.log(symbol, routerContract);
		const amountIn = await routerContract.getAmountsIn(amountOut, [paybackTransfer.token, assetTransfer.token]);
		return amountIn[0];
	}
	catch {
		return paybackTransfer.amount;
	}
}

export { getReserves, getAmountOut, getAmountsOut, getRefund };