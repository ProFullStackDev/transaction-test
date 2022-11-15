import './App.scss';
import getTokensTransferred from './api/getTokensTransferred';
let hash = "0x8e5140348b69453eb5e368da3d2c2b3667ebe23c04345f18d2801490f2dffbba";
getTokensTransferred(hash);

function App() {
  return (
    <div className="text-white App">
      <div className='py-20 sm:px-20 md:px-32 lg:px-60 background px-9'>
        <div className="w-full text-3xl">
          Type the transaction ID and test to see whether it is profitable.
        </div>
        <input
          type="email"
          className="w-[230px] sm:w-[273px] lg:w-[70%] px-16 py-3 mt-10 placeholder-white gradient-border-bg"
          placeholder="Transaction Hash"
        />
        <button className="w-20 h-12 mb-10 ml-10 text-lg md:w-24 xl:w-48 hover:border-white test-btn hover:cursor-pointer">
          test
        </button>
        <div className='flex flex-col gap-8 text-2xl hr-gradient'>
          <div className='text-green-400'>Relative Profit : 32%</div>
          <div className='text-yellow-100'>Absolute Profit : 328BNB | 300US$</div>
          <div className='text-pink-200'>Input amount of tokens to start the transaction : 300</div>
          <div className='text-blue-300'>Gas fee : 32$</div>
          <div className='text-gray-200'>Flashloan interest : 32$</div>
        </div>
      </div>
    </div>
  );
}

export default App;