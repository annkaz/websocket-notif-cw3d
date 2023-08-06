# Real-time Toast Notification Component for CW3D

The Real-time Toast Notification component is meant to be added to your dapp to notify users about real-time state of their transactions. The component opens WebSocket connection using Alchemy's Subscription API. It subscribes to PENDING_TRANSACTIONS and MINED_TRANSACTIONS. Checkout Alchemy's docs for more [`Subscription API Endpoints`](https://docs.alchemy.com/reference/subscription-api-endpoints)

## Step by step tutorial on how to implement Real-Time Toast Notifications in your dapp

#### Step 1. In your terminal run the following command:`npx create-web3-dapp@latest`

#### Step 2. Create files

For real-time Toast Notification Component:

1.  Create a new environment variable in your .env.local file named NEXT_PUBLIC_ALCHEMY_API_KEY and assign your Alchemy API key as its value. This will make the key available to the frontend code in the Next.js application.
2.  In /components create toastNotification.jsx
3.  In /styles create ToastNotification.module.css
4.  Copy the corresponding code from this repo into each of the created files above.

For real-time Transactions History Display:

1.  Create a new environment variable in your .env.local file named NEXT_PUBLIC_ALCHEMY_API_KEY and assign your Alchemy API key as its value. This will make the key available to the frontend code in the Next.js application.
2.  In /components create realTimeTransactionHistory.jsx
3.  In /styles create RealTimeTransactionHistory.module.css
4.  In /pages/api create getTransaction.js
5.  Copy the corresponding code from this repo into each of the created files above.

For real-time Toast Notification Component using react-tostify:

1.  Create a new environment variable in your .env.local file named NEXT_PUBLIC_ALCHEMY_API_KEY and assign your Alchemy API key as its value. This will make the key available to the frontend code in the Next.js application.
2.  Install react-tostify npm package by running `npm i react-toastify`
3.  In /components create transactionsNotification.jsx
4.  Copy the corresponding code from this repo into each of the created files above.

#### Step 3: Implement

For real-time Notification Toast Component:

1.  Import the `ToastNotification` component at the top `import ToastNotification from "../components/toastNotification"` of a page or component
2.  Add the `ToastNotification` component to the return statement and pass in the props as parameters: `return <ToastNotification walletAddress={walletOrCollectionAddress} chain={chain} />`

For real-time Transactions History Display:

1.  Import the `RealTimeTransactionHistory` component at the top `import RealTimeTransactionHistory from "../components/realTimeTransactionHistory"` of a page or component
2.  Add the `RealTimeTransactionHistory` component to the return statement and pass in the props as parameters: `return <RealTimeTransactionHistory walletAddress={walletOrCollectionAddress} chain={chain} />`

For real-time Notification Toast Component using react-tostify:

1.  Import the `TransactionNotification` component at the top `import TransactionNotification from "../components/TransactionNotification"` of a page or component
2.  Add the `TransactionNotification` component to the return statement and pass in the props as parameters: `return <TransactionNotification walletAddress={walletOrCollectionAddress} chain={chain} />`

#### Step 4. Protect your API Keys

To avoid unintended use of the API Key, you can setup an allowlist within your Alchemy dashboard, specifying what domains, contract addresses, wallet addresses, or IP addresses are able to send requests. [`Learn more`](https://docs.alchemy.com/docs/best-practices-when-using-alchemy#7-protecting-your-api-keys)

### Setup and installation

1. Install all the necessary dependencies in the project directory:

```
npm install
```

2. Update environmental variables at .env.local in the project root folder:

```
ALCHEMY_API_KEY=your-api-key
NEXT_PUBLIC_WC_PROJECT_ID=your-wallet-connect-projectId
```

### Running the Project

1. Inside the project folder, start the local development server:
   ```
   npm run dev
   ```
2. Open your browser and navigate to [`http://localhost:3000/`](http://localhost:3000/) to view the dApp in action.

### Future Improvements: Secure WebSocket Handling and API Key Protection

Alchemy offers built-in protections, like an allowlist, to secure API keys used in frontend-only applications. However, for even more security, you might consider an alternative approach that keeps sensitive API keys server-side.

Our current setup involves the client-side component communicating directly with Alchemy via the WebSockets API, which requires the API key on the client-side. A more secure method involves setting up a bridge server:

1. Set up an API endpoint on your server that initiates a WebSocket connection to Alchemy. This keeps the API key on the server-side.

2. Make this endpoint listen for Alchemy events and push necessary data to your client-side app when these events occur.

3. In your client-side app (e.g., the Toast Notification Component), set up a WebSocket connection to your new server-side endpoint.

This approach keeps API keys on the server-side and only involves client-server communications, not direct connections to Alchemy. Although more complex and requiring careful WebSocket management, it provides an additional security layer by minimizing the exposure of sensitive keys
