import Market from "./pages/Market";
import ConnectWallet from "./components/ConnectWallet";
import { NetworkSwitcher } from "./components/NetworkSwitcher";
import { PolkadotLogo } from "./components/PolkadotLogo";

const Logo = () => (
  <div className="flex items-center gap-3">
    <PolkadotLogo size={40} />
    <span className="text-xl font-bold text-white">Revive Markets</span>
  </div>
);

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0b1e] via-[#1a0b2e] to-[#0b0b1e]">
      <header className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          <NetworkSwitcher />
          <ConnectWallet />
        </div>
      </header>
      <main>
        <Market />
      </main>
    </div>
  );
}
