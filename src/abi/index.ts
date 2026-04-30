export const ERC20_ABI = [
  { type: "function", name: "name",     stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "symbol",   stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "totalSupply", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "balanceOf", stateMutability: "view",
    inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "allowance", stateMutability: "view",
    inputs: [{ type: "address" }, { type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable",
    inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "transfer", stateMutability: "nonpayable",
    inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }] },
] as const;

export const ROUTER_ABI = [
  { type: "function", name: "factory", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "WPROS_ADDR", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  {
    type: "function", name: "getAmountsOut", stateMutability: "view",
    inputs: [{ type: "uint256", name: "amountIn" }, { type: "address[]", name: "path" }],
    outputs: [{ type: "uint256[]" }],
  },
  {
    type: "function", name: "getAmountsIn", stateMutability: "view",
    inputs: [{ type: "uint256", name: "amountOut" }, { type: "address[]", name: "path" }],
    outputs: [{ type: "uint256[]" }],
  },
  {
    type: "function", name: "quote", stateMutability: "pure",
    inputs: [
      { type: "uint256", name: "amountA" },
      { type: "uint256", name: "reserveA" },
      { type: "uint256", name: "reserveB" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function", name: "swapExactTokensForTokens", stateMutability: "nonpayable",
    inputs: [
      { type: "uint256", name: "amountIn" },
      { type: "uint256", name: "amountOutMin" },
      { type: "address[]", name: "path" },
      { type: "address", name: "to" },
      { type: "uint256", name: "deadline" },
    ],
    outputs: [{ type: "uint256[]" }],
  },
  {
    type: "function", name: "swapExactPROSForTokens", stateMutability: "payable",
    inputs: [
      { type: "uint256", name: "amountOutMin" },
      { type: "address[]", name: "path" },
      { type: "address", name: "to" },
      { type: "uint256", name: "deadline" },
    ],
    outputs: [{ type: "uint256[]" }],
  },
  {
    type: "function", name: "swapExactTokensForPROS", stateMutability: "nonpayable",
    inputs: [
      { type: "uint256", name: "amountIn" },
      { type: "uint256", name: "amountOutMin" },
      { type: "address[]", name: "path" },
      { type: "address", name: "to" },
      { type: "uint256", name: "deadline" },
    ],
    outputs: [{ type: "uint256[]" }],
  },
  {
    type: "function", name: "addLiquidity", stateMutability: "nonpayable",
    inputs: [
      { type: "address" }, { type: "address" },
      { type: "uint256" }, { type: "uint256" },
      { type: "uint256" }, { type: "uint256" },
      { type: "address" }, { type: "uint256" },
    ],
    outputs: [{ type: "uint256" }, { type: "uint256" }, { type: "uint256" }],
  },
  {
    type: "function", name: "addLiquidityPROS", stateMutability: "payable",
    inputs: [
      { type: "address" },
      { type: "uint256" },
      { type: "uint256" }, { type: "uint256" },
      { type: "address" }, { type: "uint256" },
    ],
    outputs: [{ type: "uint256" }, { type: "uint256" }, { type: "uint256" }],
  },
  {
    type: "function", name: "removeLiquidity", stateMutability: "nonpayable",
    inputs: [
      { type: "address" }, { type: "address" },
      { type: "uint256" },
      { type: "uint256" }, { type: "uint256" },
      { type: "address" }, { type: "uint256" },
    ],
    outputs: [{ type: "uint256" }, { type: "uint256" }],
  },
  {
    type: "function", name: "removeLiquidityPROS", stateMutability: "nonpayable",
    inputs: [
      { type: "address", name: "token" },
      { type: "uint256", name: "liquidity" },
      { type: "uint256", name: "amountTokenMin" },
      { type: "uint256", name: "amountPROSMin" },
      { type: "address", name: "to" },
      { type: "uint256", name: "deadline" },
    ],
    outputs: [
      { type: "uint256", name: "amountToken" },
      { type: "uint256", name: "amountPROS" },
    ],
  },
] as const;

export const FACTORY_ABI = [
  { type: "function", name: "getPair", stateMutability: "view",
    inputs: [{ type: "address" }, { type: "address" }], outputs: [{ type: "address" }] },
  { type: "function", name: "allPairsLength", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "allPairs", stateMutability: "view",
    inputs: [{ type: "uint256" }], outputs: [{ type: "address" }] },
] as const;

export const PAIR_ABI = [
  { type: "function", name: "token0", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "token1", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "getReserves", stateMutability: "view", inputs: [],
    outputs: [
      { type: "uint112", name: "reserve0" },
      { type: "uint112", name: "reserve1" },
      { type: "uint32",  name: "blockTimestampLast" },
    ] },
  { type: "function", name: "totalSupply", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "balanceOf", stateMutability: "view",
    inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
] as const;

export const PRESALE_ABI = [
  { type: "function", name: "rate", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "hardCapPROS", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "totalRaisedPROS", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "totalSold", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "buyerCount", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "started", stateMutability: "view", inputs: [], outputs: [{ type: "bool" }] },
  { type: "function", name: "ended",   stateMutability: "view", inputs: [], outputs: [{ type: "bool" }] },
  { type: "function", name: "owner",   stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "CLAIM_START", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "claimInfo", stateMutability: "view",
    inputs: [{ type: "address" }],
    outputs: [
      { type: "uint256", name: "claimable" },
      { type: "bool",    name: "isClaimed" },
      { type: "bool",    name: "claimOpen" },
      { type: "uint256", name: "secondsUntilOpen" },
    ] },
  { type: "function", name: "buy",   stateMutability: "payable", inputs: [], outputs: [] },
  { type: "function", name: "claim", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "withdrawPROS", stateMutability: "nonpayable",
    inputs: [{ type: "uint256" }], outputs: [] },
  { type: "function", name: "start", stateMutability: "nonpayable",
    inputs: [{ type: "uint256" }, { type: "uint256" }, { type: "uint256" }], outputs: [] },
  { type: "function", name: "endPresale", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "pause",   stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "unpause", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "event", name: "Bought", inputs: [
    { type: "address", name: "buyer", indexed: true },
    { type: "uint256", name: "prosIn" },
    { type: "uint256", name: "sparkOut" },
  ] },
] as const;

export const TOKEN_FACTORY_ABI = [
  { type: "function", name: "creationFee", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "totalTokens", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  {
    type: "function", name: "tokensPaginated", stateMutability: "view",
    inputs: [{ type: "uint256" }, { type: "uint256" }],
    outputs: [{
      type: "tuple[]",
      components: [
        { type: "address", name: "token" },
        { type: "address", name: "creator" },
        { type: "uint256", name: "totalSupply" },
        { type: "uint256", name: "createdAt" },
        { type: "string",  name: "name" },
        { type: "string",  name: "symbol" },
        { type: "string",  name: "logoURI" },
      ],
    }],
  },
  {
    type: "function", name: "createToken", stateMutability: "payable",
    inputs: [
      { type: "string",  name: "name" },
      { type: "string",  name: "symbol" },
      { type: "uint256", name: "totalSupply" },
      { type: "uint16",  name: "buyTaxBps" },
      { type: "uint16",  name: "sellTaxBps" },
      { type: "address", name: "taxTreasury" },
      { type: "string",  name: "logoURI" },
    ],
    outputs: [{ type: "address" }],
  },
  {
    type: "event", name: "TokenCreated",
    inputs: [
      { type: "address", name: "token", indexed: true },
      { type: "address", name: "creator", indexed: true },
      { type: "string",  name: "name" },
      { type: "string",  name: "symbol" },
      { type: "uint256", name: "totalSupply" },
      { type: "string",  name: "logoURI" },
    ],
  },
] as const;
