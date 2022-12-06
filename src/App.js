import './App.scss';
import { useState } from 'react';
import { getTokensTransferred } from './api/transaction.api';
import { getAmountsOut, getRefund } from './api/token.api';
import toast, { Toaster } from 'react-hot-toast';
import calcUSD from './api/tokenprice.api';

const App = () => {

  const [absoProfit, setAbsoProfit] = useState(0);
  const [preProfit, setPreProfit] = useState(0);
  const [usdt, setUsdt] = useState(0);
  const [iniToken, setIniToken] = useState(0);
  const [outToken, setOutToken] = useState(0);
  const [outTokenNew, setOutTokenNew] = useState(0);
  const [transactionFee, setTransactionFee] = useState(0);
  const [gasPrice, setGasPrice] = useState(0);
  const [gasUsed, setGasUsed] = useState(0);
  const [unit, setUnit] = useState("");
  let profitUnit = "";
  let profitToken = "";
  let addedFee = 0;

  const test = async () => {

    //test the transaction with the hash
    let hash = document.getElementById("hash").value.trim();
    let { tokensTransferred, gasUsed, gasPrice, contract } = await getTokensTransferred(hash);
    addedFee = 0;
    console.log(tokensTransferred);
    if (!tokensTransferred) {
      setTransactionFee(0);
      initValues();
      return;
    }
    //calculate the profit of the origal transaction.    
    let previousProfit = await calcProfit(tokensTransferred, contract);
    setPreProfit(toBNB(previousProfit));
    console.log(tokensTransferred);
    let swaps = await currentSwaps(tokensTransferred);
    toast.success("Profit calculated.");
    if (swaps.length === 0 || previousProfit === 0) {
      initValues();
    } else {
      const flashloanExist = await calcRefund(tokensTransferred, contract);
      let tokenPrice = await calcUSD(profitToken);
      let absoluteProfit = await calcProfit(tokensTransferred, contract, "current");
      if (flashloanExist) {
        setIniToken(0 + profitUnit);
        setOutToken(toBNB(previousProfit) + profitUnit);
        setOutTokenNew(toBNB(absoluteProfit) - addedFee / tokenPrice + profitUnit);
      }
      setAbsoProfit(toBNB(absoluteProfit) - addedFee / tokenPrice);
      setUsdt(tokenPrice);
    }

    //gas estimation
    setTransactionFee(toBNB(gasUsed * gasPrice));
    setGasPrice(toBNB(gasPrice).toFixed(10));
    setGasUsed(gasUsed.toString());
    toast.success("Transaction fee calculated");
  }

  const calcProfit = async (tokensTransferred, contract, time = "previous") => {
    const filtered = filterTransaction(tokensTransferred);
    if (filtered.length === 0) return 0;
    let inputTrans = filtered.filter(transferred => transferred.receiver === contract).pop();
    let amountIn = inputTrans?.amount;
    let outputTrans = filtered.filter(transferred => transferred.sender === contract).shift();
    let amountOut = outputTrans?.amount;
    if (!amountIn | !amountOut) return 0;
    if (time === "previous") {
      let flashloanExist = await calcRefund(tokensTransferred, contract, "no-test");
      if (!flashloanExist) {
        setIniToken(toBNB(amountOut) + outputTrans.symbol);
        setOutToken(toBNB(amountIn) + inputTrans.symbol);
      }
    }
    else setOutTokenNew(toBNB(amountIn) + inputTrans.symbol);
    profitUnit = outputTrans.symbol;
    profitToken = outputTrans.token;
    setUnit(profitUnit);
    return amountIn.sub(amountOut);
  }

  const initValues = async () => {
    setAbsoProfit(0);
    setUsdt(await calcUSD());
  }

  const currentSwaps = async (tokensTransferred) => {
    //get amount outs while testing
    let swaps = [];
    for (let i = 0; i < tokensTransferred.length - 1; i++) {
      let amountOut = await getAmountsOut(tokensTransferred, i);
      if (tokensTransferred.filter(trans => trans.amount.eq(tokensTransferred[i + 1].amount)).length < 2) {
        tokensTransferred[i + 1].amount = amountOut;
      }
      swaps.push(amountOut);
    }
    return swaps;
  }

  const toBNB = (value) => {
    return value / 10 ** 18;
  }

  const filterTransaction = (transferred) => {
    transferred.forEach((transfer) => {
      let count = transferred.filter(trans => {
        if (trans === 0) return false;
        return trans.amount.eq(transfer.amount);
      }).length;
      if (count > 1) {
        transferred = transferred.map(trans => {
          if (trans === 0 || trans.amount.eq(transfer.amount)) {
            return 0;
          } else {
            return trans;
          }
        })
      }
    });
    return transferred.filter(transfer => transfer !== 0);
  }

  const calcRefund = async (tokensTransferred, contract, method = "test") => {
    let receivers = tokensTransferred.map(transfer => transfer.receiver);
    let assetTransfer = tokensTransferred.filter((transfer, index) => {
      let rightIndex = receivers.indexOf(transfer.sender);
      if (rightIndex > index && transfer.sender !== contract) return true;
      return false;
    });
    if (method === "test") {
      for (let transfer of assetTransfer) {
        let paybackTransfer = tokensTransferred.find(trans => (
          trans.receiver === transfer.sender
        ));
        let refund = await getRefund(transfer, paybackTransfer);
        addedFee += toBNB(refund.sub(paybackTransfer.amount)) * await calcUSD(paybackTransfer.token);
      }
    }
    return assetTransfer.length !== 0;
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
          <div className='text-yellow-100'>Profit By Token of Original Transaction : {preProfit}{unit}</div>
          <div className='text-yellow-200'>Profit By Token of New Transaction : {absoProfit}{unit}</div>
          <div className='text-pink-200'>Profit By BUSD of Original Transaction : {preProfit * usdt}US$</div>
          <div className='text-pink-300'>Profit By BUSD of New Transaction : {absoProfit * usdt}US$</div>
          <div className='text-gray-300'>Gas Price : {gasPrice}BNB</div>
          <div className='text-gray-400'>Gas Used : {gasUsed}</div>
          <div className='text-gray-500'>Gas Fee : {transactionFee}BNB</div>
          <div className='text-cyan-200'>Token Price : {usdt}US$</div>
        </div>
      </div>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </div>
  );
}

export default App;