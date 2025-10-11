// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract PredictionMarket {
    struct Market {
        string question;
        string[] outcomes;
        uint256[] shares;
        uint256[] prices; // in smallest PAS units (10^-10 PAS)
        bool resolved;
        uint256 winningOutcome;
        address creator;
        uint256 totalLiquidity;
        uint256 spread; // in basis points
        uint256 creatorFees; // fees for market creator
        mapping(address => uint256[]) userShares; // userShares[user][outcome] = shares owned
    }

    mapping(uint256 => Market) public markets;
    uint256 public marketCount;
    uint256 public accumulatedFees;
    address public owner;

    event MarketCreated(uint256 indexed marketId, string question, address creator);
    event SharesBought(uint256 indexed marketId, uint256 outcome, uint256 shares, address buyer);
    event SharesSold(uint256 indexed marketId, uint256 outcome, uint256 shares, address seller);
    event MarketResolved(uint256 indexed marketId, uint256 winningOutcome);

    function createMarket(string memory _question, string[] memory _outcomes, uint256 _spread, uint256[] memory _initialLiquidity) external payable {
        require(_outcomes.length >= 2, "At least 2 outcomes required");
        require(_outcomes.length <= 5, "Maximum 5 outcomes");
        require(_outcomes.length == _initialLiquidity.length, "Number of outcomes must match number of liquidity");
        require(_spread >= 10 && _spread <= 1000, "Spread must be between 10 and 1000 basis points (0.1% to 10%)");

        if (owner == address(0)) {
            owner = msg.sender;
        }

        // Calculate total liquidity
        uint256 totalLiquidity = 0;
        for (uint256 i = 0; i < _initialLiquidity.length; i++) {
            totalLiquidity += _initialLiquidity[i];
        }
        require(msg.value == totalLiquidity * 10**8, "Must send total initial liquidity amount");

        // Calculate prices: price[i] = (liquidity[i] * 1e8) / totalLiquidity  (since 1 PAS = 1e8 wei)
        uint256[] memory prices = new uint256[](_outcomes.length);
        for (uint256 i = 0; i < _outcomes.length; i++) {
            prices[i] = (_initialLiquidity[i] * 10**8) / totalLiquidity;
        }

        marketCount++;
        Market storage market = markets[marketCount];
        market.question = _question;
        market.outcomes = _outcomes;

        // Give initial shares to creator: shares = totalLiquidity
        uint256 sharesPerOutcome = totalLiquidity;
        market.shares = new uint256[](_outcomes.length);
        for (uint256 i = 0; i < _outcomes.length; i++) {
            if (_initialLiquidity[i] > 0) {
                market.shares[i] = sharesPerOutcome;
            }
        }
        market.prices = prices;
        market.creator = msg.sender;
        market.totalLiquidity = totalLiquidity; // Store in PAS units
        market.spread = _spread;
        market.creatorFees = 0;

        market.userShares[msg.sender] = new uint256[](_outcomes.length);
        for (uint256 i = 0; i < _outcomes.length; i++) {
            if (_initialLiquidity[i] > 0) {
                market.userShares[msg.sender][i] = sharesPerOutcome;
            }
        }

        emit MarketCreated(marketCount, _question, msg.sender);
    }

    function getMarkets() external view returns (uint256[] memory) {
        uint256[] memory marketIds = new uint256[](marketCount);
        for (uint256 i = 1; i <= marketCount; i++) {
            marketIds[i-1] = i;
        }
        return marketIds;
    }

    function getMarket(uint256 _marketId) external view returns (
        string memory question,
        string[] memory outcomes,
        uint256[] memory prices,
        bool resolved,
        uint256 winningOutcome,
        address creator,
        uint256 spread,
        uint256 totalLiquidity,
        uint256 creatorFees
    ) {
        Market storage market = markets[_marketId];
        return (
            market.question,
            market.outcomes,
            market.prices,
            market.resolved,
            market.winningOutcome,
            market.creator,
            market.spread,
            market.totalLiquidity,
            market.creatorFees
        );
    }

    function getMarketShares(uint256 _marketId) external view returns (uint256[] memory) {
        Market storage market = markets[_marketId];
        return market.shares;
    }

    function buy(uint256 _marketId, uint256 _outcome, uint256 _amount) external payable {
        Market storage market = markets[_marketId];
        require(!market.resolved, "Market already resolved");
        require(_outcome < market.outcomes.length, "Invalid outcome");
        require(msg.value == _amount, "Incorrect payment amount");

        // Simple price adjustment: increase price by spread% per buy
        uint256 sharesToBuy = _amount / market.prices[_outcome];
        market.shares[_outcome] += sharesToBuy;
        market.prices[_outcome] = market.prices[_outcome] * (10000 + market.spread) / 10000;
        market.totalLiquidity += _amount / 10**8;

        // Track user shares
        if (market.userShares[msg.sender].length == 0) {
            market.userShares[msg.sender] = new uint256[](market.outcomes.length);
        }
        market.userShares[msg.sender][_outcome] += sharesToBuy;

        emit SharesBought(_marketId, _outcome, sharesToBuy, msg.sender);
    }

    function sell(uint256 _marketId, uint256 _outcome, uint256 _shares) external {
        Market storage market = markets[_marketId];
        require(!market.resolved, "Market already resolved");
        require(_outcome < market.outcomes.length, "Invalid outcome");
        require(market.shares[_outcome] >= _shares, "Not enough shares");

        uint256 payout = _shares * market.prices[_outcome];
        require(address(this).balance >= payout, "Insufficient contract balance");

        market.shares[_outcome] -= _shares;
        market.prices[_outcome] = market.prices[_outcome] * (10000 - market.spread) / 10000;
        market.totalLiquidity -= payout / 10**8;

        // Update user shares
        market.userShares[msg.sender][_outcome] -= _shares;

        payable(msg.sender).transfer(payout);

        emit SharesSold(_marketId, _outcome, _shares, msg.sender);
    }

    function resolveMarket(uint256 _marketId, uint256 _winningOutcome) external {
        Market storage market = markets[_marketId];
        require(msg.sender == market.creator, "Only creator can resolve");
        require(!market.resolved, "Market already resolved");
        require(_winningOutcome < market.outcomes.length, "Invalid outcome");

        market.resolved = true;
        market.winningOutcome = _winningOutcome;

        emit MarketResolved(_marketId, _winningOutcome);
    }

    function getUserShares(uint256 _marketId, address _user) external view returns (uint256[] memory) {
        Market storage market = markets[_marketId];
        return market.userShares[_user];
    }

    function test() external view returns (uint256) {
        return 42;
    }

    // Emergency withdraw for creator
    function emergencyWithdraw(uint256 _marketId) external {
        Market storage market = markets[_marketId];
        require(msg.sender == market.creator, "Only creator");
        require(market.resolved, "Market not resolved");

        uint256 balance = address(this).balance;
        if (balance > 0) {
            payable(msg.sender).transfer(balance);
        }
    }

    function claimWinnings(uint256 _marketId) external {
        Market storage market = markets[_marketId];
        require(market.resolved, "Market not resolved");

        uint256 winningOutcome = market.winningOutcome;
        uint256 userShares = market.userShares[msg.sender][winningOutcome];
        require(userShares > 0, "No winning shares");

        uint256 totalWinningShares = market.shares[winningOutcome];
        require(totalWinningShares > 0, "No winning shares available");

        uint256 payout = (userShares * market.totalLiquidity * 10**8) / totalWinningShares;

        // Deduct 2% fee: 1% to platform, 1% to market creator
        uint256 totalFee = payout / 50; // 2% = 1/50
        uint256 platformFee = totalFee / 2;
        uint256 creatorFee = totalFee / 2;
        accumulatedFees += platformFee;
        market.creatorFees += creatorFee;
        payout -= totalFee;

        // Prevent re-entrancy and multiple claims
        market.userShares[msg.sender][winningOutcome] = 0;

        payable(msg.sender).transfer(payout);

        emit SharesSold(_marketId, winningOutcome, userShares, msg.sender); // Reuse event
    }

    function claimFees() external {
        require(msg.sender == owner, "Only owner can claim protocol fees");
        uint256 fees = accumulatedFees;
        require(fees > 0, "No fees to claim");
        accumulatedFees = 0;
        payable(msg.sender).transfer(fees);
    }

    function claimCreatorFees(uint256 _marketId) external {
        Market storage market = markets[_marketId];
        require(market.resolved, "Market not resolved");
        require(msg.sender == market.creator, "Only market creator can claim creator fees");
        uint256 fees = market.creatorFees;
        require(fees > 0, "No fees to claim");
        market.creatorFees = 0;
        payable(msg.sender).transfer(fees);
    }

    function removeMarket(uint256 _marketId) external {
        Market storage market = markets[_marketId];
        require(market.creator == msg.sender, "Only creator can remove market");
        require(market.resolved, "Market must be resolved to remove");

        // Delete the market (this will remove all data)
        delete markets[_marketId];
    }
}
