import './App.scss';
import { useState } from 'react';
import { getTokensTransferred } from './api/transactionApi';
import { getAmountsOut } from './api/tokenApi';
import toast, { Toaster } from 'react-hot-toast';
import calcUSD from './api/tokenPriceApi';
import { setIn } from 'immutable';

const App = () => {

  let [absoProfit, setAbsoProfit] = useState("__");
  let [preProfit, setPreProfit] = useState("__");
  let [usdt, setUsdt] = useState(0);
  let [iniToken, setIniToken] = useState("__");
  let [outToken, setOutToken] = useState("__");
  let [outTokenNew, setOutTokenNew] = useState("__");
  let [transactionFee, setTransactionFee] = useState("__");
  let [flashloan, setFlashloan] = useState("__");
  let [gasPrice, setGasPrice] = useState("__");
  let [gasUsed, setGasUsed] = useState("__");

  const test = async () => {
    //test the transaction with the hash
    let hash = document.getElementById("hash").value.trim();
    let { tokensTransferred, gasUsed, gasPrice, contract } = await getTokensTransferred(hash);
    if (!tokensTransferred) {
      setTransactionFee(0);
      initValues();
      return;
    }
    let previousProfit = calcProfit(tokensTransferred, contract);
    setPreProfit(ToBNB(previousProfit));
    let swaps = await currentSwaps(tokensTransferred);
    toast.success("Profit calculated.");
    if (swaps.length === 0 || previousProfit === 0) {
      initValues();
    }
    else {
      let flashloanInterest = calcFlashloanInterest(tokensTransferred, contract);
      let absoluteProfit = calcProfit(tokensTransferred, contract, "current");
      let token_price = await calcUSD(tokensTransferred[0].token);
      setAbsoProfit(ToBNB(absoluteProfit - flashloanInterest - gasUsed * gasPrice));
      setUsdt(token_price);
      setFlashloan(ToBNB(flashloanInterest));
    }
    setTransactionFee(ToBNB(gasUsed * gasPrice));
    setGasPrice(ToBNB(gasPrice).toFixed(10));
    setGasUsed(gasUsed.toString());
    toast.success("Transaction fee calculated");
  }

  const calcProfit = (tokensTransferred, contract, time = "previous") => {
    if (tokensTransferred.length === 0) return 0;
    let amountIn = tokensTransferred.filter(transferred => transferred.receiver === contract).pop()?.amount;
    let amountOut = tokensTransferred.filter(transferred => transferred.sender === contract).pop()?.amount;
    if (!amountIn | !amountOut) return 0;
    if (time === "previous") {
      setIniToken(ToBNB(amountOut));
      setOutToken(ToBNB(amountIn));
    }
    else setOutTokenNew(ToBNB(amountIn));
    return amountIn.sub(amountOut);
  }

  const initValues = async () => {
    let bnb_price = await calcUSD();
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
    return swaps;
  }

  const ToBNB = (value) => {
    return (value / 10 ** 18);
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
    return flashloanInterest;
  }

  return (
    <div className="text-white App">
      <div className='pt-20 sm:px-20 md:px-32 lg:px-60 background px-9'>
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
          <div className='text-green-300'>Input Amount By Token : {iniToken}</div>
          <div className='text-blue-200'>Out Amount By Token of Original Transaction : {outToken}</div>
          <div className='text-blue-300'>Out Amount By Token of New Transaction : {outTokenNew}</div>
          <div className='text-yellow-100'>Profit By Token of Original Transaction : {preProfit}</div>
          <div className='text-yellow-200'>Profit By Token of New Transaction : {absoProfit}</div>
          <div className='text-pink-200'>Profit By BUSD of Original Transaction : {usdt !== 0 ? (preProfit * usdt) : "__"}</div>
          <div className='text-pink-300'>Profit By BUSD of New Transaction : {usdt !== 0 ? (absoProfit * usdt) : "__"}</div>
          <div className='text-gray-300'>Gas Price : {gasPrice}BNB</div>
          <div className='text-gray-400'>Gas Used : {gasUsed}</div>
          <div className='text-gray-500'>Gas Fee : {transactionFee}BNB</div>
          <div className='text-cyan-200'>Token Price : {usdt} US$</div>
          <div className='text-gray-200'>Flashloan interest : {flashloan}</div>
        </div>
      </div>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </div>
  );
}

export default App;