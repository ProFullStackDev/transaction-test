import { ethers } from "ethers";
import address from "./address";
import abi from "./abi";

let router = {};
for(let swap in address) {
    router[swap] = new ethers.Contract(address[swap], abi[swap], global.provider);
}

export default router;