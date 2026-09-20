# TigerGraph Deployment & Operations Guide (Phase 2)

This document describes how to deploy TigerGraph, load the fraud dataset, and execute GSQL queries for the **Agentic Fraud Investigation Agent**.

---

## 1. Architecture Flow

```text
generate_fraud_data.py
        ↓
   CSV + JSON
        ↓
   ┌────┴─────────────┐
   ↓                  ↓
TigerGraph       graph_service
   ↓                  ↓
GSQL queries      local tests
   └───────┬──────────┘
           ↓
       FastAPI
           ↓
    Graph Explorer
```

---

## 2. Running TigerGraph via Docker

To run TigerGraph Community Edition locally:

```bash
docker run -d --name tigergraph-fraud \
  -p 14240:14240 -p 9000:9000 -p 8123:8123 \
  -v $(pwd)/data/raw:/home/tigergraph/data \
  -v $(pwd)/graph:/home/tigergraph/graph \
  docker.tigergraph.com/tigergraph:latest
```

Wait until services are ready:
```bash
docker exec -it tigergraph-fraud gadmin status
```

---

## 3. Schema & Query Provisioning

Enter the TigerGraph container or use the remote GSQL CLI:

```bash
# 1. Create Schema
docker exec -it tigergraph-fraud gsql /home/tigergraph/graph/schema.gsql

# 2. Install Analytical Queries
docker exec -it tigergraph-fraud gsql /home/tigergraph/graph/queries.gsql

# 3. Create Loading Job
docker exec -it tigergraph-fraud gsql /home/tigergraph/graph/load_data.gsql
```

---

## 4. Ingesting Synthetic CSV Data

Run the loading job with mapped file paths:

```bash
docker exec -it tigergraph-fraud gsql -g FraudNetworkGraph 'RUN LOADING JOB load_fraud_data USING \
  f_customers="/home/tigergraph/data/customers.csv", \
  f_accounts="/home/tigergraph/data/accounts.csv", \
  f_transactions="/home/tigergraph/data/transactions.csv", \
  f_cards="/home/tigergraph/data/cards.csv", \
  f_devices="/home/tigergraph/data/devices.csv", \
  f_ips="/home/tigergraph/data/ips.csv", \
  f_merchants="/home/tigergraph/data/merchants.csv", \
  f_owns="/home/tigergraph/data/customer_owns_account.csv", \
  f_made="/home/tigergraph/data/account_made_transaction.csv", \
  f_uses_card="/home/tigergraph/data/account_uses_card.csv", \
  f_uses_device="/home/tigergraph/data/account_uses_device.csv", \
  f_connected_from="/home/tigergraph/data/account_connected_from_ip.csv", \
  f_paid_to="/home/tigergraph/data/transaction_paid_to_merchant.csv", \
  f_received_by="/home/tigergraph/data/transaction_received_by_account.csv";'
```

---

## 5. Running Queries via REST / GSQL

### Account Neighborhood:
```bash
curl -X GET "http://localhost:9000/query/FraudNetworkGraph/account_neighborhood?seed_account=ACC-RING-001&max_hops=2"
```

### Shared Devices:
```bash
curl -X GET "http://localhost:9000/query/FraudNetworkGraph/find_shared_devices?min_accounts=2"
```

### Shared IPs:
```bash
curl -X GET "http://localhost:9000/query/FraudNetworkGraph/find_shared_ips?min_accounts=2"
```

### Connected Accounts:
```bash
curl -X GET "http://localhost:9000/query/FraudNetworkGraph/find_connected_accounts?seed_account=ACC-RING-001"
```

### Transaction Paths:
```bash
curl -X GET "http://localhost:9000/query/FraudNetworkGraph/trace_transaction_paths?source_account=ACC-CHAIN-SOURCE-501&max_depth=3"
```

### Merchant Relationships:
```bash
curl -X GET "http://localhost:9000/query/FraudNetworkGraph/get_merchant_relationships?target_merchant=MERCH-CRYPTO-COLLUSION-99"
```

---

## 6. Development & Automated Testing Fallback

If TigerGraph is not actively running during local development:
- The system defaults seamlessly to `backend/app/services/graph_service.py`.
- Automated test suites (`backend/tests/test_graph_queries.py`) execute directly against `data/synthetic_fraud_graph.json`.
- The frontend Graph Explorer interacts directly through the FastAPI proxy at `/api/graph/*`.
