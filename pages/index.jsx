import styles from "../styles/Home.module.css";
import { useState } from "react";
import TransactionNotification from "../components/transactionsNotification";
import RealTimeTransactionHistory from "../components/realTimeTransactionHistory";
import ToastNotification from "../components/toastNotification";

export default function Home() {
  const [chain, setChain] = useState(process.env.NEXT_PUBLIC_ALCHEMY_NETWORK);
  const [walletOrCollectionAddress, setWalletOrCollectionAddress] =
    useState("vitalik.eth");

  return (
    <div>
      <main className={styles.main}>
        <RealTimeTransactionHistory
          walletAddress={walletOrCollectionAddress}
          chain={chain}
        />
        <ToastNotification
          walletAddress={walletOrCollectionAddress}
          chain={chain}
        />
        <TransactionNotification
          walletAddress={walletOrCollectionAddress}
          chain={chain}
        />
      </main>
    </div>
  );
}
