import { Alchemy, Network, AlchemySubscription } from "alchemy-sdk";
import styles from "../styles/RealTimeTransactionHistory.module.css";
import { useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";

const getTransactionData = async (
  fromAddress,
  toAddress,
  blockNumber,
  chain
) => {
  try {
    const transaction = await fetch("/api/getTransaction", {
      method: "POST",
      body: JSON.stringify({
        fromAddress,
        toAddress,
        chain: chain ? chain : "ETH_MAINNET",
        blockNumber,
      }),
    });

    if (!transaction.ok) {
      throw new Error(`HTTP error! status: ${transaction.status}`);
    }

    const res = await transaction.json();
    return (res && res.transfers && res.transfers[0]) ?? [];
  } catch (e) {
    console.error(e);
    return null;
  }
};

export default function RealTimeTransactionHistory({ walletAddress, chain }) {
  const [myAddress, setMyAddress] = useState();
  const { address, isConnected } = useAccount();
  const [transactions, setTransactions] = useState({});
  const transactionsRef = useRef(transactions);

  useEffect(() => {
    transactionsRef.current = transactions;
  }, [transactions]);

  let orderedTransactions = Object.values(transactions).reverse();

  // Callback function for handling pending transactions
  const pendingCb = (tx) => {
    let newTransactions = { ...transactionsRef.current };
    if (newTransactions[tx.nonce]) {
      let oldPayload = newTransactions[tx.nonce];
      let updatedPayload = { ...oldPayload, status: "Cancelled" };
      newTransactions[tx.nonce] = updatedPayload;
    } else {
      let payload = {
        status: "Pending",
        toAddress: tx.to,
        fromAddress: tx.from,
        value: tx.value,
        hash: tx.hash,
        nonce: tx.nonce,
        asset: "WEI",
      };
      newTransactions[tx.nonce] = payload;
    }
    setTransactions(newTransactions);
    transactionsRef.current = newTransactions; // Update the reference
  };

  // Callback function for handling mined transactions
  const minedCb = async (tx) => {
    let { transaction } = tx;
    let { blockNumber, from, to, nonce } = transaction;
    let txData = await getTransactionData(from, to, blockNumber, chain);
    let { asset, value, category, metadata } = txData;

    let newTransactions = { ...transactionsRef.current };
    let oldPayload = newTransactions[nonce];

    let status;
    if (oldPayload && oldPayload?.status === "Cancelled") {
      status = "Cancelled";
    } else if (from.toLowerCase() === myAddress.toLowerCase()) {
      status = "Sent";
    } else if (!oldPayload && txData) {
      status = "Received";
      oldPayload = {
        toAddress: txData.to,
        fromAddress: txData.from,
        value: txData.value,
        hash: txData.hash,
        nonce: txData.nonce,
      };
    }

    let updatedPayload = {
      ...oldPayload,
      status: status,
      timestamp: metadata.blockTimestamp,
      asset: asset,
      value: value,
      category: category,
    };

    newTransactions[nonce] = updatedPayload;
    setTransactions(newTransactions);
    transactionsRef.current = newTransactions; // Update the reference
  };

  // This hook is used for setting the user's wallet address once it is available from the props
  useEffect(() => {
    if (walletAddress?.length) setMyAddress(walletAddress);
  }, [walletAddress]);

  // This hook is used for setting the user's wallet address once it is available from wallet connect
  useEffect(() => {
    if (address?.length && isConnected) setMyAddress(address);
  }, [address]);

  // This hook is used to esteblish WebSocket subscriptions using Alchemy's Subscription API to receive real-time updates about events on the blockchain
  useEffect(() => {
    const settings = {
      apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
      network: Network[chain],
    };

    const alchemy = new Alchemy(settings);

    // Here we subscribe for the PENDING_TRANSACTIONS events for myAddress
    alchemy.ws.on(
      {
        method: AlchemySubscription.PENDING_TRANSACTIONS,
        fromAddress: myAddress,
      },
      (tx) => pendingCb(tx)
    );

    // Here we subscribe for the MINED_TRANSACTIONS events for myAddress
    alchemy.ws.on(
      {
        method: AlchemySubscription.MINED_TRANSACTIONS,
        addresses: [
          {
            from: myAddress,
          },
          {
            to: myAddress,
          },
        ],
        includeRemoved: true,
        hashesOnly: false,
      },
      (tx) => minedCb(tx)
    );

    // Cleanup function to disconnect on the component unmount
    return () => {
      alchemy.ws.off();
    };
  }, [myAddress]); // Rerun the effect whenever myAddress changes

  return (
    <div className={styles.tx_history_container}>
      <div className={styles.header_container}>
        <div className={styles.name}>
          {myAddress?.slice(0, 6) +
            "..." +
            myAddress?.slice(myAddress.length - 4)}
        </div>
      </div>

      <div className={styles.table_container}>
        <div className={styles.table}>
          <div className={styles.column}>
            <div className={styles.row}>
              <span className={styles.title}>STATUS</span>
            </div>
            <hr />
            {orderedTransactions.map((tx, i) => {
              let color = styles.blue_text;
              if (tx.status === "Sent") {
                color = styles.green_text;
              } else if (tx.status === "Cancelled") {
                color = styles.red_text;
              }
              return (
                <div key={i} className={styles.row}>
                  <span className={color}>{tx.status}</span>
                </div>
              );
            })}
          </div>
          <div className={styles.column}>
            <div className={styles.row}>
              <span className={styles.title}>TX HASH</span>
            </div>
            <hr />
            {orderedTransactions.map((tx, i) => {
              return (
                <div key={i} className={styles.row}>
                  <span className={styles.blue_text}>
                    {tx.hash.slice(0, 6)}...{tx.hash.slice(6, 10)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className={styles.column}>
            <div className={styles.row}>
              <span className={styles.title}>FROM</span>
            </div>
            <hr />
            {orderedTransactions.map((tx, i) => {
              return (
                <div key={i} className={styles.row}>
                  <span className={styles.blue_text}>
                    {tx.fromAddress.slice(0, 6)}...
                    {tx.fromAddress.slice(tx.fromAddress.length - 4)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className={styles.column}>
            <div className={styles.row}>
              <span className={styles.title}>TO</span>
            </div>
            <hr />
            {orderedTransactions.map((tx, i) => {
              return (
                <div key={i} className={styles.row}>
                  <span className={styles.blue_text}>
                    {tx.toAddress.slice(0, 6)}...
                    {tx.toAddress.slice(tx.toAddress.length - 4)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className={styles.column}>
            <div className={styles.row}>
              <span className={styles.title}>DATE TIME (UTC)</span>
            </div>
            <hr />
            {orderedTransactions.map((tx, i) => {
              const newDateStr = tx?.timestamp
                ? new Date(tx?.timestamp)
                    .toISOString()
                    .replace("T", " ")
                    .slice(0, -5)
                : "";
              return (
                <div key={i} className={styles.row}>
                  {newDateStr}
                </div>
              );
            })}
          </div>
          <div className={styles.column}>
            <div className={styles.row}>
              <span className={styles.title}>TOKEN TYPE</span>
            </div>
            <hr />
            {orderedTransactions.map((tx, i) => {
              return (
                <div key={i} className={styles.row}>
                  {tx?.category || ""}
                </div>
              );
            })}
          </div>
          <div className={styles.column}>
            <div className={styles.row}>
              <span className={styles.title}>VALUE</span>
            </div>
            <hr />
            {orderedTransactions.map((tx, i) => {
              return (
                <div key={i} className={styles.row}>
                  {(tx.value * 100) / 100} {tx?.asset || "ETH"}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
