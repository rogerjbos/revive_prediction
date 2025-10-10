import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useTypink } from 'typink'
import { Package, Copy, Check, Code, Wallet, CreditCard, Hash, User, Send, Network, AlertCircle, List } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import NetworkIndicator from '../components/polkadot/NetworkIndicator'
import BlockNumber from '../components/polkadot/BlockNumber'
import BalanceDisplay from '../components/polkadot/BalanceDisplay'
import AddressDisplay from '../components/polkadot/AddressDisplay'
import { useBlockNumber, useBalance, useChainInfo, useStakingInfo, useNonce, useEvents } from '../hooks/usePolkadot'

interface ComponentExample {
  title: string
  description: string
  component: React.ReactNode
  code: string
  category: 'component' | 'hook' | 'wallet' | 'transaction' | 'input' | 'display'
  icon?: React.ReactNode
  href?: string
}

export default function Components() {
  const { connectedAccount } = useTypink()
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Hook examples
  const { blockNumber } = useBlockNumber()
  const { balance } = useBalance(connectedAccount?.address)
  const { chainInfo } = useChainInfo()
  const { stakingInfo } = useStakingInfo()
  const { nonce } = useNonce(connectedAccount?.address)
  const { events } = useEvents(5)

  // Demo/sample fallbacks so the live preview always shows something
  const sampleAddress = '5GrwvaEF5zXb26Fz9rcQpDWSkAqY9G6X' // truncated sample
  const sampleAccount = { name: 'Demo Account', address: sampleAddress, source: 'demo' }
  const sampleBalance = { free: '1,234.5678', reserved: '0.0000' }
  const sampleBlockNumber = 1234567
  const sampleChainInfo = { name: 'Polkadot', tokenSymbol: 'DOT', tokenDecimals: 10 }
  const sampleStakingInfo = { validatorCount: 297, activeEra: 512 }
  const sampleNonce = 7
  const sampleEvents = [
    { section: 'system', method: 'ExtrinsicSuccess' },
    { section: 'balances', method: 'Transfer' },
  ]

  const copyToClipboard = (code: string, index: number) => {
    navigator.clipboard.writeText(code)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const examples: ComponentExample[] = [
    // Wallet & Account Components
    {
      title: 'ConnectWallet',
      description: 'Multi-wallet connection with account selection (Polkadot.js, Talisman, SubWallet, etc.)',
      component: (
  <div className="text-gray-300 text-sm text-center">
          <p>See the header for live example →</p>
          <p className="mt-2 text-xs">Already implemented in this template</p>
        </div>
      ),
      code: `import { ConnectWallet } from 'typink'

function App() {
  return <ConnectWallet />
}`,
      category: 'wallet',
      icon: <Wallet className="w-5 h-5" />,
      href: 'https://github.com/Polkadot-UI-Initiative/polkadot-ui/tree/main/packages/registry/registry/polkadot-ui/blocks/connect-wallet',
    },
    {
      title: 'AddressDisplay',
      description: 'Format addresses with identicon, copy, and explorer links',
      component: (
        <div className="space-y-4">
          <AddressDisplay address={connectedAccount?.address ?? sampleAccount.address} />
          <AddressDisplay address={connectedAccount?.address ?? sampleAccount.address} showCopy={false} showExplorer={false} />
        </div>
      ),
      code: `import AddressDisplay from './components/polkadot/AddressDisplay'

function MyComponent({ address }: { address: string }) {
  return (
    <>
      <AddressDisplay address={address} />
      <AddressDisplay address={address} showCopy={false} />
    </>
  )
}`,
      category: 'component',
      icon: <User className="w-5 h-5" />,
    },
    {
      title: 'RequireAccount',
      description: 'Conditional rendering based on account connection',
      component: (
        <div className="p-4 border border-polkadot-pink/20 rounded-lg bg-polkadot-pink/5">
          {connectedAccount ? (
            <div className="text-green-400">✓ Account connected: {connectedAccount.name}</div>
          ) : (
            <div className="text-cyan-300">Demo Account: {sampleAccount.name}</div>
          )}
        </div>
      ),
      code: `import { useTypink } from 'typink'

function MyComponent() {
  const { connectedAccount } = useTypink()
  
  if (!connectedAccount) {
    return <div>Please connect an account</div>
  }
  
  return <div>Connected: {connectedAccount.name}</div>
}`,
      category: 'wallet',
      icon: <User className="w-5 h-5" />,
      href: 'https://github.com/Polkadot-UI-Initiative/polkadot-ui/tree/main/packages/registry/registry/polkadot-ui/blocks/require-account',
    },
    {
      title: 'AccountInfo',
      description: 'Display account identity, balance, and metadata',
      component: (
        <div className="p-4 border border-polkadot-cyan/20 rounded-lg bg-polkadot-cyan/5">
          <div className="space-y-2 text-sm">
            <div><strong>Name:</strong> {connectedAccount?.name ?? sampleAccount.name}</div>
            <div><strong>Address:</strong> {(connectedAccount?.address ?? sampleAccount.address).slice(0, 8)}...{(connectedAccount?.address ?? sampleAccount.address).slice(-8)}</div>
            <div><strong>Source:</strong> {connectedAccount?.source ?? sampleAccount.source}</div>
          </div>
        </div>
      ),
      code: `import { useTypink } from 'typink'

function AccountInfo() {
  const { connectedAccount } = useTypink()
  
  return (
    <div>
      <div>Name: {connectedAccount?.name}</div>
      <div>Address: {connectedAccount?.address}</div>
      <div>Source: {connectedAccount?.source}</div>
    </div>
  )
}`,
      category: 'wallet',
      icon: <User className="w-5 h-5" />,
      href: 'https://github.com/Polkadot-UI-Initiative/polkadot-ui/tree/main/packages/registry/registry/polkadot-ui/blocks/account-info',
    },

    // Network & Connection Components
    {
      title: 'NetworkIndicator',
      description: 'Display connection status with animated indicators',
      component: (
        <div className="space-y-4">
          <NetworkIndicator />
          <NetworkIndicator showLabel={false} />
        </div>
      ),
      code: `import NetworkIndicator from './components/polkadot/NetworkIndicator'

function MyComponent() {
  return (
    <>
      <NetworkIndicator />
      <NetworkIndicator showLabel={false} />
    </>
  )
}`,
      category: 'component',
      icon: <Network className="w-5 h-5" />,
    },
    {
      title: 'BlockNumber',
      description: 'Real-time block number with live updates',
      component: (
        <div className="space-y-4">
          <BlockNumber />
          <BlockNumber showIcon={false} />
          <BlockNumber format="short" />
        </div>
      ),
      code: `import BlockNumber from './components/polkadot/BlockNumber'

function MyComponent() {
  return (
    <>
      <BlockNumber />
      <BlockNumber showIcon={false} />
      <BlockNumber format="short" />
    </>
  )
}`,
      category: 'component',
      icon: <Hash className="w-5 h-5" />,
    },
    {
      title: 'RequireConnection',
      description: 'Gate content behind network connection',
      component: (
        <div className="p-4 border border-polkadot-violet/20 rounded-lg bg-polkadot-violet/5">
          <div className="text-green-400">✓ Connected to network</div>
        </div>
      ),
      code: `import { usePolkadot } from './providers/PolkadotProvider'

function MyComponent() {
  const { status } = usePolkadot()
  
  if (status !== 'connected') {
    return <div>Connecting to network...</div>
  }
  
  return <div>Connected!</div>
}`,
      category: 'component',
      icon: <Network className="w-5 h-5" />,
      href: 'https://github.com/Polkadot-UI-Initiative/polkadot-ui/tree/main/packages/registry/registry/polkadot-ui/blocks/require-connection',
    },

    // Balance & Token Components
    {
      title: 'BalanceDisplay',
      description: 'Account balance with real-time updates and formatting',
      component: (
        <div className="space-y-4">
          <BalanceDisplay address={connectedAccount?.address ?? sampleAccount.address} />
          <BalanceDisplay address={connectedAccount?.address ?? sampleAccount.address} type="detailed" showIcon={false} />
        </div>
      ),
      code: `import BalanceDisplay from './components/polkadot/BalanceDisplay'

function MyComponent({ address }: { address: string }) {
  return (
    <>
      <BalanceDisplay address={address} />
      <BalanceDisplay address={address} type="detailed" />
    </>
  )
}`,
      category: 'display',
      icon: <CreditCard className="w-5 h-5" />,
    },
    {
      title: 'SelectToken',
      description: 'Token selection dropdown with balance display',
      component: (
        <div className="p-6 border border-polkadot-lime/20 rounded-lg bg-polkadot-lime/5 text-center space-y-2">
          <div className="text-sm font-semibold text-gray-200">Token Selector Component</div>
          <div className="text-xs text-gray-400">Select from available tokens with live balances</div>
          <div className="text-[10px] text-polkadot-lime/70 mt-2 px-3 py-1 rounded bg-black/30 inline-block">
            Install: npx polkadot-ui add select-token
          </div>
        </div>
      ),
      code: `// Install from polkadot-ui
// npx polkadot-ui add select-token

import { SelectToken } from './components/polkadot/SelectToken'

function MyComponent() {
  return (
    <SelectToken 
      chainId="polkadot"
      assetIds={[1984, 1337, 7777]}
      withBalance
    />
  )
}`,
      category: 'input',
      icon: <CreditCard className="w-5 h-5" />,
      href: 'https://github.com/Polkadot-UI-Initiative/polkadot-ui/tree/main/packages/registry/registry/polkadot-ui/blocks/select-token',
    },
    {
      title: 'SelectTokenDialog',
      description: 'Dialog-based token selection with search',
      component: (
        <div className="p-6 border border-polkadot-cyan/20 rounded-lg bg-polkadot-cyan/5 text-center space-y-2">
          <div className="text-sm font-semibold text-gray-200">Token Dialog Component</div>
          <div className="text-xs text-gray-400">Full-screen token selector with search & filtering</div>
          <div className="text-[10px] text-polkadot-cyan/70 mt-2 px-3 py-1 rounded bg-black/30 inline-block">
            Install: npx polkadot-ui add select-token-dialog
          </div>
        </div>
      ),
      code: `// Install from polkadot-ui
// npx polkadot-ui add select-token-dialog

import { SelectTokenDialog } from './components/polkadot/SelectTokenDialog'

function MyComponent() {
  return (
    <SelectTokenDialog 
      chainId="polkadot"
      assetIds={[1984, 8, 27]}
      withBalance
      withSearch
    />
  )
}`,
      category: 'input',
      icon: <CreditCard className="w-5 h-5" />,
      href: 'https://github.com/Polkadot-UI-Initiative/polkadot-ui/tree/main/packages/registry/registry/polkadot-ui/blocks/select-token',
    },

    // Transaction Components
    {
      title: 'TxButton',
      description: 'Submit transactions with progress states and notifications',
      component: (
        <div className="p-6 border border-polkadot-pink/20 rounded-lg bg-polkadot-pink/5 text-center space-y-2">
          <div className="text-sm font-semibold text-gray-200">Transaction Button Component</div>
          <div className="text-xs text-gray-400">Handles signing, submission, and notifications</div>
          <div className="text-[10px] text-polkadot-pink/70 mt-2 px-3 py-1 rounded bg-black/30 inline-block">
            Install: npx polkadot-ui add tx-button
          </div>
        </div>
      ),
      code: `// Install from polkadot-ui
// npx polkadot-ui add tx-button

import { TxButton } from './components/polkadot/TxButton'
import { useTx } from 'typink'

function MyComponent() {
  const tx = useTx((tx) => tx.system.remark)
  
  return (
    <TxButton
      tx={tx}
      args={["Hello Polkadot!"]}
      networkId="polkadot"
    >
      Submit Transaction
    </TxButton>
  )
}`,
      category: 'transaction',
      icon: <Send className="w-5 h-5" />,
      href: 'https://github.com/Polkadot-UI-Initiative/polkadot-ui/tree/main/packages/registry/registry/polkadot-ui/blocks/tx-button',
    },
    {
      title: 'TxNotification',
      description: 'Transaction status notifications and toasts',
      component: (
        <div className="p-6 border border-polkadot-violet/20 rounded-lg bg-polkadot-violet/5 text-center space-y-2">
          <div className="text-sm font-semibold text-gray-200">Transaction Notification System</div>
          <div className="text-xs text-gray-400">Shows signing, broadcasting, inclusion, and finalization states</div>
          <div className="text-[10px] text-polkadot-violet/70 mt-2 px-3 py-1 rounded bg-black/30 inline-block">
            Install: npx polkadot-ui add tx-notification
          </div>
        </div>
      ),
      code: `// Install from polkadot-ui
// npx polkadot-ui add tx-notification

import { txStatusNotification } from './components/polkadot/TxNotification'

function MyComponent() {
  const handleTransaction = async () => {
    const notificationId = txStatusNotification({
      status: 'signing',
      title: 'Transfer',
    })
    
    // Update notification as transaction progresses
    txStatusNotification({
      id: notificationId,
      status: 'broadcasting',
    })
  }
}`,
      category: 'transaction',
      icon: <AlertCircle className="w-5 h-5" />,
      href: 'https://github.com/Polkadot-UI-Initiative/polkadot-ui/tree/main/packages/registry/registry/polkadot-ui/blocks/tx-notification',
    },

    // Input Components
    {
      title: 'AddressInput',
      description: 'Address input with SS58/Ethereum validation',
      component: (
        <div className="p-6 border border-polkadot-lime/20 rounded-lg bg-polkadot-lime/5 text-center space-y-2">
          <div className="text-sm font-semibold text-gray-200">Address Input Component</div>
          <div className="text-xs text-gray-400">Validates addresses and shows identity lookup</div>
          <div className="text-[10px] text-polkadot-lime/70 mt-2 px-3 py-1 rounded bg-black/30 inline-block">
            Install: npx polkadot-ui add address-input
          </div>
        </div>
      ),
      code: `// Install from polkadot-ui
// npx polkadot-ui add address-input

import { AddressInput } from './components/polkadot/AddressInput'

function MyComponent() {
  const [address, setAddress] = useState('')
  
  return (
    <AddressInput
      value={address}
      onChange={setAddress}
      chainId="polkadot"
      withIdentityLookup
    />
  )
}`,
      category: 'input',
      icon: <Hash className="w-5 h-5" />,
      href: 'https://github.com/Polkadot-UI-Initiative/polkadot-ui/tree/main/packages/registry/registry/polkadot-ui/blocks/address-input',
    },
    {
      title: 'AmountInput',
      description: 'Token amount input with balance and max button',
      component: (
        <div className="p-6 border border-polkadot-cyan/20 rounded-lg bg-polkadot-cyan/5 text-center space-y-2">
          <div className="text-sm font-semibold text-gray-200">Amount Input Component</div>
          <div className="text-xs text-gray-400">Input for token amounts with max button and validation</div>
          <div className="text-[10px] text-polkadot-cyan/70 mt-2 px-3 py-1 rounded bg-black/30 inline-block">
            Install: npx polkadot-ui add amount-input
          </div>
        </div>
      ),
      code: `// Install from polkadot-ui
// npx polkadot-ui add amount-input

import { AmountInput } from './components/polkadot/AmountInput'

function MyComponent() {
  const [amount, setAmount] = useState('')
  
  return (
    <AmountInput
      value={amount}
      onChange={setAmount}
      chainId="polkadot"
      assetId={1984}
      withMaxButton
    />
  )
}`,
      category: 'input',
      icon: <CreditCard className="w-5 h-5" />,
      href: 'https://github.com/Polkadot-UI-Initiative/polkadot-ui/tree/main/packages/registry/registry/polkadot-ui/blocks/amount-input',
    },
    {
      title: 'Identicon Themes',
      description: 'Different visual styles for address identicons (polkadot, substrate, beachball, jdenticon)',
      component: (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-black/20 border border-white/5">
            <div className="text-xs text-gray-300 mb-3">Available themes:</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded bg-black/30 border border-polkadot-pink/20">
                <div className="text-xs font-semibold text-polkadot-pink mb-1">polkadot</div>
                <div className="text-[10px] text-gray-400">Official Polkadot style</div>
              </div>
              <div className="p-3 rounded bg-black/30 border border-polkadot-purple/20">
                <div className="text-xs font-semibold text-polkadot-purple mb-1">substrate</div>
                <div className="text-[10px] text-gray-400">Alternative Substrate style</div>
              </div>
              <div className="p-3 rounded bg-black/30 border border-polkadot-cyan/20">
                <div className="text-xs font-semibold text-polkadot-cyan mb-1">beachball</div>
                <div className="text-[10px] text-gray-400">Colorful circular pattern</div>
              </div>
              <div className="p-3 rounded bg-black/30 border border-polkadot-lime/20">
                <div className="text-xs font-semibold text-polkadot-lime mb-1">jdenticon</div>
                <div className="text-[10px] text-gray-400">Geometric shapes</div>
              </div>
            </div>
          </div>
        </div>
      ),
      code: `// Use with AddressInput or AccountInfo
import { AddressInput } from './components/polkadot/AddressInput'
import { AccountInfo } from './components/polkadot/AccountInfo'

function MyComponent() {
  return (
    <>
      {/* polkadot theme (default) */}
      <AddressInput identiconTheme="polkadot" />
      
      {/* substrate theme */}
      <AddressInput identiconTheme="substrate" />
      
      {/* beachball theme */}
      <AddressInput identiconTheme="beachball" />
      
      {/* jdenticon theme */}
      <AddressInput identiconTheme="jdenticon" />
      
      {/* Also works with AccountInfo */}
      <AccountInfo 
        address={address}
        iconTheme="beachball"
      />
    </>
  )
}`,
      category: 'display',
      icon: <User className="w-5 h-5" />,
    },
    {
      title: 'Multi-Chain Support',
      description: 'Components work across Polkadot, Kusama, and testnet chains',
      component: (
        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-black/20 border border-white/5">
            <div className="text-xs text-gray-300 mb-3">Supported chains for identity lookup:</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-polkadot-pink"></div>
                <span className="text-gray-300">Polkadot People</span>
                <code className="text-xs text-gray-400 ml-auto">polkadotPeople</code>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-polkadot-purple"></div>
                <span className="text-gray-300">Kusama People</span>
                <code className="text-xs text-gray-400 ml-auto">kusamaPeople</code>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-polkadot-cyan"></div>
                <span className="text-gray-300">Paseo People (testnet)</span>
                <code className="text-xs text-gray-400 ml-auto">paseoPeople</code>
              </div>
            </div>
          </div>
        </div>
      ),
      code: `// Specify identity chain for AccountInfo and AddressInput
import { AddressInput } from './components/polkadot/AddressInput'
import { AccountInfo } from './components/polkadot/AccountInfo'

function MyComponent() {
  return (
    <>
      {/* Polkadot mainnet */}
      <AddressInput 
        identityChain="polkadotPeople"
        withIdentityLookup 
      />
      
      {/* Kusama */}
      <AccountInfo
        address={address}
        chainId="kusamaPeople"
      />
      
      {/* Testnet */}
      <AddressInput 
        identityChain="paseoPeople"
        withIdentitySearch
      />
    </>
  )
}`,
      category: 'display',
      icon: <Network className="w-5 h-5" />,
    },
    {
      title: 'Balance with Comparison Token',
      description: 'Display balance with USD or stablecoin conversion rates',
      component: (
        <div className="p-4 rounded-lg bg-black/20 border border-white/5">
          <div className="text-xs text-gray-300 mb-3">Example: DOT balance with USDC comparison</div>
          <div className="space-y-2">
            <div className="p-3 rounded bg-black/30 border border-polkadot-pink/20">
              <div className="text-lg font-bold text-white">12.3456 DOT</div>
              <div className="text-xs text-gray-400 mt-1">≈ $98.76 USDC</div>
            </div>
            <div className="text-[10px] text-gray-500 mt-2">
              Supports any token-to-token conversion with custom rates
            </div>
          </div>
        </div>
      ),
      code: `// Install from polkadot-ui
// npx polkadot-ui add balance-display

import { BalanceDisplay } from './components/polkadot/BalanceDisplay'

function MyComponent() {
  const dotPrice = 8.00 // from price API
  
  return (
    <BalanceDisplay
      tokenId={NATIVE_TOKEN_KEY}
      compareTokenId={1337} // USDC
      accountAddress={address}
      tokenConversionRate={dotPrice}
      precision={4}
    />
  )
}`,
      category: 'display',
      icon: <CreditCard className="w-5 h-5" />,
    },
    {
      title: 'Token Logos with Networks',
      description: 'Display token logos with network badge overlays',
      component: (
        <div className="p-4 rounded-lg bg-black/20 border border-white/5">
          <div className="text-xs text-gray-300 mb-3">Example: Token with network indicator</div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-polkadot-pink/20 flex items-center justify-center">
                <span className="text-lg font-bold text-polkadot-pink">DOT</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-polkadot-purple/90 border-2 border-black flex items-center justify-center">
                <span className="text-[8px] text-white">AH</span>
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-white">DOT</div>
              <div className="text-xs text-gray-400">on Asset Hub</div>
            </div>
          </div>
        </div>
      ),
      code: `// TokenLogoWithNetwork component
import { TokenLogoWithNetwork } from './components/polkadot/TokenLogo'

function MyComponent() {
  return (
    <TokenLogoWithNetwork
      tokenLogo={token.logo}
      networkLogo={network.logo}
      tokenSymbol={token.symbol}
      size="md" // sm | md | lg
    />
  )
}`,
      category: 'display',
      icon: <Package className="w-5 h-5" />,
    },

    // Custom Hooks
    {
      title: 'useBlockNumber Hook',
      description: 'Get current block number with real-time updates',
      component: (
        <div className="p-4 rounded-lg bg-black/40 border border-white/10">
          <div className="text-sm text-gray-300 mb-2">Current Block:</div>
          <div className="text-2xl font-bold text-gradient">
            #{blockNumber != null ? blockNumber.toLocaleString() : '—'}
          </div>
        </div>
      ),
      code: `import { useBlockNumber } from './hooks/usePolkadot'

function MyComponent() {
  const { blockNumber, loading } = useBlockNumber()
  
  if (loading) return <div>Loading...</div>
  
  return <div>Block: #{blockNumber}</div>
}`,
      category: 'hook',
      icon: <Hash className="w-5 h-5" />,
    },
    {
      title: 'useBalance Hook',
      description: 'Get account balance with subscriptions',
      component: (
        <div className="p-4 rounded-lg bg-black/40 border border-white/10 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">Free:</span>
            <span className="text-white font-mono">{(connectedAccount ? balance?.free : sampleBalance.free) ?? '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">Reserved:</span>
            <span className="text-white font-mono">{(connectedAccount ? balance?.reserved : sampleBalance.reserved) ?? '—'}</span>
          </div>
        </div>
      ),
      code: `import { useBalance } from './hooks/usePolkadot'

function MyComponent({ address }: { address: string }) {
  const { balance, loading } = useBalance(address)
  
  if (loading) return <div>Loading...</div>
  
  return (
    <div>
      <div>Free: {balance.free}</div>
      <div>Reserved: {balance.reserved}</div>
    </div>
  )
}`,
      category: 'hook',
      icon: <CreditCard className="w-5 h-5" />,
    },
    {
      title: 'useChainInfo Hook',
      description: 'Get chain metadata and properties',
      component: (
        <div className="p-4 rounded-lg bg-black/40 border border-white/10 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">Chain:</span>
            <span className="text-white">{chainInfo?.name ?? '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">Token:</span>
            <span className="text-white">{chainInfo?.tokenSymbol ?? '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">Decimals:</span>
            <span className="text-white">{chainInfo?.tokenDecimals ?? '—'}</span>
          </div>
        </div>
      ),
      code: `import { useChainInfo } from './hooks/usePolkadot'

function MyComponent() {
  const { chainInfo, loading } = useChainInfo()
  
  if (loading) return <div>Loading...</div>
  
  return (
    <div>
      <div>Chain: {chainInfo.name}</div>
      <div>Token: {chainInfo.tokenSymbol}</div>
      <div>Decimals: {chainInfo.tokenDecimals}</div>
    </div>
  )
}`,
      category: 'hook',
      icon: <Network className="w-5 h-5" />,
    },
    {
      title: 'useStakingInfo Hook',
      description: 'Get staking metrics and validator info',
      component: (
        <div className="p-4 rounded-lg bg-black/40 border border-white/10 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">Validators:</span>
            <span className="text-white">{stakingInfo?.validatorCount ?? '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">Active Era:</span>
            <span className="text-white">{stakingInfo?.activeEra ?? '—'}</span>
          </div>
        </div>
      ),
      code: `import { useStakingInfo } from './hooks/usePolkadot'

function MyComponent() {
  const { stakingInfo, loading } = useStakingInfo()
  
  if (loading) return <div>Loading...</div>
  
  return (
    <div>
      <div>Validators: {stakingInfo.validatorCount}</div>
      <div>Era: {stakingInfo.activeEra}</div>
    </div>
  )
}`,
      category: 'hook',
      icon: <Network className="w-5 h-5" />,
    },
    {
      title: 'useNonce Hook',
      description: 'Get account transaction nonce',
      component: (
        <div className="p-4 rounded-lg bg-black/40 border border-white/10">
          <div className="text-sm text-gray-300 mb-2">Account Nonce:</div>
          <div className="text-2xl font-bold text-white">{connectedAccount ? (nonce != null ? nonce : '—') : sampleNonce}</div>
        </div>
      ),
      code: `import { useNonce } from './hooks/usePolkadot'

function MyComponent({ address }: { address: string }) {
  const { nonce, loading } = useNonce(address)
  
  if (loading) return <div>Loading...</div>
  
  return <div>Nonce: {nonce}</div>
}`,
      category: 'hook',
      icon: <Hash className="w-5 h-5" />,
    },
    {
      title: 'useEvents Hook',
      description: 'Subscribe to chain events',
      component: (
        <div className="p-4 rounded-lg bg-black/40 border border-white/10">
          <div className="text-sm text-gray-300 mb-2">Recent Events:</div>
          <div className="text-xs text-white space-y-1 max-h-20 overflow-auto">
            {Array.isArray(events) && events.length > 0 ? (
              events.slice(0, 3).map((event, i) => (
                <div key={i} className="truncate">{event.section}.{event.method}</div>
              ))
              ) : (
              <div className="text-gray-300">No recent events</div>
            )}
          </div>
        </div>
      ),
      code: `import { useEvents } from './hooks/usePolkadot'

function MyComponent() {
  const { events, loading } = useEvents(10)
  
  if (loading) return <div>Loading...</div>
  
  return (
    <div>
      {events.map((event, i) => (
        <div key={i}>{event.section}.{event.method}</div>
      ))}
    </div>
  )
}`,
      category: 'hook',
      icon: <List className="w-5 h-5" />,
    },
  ]

  const categories = [
    { id: 'all', label: 'All Components', count: examples.length },
    { id: 'wallet', label: 'Wallet & Account', count: examples.filter(e => e.category === 'wallet').length },
    { id: 'display', label: 'Display', count: examples.filter(e => e.category === 'display').length },
    { id: 'input', label: 'Input', count: examples.filter(e => e.category === 'input').length },
    { id: 'transaction', label: 'Transaction', count: examples.filter(e => e.category === 'transaction').length },
    { id: 'component', label: 'Network', count: examples.filter(e => e.category === 'component').length },
    { id: 'hook', label: 'Hooks', count: examples.filter(e => e.category === 'hook').length },
  ]
  const filteredExamples = selectedCategory === 'all' 
    ? examples 
    : examples.filter(ex => ex.category === selectedCategory)

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-8 border border-white/10"
      >
        <div className="flex items-center gap-3 mb-4">
          <Package className="w-8 h-8 text-pink-500" />
          <h1 className="text-4xl font-bold text-gradient">Polkadot Components</h1>
        </div>
        <p className="text-gray-300 text-lg">
          Reusable components and hooks for building Polkadot applications. Copy the code and use them in your project.
        </p>
      </motion.div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-3">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'gradient' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className="capitalize"
          >
            {category.label} ({category.count})
          </Button>
        ))}
      </div>

      {/* Components Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredExamples.map((example, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="glass-dark border-white/10 hover:border-pink-500/50 transition-all duration-300 h-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-polkadot">
                      <Code className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white">{example.title}</CardTitle>
                        <CardDescription className="mt-1 text-gray-300">
                          {example.description}
                        </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Live Preview */}
                <div className="p-4 rounded-lg bg-black/20 border border-white/5 text-white">
                  <div className="text-xs text-gray-300 mb-3 font-semibold uppercase tracking-wide">
                    Live Preview
                  </div>
                  {example.component}
                </div>

                {/* Code */}
                <div className="relative">
                  <div className="text-xs text-gray-300 mb-2 font-semibold uppercase tracking-wide">
                    Code
                  </div>
                  <pre className="bg-black/40 rounded-lg p-4 overflow-x-auto text-sm border border-white/5">
                      <code className="text-gray-200 font-mono text-xs">
                      {example.code}
                    </code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-6 right-2 bg-black/60 hover:bg-black/80"
                    onClick={() => copyToClipboard(example.code, index)}
                  >
                    {copiedIndex === index ? (
                      <>
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="ml-2 text-green-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span className="ml-2">Copy</span>
                      </>
                    )}
                  </Button>
                </div>

                <div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-pink-500/10 text-pink-400 border border-pink-500/20 capitalize">
                    {example.category}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Installation Guide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-dark rounded-2xl p-8 border border-white/10"
      >
        <h2 className="text-2xl font-bold text-white mb-4">Installation</h2>
        <p className="text-gray-300 mb-4">
          All components and hooks are included in this template. Simply copy the code and customize for your needs.
        </p>
        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="text-sm font-semibold text-white mb-1">Components Location</div>
            <code className="text-xs text-gray-300 font-mono">src/components/polkadot/</code>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="text-sm font-semibold text-white mb-1">Hooks Location</div>
            <code className="text-xs text-gray-300 font-mono">src/hooks/usePolkadot.ts</code>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
