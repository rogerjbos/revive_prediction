import { ExternalLink, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { useTypink } from "typink";
import { useMetaMaskContext } from "../providers/MetaMaskProvider";
import { Button } from "./ui/Button";

export default function ConnectMetaMask() {
  // Use shared context from MetaMaskProvider so UI reflects a single source of truth
  const { isInstalled, accounts, connected, connect, disconnect, currentAccount, refresh } =
    useMetaMaskContext();

  const address = currentAccount;
  const { setConnectedAccount, connectedAccount } = useTypink();
  const [switchMessage, setSwitchMessage] = useState("");

  // Keep typink's connectedAccount in sync with MetaMask state
  useEffect(() => {
    if (connected && address) {
      if (connectedAccount?.address !== address) {
        setConnectedAccount({
          address,
          name: `${address.slice(0, 6)}...${address.slice(-4)}`,
          source: "metamask",
        } as any);
      }
    } else {
      if (connectedAccount?.source === "metamask") {
        // clear typink's connected account if MetaMask disconnected
        setConnectedAccount(undefined as any);
      }
    }
  }, [connected, address, setConnectedAccount, connectedAccount]);

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center">
          <Wallet className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="font-semibold text-white">MetaMask</div>
          <div className="text-xs text-gray-400">Ethereum wallet (EVM)</div>
        </div>
      </div>

      <div>
        {isInstalled ? (
          // Show either the connected address with actions or a prominent Connect button
          connected ? (
            <div className="flex items-center gap-2">
              <div className="text-sm text-green-400 max-w-[220px] truncate">
                {address}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  try {
                    // call provider disconnect if available then clear typink
                    disconnect && disconnect();
                    setConnectedAccount(undefined as any);
                  } catch (e) {
                    console.warn("MetaMask disconnect failed", e);
                  }
                }}
              >
                Disconnect
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const previousAddress = address;
                    try {
                      console.log("Attempting to switch accounts...");
                      
                      // Try to request permissions to trigger account selection
                      if (window.ethereum && window.ethereum.request) {
                        try {
                          await window.ethereum.request({
                            method: 'wallet_requestPermissions',
                            params: [{ eth_accounts: {} }],
                          });
                        } catch (e) {
                          console.log("wallet_requestPermissions failed, trying eth_requestAccounts");
                        }
                      }
                      
                      // Prompt MetaMask to request accounts (may not show dialog if already connected)
                      const accs = await connect();
                      console.log("MetaMask returned accounts:", accs);
                      
                      // Always refresh the data to ensure UI is up to date
                      console.log("Calling refresh after connect");
                      refresh();
                      
                      // Check if account actually changed
                      const newAddress = accs && accs[0];
                      if (newAddress && newAddress !== previousAddress) {
                        console.log("Account changed from", previousAddress, "to", newAddress);
                        setSwitchMessage("Account switched successfully!");
                        setTimeout(() => setSwitchMessage(""), 3000);
                      } else {
                        setSwitchMessage(
                          "To switch accounts: 1) Click the MetaMask extension, 2) Click your account avatar, 3) Select a different account, 4) Return to this app."
                        );
                      }
                    } catch (e) {
                      console.warn("Account switch failed", e);
                      setSwitchMessage(
                        "To switch accounts: Open MetaMask extension → Click account avatar → Select different account → Return here."
                      );
                    }
                  }}
                >
                  Switch Account
                </Button>
                {switchMessage && (
                  <div className="text-xs text-gray-400 ml-2">
                    {switchMessage}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              variant="gradient"
              onClick={async () => {
                try {
                  await connect();
                } catch (e) {
                  console.warn("MetaMask connect failed", e);
                }
              }}
              className="min-w-[96px]"
            >
              Connect
            </Button>
          )
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open("https://metamask.io/", "_blank")}
            className="min-w-[96px]"
          >
            Install <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
