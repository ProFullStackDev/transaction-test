import './App.scss';
import { useState } from 'react';
import { getTokensTransferred } from './api/transactionApi';
import { getReserves, getAmountOut, getAmountsOut } from './api/tokenApi';
import calcUSD from './api/tokenPriceApi';
const log = console.log;
const App = () => {

  let [relaProfit, setRelaProfit] = useState("__");
  let [absoProfit, setAbsoProfit] = useState("__");
  let [usdt, setUsdt] = useState(0);
  let [iniToken, setIniToken] = useState("__");
  let [transactionFee, setTransactionFee] = useState("__");
  let [flashloan, setFlashloan] = useState("__");

  const test = async () => {
    //test the transaction with the hash
    let hash = document.getElementById("hash").value.trim();
    let { tokensTransferred, transactionFee } = await getTokensTransferred(hash);
    log("A", tokensTransferred);
    let swaps = await currentSwaps(tokensTransferred);
    // if (swaps.length === 0) {
    //   initValues();
    // }
    // else {
    //   let absoluteProfit = swaps.pop().sub(tokensTransferred[0].amount);
    //   let previousProfit = tokensTransferred[tokensTransferred.length - 1].amount - tokensTransferred[0].amount - transactionFee;
    //   let relativeProfit = absoluteProfit.sub(previousProfit);
    //   let token_price = await calcUSD(tokensTransferred[0].token);
    //   setRelaProfit(convertToBNB(relativeProfit - transactionFee));
    //   setAbsoProfit(convertToBNB(absoluteProfit - transactionFee));
    //   setUsdt(token_price);
    // }
    // setTransactionFee(transactionFee / 10 ** 18);
    // setFlashloan(0);
  }

  const initValues = () => {
    setRelaProfit(0);
    setAbsoProfit(0);
  }

  const currentSwaps = async (tokensTransferred) => {
    //get amount outs while testing
    let swaps = [], swaps1 = [];
    for (let i = 0; i < tokensTransferred.length - 1; i++) {
      let { receiver, token, amount } = tokensTransferred[i];
      let reserves = await getReserves(receiver);
      let index = reserves.tokens.indexOf(token);
      let amountIn = i === 0 ? amount : swaps[i - 1];
      let amountOut = await getAmountOut(amountIn, reserves.reserves[index], reserves.reserves[1 - index]);
      let amountOut1 = await getAmountsOut(tokensTransferred, i);
      tokensTransferred[i + 1].amount = amountOut1;
      swaps.push(amountOut);
      swaps1.push(amountOut1)
    }
    log(swaps);
    log(swaps1);
    return swaps;
  }

  const convertToBNB = (value) => {
    return (value / 10 ** 18).toFixed(5);
  }

  return (
    <div className="text-white App">
      <div className='py-20 sm:px-20 md:px-32 lg:px-60 background px-9'>
        <div className="w-full text-3xl">
          Type the transaction ID and test to see whether it is profitable.
        </div>
        <input
          type="text" id="hash"
          className="w-[230px] sm:w-[273px] lg:w-[70%] px-16 py-3 mt-10 placeholder-white gradient-border-bg"
          placeholder="Transaction Hash"
        />
        <button onClick={test} className="w-20 h-12 mb-10 ml-10 text-lg md:w-24 xl:w-48 hover:border-white test-btn hover:cursor-pointer">
          test
        </button>
        <div className='flex flex-col gap-8 text-2xl hr-gradient'>
          <div className='text-green-400'>Relative Profit : {relaProfit > 0 && "+"}{relaProfit} | {usdt ? (relaProfit * usdt).toFixed(5) : "__"}US$</div>
          <div className='text-yellow-100'>Absolute Profit : {absoProfit} | {usdt ? (absoProfit * usdt).toFixed(5) : "__"}US$</div>
          <div className='text-pink-200'>Input amount of tokens to start the transaction : {iniToken}</div>
          <div className='text-blue-300'>Transaction fee : {transactionFee}</div>
          <div className='text-gray-200'>Flashloan interest : {flashloan}</div>
        </div>
      </div>
    </div>
  );
}

export default App;