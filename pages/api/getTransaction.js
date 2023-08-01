import { Network, Alchemy, AssetTransfersCategory } from "alchemy-sdk";

export default async function handler(req, res) {
  const { fromAddress, toAddress, chain, blockNumber } = JSON.parse(req.body);
  // Only allow POST requests
  if (req.method !== "POST") {
    res.status(405).send({ message: "Only POST requests allowed" });
    return;
  }

  // Set Alchemy settings based on the chain
  const settings = {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: Network[chain],
  };

  const alchemy = new Alchemy(settings);

  // Get the asset transfer info for the specified to and from address as well as blockNumber
  try {
    const txData = await alchemy.core.getAssetTransfers({
      fromBlock: blockNumber,
      toBlock: blockNumber,
      category: [
        AssetTransfersCategory.EXTERNAL,
        AssetTransfersCategory.INTERNAL,
        AssetTransfersCategory.ERC1155,
        AssetTransfersCategory.ERC20,
        AssetTransfersCategory.ERC721,
      ],
      fromAddress,
      toAddress,
      maxCount: 1,
      excludeZeroValue: false,
      withMetadata: true,
    });

    res.status(200).send(txData);
  } catch (e) {
    console.warn(e);
    res.status(500).send({
      message: "something went wrong, check the log in your terminal",
    });
  }
}
