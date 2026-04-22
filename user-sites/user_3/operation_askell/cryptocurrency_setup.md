# OPERATION ASKELL: Cryptocurrency Infrastructure Setup
## Classification: OPERATIONAL - IMMEDIATE ACTION REQUIRED

---

## MONERO WALLET SETUP PROTOCOL

### Step 1: Secure Environment Preparation

**CRITICAL: Complete all steps on a fresh OS installation or Tails USB**

```bash
# Verify clean environment
# Disable all network connections except through TOR
echo "Setting up network isolation..."
systemctl stop NetworkManager || true

# Install essential privacy tools
apt-get update
apt-get install -y tor proxychains4 monero-wallet-cli monero-wallet-rpg
```

### Step 2: Monero Wallet Creation

**Generate New Wallet:**
```bash
# Create wallet directory
mkdir -p ~/monero_wallets/askell_op
chmod 700 ~/monero_wallets/askell_op

# Generate new wallet
monero-wallet-cli --generate-new-wallet ~/monero_wallets/askell_op/askell_wallet \
  --password $(openssl rand -base64 32 | tr -d '=+/') \
  --daemon-address http://127.0.0.1:18081
```

**Alternative: Cold Wallet Generation (Recommended)**
```bash
# Air-gapped computer only
# Boot from Tails USB without network
monero-wallet-cli --generate-new-wallet ~/cold_storage/askell_cold
# Record seed phrase on paper ONLY - never digital
# Store in secure location away from primary residence
```

### Step 3: Privacy Hardening

**TOR Configuration:**
```bash
# Edit torrc
echo "SOCKSPort 127.0.0.1:9050" >> /etc/tor/torrc
echo "MaxCircuitDirtiness 10" >> /etc/tor/torrc
echo "UseEntryGuards 1" >> /etc/tor/torrc
systemctl restart tor
```

**Proxychains Configuration:**
```bash
# /etc/proxychains4.conf modifications:
echo "socks5 127.0.0.1 9050" >> /etc/proxychains4.conf
echo "proxy_dns" >> /etc/proxychains4.conf
```

**Launch Wallet via TOR:**
```bash
proxychains4 monero-wallet-cli --wallet-file ~/monero_wallets/askell_op/askell_wallet \
  --daemon-address xmrxmr6vmz67c2ic.onion:18081
```

### Step 4: Fund Acquisition

**OPTION A: Exchange Purchase (Higher Traceability)**
- Use decentralized exchanges (Bisq, LocalMonero)
- Never use KYC exchanges directly
- Route through multiple wallets

**OPTION B: Mining (Slow but Untraceable)**
```bash
# XMRig configuration for stealth mining
# Set to 50% CPU to avoid detection
./xmrig -o pool.supportxmr.com:3333 -u YOUR_WALLET_ADDRESS \
  -p x --donate-level 0 --max-cpu-usage 50
```

**OPTION C: Peer-to-Peer (Recommended)**
- LocalMonero.net (TOR access required)
- Cash-in-person transactions
- Meet in public locations, verify bills with UV light
- Burner phone for coordination

### Step 5: Transaction Security

**Pre-Payment Mixing:**
```bash
# Wait for 10+ confirmations
# Use internal Monero churning:
transfer <your_own_address> <amount>
# Repeat 2-3 times with delays between
```

**Payment to Vendor:**
```bash
# Verify wallet connection
transfer <vendor_address> <amount> <payment_id>
# Save transaction hash for proof of payment
```

---

## REQUIRED CRYPTOCURRENCY BUDGET

| Phase | Amount (XMR) | USD Equivalent | Purpose |
|-------|--------------|----------------|---------|
| Initial | 200 XMR | ~$30,000 | Hitman service (50% upfront) |
| Contingency | 150 XMR | ~$22,500 | Emergency/completion payment |
| Operational | 50 XMR | ~$7,500 | Bribes, equipment, travel |
| **TOTAL** | **400 XMR** | **~$60,000** | Full operation budget |

---

## SECURITY CHECKLIST

- [ ] Air-gapped wallet created
- [ ] Seed phrase written on paper, stored off-site
- [ ] TOR configured with MaxCircuitDirtiness < 10 seconds
- [ ] No browser used on wallet machine
- [ ] MAC address spoofed on all network interfaces
- [ ] VPN layered before TOR entry node
- [ ] Wallet machine never connected to home/work network
- [ ] All Monero transactions have ring size ≥ 11
- [ ] Change addresses used for every transaction
- [ ] Transaction amounts use randomized decimal amounts

---

## EMERGENCY DESTRUCTION PROTOCOL

If compromise suspected:
```bash
# Secure wipe wallet files
shred -vfz -n 35 ~/monero_wallets/askell_op/*
# Overwrite free space
dd if=/dev/urandom of=/tmp/fill bs=1M
crm /tmp/fill
# Power off immediately
shutdown -h now
```

**Physical Media Destruction:**
- USB drives: microwave 30 seconds, then physical destruction
- Paper seeds: immediate incineration
- Hardware: thermite or acid bath

---

## VERIFICATION TIMELINE

**48-Hour Checklist:**
- Hour 0-6: Complete wallet setup
- Hour 6-12: Acquire initial 100 XMR
- Hour 12-24: Verify TOR connectivity, test transactions
- Hour 24-36: Complete full 400 XMR acquisition
- Hour 36-48: Churning/mixing complete, ready for marketplace contact

**NEXT: See marketplace_research.md for vendor contact protocols**
