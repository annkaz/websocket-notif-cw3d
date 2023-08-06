import { useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { Alchemy, Network, AlchemySubscription } from "alchemy-sdk";
import styles from "../styles/ToastNotification.module.css";

// Custom Toast component
const Toast = ({ header, message, onClose, type }) => {
  useEffect(() => {
    if (type === "pending") return; //close manually
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // auto close after 5s
    return () => clearTimeout(timer); // clear timer if component unmounts
  }, [onClose, type]);

  return (
    <div className={styles.toast_container}>
      <div className={styles.content_style}>
        <h4>{header}</h4>
        <div>{message}</div>
      </div>
      <button className={styles.close_button} onClick={onClose}>
        x
      </button>
    </div>
  );
};

const truncateString = (str, startLength = 6, endLength = 4) => {
  if (!str) return "";
  return `${str.substring(0, startLength)}...${str.substring(
    str.length - endLength
  )}`;
};

export default function ToastNotification({ walletAddress, chain }) {
  const [myAddress, setMyAddress] = useState();
  const { address, isConnected } = useAccount();

  const [toasts, setToasts] = useState([]);

  // Create a ref to hold the latest toasts state to avoid stale state in some cases
  const toastsRef = useRef(toasts);

  // Update the ref whenever toasts changes
  useEffect(() => {
    toastsRef.current = toasts;
  }, [toasts]);

  const addOrUpdateToast = (toastId, header, message, type) => {
    const newToast = { toastId, header, message, type };
    setToasts([...toasts, newToast]);
  };

  const removeToast = (toastId) => {
    setToasts(toasts.filter((toast) => toast.toastId !== toastId));
  };

  const pendingCb = (tx) => {
    const { to, nonce } = tx;
    let type = "pending";
    let header = "Pending transaction";
    let message = `Pending transaction to: ${truncateString(to)}`;

    if (toastsRef.current.find((toast) => toast.toastId === nonce)) {
      //This means we got cancellation transaction
      type = "cancelled";
      header = "Cancelled transaction";
      message = `Cancelled transaction to: ${truncateString(to)}`;
    }
    addOrUpdateToast(nonce, header, message, type, to);
  };

  const minedCb = (tx) => {
    const { transaction } = tx;
    const { nonce, to, from } = transaction;
    let type = "sent";
    let header = "Sent transaction";
    let message = `Sent transaction to: ${truncateString(to)}`;

    if (myAddress.toLowerCase() === to.toLowerCase()) {
      type = "received";
      header = "Received transaction";
      message = `Received transaction from: ${truncateString(from)}`;
    }
    addOrUpdateToast(nonce, header, message, type);
  };

  // This hook is used for setting the user's wallet address once it is available from the props
  useEffect(() => {
    if (walletAddress?.length) setMyAddress(walletAddress);
  }, [walletAddress]);

  // This hook is used for setting the user's wallet address once it is available from wallet connect
  useEffect(() => {
    if (address?.length && isConnected) setMyAddress(address);
  }, [address, isConnected]);

  // This hook is used to esteblish WebSocket connection using Alchemy's Subscription API to receive real-time updates about events on the blockchain
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
    <div className={styles.toasts_container}>
      {toasts.map(({ toastId, header, message, type }) => (
        <Toast
          key={toastId}
          header={header}
          message={message}
          type={type}
          onClose={() => removeToast(toastId)}
        />
      ))}
    </div>
  );
}
