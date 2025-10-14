import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import { Button } from "../components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Input, Label } from "../components/ui/Input";
import { useMetaMaskContext } from "../providers/MetaMaskProvider";
import { useToast } from "../components/Toast";

// Contract address
const CONTRACT_ADDRESS = '0xf0c9ae5bFd3c8B4bBA39c91EB0df17790b9E5a2F';

// Prediction Market contract ABI
const predictionMarketABI = [
  {
    inputs: [
      { internalType: "string", name: "_question", type: "string" },
      { internalType: "string[]", name: "_outcomes", type: "string[]" },
      { internalType: "uint256", name: "_spread", type: "uint256" },
      { internalType: "uint256[]", name: "_initialLiquidity", type: "uint256[]" },
    ],
    name: "createMarket",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "getMarkets",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_marketId", type: "uint256" }],
    name: "getMarket",
    outputs: [
      { internalType: "string", name: "question", type: "string" },
      { internalType: "string[]", name: "outcomes", type: "string[]" },
      { internalType: "uint256[]", name: "prices", type: "uint256[]" },
      { internalType: "bool", name: "resolved", type: "bool" },
      { internalType: "uint256", name: "winningOutcome", type: "uint256" },
      { internalType: "address", name: "creator", type: "address" },
      { internalType: "uint256", name: "spread", type: "uint256" },
      { internalType: "uint256", name: "totalLiquidity", type: "uint256" },
      { internalType: "uint256", name: "creatorFees", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_marketId", type: "uint256" },
      { internalType: "uint256", name: "_outcome", type: "uint256" },
      { internalType: "uint256", name: "_amount", type: "uint256" },
    ],
    name: "buy",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_marketId", type: "uint256" },
      { internalType: "uint256", name: "_outcome", type: "uint256" },
      { internalType: "uint256", name: "_shares", type: "uint256" },
    ],
    name: "sell",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_marketId", type: "uint256" }],
    name: "getMarketShares",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_marketId", type: "uint256" },
      { internalType: "address", name: "_user", type: "address" },
    ],
    name: "getUserShares",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "test",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_marketId", type: "uint256" },
      { internalType: "uint256", name: "_winningOutcome", type: "uint256" },
    ],
    name: "resolveMarket",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_marketId", type: "uint256" }],
    name: "claimWinnings",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "claimFees",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_marketId", type: "uint256" }],
    name: "claimCreatorFees",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "accumulatedFees",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_marketId", type: "uint256" }],
    name: "removeMarket",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];


// Paseo Passet Hub network
const PASEO_ASSET_HUB = {
  chainId: "0x190f1b46",
  chainName: "Paseo Passet Hub",
  nativeCurrency: {
    name: "PAS",
    symbol: "PAS",
    decimals: 10,
  },
  rpcUrls: ["https://testnet-passet-hub-eth-rpc.polkadot.io"],
  blockExplorerUrls: [
    "https://blockscout-passet-hub.parity-testnet.parity.io/",
  ],
};

interface Market {
  id: number;
  question: string;
  outcomes: string[];
  prices: number[];
  resolved: boolean;
  winningOutcome?: number;
  creator: string;
  spread: number;
  totalLiquidity: number;
  creatorFees: number;
  userShares?: number[]; // shares owned by current user
  totalShares?: number[]; // total shares outstanding for each outcome
}

export default function PredictionMarket() {
  const { connected, chainId, accounts, currentAccount, refreshTrigger, refresh } = useMetaMaskContext();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [newQuestion, setNewQuestion] = useState<string>("");
  const [newOutcomes, setNewOutcomes] = useState<string>("");
  const [newFee, setNewFee] = useState<string>("1");
  const [initialLiquidity, setInitialLiquidity] = useState<string[]>([]);
  const [userBalance, setUserBalance] = useState<string>("0");
  const [userAddress, setUserAddress] = useState<string>("");
  const [accumulatedFees, setAccumulatedFees] = useState<string>("0");

  const { showToast } = useToast();

  const isCorrectNetwork = chainId === PASEO_ASSET_HUB.chainId;

  useEffect(() => {
    console.log("Market useEffect triggered:", { connected, isCorrectNetwork, currentAccount, refreshTrigger });
    // Clear data when account changes or disconnects
    setMarkets([]);
    setUserBalance("0");
    setUserAddress("");
    setAccumulatedFees("0");
    
    if (connected && isCorrectNetwork && currentAccount) {
      fetchMarkets();
    }
  }, [connected, isCorrectNetwork, currentAccount, refreshTrigger]);

  // Initialize initial liquidity when outcomes change
  useEffect(() => {
    const outcomes = newOutcomes.split(",").map(o => o.trim()).filter(o => o.length > 0);
    if (outcomes.length > 0 && initialLiquidity.length !== outcomes.length) {
      // Initialize with minimum liquidity of 10 for each outcome
      setInitialLiquidity(outcomes.map(() => "10"));
    }
  }, [newOutcomes, initialLiquidity.length]);

  const switchToPaseoAssetHub = async () => {
    if (!(window as any).ethereum) {
      setError("MetaMask not detected in this browser");
      return;
    }

    try {
      await (window as any).ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: PASEO_ASSET_HUB.chainId }],
      });
      setError("");
    } catch (switchError: any) {
      if (switchError?.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: "wallet_addEthereumChain",
            params: [PASEO_ASSET_HUB],
          });
          setError("");
        } catch (addError: any) {
          console.error("Failed to add chain to MetaMask:", addError);
          setError(
            `Failed to add network to MetaMask: ${
              addError?.message || addError
            }`
          );
        }
      } else {
        console.error("Failed to switch network:", switchError);
        setError(
          `Failed to switch network: ${switchError?.message || switchError}`
        );
      }
    }
  };

  const getProvider = () => {
    if (!(window as any).ethereum) {
      throw new Error("MetaMask not detected.");
    }
    return new ethers.BrowserProvider((window as any).ethereum);
  };

  const getSigner = async () => {
    const provider = getProvider();
    return provider.getSigner();
  };

  const getContract = async (withSigner = false) => {
    const provider = getProvider();
    return new ethers.Contract(CONTRACT_ADDRESS, predictionMarketABI, provider);
  };  const fetchMarkets = async () => {
    try {
      // console.log("Fetching markets for account:", currentAccount);
      if (!currentAccount) {
        // console.log("No current account, skipping fetch");
        return;
      }
      
      const contract = await getContract();
      const userAddress = currentAccount;
      setUserAddress(userAddress);
      const testResult = await contract.test();
      // console.log("Test result:", testResult);
      const marketIds = await contract.getMarkets();
      const marketPromises = marketIds.map(async (id: any) => {
        const [question, outcomes, prices, resolved, winningOutcome, creator, spread, totalLiquidity, creatorFees] = await contract.getMarket(id);
        
        // Filter out deleted markets (markets with empty question are considered deleted)
        if (question === "") {
          return null;
        }
        
        const userShares = await contract.getUserShares(id, userAddress);
        const totalShares = await contract.getMarketShares(id);
        return {
          id: Number(id),
          question,
          outcomes,
          prices: prices.map((p: any) => Number(p) / 1e8), // Display in PAS
          resolved,
          winningOutcome: resolved ? Number(winningOutcome) : undefined,
          creator,
          spread: Number(spread),
          totalLiquidity: Number(totalLiquidity), // Already in PAS units
          creatorFees: Number(creatorFees) / 1e8, // Display in PAS
          userShares: userShares.map((s: any) => Number(s)),
          totalShares: totalShares.map((s: any) => Number(s)),
        };
      });
      const fetchedMarkets = (await Promise.all(marketPromises)).filter(market => market !== null);
      setMarkets(fetchedMarkets);

      // Get user balance
      const provider = getProvider();
      const balance = await provider.getBalance(userAddress);
      setUserBalance(ethers.formatEther(balance)); // Show in ether for now

      // Get accumulated fees
      const fees = await contract.accumulatedFees();
      setAccumulatedFees((Number(fees) / 1e8).toFixed(4));
    } catch (err: any) {
      console.error("Error fetching markets:", err);
      setError(`Failed to fetch markets: ${err.message || err.toString()}`);
    }
  };

  const handleCreateMarket = async () => {
    if (!newQuestion.trim() || !newOutcomes.trim()) return;

    const outcomes = newOutcomes.split(",").map(o => o.trim());

    // Validate spread
    const spreadValue = parseFloat(newFee);
    if (isNaN(spreadValue) || spreadValue < 1 || spreadValue > 10) {
      showToast({
        type: "error",
        message: "Invalid Spread",
        description: "Spread must be a number between 1% and 10%",
      });
      return;
    }

    // Validate initial liquidity
    if (initialLiquidity.length !== outcomes.length) {
      showToast({
        type: "error",
        message: "Invalid Liquidity",
        description: "You must provide liquidity for each outcome",
      });
      return;
    }

    const liquidityValues = initialLiquidity.map(l => parseFloat(l));
    const invalidLiquidity = liquidityValues.some(l => isNaN(l) || l < 10);
    if (invalidLiquidity) {
      showToast({
        type: "error",
        message: "Invalid Liquidity",
        description: "Each outcome must have at least 10 PAS liquidity",
      });
      return;
    }

    const totalLiquidity = liquidityValues.reduce((sum, l) => sum + l, 0);

    setLoading(true);
    setError("");
    try {
      console.log("Creating market...");
      const contract = await getContract();
      const signer = await getSigner();
      const contractWithSigner = contract.connect(signer);
      
      // Convert percentage to basis points
      const spreadInBasisPoints = Math.round(spreadValue * 100);
      
      // Send total liquidity as value
      const weiValue = (parseFloat(totalLiquidity) * 1e8).toString();
      const tx = await contractWithSigner.createMarket(newQuestion, outcomes, spreadInBasisPoints, liquidityValues.map(l => parseFloat(l)), { value: ethers.parseUnits(weiValue, 0) });
      await tx.wait();
      // console.log("Market created");
      setNewQuestion("");
      setNewOutcomes("");
      setNewFee("1");
      setInitialLiquidity([]);
      setShowCreateForm(false);
      await fetchMarkets();
    } catch (err: any) {
      console.error("Error creating market:", err);
      setError(`Failed to create market: ${err.message || err.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (marketId: number, outcome: number, amount: string) => {
    setLoading(true);
    setError("");
    try {
      // console.log("Buying shares...");
      const contract = await getContract();
      const signer = await getSigner();
      const contractWithSigner = contract.connect(signer);
      const weiAmount = (parseFloat(amount) * 1e8).toString();
      const tx = await contractWithSigner.buy(marketId, outcome, ethers.parseUnits(weiAmount, 0), { value: ethers.parseUnits(weiAmount, 0) });
      await tx.wait();
      // console.log("Shares bought");
      await fetchMarkets();
    } catch (err: any) {
      console.error("Error buying shares:", err);
      setError(`Failed to buy shares: ${err.message || err.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSell = async (marketId: number, outcome: number, shares: string) => {
    setLoading(true);
    setError("");
    try {
      // console.log("Selling shares...");
      const contract = await getContract();
      const signer = await getSigner();
      const contractWithSigner = contract.connect(signer);
      const tx = await contractWithSigner.sell(marketId, outcome, shares);
      await tx.wait();
      console.log("Shares sold");
      await fetchMarkets();
    } catch (err: any) {
      console.error("Error selling shares:", err);
      setError(`Failed to sell shares: ${err.message || err.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (marketId: number) => {
    setLoading(true);
    setError("");
    try {
      // console.log("Resolving market...");
      const contract = await getContract();
      const signer = await getSigner();
      const contractWithSigner = contract.connect(signer);
      const winningOutcome = prompt("Enter winning outcome index (0-based):");
      if (winningOutcome !== null) {
        const tx = await contractWithSigner.resolveMarket(marketId, parseInt(winningOutcome));
        await tx.wait();
        // console.log("Market resolved");
        await fetchMarkets();
      }
    } catch (err: any) {
      console.error("Error resolving market:", err);
      setError(`Failed to resolve market: ${err.message || err.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimWinnings = async (marketId: number) => {
    setLoading(true);
    setError("");
    try {
      // console.log("Claiming winnings...");
      const contract = await getContract();
      const signer = await getSigner();
      const contractWithSigner = contract.connect(signer);
      const tx = await contractWithSigner.claimWinnings(marketId);
      await tx.wait();
      // console.log("Winnings claimed");
      await fetchMarkets();
    } catch (err: any) {
      console.error("Error claiming winnings:", err);
      setError(`Failed to claim winnings: ${err.message || err.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimFees = async () => {
    setLoading(true);
    setError("");
    try {
      // console.log("Claiming accumulated fees...");
      const contract = await getContract();
      const signer = await getSigner();
      const contractWithSigner = contract.connect(signer);
      const tx = await contractWithSigner.claimFees();
      await tx.wait();
      // console.log("Fees claimed");
      await fetchMarkets(); // Refresh the accumulated fees display
    } catch (err: any) {
      console.error("Error claiming fees:", err);
      setError(`Failed to claim fees: ${err.message || err.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimCreatorFees = async (marketId: number) => {
    setLoading(true);
    setError("");
    try {
      // console.log("Claiming creator fees...");
      const contract = await getContract();
      const signer = await getSigner();
      const contractWithSigner = contract.connect(signer);
      const tx = await contractWithSigner.claimCreatorFees(marketId);
      await tx.wait();
      // console.log("Creator fees claimed");
      await fetchMarkets();
    } catch (err: any) {
      console.error("Error claiming creator fees:", err);
      setError(`Failed to claim creator fees: ${err.message || err.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMarket = async (marketId: number) => {
    setLoading(true);
    setError("");
    try {
      // console.log("Removing market...");
      const contract = await getContract();
      const signer = await getSigner();
      const contractWithSigner = contract.connect(signer);
      const tx = await contractWithSigner.removeMarket(marketId);
      await tx.wait();
      // console.log("Market removed");
      await fetchMarkets();
    } catch (err: any) {
      console.error("Error removing market:", err);
      setError(`Failed to remove market: ${err.message || err.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="container mx-auto px-6 py-8">
        <Card className="bg-blue-50">
          <CardHeader>
            <CardTitle>MetaMask not connected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Please connect your MetaMask wallet and switch to Paseo Passet Hub to use Revive Markets.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="gradient"
                onClick={async () => {
                  try {
                    await (window as any).ethereum.request({
                      method: "eth_requestAccounts",
                    });
                    setError("");
                  } catch (e: any) {
                    console.error("MetaMask connect failed", e);
                    setError(e?.message || String(e));
                  }
                }}
              >
                Connect MetaMask
              </Button>

              <Button
                variant="outline"
                onClick={async () => {
                  await switchToPaseoAssetHub();
                }}
              >
                Switch Network
              </Button>
            </div>
            {error && <p className="text-red-500 mt-3">{error}</p>}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-white">Prediction Markets powered by Polkadot</h2>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? "Cancel" : "Create Market"}
        </Button>
      </div>

      {/* User Info Box */}
      <Card className="bg-blue-50">
        <CardHeader>
          <CardTitle>Your Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-blue-500">
            <p><strong>PAS Balance:</strong> {userBalance}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Button
                size="sm"
                onClick={handleClaimFees}
                disabled={loading || accumulatedFees === "0"}
              >
                Claim Platform Fees ({parseFloat(accumulatedFees).toFixed(4)} PAS)
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  // console.log("Manual refresh clicked");
                  refresh();
                }}
              >
                Refresh Data
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  if (window.ethereum) {
                    try {
                      const accs = await window.ethereum.request({ method: "eth_accounts" });
                      console.log("Manual account check:", accs);
                      if (accs && accs[0] !== currentAccount) {
                        console.log("Account mismatch detected, refreshing...");
                        refresh();
                      } else {
                        console.log("Account is current");
                      }
                    } catch (e) {
                      console.error("Failed to check accounts:", e);
                    }
                  }
                }}
              >
                Check Accounts
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {showCreateForm && (
        <Card className="bg-blue-50">
          <CardHeader>
            <CardTitle>Create New Market</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="market-question" className="text-gray-800">
                    Market Question
                  </Label>
                  <Input
                    id="market-question"
                    placeholder="e.g., Will Polkadot (DOT) reach the top 20 by end of year?"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    className="h-9 text-sm mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="outcomes" className="text-gray-800">
                    Outcomes
                  </Label>
                  <Input
                    id="outcomes"
                    placeholder="e.g., Yes, No"
                    value={newOutcomes}
                    onChange={(e) => setNewOutcomes(e.target.value)}
                    className="h-9 text-sm mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="spread" className="text-gray-800">
                    Spread (%)
                  </Label>
                  <Input
                    id="spread"
                    type="number"
                    placeholder="e.g., 2.5"
                    value={newFee}
                    onChange={(e) => setNewFee(e.target.value)}
                    min="1"
                    max="10"
                    step="0.1"
                    className="h-9 text-sm mt-1"
                  />
                </div>
              </div>
              
              {/* Initial Liquidity Section */}
              {newOutcomes.trim() && initialLiquidity.length > 0 && (
                <div>
                  <Label className="block text-sm font-medium text-gray-800 mb-2">
                    Initial Liquidity (minimum 10 PAS per outcome)
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {newOutcomes.split(",").map((outcome, index) => (
                      <div key={index}>
                        <Label htmlFor={`liquidity-${index}`} className="text-xs text-gray-700">
                          {outcome.trim()} (Liquidity)
                        </Label>
                        <Input
                          id={`liquidity-${index}`}
                          type="number"
                          placeholder="10"
                          value={initialLiquidity[index] || ""}
                          onChange={(e) => {
                            const newLiquidity = [...initialLiquidity];
                            newLiquidity[index] = e.target.value;
                            setInitialLiquidity(newLiquidity);
                          }}
                          min="10"
                          step="1"
                          className="h-8 text-sm mt-1"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Total Liquidity: {initialLiquidity.reduce((sum, liq) => sum + (parseFloat(liq) || 0), 0).toFixed(1)}
                  </p>
                </div>
              )}
              
              <Button onClick={handleCreateMarket} disabled={loading}>
                {loading ? "Creating..." : "Create Market"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {markets.map((market) => (
          <Card key={market.id} className="bg-blue-50 market-card">
            <CardHeader>
              <div className="market-header">
                <div className="market-title-section">
                  <CardTitle className="card-title">{market.question}</CardTitle>
                  <p className="market-meta">
                    Spread: {market.spread / 100}% | Liquidity: {market.totalLiquidity?.toFixed(4)} PAS
                  </p>
                </div>
                <div className="market-actions-header">
                  {(() => {
                    console.log(`Market ${market.id}: creator=${market.creator}, userAddress=${userAddress}, resolved=${market.resolved}, match=${market.creator.toLowerCase() === userAddress.toLowerCase()}`);
                    return market.creator.toLowerCase() === userAddress.toLowerCase() && !market.resolved;
                  })() && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolve(market.id)}
                      disabled={loading}
                    >
                      Resolve
                    </Button>
                  )}
                  {market.creator.toLowerCase() === userAddress.toLowerCase() && market.resolved && market.creatorFees > 0 && (
                    <Button
                      size="sm"
                      onClick={() => handleClaimCreatorFees(market.id)}
                      disabled={loading}
                    >
                      Fees ({market.creatorFees.toFixed(2)} PAS)
                    </Button>
                  )}
                  {market.creator.toLowerCase() === userAddress.toLowerCase() && market.resolved && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveMarket(market.id)}
                      disabled={loading}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <table className="w-full text-sm border-collapse market-table">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">Outcome</th>
                      <th className="text-left py-3 px-2">Price</th>
                      <th className="text-left py-3 px-2 hide-mobile">Total</th>
                      <th className="text-left py-3 px-2 hide-mobile">Yours</th>
                      <th className="text-left py-3 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {market.outcomes.map((outcome, index) => (
                      <React.Fragment key={`outcome-${index}`}>
                        {/* Data row */}
                        <tr className="border-b">
                          <td className="py-3 px-2 font-medium">{outcome}</td>
                          <td className="py-3 px-2">
                            {market.resolved 
                              ? (index === market.winningOutcome ? "1.0000" : "0.0000")
                              : (market.prices[index]?.toFixed(4) || "0.0000")
                            } PAS
                          </td>
                          <td className="py-3 px-2 hide-mobile">{market.totalShares ? market.totalShares[index] || 0 : 0}</td>
                          <td className="py-3 px-2 hide-mobile">{market.userShares ? market.userShares[index] || 0 : 0}</td>
                          <td className="py-3 px-2">
                            {market.resolved ? (
                              index === market.winningOutcome && market.userShares && market.userShares[index] > 0 && (
                                <Button
                                  size="sm"
                                  onClick={() => handleClaimWinnings(market.id)}
                                  disabled={loading}
                                >
                                  Claim
                                </Button>
                              )
                            ) : null}
                          </td>
                        </tr>
                        {/* Trading buttons row */}
                        {!market.resolved && (
                          <tr className="border-b border-gray-200">
                            <td colSpan={5} className="py-2 px-2">
                              <div className="flex gap-2 justify-start">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    const amount = prompt(`Buy ${outcome} - Amount in PAS:`);
                                    if (amount) handleBuy(market.id, index, amount);
                                  }}
                                  disabled={loading}
                                >
                                  Buy
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const shares = prompt(`Sell ${outcome} - Number of shares:`);
                                    if (shares) handleSell(market.id, index, shares);
                                  }}
                                  disabled={loading || !market.userShares || market.userShares[index] === 0}
                                >
                                  Sell
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
                {market.resolved && (
                  <p className="text-green-600">
                    Resolved: {market.outcomes[market.winningOutcome!]}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!isCorrectNetwork && (
        <p className="text-yellow-600">
          Please switch to the Paseo Passet Hub network to interact with Revive Markets.
        </p>
      )}
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}

// forge create --rpc-url https://testnet-passet-hub-eth-rpc.polkadot.io --chain 420420422 --private-key $PASEO_PRIVATE_KEY --resolc --broadcast src/contracts/Market.sol:PredictionMarket
