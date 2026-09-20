#!/usr/bin/env python3
"""
Deterministic Synthetic Fraud Data Generator for TigerGraph (Phase 2)

Generates:
1. 7 Vertex CSVs and 7 Edge CSVs in data/raw/
2. Consolidated JSON graph in data/synthetic_fraud_graph.json

Adheres strictly to synthetic compliance constraints:
- ssn_hash: synthetic hashes (SYNTH_SSN_HASH_*)
- card_number_masked: masked synthetic formats (4000-XXXX-XXXX-*)
- ip_address: RFC 5737 Documentation/Reserved ranges (192.0.2.x, 198.51.100.x, 203.0.113.x)
- email: RFC 2606 reserved domains (@example.test)
- VPN/Proxy labeled as synthetic/anomalous behavior

Scenarios Represented:
1. Normal Baseline Behavior
2. Shared Device Ring (Multi-accounting / Bot Farm)
3. Anomalous IP Cluster (Shared Proxy/VPN synthetic anomaly)
4. Merchant Collusion / Bust-out Spike
5. Multi-hop Layering / Money Muling Chain
"""

import os
import csv
import json
import random
import hashlib
from datetime import datetime, timezone, timedelta

# Set deterministic seed
RANDOM_SEED = 42
random.seed(RANDOM_SEED)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RAW_DIR = os.path.join(BASE_DIR, "raw")
JSON_FILE = os.path.join(BASE_DIR, "synthetic_fraud_graph.json")

os.makedirs(RAW_DIR, exist_ok=True)

NOW = datetime(2026, 9, 20, 12, 0, 0, tzinfo=timezone.utc)

def make_synth_hash(prefix: str, val: str) -> str:
    h = hashlib.sha256(f"SYNTH_{prefix}_{val}_{RANDOM_SEED}".encode()).hexdigest()[:16].upper()
    return f"SYNTH_HASH_{h}"

# Storage dictionaries
vertices = {
    "Customer": [],
    "Account": [],
    "Transaction": [],
    "Card": [],
    "Device": [],
    "IP": [],
    "Merchant": [],
}

edges = {
    "OWNS": [],             # Customer -> Account
    "MADE": [],             # Account -> Transaction
    "USES_CARD": [],        # Account -> Card (since)
    "USES_DEVICE": [],      # Account -> Device (last_seen)
    "CONNECTED_FROM": [],   # Account -> IP (timestamp)
    "PAID_TO": [],          # Transaction -> Merchant
    "RECEIVED_BY": [],      # Transaction -> Account
}

scenario_registry = []

# ==============================================================================
# 1. MERCHANTS (Legitimate & Anomalous)
# ==============================================================================
merchants_data = [
    {"id": "MERCH-GROCERY-01", "name": "FreshMarket Supercenter", "mcc": "5411", "risk": "LOW"},
    {"id": "MERCH-STREAM-02", "name": "Nordic Stream Media", "mcc": "4899", "risk": "LOW"},
    {"id": "MERCH-ECOM-03", "name": "Global Retail Direct", "mcc": "5311", "risk": "LOW"},
    {"id": "MERCH-TECH-04", "name": "Apex Electronics Depot", "mcc": "5732", "risk": "MEDIUM"},
    {"id": "MERCH-CRYPTO-COLLUSION-99", "name": "BitVault OTC Escrow", "mcc": "6051", "risk": "CRITICAL"},
    {"id": "MERCH-OFFSHORE-504", "name": "Larnaca Liquidity Services", "mcc": "6211", "risk": "HIGH"},
]

for m in merchants_data:
    vertices["Merchant"].append({
        "id": m["id"],
        "name": m["name"],
        "merchant_category_code": m["mcc"],
        "risk_level": m["risk"],
    })

# ==============================================================================
# SCENARIO 1: NORMAL BASELINE (10 Legitimate Customers)
# ==============================================================================
normal_accounts = []
for i in range(1, 11):
    c_id = f"CUST-NORM-{i:03d}"
    acc_id = f"ACC-NORM-{i:03d}"
    card_id = f"CARD-NORM-{i:03d}"
    dev_id = f"DEV-NORM-{i:03d}"
    ip_id = f"IP-NORM-{i:03d}"
    
    # RFC 5737 TEST-NET-1: 192.0.2.x
    ip_addr = f"192.0.2.{10 + i}"
    
    created_dt = (NOW - timedelta(days=180 + i * 10)).strftime("%Y-%m-%dT%H:%M:%SZ")
    
    vertices["Customer"].append({
        "id": c_id,
        "name": f"Regular Customer {i}",
        "ssn_hash": make_synth_hash("SSN", c_id),
        "email": f"customer.{i:03d}@example.test",
        "risk_score": round(random.uniform(0.05, 0.20), 2),
        "created_at": created_dt,
    })
    
    vertices["Account"].append({
        "id": acc_id,
        "account_number": f"9900-4400-{i:04d}",
        "account_type": "CHECKING" if i % 2 == 0 else "SAVINGS",
        "balance": round(random.uniform(1500.0, 12000.0), 2),
        "status": "ACTIVE",
        "opened_date": created_dt,
    })
    normal_accounts.append(acc_id)
    
    vertices["Card"].append({
        "id": card_id,
        "card_number_masked": f"4111-22XX-XXXX-{1000 + i}",
        "card_type": "VISA_DEBIT",
        "expiration_date": "12/28",
    })
    
    vertices["Device"].append({
        "id": dev_id,
        "device_fingerprint": make_synth_hash("FINGERPRINT", dev_id),
        "device_type": "Mobile",
        "os": "iOS 17.4" if i % 2 == 0 else "Android 14",
        "browser": "Mobile Safari" if i % 2 == 0 else "Chrome Mobile",
        "is_emulator": False,
    })
    
    vertices["IP"].append({
        "id": ip_id,
        "ip_address": ip_addr,
        "asn": "AS64496", # RFC 5398 Reserved ASN
        "country": "US",
        "is_proxy_vpn": False,
    })
    
    # Edges
    edges["OWNS"].append({"from_customer": c_id, "to_account": acc_id})
    edges["USES_CARD"].append({"from_account": acc_id, "to_card": card_id, "since": created_dt})
    edges["USES_DEVICE"].append({"from_account": acc_id, "to_device": dev_id, "last_seen": (NOW - timedelta(hours=i)).strftime("%Y-%m-%dT%H:%M:%SZ")})
    edges["CONNECTED_FROM"].append({"from_account": acc_id, "to_ip": ip_id, "timestamp": (NOW - timedelta(hours=i)).strftime("%Y-%m-%dT%H:%M:%SZ")})
    
    # 2-3 Normal Transactions
    for t_idx in range(1, 3):
        t_id = f"TXN-NORM-{i:03d}-{t_idx}"
        m_target = merchants_data[t_idx - 1]["id"]
        t_time = (NOW - timedelta(days=t_idx, hours=i)).strftime("%Y-%m-%dT%H:%M:%SZ")
        amount = round(random.uniform(18.50, 145.00), 2)
        
        vertices["Transaction"].append({
            "id": t_id,
            "amount": amount,
            "currency": "USD",
            "timestamp": t_time,
            "status": "COMPLETED",
            "channel": "POS" if t_idx == 1 else "ONLINE",
        })
        
        edges["MADE"].append({"from_account": acc_id, "to_transaction": t_id})
        edges["PAID_TO"].append({"from_transaction": t_id, "to_merchant": m_target})

scenario_registry.append({
    "name": "Scenario 1: Normal Baseline",
    "description": "10 regular customers with 1-to-1 account, device, and residential IP mappings performing everyday retail purchases.",
    "account_count": len(normal_accounts),
})

# ==============================================================================
# SCENARIO 2: SHARED DEVICE RING / BOT FARM (4 Accounts Sharing 1 Emulator)
# ==============================================================================
shared_dev_id = "DEV-ROOT-EMU-77"
vertices["Device"].append({
    "id": shared_dev_id,
    "device_fingerprint": make_synth_hash("FINGERPRINT", "EMULATOR_RING_77"),
    "device_type": "Emulator",
    "os": "Android 10 (Rooted/Spoofed)",
    "browser": "HeadlessChrome/112",
    "is_emulator": True,
})

shared_dev_accounts = []
for i in range(1, 5):
    c_id = f"CUST-RING-{i:03d}"
    acc_id = f"ACC-RING-{i:03d}"
    card_id = f"CARD-RING-{i:03d}"
    ip_id = f"IP-RING-{i:03d}"
    
    # RFC 5737 TEST-NET-2: 198.51.100.x
    ip_addr = f"198.51.100.{20 + i}"
    created_dt = (NOW - timedelta(days=15 + i)).strftime("%Y-%m-%dT%H:%M:%SZ")
    
    vertices["Customer"].append({
        "id": c_id,
        "name": f"Syndicate Identity {i}",
        "ssn_hash": make_synth_hash("SSN", c_id),
        "email": f"syndicate.{i:03d}@example.test",
        "risk_score": 0.88,
        "created_at": created_dt,
    })
    
    vertices["Account"].append({
        "id": acc_id,
        "account_number": f"7700-1100-{i:04d}",
        "account_type": "CHECKING",
        "balance": 8400.00,
        "status": "UNDER_INVESTIGATION",
        "opened_date": created_dt,
    })
    shared_dev_accounts.append(acc_id)
    
    vertices["Card"].append({
        "id": card_id,
        "card_number_masked": f"5424-99XX-XXXX-{2000 + i}",
        "card_type": "MASTERCARD_CREDIT",
        "expiration_date": "08/27",
    })
    
    vertices["IP"].append({
        "id": ip_id,
        "ip_address": ip_addr,
        "asn": "AS64497",
        "country": "US",
        "is_proxy_vpn": False,
    })
    
    edges["OWNS"].append({"from_customer": c_id, "to_account": acc_id})
    edges["USES_CARD"].append({"from_account": acc_id, "to_card": card_id, "since": created_dt})
    # All 4 connect to the same shared emulator device
    edges["USES_DEVICE"].append({"from_account": acc_id, "to_device": shared_dev_id, "last_seen": (NOW - timedelta(minutes=15 * i)).strftime("%Y-%m-%dT%H:%M:%SZ")})
    edges["CONNECTED_FROM"].append({"from_account": acc_id, "to_ip": ip_id, "timestamp": (NOW - timedelta(minutes=15 * i)).strftime("%Y-%m-%dT%H:%M:%SZ")})
    
    # Rapid cash-out transactions
    t_id = f"TXN-RING-{i:03d}"
    vertices["Transaction"].append({
        "id": t_id,
        "amount": 2450.00,
        "currency": "USD",
        "timestamp": (NOW - timedelta(minutes=10 * i)).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "status": "FLAGGED",
        "channel": "MOBILE_APP",
    })
    edges["MADE"].append({"from_account": acc_id, "to_transaction": t_id})
    edges["PAID_TO"].append({"from_transaction": t_id, "to_merchant": "MERCH-CRYPTO-COLLUSION-99"})

scenario_registry.append({
    "name": "Scenario 2: Shared Device Ring",
    "description": f"4 distinct accounts ({', '.join(shared_dev_accounts)}) all sharing a single rooted emulator ({shared_dev_id}).",
    "device_id": shared_dev_id,
    "accounts": shared_dev_accounts,
})

# ==============================================================================
# SCENARIO 3: ANOMALOUS IP / PROXY CLUSTER (3 Accounts Sharing 1 Proxy IP)
# ==============================================================================
# RFC 5737 TEST-NET-3: 203.0.113.x
shared_ip_id = "IP-ANOMALY-PROXY-88"
shared_ip_addr = "203.0.113.88"

vertices["IP"].append({
    "id": shared_ip_id,
    "ip_address": shared_ip_addr,
    "asn": "AS64498",
    "country": "NL",
    "is_proxy_vpn": True,
})

shared_ip_accounts = []
for i in range(1, 4):
    c_id = f"CUST-PROXY-{i:03d}"
    acc_id = f"ACC-PROXY-{i:03d}"
    dev_id = f"DEV-PROXY-{i:03d}"
    created_dt = (NOW - timedelta(days=5 + i)).strftime("%Y-%m-%dT%H:%M:%SZ")
    
    vertices["Customer"].append({
        "id": c_id,
        "name": f"Proxy Cluster Holder {i}",
        "ssn_hash": make_synth_hash("SSN", c_id),
        "email": f"proxy.holder.{i:03d}@example.test",
        "risk_score": 0.92,
        "created_at": created_dt,
    })
    
    vertices["Account"].append({
        "id": acc_id,
        "account_number": f"8800-3300-{i:04d}",
        "account_type": "CHECKING",
        "balance": 4100.00,
        "status": "LOCKED",
        "opened_date": created_dt,
    })
    shared_ip_accounts.append(acc_id)
    
    vertices["Device"].append({
        "id": dev_id,
        "device_fingerprint": make_synth_hash("FINGERPRINT", dev_id),
        "device_type": "Desktop",
        "os": "Linux x86_64",
        "browser": "Firefox/115",
        "is_emulator": False,
    })
    
    edges["OWNS"].append({"from_customer": c_id, "to_account": acc_id})
    edges["USES_DEVICE"].append({"from_account": acc_id, "to_device": dev_id, "last_seen": (NOW - timedelta(minutes=5 * i)).strftime("%Y-%m-%dT%H:%M:%SZ")})
    # All 3 connect via the shared proxy IP
    edges["CONNECTED_FROM"].append({"from_account": acc_id, "to_ip": shared_ip_id, "timestamp": (NOW - timedelta(minutes=5 * i)).strftime("%Y-%m-%dT%H:%M:%SZ")})
    
    # Rapid probe transaction
    t_id = f"TXN-PROXY-{i:03d}"
    vertices["Transaction"].append({
        "id": t_id,
        "amount": round(random.uniform(5.00, 25.00), 2),
        "currency": "USD",
        "timestamp": (NOW - timedelta(minutes=4 * i)).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "status": "FLAGGED",
        "channel": "WEB",
    })
    edges["MADE"].append({"from_account": acc_id, "to_transaction": t_id})
    edges["PAID_TO"].append({"from_transaction": t_id, "to_merchant": "MERCH-ECOM-03"})

scenario_registry.append({
    "name": "Scenario 3: Anomalous IP Proxy Cluster",
    "description": f"3 accounts ({', '.join(shared_ip_accounts)}) originating authorizations from single synthetic proxy IP ({shared_ip_addr}).",
    "ip_id": shared_ip_id,
    "ip_address": shared_ip_addr,
    "accounts": shared_ip_accounts,
})

# ==============================================================================
# SCENARIO 4: MERCHANT COLLUSION / BUST-OUT (Multiple Accounts -> Single High-Risk Merchant)
# ==============================================================================
collusion_merchant_id = "MERCH-CRYPTO-COLLUSION-99"
collusion_accounts = []

for i in range(1, 4):
    c_id = f"CUST-COLLUDE-{i:03d}"
    acc_id = f"ACC-COLLUDE-{i:03d}"
    created_dt = (NOW - timedelta(days=20 + i)).strftime("%Y-%m-%dT%H:%M:%SZ")
    
    vertices["Customer"].append({
        "id": c_id,
        "name": f"Collusive Trader {i}",
        "ssn_hash": make_synth_hash("SSN", c_id),
        "email": f"trader.{i:03d}@example.test",
        "risk_score": 0.85,
        "created_at": created_dt,
    })
    
    vertices["Account"].append({
        "id": acc_id,
        "account_number": f"6600-9900-{i:04d}",
        "account_type": "CHECKING",
        "balance": 28500.00,
        "status": "ACTIVE",
        "opened_date": created_dt,
    })
    collusion_accounts.append(acc_id)
    edges["OWNS"].append({"from_customer": c_id, "to_account": acc_id})
    
    # Multiple transactions just under the $10,000 reporting threshold
    for t_step in range(1, 3):
        t_id = f"TXN-COLLUDE-{i:03d}-{t_step}"
        vertices["Transaction"].append({
            "id": t_id,
            "amount": 9500.00 + (t_step * 150.0),
            "currency": "USD",
            "timestamp": (NOW - timedelta(hours=3 * i, minutes=20 * t_step)).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "status": "FLAGGED",
            "channel": "WIRE",
        })
        edges["MADE"].append({"from_account": acc_id, "to_transaction": t_id})
        edges["PAID_TO"].append({"from_transaction": t_id, "to_merchant": collusion_merchant_id})

scenario_registry.append({
    "name": "Scenario 4: Merchant Bust-out & Collusion",
    "description": f"High volume fund sweeps concentrated into {collusion_merchant_id} structured below reporting limits.",
    "merchant_id": collusion_merchant_id,
    "accounts": collusion_accounts,
})

# ==============================================================================
# SCENARIO 5: MULTI-HOP LAYERING / TRANSACTION CHAIN (Acc A -> Acc B -> Acc C -> Merchant)
# ==============================================================================
chain_acc_a = "ACC-CHAIN-SOURCE-501"
chain_acc_b = "ACC-CHAIN-MULE-502"
chain_acc_c = "ACC-CHAIN-MULE-503"

chain_accounts = [chain_acc_a, chain_acc_b, chain_acc_c]
chain_custs = ["CUST-CHAIN-501", "CUST-CHAIN-502", "CUST-CHAIN-503"]

for idx, (c_id, a_id) in enumerate(zip(chain_custs, chain_accounts)):
    vertices["Customer"].append({
        "id": c_id,
        "name": f"Layering Entity {idx + 1}",
        "ssn_hash": make_synth_hash("SSN", c_id),
        "email": f"entity.{idx + 1}@example.test",
        "risk_score": 0.89 + (idx * 0.03),
        "created_at": (NOW - timedelta(days=40)).strftime("%Y-%m-%dT%H:%M:%SZ"),
    })
    vertices["Account"].append({
        "id": a_id,
        "account_number": f"5500-1100-{501 + idx}",
        "account_type": "CHECKING",
        "balance": 15000.00,
        "status": "ACTIVE",
        "opened_date": (NOW - timedelta(days=40)).strftime("%Y-%m-%dT%H:%M:%SZ"),
    })
    edges["OWNS"].append({"from_customer": c_id, "to_account": a_id})

# Hop 1: Acc A -(MADE)-> Txn 1 -(RECEIVED_BY)-> Acc B
t_chain_1 = "TXN-CHAIN-HOP-1"
vertices["Transaction"].append({
    "id": t_chain_1,
    "amount": 25000.00,
    "currency": "USD",
    "timestamp": (NOW - timedelta(hours=6)).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "status": "COMPLETED",
    "channel": "P2P_TRANSFER",
})
edges["MADE"].append({"from_account": chain_acc_a, "to_transaction": t_chain_1})
edges["RECEIVED_BY"].append({"from_transaction": t_chain_1, "to_account": chain_acc_b})

# Hop 2: Acc B -(MADE)-> Txn 2 -(RECEIVED_BY)-> Acc C
t_chain_2 = "TXN-CHAIN-HOP-2"
vertices["Transaction"].append({
    "id": t_chain_2,
    "amount": 24200.00,
    "currency": "USD",
    "timestamp": (NOW - timedelta(hours=4)).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "status": "COMPLETED",
    "channel": "P2P_TRANSFER",
})
edges["MADE"].append({"from_account": chain_acc_b, "to_transaction": t_chain_2})
edges["RECEIVED_BY"].append({"from_transaction": t_chain_2, "to_account": chain_acc_c})

# Hop 3: Acc C -(MADE)-> Txn 3 -(PAID_TO)-> Offshore Merchant
t_chain_3 = "TXN-CHAIN-HOP-3"
vertices["Transaction"].append({
    "id": t_chain_3,
    "amount": 23500.00,
    "currency": "USD",
    "timestamp": (NOW - timedelta(hours=2)).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "status": "FLAGGED",
    "channel": "SWIFT_WIRE",
})
edges["MADE"].append({"from_account": chain_acc_c, "to_transaction": t_chain_3})
edges["PAID_TO"].append({"from_transaction": t_chain_3, "to_merchant": "MERCH-OFFSHORE-504"})

scenario_registry.append({
    "name": "Scenario 5: Multi-hop Layering / Transaction Chain",
    "description": f"Fund hop chain: {chain_acc_a} -> {chain_acc_b} -> {chain_acc_c} -> MERCH-OFFSHORE-504.",
    "path": [chain_acc_a, t_chain_1, chain_acc_b, t_chain_2, chain_acc_c, t_chain_3, "MERCH-OFFSHORE-504"],
})

# ==============================================================================
# WRITE CSV FIXTURES TO data/raw/
# ==============================================================================

# Write Vertices
for v_type, v_list in vertices.items():
    if not v_list:
        continue
    filepath = os.path.join(RAW_DIR, f"{v_type.lower()}s.csv")
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(v_list[0].keys()))
        writer.writeheader()
        writer.writerows(v_list)
    print(f"Generated {filepath}: {len(v_list)} rows")

# Write Edges
edge_file_map = {
    "OWNS": ("customer_owns_account.csv", ["from_customer", "to_account"]),
    "MADE": ("account_made_transaction.csv", ["from_account", "to_transaction"]),
    "USES_CARD": ("account_uses_card.csv", ["from_account", "to_card", "since"]),
    "USES_DEVICE": ("account_uses_device.csv", ["from_account", "to_device", "last_seen"]),
    "CONNECTED_FROM": ("account_connected_from_ip.csv", ["from_account", "to_ip", "timestamp"]),
    "PAID_TO": ("transaction_paid_to_merchant.csv", ["from_transaction", "to_merchant"]),
    "RECEIVED_BY": ("transaction_received_by_account.csv", ["from_transaction", "to_account"]),
}

for edge_name, (filename, fieldnames) in edge_file_map.items():
    e_list = edges.get(edge_name, [])
    filepath = os.path.join(RAW_DIR, filename)
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(e_list)
    print(f"Generated {filepath}: {len(e_list)} rows")

# ==============================================================================
# WRITE CONSOLIDATED JSON GRAPH
# ==============================================================================
consolidated = {
    "metadata": {
        "generator": "generate_fraud_data.py",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "random_seed": RANDOM_SEED,
        "vertex_counts": {k: len(v) for k, v in vertices.items()},
        "edge_counts": {k: len(v) for k, v in edges.items()},
    },
    "scenarios": scenario_registry,
    "vertices": vertices,
    "edges": edges,
}

with open(JSON_FILE, "w", encoding="utf-8") as f:
    json.dump(consolidated, f, indent=2)

print(f"\nGenerated consolidated JSON: {JSON_FILE}")
print(f"Total Vertices: {sum(len(v) for v in vertices.values())}")
print(f"Total Edges: {sum(len(e) for e in edges.values())}")
print(f"Scenarios embedded: {len(scenario_registry)}")
