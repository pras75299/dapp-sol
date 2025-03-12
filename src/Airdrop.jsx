import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useState, useEffect } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export function Airdrop() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);

  async function getBalance() {
    if (!wallet.publicKey) return;
    try {
      const balance = await connection.getBalance(wallet.publicKey);
      setBalance(balance / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error("Error getting balance:", error);
    }
  }

  useEffect(() => {
    getBalance();
    // Set up an interval to refresh balance every 2 seconds
    const intervalId = setInterval(getBalance, 10000);
    return () => clearInterval(intervalId);
  }, [wallet.publicKey, connection]);

  async function sendAirdropToUser() {
    if (!wallet.publicKey) {
      alert("Please connect your wallet first!");
      return;
    }

    const amount = document.getElementById("amount").value;
    if (!amount || isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount!");
      return;
    }

    try {
      setLoading(true);
      const lamports = amount * LAMPORTS_PER_SOL;

      console.log(
        `Requesting ${amount} SOL (${lamports} lamports) to ${wallet.publicKey.toString()}`
      );

      const signature = await connection.requestAirdrop(
        wallet.publicKey,
        lamports
      );

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(
        signature,
        "confirmed"
      );

      if (confirmation.value.err) {
        throw new Error("Transaction failed!");
      }

      alert(
        `Airdrop of ${amount} SOL successful!\nTransaction signature: ${signature}`
      );

      // Refresh balance after successful airdrop
      await getBalance();
    } catch (error) {
      console.error("Airdrop failed:", error);
      alert(
        "Airdrop failed! This could be due to:\n- Rate limiting\n- Network issues\n- Insufficient devnet funds\nPlease try again with a smaller amount or wait a few minutes."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="airdrop-container">
      {wallet.publicKey ? (
        <>
          <div className="wallet-info">
            <label>Public Key</label>
            <div className="wallet-address">{wallet.publicKey.toString()}</div>
            <div className="balance-info">
              <label>Balance</label>
              <div className="balance-amount">{balance.toFixed(4)} SOL</div>
            </div>
          </div>
        </>
      ) : (
        <p>Please connect your wallet</p>
      )}
      <input
        type="text"
        placeholder="Enter SOL (max 2 SOL)"
        id="amount"
        disabled={loading}
      />
      <button
        onClick={sendAirdropToUser}
        disabled={loading || !wallet.publicKey}
      >
        {loading ? "Processing..." : "Airdrop"}
      </button>
    </div>
  );
}
