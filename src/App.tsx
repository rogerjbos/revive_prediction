import Market from "./pages/Market";
import ConnectWallet from "./components/ConnectWallet";
import { NetworkSwitcher } from "./components/NetworkSwitcher";

const Logo = () => (
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
      <span className="text-white font-bold text-lg">RM</span>
    </div>
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
