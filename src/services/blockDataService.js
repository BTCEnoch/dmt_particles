const blockDataCache = new Map();

export async function fetchBlockData(blockNumber) {
  if (blockDataCache.has(blockNumber)) {
    return blockDataCache.get(blockNumber);
  }

  const url = `https://ordinals.com/r/blockinfo/${blockNumber}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} for URL: ${url}`);
    }

    const data = await response.json();
    const parsedData = {
      blockNumber: data.blockNumber || "N/A",
      timestamp: data.timestamp || "N/A",
      transactions: data.transactions ? data.transactions.length : "N/A",
      miner: data.miner || "N/A",
      nonce: data.nonce || 0,
    };

    blockDataCache.set(blockNumber, parsedData);
    return parsedData;
  } catch (error) {
    console.error("Error fetching block data:", error);
    return null;
  }
}
