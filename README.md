# RACA NFT Automation: A Side Project Overview

This codebase serves as a side endeavor aimed at automating transactions with MetaMask and the RACA marketplace, specifically for the buying and selling of NFTs. Created in 2021 during a partnership with a friend, the project emerged as a solution to simplify the buying experience, effectively circumvent rate restrictions, and handle transactions securely.

## Features

- **Automated RACA NFT Purchase**: Executes the latest RACA NFT purchase orders automatically.
- **Anti-Bot & Rate Limit Countermeasures**: Designed to avoid 100% rate limit and bot detection.

## Requirements

### Software and Wallets

- Puppeteer with MetaMask plugin installed
- Multiple MetaMask wallets
  - Ensure sufficient BNB for BSC transaction fees
  - Maintain RACA balance for NFT purchases
- Different IP addresses for invoking RACA endpoints

### Security Measures

- Safeguard the 12-word secret phrase for MetaMask.
  - AWS KMS can be used for encryption.
  - Local encryption methods are also acceptable.

## Future Improvements

- **Efficiency Optimization**: Reduce the loading and MetaMask wallet configuration time.
- **Data Visualization**: Implement features to track and visualize NFT price fluctuations.

## Architecture Diagram

![Dapp RACA Architecture](./img/dapp_raca.drawio.png)

## RACA Endpoints

- Marketplace: `https://market.radiocaca.com/#/market-place`
- Specific Item: `https://market.radiocaca.com/#/market-place/[item]`

## Release History

- Initial release: MVP

Feel free to contribute or raise issues if you find any. Thank you for visiting this project!
