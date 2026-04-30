/**
 * 25 randomized viral-style tweet templates for the Share-to-X button.
 * The template is picked at random on each click. Optional placeholders:
 *   {{symbol}}  - token symbol the user is sharing
 *   {{address}} - token contract address (truncated)
 *   {{url}}     - link back to the dApp
 */
export const VIRAL_TWEETS: string[] = [
  // 1
  "Just sparked my own token on @SparkDEX_Pharos in less than 60 seconds. ⚡\nNo gatekeepers. No code. Just spark, swap, send.\nFrom idea → liquidity in seconds. {{url}}\n#PharosMainnet #SparkYourToken #DeFi",
  // 2
  "Memecoin season on Pharos is HERE 🟠🌸🟣\nSpark DEX = create + LP + presale + swap, all in one tab.\nGas fees that cost less than your morning coffee. ☕\n{{url}}\n#SparkDEX #PROS #Memecoin",
  // 3
  "If you're not on Pharos yet, you're early.\nIf you're not on @SparkDEX_Pharos yet, you're VERY early.\n⚡ Spark Your Token • Ignite the Trade ⚡\n{{url}}\n#PharosMainnet #SparkDEX",
  // 4
  "POV: you launched a token, added liquidity, did a presale, and swapped — all on one screen.\nWelcome to Spark DEX. ⚡\n{{url}}\n#DeFi #PharosMainnet",
  // 5
  "Spark DEX has the smoothest UX I've used in DeFi this cycle. ✨\nDark mode by default. Gradients that slap.\nPharos gas? basically free.\n{{url}}\n#SparkYourToken",
  // 6
  "My friend: \"how do I launch a token?\"\nMe: opens Spark DEX, types name + symbol, hits Create. ⚡\nLP added 30 seconds later.\n{{url}}\n#PharosMainnet #SparkDEX",
  // 7
  "Real ones know: the next 100x doesn't launch on a tier-1 chain.\nIt sparks on Pharos. ⚡\n@SparkDEX_Pharos is the lab.\n{{url}}\n#SparkDEX",
  // 8
  "Just bought into the $SPARK presale on @SparkDEX_Pharos.\nGovernance + 100% on-chain claim on June 25, 2026.\nDon't fade the spark. ⚡🟠🌸🟣\n{{url}}",
  // 9
  "Things I love about Spark DEX:\n• Token Generator (no Solidity needed)\n• V2 fork w/ permissionless pools\n• Beautiful UI\n• PROS gas is a joke\nBuilt for Pharos. ⚡\n{{url}}",
  // 10
  "Spark DEX feels like a memecoin launchpad and a serious DeFi hub had a baby. 👀\nAnd that baby is fast.\n{{url}}\n#PharosMainnet #SparkYourToken",
  // 11
  "ERC-20 on Pharos in 4 clicks:\n1) Open @SparkDEX_Pharos\n2) Token Generator → name, symbol, supply\n3) Add Liquidity\n4) Tweet about it\nDONE. {{url}}",
  // 12
  "From idea to liquidity in seconds.\nFrom liquidity to viral in minutes.\nThat's Spark DEX. ⚡\n{{url}}\n#SparkDEX #PharosMainnet",
  // 13
  "{{symbol}} is live on Spark DEX.\nLP is in. Charts are loading.\n{{address}}\nSwap → {{url}}\n#PharosMainnet #SparkYourToken",
  // 14
  "Hot take: the next viral memecoin won't launch where everyone is — it'll spark where the early ones are.\nThat's Pharos. That's @SparkDEX_Pharos. ⚡\n{{url}}",
  // 15
  "Created a token on @SparkDEX_Pharos for the lols.\nNow the chart is green. 📈\nThis is too easy. {{url}}\n#SparkDEX",
  // 16
  "Spark DEX makes \"I have a token idea\" go from a 3-week project to a 3-minute one. ⚡\n{{url}}\n#DeFi #PharosMainnet",
  // 17
  "Pharos gas + Spark DEX UX = unfair advantage for early launchers.\nGo spark something.\n{{url}}\n#SparkYourToken",
  // 18
  "Reminder: $SPARK presale is live.\nBuy with PROS. Claim opens June 25, 2026.\nGovernance, fees, and the future of Spark DEX. ⚡\n{{url}}",
  // 19
  "Hot tip: import any token by contract on Spark DEX and trade it instantly.\nNo waiting for listings. No emails to support.\nThe DEX trusts you. ⚡\n{{url}}",
  // 20
  "I built a token, added LP, did a swap, and earned LP fees — all on one tab.\nSpark DEX makes it look easy. {{url}}\n#PharosMainnet",
  // 21
  "Audited UI ✅ (lol just vibes for now)\nAudited tokenomics ✅\nAudited gas (it's literally nothing) ✅\nWelcome to Spark DEX on Pharos.\n{{url}}",
  // 22
  "If your DEX doesn't let you create + LP + presale + swap on one site, your DEX is mid.\nUpgrade to @SparkDEX_Pharos. ⚡\n{{url}}",
  // 23
  "Three words: SPARK. YOUR. TOKEN. ⚡\n{{url}}\n#PharosMainnet #SparkDEX",
  // 24
  "Pharos is fast. Spark DEX is faster.\nLaunch, list, and trade on one of the lowest-fee L1s out there.\n{{url}}\n#SparkYourToken",
  // 25
  "Imagine being able to launch a token, add liquidity, and shill it on X — all without leaving one tab.\nYou don't have to imagine. It's @SparkDEX_Pharos. ⚡\n{{url}}",
];

/** Pick a random tweet template and fill in the placeholders. */
export function buildRandomTweet(opts?: {
  symbol?: string;
  address?: string;
  url?: string;
}): string {
  const tpl = VIRAL_TWEETS[Math.floor(Math.random() * VIRAL_TWEETS.length)];
  const url = opts?.url ?? (typeof window !== "undefined" ? window.location.origin : "https://spark-dex.xyz");
  const address = opts?.address
    ? `${opts.address.slice(0, 6)}…${opts.address.slice(-4)}`
    : "";
  return tpl
    .replaceAll("{{symbol}}", opts?.symbol ? `$${opts.symbol}` : "$SPARK")
    .replaceAll("{{address}}", address)
    .replaceAll("{{url}}", url);
}

/** Open Twitter's compose URL in a new tab with the rendered tweet. */
export function shareToX(opts?: Parameters<typeof buildRandomTweet>[0]) {
  const text = buildRandomTweet(opts);
  const u = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  if (typeof window !== "undefined") window.open(u, "_blank", "noopener,noreferrer");
}
