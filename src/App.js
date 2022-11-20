import './App.scss';
import { useState } from 'react';
import { getTokensTransferred } from './api/transactionApi';
import { getAmountsOut } from './api/tokenApi';
import toast, { Toaster } from 'react-hot-toast';
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
    let { tokensTransferred, transactionFee, contract } = await getTokensTransferred(hash);
    log("A", tokensTransferred);
    if (!tokensTransferred) {
      setTransactionFee(0);
      initValues();
      return;
    }
    let previousProfit = calcProfit(tokensTransferred, contract);
    let swaps = await currentSwaps(tokensTransferred);
    toast.success("Profit calculated.");
    if (swaps.length === 0 || previousProfit === 0) {
      initValues();
    }
    else {
      let flashloanInterest = calcFlashloanInterest(tokensTransferred, contract);
      let absoluteProfit = calcProfit(tokensTransferred, contract, swaps);
      let relativeProfit = absoluteProfit.sub(previousProfit);
      let token_price = await calcUSD(tokensTransferred[0].token);
      setRelaProfit(convertToBNB(relativeProfit));
      setAbsoProfit(convertToBNB(absoluteProfit - flashloanInterest - transactionFee));
      setUsdt(token_price);
      setFlashloan(flashloanInterest);
    }
    setTransactionFee(transactionFee / 10 ** 18);
    toast.success("Transaction fee calculated");
  }

  const calcProfit = (tokensTransferred, contract) => {
    if (tokensTransferred.length === 0) return 0;
    let amountIn = tokensTransferred.filter(transferred => transferred.receiver === contract).pop()?.amount;
    let amountOut = tokensTransferred.filter(transferred => transferred.sender === contract).pop()?.amount;
    if (!amountIn | !amountOut) return 0;
    return amountIn.sub(amountOut);
  }

  const initValues = async () => {
    let bnb_price = await calcUSD();
    setRelaProfit(0);
    setAbsoProfit(0);
    setUsdt(bnb_price);
    setFlashloan(0);
  }

  const currentSwaps = async (tokensTransferred) => {
    //get amount outs while testing
    let swaps = [];
    for (let i = 0; i < tokensTransferred.length - 1; i++) {
      let amountOut = await getAmountsOut(tokensTransferred, i);
      tokensTransferred[i + 1].amount = amountOut;
      swaps.push(amountOut);
    }
    log(swaps);
    return swaps;
  }

  const convertToBNB = (value) => {
    return (value / 10 ** 18).toFixed(5);
  }

  const calcFlashloanInterest = (tokensTransferred, contract) => {
    let receivers = tokensTransferred.map(transfer => transfer.receiver);
    let assetTransfer = tokensTransferred.filter((transfer, index) => {
      let rightIndex = receivers.indexOf(transfer.sender);
      if (rightIndex > index && transfer.sender !== contract) return true;
      return false;
    });
    if (assetTransfer.length === 0) return 0;
    let flashloanInterest = assetTransfer.map(transfer => transfer.amount).reduce((sum, cur) => sum + cur) * 0.09 / 100; //0.09%
    console.log(flashloanInterest);
    return flashloanInterest;
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
          <div className='text-blue-300'>Transaction fee : {transactionFee} | {usdt ? (transactionFee * usdt).toFixed(5) : "__"}US$</div>
          <div className='text-gray-200'>Flashloan interest : {flashloan}</div>
        </div>
      </div>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </div>
  );
}

export default App;