import { ethers } from 'ethers';
const provider = new ethers.providers.JsonRpcProvider();

const getTokensTransferred = async (hash) => {
    const transaction = await provider.getTransaction(hash);
    console.log(transaction);
}

export default getTokensTransferred;