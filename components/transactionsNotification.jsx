import { useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { Alchemy, Network, AlchemySubscription } from "alchemy-sdk";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ToastContent = ({ header, message }) => (
  <div>
    <h4>{header}</h4>
    <p>{message}</p>
  </div>
);

const truncateString = (str, startLength = 6, endLength = 4) => {
  if (!str) return "";
  return `${str.substring(0, startLength)}...${str.substring(
    str.length - endLength
  )}`;
};

export default function TransactionNotification({ walletAddress, chain }) {
  // This avoids Next.js dehydration
  const [myAddress, setMyAddress] = useState();
  const { address, isConnected } = useAccount();
  // This maintains a mapping of txHash to toastId
  const toastIdsRef = useRef({});

  // Define callback functions to call for pending and mined events
  const pendingCb = (tx) => {
    const { to, nonce } = tx;
    if (toastIdsRef.current[nonce]) {
      //This means we got cancellation transaction
      const toastId = toastIdsRef.current[nonce];
      let message = `Cancelled transaction to: ${truncateString(to)}`;
      toast.update(toastId, {
        render: (
          <ToastContent header="Cancelled transaction" message={message} />
        ),
        type: "error",
        isLoading: false,
        autoClose: 5000,
        closeButton: true,
      });
    } else {
      let message = `Pending transaction to: ${truncateString(to)}`;
      const toastId = toast.loading(
        <ToastContent header="Pending transaction" message={message} />,
        { autoClose: false, closeButton: true }
      );
      toastIdsRef.current[nonce] = toastId;
    }
  };

  const minedCb = (tx) => {
    const { transaction } = tx;
    const { nonce, to } = transaction;
    const toastId = toastIdsRef.current[nonce];
    const message = `Sent transaction to: ${truncateString(to)}`;
    toast.update(toastId, {
      render: <ToastContent header="Confirmed transaction" message={message} />,
      type: "success",
      isLoading: false,
      autoClose: 5000,
      closeButton: true,
    });
  };

  // This hook is used for setting the user's wallet address once it is available from the props
  useEffect(() => {
    if (walletAddress?.length) setMyAddress(walletAddress);
  }, [walletAddress]);

  // This hook is used for setting the user's wallet address once it is available from wallet connect
  useEffect(() => {
    if (address?.length && isConnected) setMyAddress(address);
  }, [address]);

  // This hook is used to esteblish WebSocket subscriptions using the Alchemy API to receive real-time updates about events on the blockchain
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
      Object.values(toastIdsRef.current).forEach((toastId) =>
        toast.dismiss(toastId)
      );
      alchemy.ws.off();
    };
  }, [myAddress]); // Rerun the effect whenever myAddress changes

  return (
    <ToastContainer
      position="bottom-right"
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      draggable
      pauseOnHover
      theme="light"
      autoClose={5000}
    />
  );
}
