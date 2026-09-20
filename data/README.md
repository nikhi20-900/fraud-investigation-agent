# Synthetic Fraud Datasets (Phase 2)

This directory contains deterministic, compliant synthetic datasets modeling normal consumer behaviors and 4 distinct fraud attack topologies.

---

## 1. Compliance & Anonymization Rules
- **SSN**: Strictly synthetic hashes (`SYNTH_HASH_*`).
- **Cards**: Masked values with dummy BINs (`4111-22XX-XXXX-*`, `5424-99XX-XXXX-*`).
- **IP Addresses**: RFC 5737 Documentation & Reserved IPv4 ranges:
  - `192.0.2.0/24` (TEST-NET-1) — Normal baseline residential users
  - `198.51.100.0/24` (TEST-NET-2) — Bot ring emulator users
  - `203.0.113.0/24` (TEST-NET-3) — Synthetic anomalous proxy cluster
- **Emails**: RFC 2606 reserved domains (`*@example.test`).
- **VPN/Proxy**: Explicitly labeled as synthetic/anomalous behavior rather than asserting all VPN traffic is inherently fraudulent.

---

## 2. Embedded Scenarios

1. **Scenario 1: Normal Baseline**
   - 10 regular customers with 1-to-1 account, device, and residential IP mappings performing routine retail purchases.
2. **Scenario 2: Shared Device Ring (Bot Farm)**
   - 4 distinct accounts (`ACC-RING-001` through `004`) sharing a single rooted emulator (`DEV-ROOT-EMU-77`).
3. **Scenario 3: Anomalous IP Proxy Cluster**
   - 3 accounts (`ACC-PROXY-001` through `003`) originating authorizations from a single synthetic proxy IP (`203.0.113.88`).
4. **Scenario 4: Merchant Bust-out & Collusion**
   - High-volume fund sweeps concentrated into `MERCH-CRYPTO-COLLUSION-99` structured just below reporting limits.
5. **Scenario 5: Multi-hop Layering / Transaction Chain**
   - Rapid fund routing chain: `ACC-CHAIN-SOURCE-501` -> `TXN-CHAIN-HOP-1` -> `ACC-CHAIN-MULE-502` -> `TXN-CHAIN-HOP-2` -> `ACC-CHAIN-MULE-503` -> `TXN-CHAIN-HOP-3` -> `MERCH-OFFSHORE-504`.

---

## 3. Directory Layout

- `generate_fraud_data.py`: Deterministic generator script.
- `synthetic_fraud_graph.json`: Consolidated JSON graph with metadata, vertices, edges, and scenario definitions.
- `raw/`: CSV fixtures formatted for direct TigerGraph ingestion:
  - `customers.csv`
  - `accounts.csv`
  - `transactions.csv`
  - `cards.csv`
  - `devices.csv`
  - `ips.csv`
  - `merchants.csv`
  - `customer_owns_account.csv`
  - `account_made_transaction.csv`
  - `account_uses_card.csv`
  - `account_uses_device.csv`
  - `account_connected_from_ip.csv`
  - `transaction_paid_to_merchant.csv`
  - `transaction_received_by_account.csv`

---

## 4. Regenerating Data

```bash
python3 generate_fraud_data.py
```
