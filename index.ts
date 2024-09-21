import Web3 from "web3";

const addresses = ``.split("\n");

const networksList: {
  rpc: string;
  rpcTitle: string;
  tokensContracts: { tokenTitle: string; tokenAddress: string }[];
}[] = [
  {
    rpc: "https://ethereum.rpc.subquery.network/public",
    rpcTitle: "ETH",
    tokensContracts: [
      {
        tokenAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
        tokenTitle: "USDT",
      },
    ],
  },
  {
    rpc: "https://arb1.arbitrum.io/rpc",
    rpcTitle: "ARB",
    tokensContracts: [
      {
        tokenAddress: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
        tokenTitle: "USDC",
      },
    ],
  },
  {
    rpc: "https://rpc.ankr.com/polygon",
    rpcTitle: "POLYGON",
    tokensContracts: [
      {
        tokenAddress: "0x0000000000000000000000000000000000001010",
        tokenTitle: "MATIC",
      },
    ],
  },
];

const erc20ABI = [
  // balanceOf
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  // decimals
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
] as const;

const getBalance = async (
  web3: Web3,
  address: string,
  networkTokensList: { tokenTitle: string; tokenAddress: string }[],
  rpc: string,
  rpcTitle: string
) => {
  const nativeBalance = await web3.eth.getBalance(address);
  let objToReturn = { [`native | ${rpcTitle}`]: "?" };
  objToReturn[`native | ${rpcTitle}`] = web3.utils.fromWei(
    nativeBalance,
    "ether"
  );

  for (let i = 0; i < networkTokensList.length; i += 1) {
    const contract = new web3.eth.Contract(
      erc20ABI,
      networkTokensList[i].tokenAddress
    );

    const balance = await contract.methods
      .balanceOf(address)
      .call()
      .catch(() => undefined);

    objToReturn[`${networkTokensList[i].tokenTitle} | ${rpcTitle}`] =
      // @ts-ignore
      web3.utils.fromWei(balance, "ether");
    // console.table(objToReturn)
  }

  return objToReturn;
};

const main = async () => {

  const networksInstances = networksList.map(
    (network) => new Web3(network.rpc)
  );

  const table = {};
  for (let i = 0; i < addresses.length; i += 1) {
    try {
      // @ts-ignore
      table[i] = {
        address: addresses[i],
      };
      console.log(addresses[i]);
      for (
        let networkInstanceIndex = 0;
        networkInstanceIndex < networksInstances.length;
        networkInstanceIndex += 1
      ) {
        // console.log('CURRENT NETWORK:', networksList[networkInstanceIndex])
        try {
          const data = await getBalance(
            networksInstances[networkInstanceIndex],
            addresses[i],
            networksList[networkInstanceIndex].tokensContracts,
            networksList[networkInstanceIndex].rpc,
            networksList[networkInstanceIndex].rpcTitle
          );

          //@ts-ignore
          table[i] = {
            ...table[i],
            ...data,
          };
        } catch (e) {}
      }

      console.table(table);
    } catch (e) {
      i -= 1;
      console.log(e);
      continue;
    }
  }

  const total = { summary: "summary" };
  for (let i = 0; i < addresses.length; i += 1) {
    // @ts-ignore
    const address = table[i];

    Object.entries(address).forEach(([title, value], index: number) => {
      // @ts-ignore
      total[title] =
      // @ts-ignore
        total[title] + Number.parseFloat(value) || Number.parseFloat(value);
    });
  }

  console.table(total);
};

main();
