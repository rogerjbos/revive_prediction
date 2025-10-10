import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Input, Label } from "../components/ui/Input";
import { useMetaMask } from "../hooks/useMetaMask";
import { useToast } from "../components/Toast";
import { PolkadotLogo } from "../components/PolkadotLogo";

// Prediction Market contract ABI
const predictionMarketABI = [
  {
    inputs: [
      { internalType: "string", name: "_question", type: "string" },
      { internalType: "string[]", name: "_outcomes", type: "string[]" },
      { internalType: "uint256", name: "_spread", type: "uint256" },
      { internalType: "uint256[]", name: "_initialPrices", type: "uint256[]" },
    ],
    name: "createMarket",
    outputs: [],
    stateMutability: "nonpayable",
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

// Contract address (placeholder)
const CONTRACT_ADDRESS = '0x8Be35F3d056c138a5Ceb32C82f1Bb5Bb305e0324';

// Paseo Asset Hub network
const PASEO_ASSET_HUB = {
  chainId: "0x190f1b46",
  chainName: "Paseo Asset Hub",
  nativeCurrency: {
    name: "PAS",
    symbol: "PAS",
    decimals: 18,
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
  userShares?: number[]; // shares owned by current user
}

export default function PredictionMarket() {
  const { connected, chainId } = useMetaMask();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [newQuestion, setNewQuestion] = useState<string>("");
  const [newOutcomes, setNewOutcomes] = useState<string>("");
  const [newFee, setNewFee] = useState<string>("1");
  const [initialPrices, setInitialPrices] = useState<string[]>([]);
  const [userBalance, setUserBalance] = useState<string>("0");
  const [userAddress, setUserAddress] = useState<string>("");
  const [accumulatedFees, setAccumulatedFees] = useState<string>("0");

  const { showToast } = useToast();

  const isCorrectNetwork = chainId === PASEO_ASSET_HUB.chainId;

  useEffect(() => {
    if (connected && isCorrectNetwork) {
      fetchMarkets();
    }
  }, [connected, isCorrectNetwork]);

  // Initialize initial prices when outcomes change
  useEffect(() => {
    const outcomes = newOutcomes.split(",").map(o => o.trim()).filter(o => o.length > 0);
    if (outcomes.length > 0 && initialPrices.length !== outcomes.length) {
      // Initialize with equal probabilities
      const equalPrice = (100 / outcomes.length).toFixed(1);
      setInitialPrices(outcomes.map(() => equalPrice));
    }
  }, [newOutcomes, initialPrices.length]);

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
      console.log("Fetching markets...");
      const contract = await getContract();
      const signer = await getSigner();
      const userAddress = await signer.getAddress();
      setUserAddress(userAddress);
      const testResult = await contract.test();
      console.log("Test result:", testResult);
      const marketIds = await contract.getMarkets();
      const marketPromises = marketIds.map(async (id: any) => {
        const [question, outcomes, prices, resolved, winningOutcome, creator, spread, totalLiquidity] = await contract.getMarket(id);
        
        // Filter out deleted markets (markets with empty question are considered deleted)
        if (question === "") {
          return null;
        }
        
        const userShares = await contract.getUserShares(id, userAddress);
        return {
          id: Number(id),
          question,
          outcomes,
          prices: prices.map((p: any) => Number(p) / 1e18), // Assuming prices in wei (PAS)
          resolved,
          winningOutcome: resolved ? Number(winningOutcome) : undefined,
          creator,
          spread: Number(spread),
          totalLiquidity: Number(totalLiquidity) / 1e18,
          userShares: userShares.map((s: any) => Number(s)),
        };
      });
      const fetchedMarkets = (await Promise.all(marketPromises)).filter(market => market !== null);
      setMarkets(fetchedMarkets);

      // Get user balance
      const provider = getProvider();
      const balance = await provider.getBalance(userAddress);
      setUserBalance(ethers.formatEther(balance));

      // Get accumulated fees
      const fees = await contract.accumulatedFees();
      setAccumulatedFees(ethers.formatEther(fees));
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

    // Validate initial prices
    if (initialPrices.length !== outcomes.length) {
      showToast({
        type: "error",
        message: "Invalid Prices",
        description: "You must provide a price for each outcome",
      });
      return;
    }

    const priceValues = initialPrices.map(p => parseFloat(p));
    const totalPrice = priceValues.reduce((sum, price) => sum + price, 0);
    if (Math.abs(totalPrice - 100) > 0.01) { // Allow small floating point errors
      showToast({
        type: "error",
        message: "Invalid Prices",
        description: "Initial prices must sum to 100%",
      });
      return;
    }

    setLoading(true);
    setError("");
    try {
      console.log("Creating market...");
      const contract = await getContract();
      const signer = await getSigner();
      const contractWithSigner = contract.connect(signer);
      
      // Convert percentage prices to wei (ether values)
      const pricesInWei = priceValues.map(price => ethers.parseEther((price / 100).toString()));
      
      // Convert percentage to basis points
      const spreadInBasisPoints = Math.round(spreadValue * 100);
      
      const tx = await contractWithSigner.createMarket(newQuestion, outcomes, spreadInBasisPoints, pricesInWei);
      await tx.wait();
      console.log("Market created");
      setNewQuestion("");
      setNewOutcomes("");
      setNewFee("1");
      setInitialPrices([]);
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
      console.log("Buying shares...");
      const contract = await getContract();
      const signer = await getSigner();
      const contractWithSigner = contract.connect(signer);
      const tx = await contractWithSigner.buy(marketId, outcome, ethers.parseEther(amount), { value: ethers.parseEther(amount) });
      await tx.wait();
      console.log("Shares bought");
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
      console.log("Selling shares...");
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
      console.log("Resolving market...");
      const contract = await getContract();
      const signer = await getSigner();
      const contractWithSigner = contract.connect(signer);
      const winningOutcome = prompt("Enter winning outcome index (0-based):");
      if (winningOutcome !== null) {
        const tx = await contractWithSigner.resolveMarket(marketId, parseInt(winningOutcome));
        await tx.wait();
        console.log("Market resolved");
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
      console.log("Claiming winnings...");
      const contract = await getContract();
      const signer = await getSigner();
      const contractWithSigner = contract.connect(signer);
      const tx = await contractWithSigner.claimWinnings(marketId);
      await tx.wait();
      console.log("Winnings claimed");
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
      console.log("Claiming accumulated fees...");
      const contract = await getContract();
      const signer = await getSigner();
      const contractWithSigner = contract.connect(signer);
      const tx = await contractWithSigner.claimFees();
      await tx.wait();
      console.log("Fees claimed");
      await fetchMarkets(); // Refresh the accumulated fees display
    } catch (err: any) {
      console.error("Error claiming fees:", err);
      setError(`Failed to claim fees: ${err.message || err.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMarket = async (marketId: number) => {
    setLoading(true);
    setError("");
    try {
      console.log("Removing market...");
      const contract = await getContract();
      const signer = await getSigner();
      const contractWithSigner = contract.connect(signer);
      const tx = await contractWithSigner.removeMarket(marketId);
      await tx.wait();
      console.log("Market removed");
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
        <Card>
          <CardHeader>
            <CardTitle>MetaMask not connected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Please connect your MetaMask wallet to use Revive Markets.
            </p>
            <div className="flex gap-3">
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
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <PolkadotLogo size={40} />
          <h2 className="text-2xl font-bold text-white">Prediction Markets powered by Polkadot</h2>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? "Cancel" : "Create Market"}
        </Button>
      </div>

      {/* User Info Box */}
      <Card>
        <CardHeader>
          <CardTitle>Your Account</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-white">
            <p><strong>PAS Balance:</strong> {parseFloat(userBalance).toFixed(4)} PAS</p>
            <Button
              size="sm"
              onClick={handleClaimFees}
              disabled={loading || accumulatedFees === "0"}
              className="mt-2"
            >
              Claim Platform Fees ({parseFloat(accumulatedFees).toFixed(4)} PAS)
            </Button>
          </div>
        </CardContent>
      </Card>

      {showCreateForm && (
        <Card>
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
                    placeholder="e.g., Will it rain tomorrow?"
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
              
              {/* Initial Prices Section */}
              {newOutcomes.trim() && initialPrices.length > 0 && (
                <div>
                  <Label className="block text-sm font-medium text-gray-800 mb-2">
                    Initial Prices (must sum to 100%)
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {newOutcomes.split(",").map((outcome, index) => (
                      <div key={index}>
                        <Label htmlFor={`price-${index}`} className="text-xs text-gray-700">
                          {outcome.trim()} (%)
                        </Label>
                        <Input
                          id={`price-${index}`}
                          type="number"
                          placeholder="0.0"
                          value={initialPrices[index] || ""}
                          onChange={(e) => {
                            const newPrices = [...initialPrices];
                            newPrices[index] = e.target.value;
                            setInitialPrices(newPrices);
                          }}
                          min="0"
                          max="100"
                          step="0.1"
                          className="h-8 text-sm mt-1"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Current sum: {initialPrices.reduce((sum, price) => sum + (parseFloat(price) || 0), 0).toFixed(1)}%
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {markets.map((market) => (
          <Card key={market.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{market.question}</CardTitle>
                  <p className="text-sm text-gray-600">Spread: {market.spread / 100}% | Liquidity: {market.totalLiquidity?.toFixed(4)} PAS</p>
                </div>
                <div className="flex gap-2">
                  {market.creator === userAddress && !market.resolved && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolve(market.id)}
                      disabled={loading}
                    >
                      Resolve
                    </Button>
                  )}
                  {market.creator === userAddress && market.resolved && (
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
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Outcome</th>
                      <th className="text-left py-2">Price</th>
                      <th className="text-left py-2">Position</th>
                      <th className="text-left py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {market.outcomes.map((outcome, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{outcome}</td>
                        <td className="py-2">{market.prices[index]?.toFixed(4)} PAS</td>
                        <td className="py-2">{market.userShares ? market.userShares[index] || 0 : 0}</td>
                        <td className="py-2">
                          {market.resolved ? (
                            index === market.winningOutcome && market.userShares && market.userShares[index] > 0 && (
                              <Button
                                size="sm"
                                onClick={() => handleClaimWinnings(market.id)}
                                disabled={loading}
                              >
                                Claim Winnings
                              </Button>
                            )
                          ) : (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  const amount = prompt("Amount in PAS:");
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
                                  const shares = prompt("Number of shares:");
                                  if (shares) handleSell(market.id, index, shares);
                                }}
                                disabled={loading || !market.userShares || market.userShares[index] === 0}
                              >
                                Sell
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
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
          Please switch to the Paseo Asset Hub network to interact with Revive Markets.
        </p>
      )}
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
