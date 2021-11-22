# Requirements
* Execute the latest RACA NFT purchase order
* Avoid Rate limit and bot detection 100%

# Prequisites
* pupeeter with metamask plugin installed
* Multiple Metamask wallets with sufficient BNB for BSC transaction fee and RACA balance to purchase NFT
* Use different IPaddresses when invoking the RACA endpoints

### Security requirement ###
* Secure the 12 words of metamask secret. The AWS KMS for encryption can be used. However, Local encryption can be used

### Improvements ###
* Reduce the loading time and minimise the metamask wallet configuration time
* Track and visualise the fluctuation price of NFT items

# Diagram

![Dapp_raca_diagram](./img/dapp_raca.drawio.png)

**RACA endpoints:**

                https://market.radiocaca.com/#/market-place
                https://market.radiocaca.com/#/market-place/[item]

# Release Update

* MVP