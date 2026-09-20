# TigerGraph Component (Phase 2)

Defines the graph schema, loading jobs, and analytical GSQL queries for the **Agentic Fraud Investigation Agent**.

---

## 1. Schema Overview (`schema.gsql`)

Target Graph: `FraudNetworkGraph`

### Vertices (7 Types)
1. **`Customer`**: `id`, `name`, `ssn_hash`, `email`, `risk_score`, `created_at`
2. **`Account`**: `id`, `account_number`, `account_type`, `balance`, `status`, `opened_date`
3. **`Transaction`**: `id`, `amount`, `currency`, `timestamp`, `status`, `channel`
4. **`Card`**: `id`, `card_number_masked`, `card_type`, `expiration_date`
5. **`Device`**: `id`, `device_fingerprint`, `device_type`, `os`, `browser`, `is_emulator`
6. **`IP`**: `id`, `ip_address`, `asn`, `country`, `is_proxy_vpn`
7. **`Merchant`**: `id`, `name`, `merchant_category_code`, `risk_level`

### Edges (7 Types)
1. **`OWNS`**: `Customer -> Account`
2. **`MADE`**: `Account -> Transaction`
3. **`USES_CARD`**: `Account -> Card` (`since`)
4. **`USES_DEVICE`**: `Account -> Device` (`last_seen`)
5. **`CONNECTED_FROM`**: `Account -> IP` (`timestamp`)
6. **`PAID_TO`**: `Transaction -> Merchant`
7. **`RECEIVED_BY`**: `Transaction -> Account` (for P2P transfers & money layering chains)
8. **`USES`**: Composite edge supporting both `(Account -> Card)` and `(Account -> Device)`

---

## 2. GSQL Queries (`queries.gsql`)

1. **`account_neighborhood(VERTEX<Account> seed_account, INT max_hops)`**: Expands 1-to-4 hops around an account to collect full entity subgraphs.
2. **`find_shared_devices(INT min_accounts)`**: Discovers hardware devices shared by multiple distinct accounts (syndicates and bot farms).
3. **`find_shared_ips(INT min_accounts)`**: Detects network IP endpoints with multiple account logins (anomalous proxy / VPN clusters).
4. **`find_connected_accounts(VERTEX<Account> seed_account)`**: Identifies 2-hop connected accounts sharing Devices, IPs, or Cards.
5. **`trace_transaction_paths(VERTEX<Account> source_account, INT max_depth)`**: Traces multi-hop fund routing and layering chains through mule accounts.
6. **`get_merchant_relationships(VERTEX<Merchant> target_merchant)`**: Analyzes transaction velocity and accounts targeting specific high-risk merchants.

---

## 3. Data Loading (`load_data.gsql`)

To load the generated CSV fixtures into a live TigerGraph instance:

```bash
# 1. Create Schema and Queries
gsql graph/schema.gsql
gsql graph/queries.gsql
gsql graph/load_data.gsql

# 2. Execute Loading Job
gsql -g FraudNetworkGraph 'RUN LOADING JOB load_fraud_data USING \
  f_customers="./data/raw/customers.csv", \
  f_accounts="./data/raw/accounts.csv", \
  f_transactions="./data/raw/transactions.csv", \
  f_cards="./data/raw/cards.csv", \
  f_devices="./data/raw/devices.csv", \
  f_ips="./data/raw/ips.csv", \
  f_merchants="./data/raw/merchants.csv", \
  f_owns="./data/raw/customer_owns_account.csv", \
  f_made="./data/raw/account_made_transaction.csv", \
  f_uses_card="./data/raw/account_uses_card.csv", \
  f_uses_device="./data/raw/account_uses_device.csv", \
  f_connected_from="./data/raw/account_connected_from_ip.csv", \
  f_paid_to="./data/raw/transaction_paid_to_merchant.csv", \
  f_received_by="./data/raw/transaction_received_by_account.csv";'
```

---

## 4. Local Development Fallback Simulator

For rapid offline iteration and automated CI/CD testing without a live TigerGraph server, `backend/app/services/graph_service.py` provides an in-memory graph simulator that reads `data/synthetic_fraud_graph.json` and executes the exact logic of all 6 GSQL queries.
