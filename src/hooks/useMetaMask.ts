import { useCallback, useEffect, useState } from "react";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function useMetaMask() {
  const [isInstalled, setIsInstalled] = useState<boolean>(
    typeof window !== "undefined" && !!window.ethereum
  );
  const [accounts, setAccounts] = useState<string[]>([]);
  const [connected, setConnected] = useState<boolean>(false);
  const [chainId, setChainId] = useState<string | null>(null);
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const handleAccountsChanged = useCallback((accs: string[]) => {
    console.log("🔄 handleAccountsChanged called with:", accs);
    const newAccounts = accs || [];
    const newConnected = Array.isArray(newAccounts) && newAccounts.length > 0;
    const newCurrentAccount = newAccounts.length > 0 ? newAccounts[0] : null;
    
    // console.log("📝 Setting accounts:", newAccounts);
    // console.log("🔗 Setting connected:", newConnected);
    // console.log("👤 Setting currentAccount:", newCurrentAccount);
    
    setAccounts(newAccounts);
    setConnected(newConnected);
    setCurrentAccount(newCurrentAccount);
  }, []);

  const handleChainChanged = useCallback((id: string) => {
    setChainId(id);
  }, []);

  useEffect(() => {
    setIsInstalled(typeof window !== "undefined" && !!window.ethereum);

    if (!window?.ethereum) return;

    const eth = window.ethereum;
    
    // Check if listeners are already added
    if (eth._reviveListenersAdded) return;
    eth._reviveListenersAdded = true;

    try {
      // Read initial accounts (may be empty)
      eth.request({ method: "eth_accounts" }).then((accs: string[]) => {
        handleAccountsChanged(accs);
      });

      eth.request({ method: "eth_chainId" }).then((id: string) => {
        setChainId(id);
      });

      eth.on && eth.on("accountsChanged", handleAccountsChanged);
      console.log("🎧 Added accountsChanged listener");
      eth.on && eth.on("chainChanged", handleChainChanged);
      console.log("🎧 Added chainChanged listener");

      // Also check for account changes when window regains focus
      const handleFocus = () => {
        eth.request({ method: "eth_accounts" }).then((accs: string[]) => {
          const currentAccs = accs || [];
          const currentAddr = currentAccs.length > 0 ? currentAccs[0] : null;
          if (currentAddr !== currentAccount) {
            console.log("Account changed on focus:", currentAddr);
            handleAccountsChanged(currentAccs);
          }
        });
      };

      window.addEventListener("focus", handleFocus);
      
      // Store the cleanup function
      eth._reviveCleanup = () => {
        window.removeEventListener("focus", handleFocus);
      };
    } catch (error) {
      console.warn("useMetaMask init error", error);
    }

    return () => {
      try {
        if (eth._reviveListenersAdded) {
          window.ethereum?.removeListener?.(
            "accountsChanged",
            handleAccountsChanged
          );
          window.ethereum?.removeListener?.("chainChanged", handleChainChanged);
          if (eth._reviveCleanup) {
            eth._reviveCleanup();
          }
          eth._reviveListenersAdded = false;
        }
      } catch (e) {
        // ignore
      }
    };
  }, [handleAccountsChanged, handleChainChanged]);

  const connect = useCallback(async () => {
    if (!window?.ethereum) throw new Error("MetaMask is not installed");
    try {
      const accs: string[] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      handleAccountsChanged(accs);
      const id: string = await window.ethereum.request({
        method: "eth_chainId",
      });
      setChainId(id);
      return accs;
    } catch (error) {
      throw error;
    }
  }, [handleAccountsChanged]);

  const disconnect = useCallback(() => {
    // MetaMask doesn't provide a programmatic disconnect. We clear local state.
    setAccounts([]);
    setConnected(false);
    setCurrentAccount(null);
  }, []);

  const refresh = useCallback(() => {
    console.log("useMetaMask refresh called, current trigger:", refreshTrigger);
    setRefreshTrigger(prev => prev + 1);
    console.log("useMetaMask refresh trigger updated to:", refreshTrigger + 1);
  }, [refreshTrigger]);

  return {
    isInstalled,
    accounts,
    connected,
    chainId,
    currentAccount,
    refreshTrigger,
    connect,
    disconnect,
    refresh,
  };
}

export default useMetaMask;
