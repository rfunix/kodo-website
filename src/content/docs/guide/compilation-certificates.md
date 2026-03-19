---
title: "Compilation Certificates"
description: "How Kōdo generates verifiable compilation certificates for trust and auditing"
---

# Compilation Certificates

When Kōdo compiles a program, it generates a **compilation certificate** (`.ko.cert.json`) alongside the binary. This certificate records the verification status of every function: contracts, confidence scores, authorship, and review status.

## Certificate Structure

```json
{
  "version": "0.5.0",
  "compiled_at": "2026-03-19T10:30:00Z",
  "source_file": "payment_service.ko",
  "module": "payment_service",
  "functions": [
    {
      "name": "charge",
      "confidence": 0.95,
      "authored_by": "claude",
      "contracts": {
        "requires": ["amount > 0"],
        "ensures": ["result.is_ok()"],
        "status": "verified_static"
      },
      "reviewed_by": null
    }
  ],
  "overall_confidence": 0.95,
  "all_contracts_verified": true
}
```

## Certificate Fields

| Field | Description |
|-------|-------------|
| `confidence` | Per-function confidence score (0.0–1.0) |
| `authored_by` | Agent or human that wrote the function |
| `contracts.status` | `verified_static`, `runtime_only`, or `none` |
| `reviewed_by` | Human reviewer (required when confidence < 0.8) |
| `overall_confidence` | Minimum confidence across all functions |
| `all_contracts_verified` | Whether all contracts were statically verified |

## Contract Status

- **`verified_static`** — Z3 SMT solver proved the contract holds for all inputs
- **`runtime_only`** — Contract couldn't be statically verified; runtime check inserted
- **`none`** — Function has no contracts

## Transitive Confidence

Confidence propagates transitively through the call graph. If function A (confidence 0.95) calls function B (confidence 0.5), A's **effective confidence** drops to 0.5.

```kodo
@confidence(0.95)
fn process_order(id: Int) -> String {
    // Effective confidence = min(0.95, 0.5) = 0.5
    return validate(id)
}

@confidence(0.5)
@reviewed_by(human: "rafael")
fn validate(id: Int) -> String {
    return "valid"
}
```

The certificate captures both declared and effective confidence.

## Policy-Based Automation

Certificates enable automated deployment decisions:

```bash
# Deploy only if all functions have confidence > 0.9
# and all contracts are statically verified
kodoc audit payment_service.ko --min-confidence 0.9 --require-static
```

Example policies:
- **Staging**: confidence > 0.7, contracts verified or runtime
- **Production**: confidence > 0.9, all contracts statically verified
- **Safety-critical**: confidence > 0.95, all contracts verified, all functions reviewed

## Generating Certificates

Certificates are generated automatically during compilation:

```bash
# Build with certificate
kodoc build payment_service.ko -o payment_service

# Certificate is created alongside the binary
ls -la
# payment_service          (binary)
# payment_service.ko.cert.json  (certificate)
```

## Auditing

Use `kodoc audit` to inspect certificates:

```bash
# Full confidence report
kodoc audit payment_service.ko

# JSON output for automation
kodoc audit payment_service.ko --json

# Check against policy
kodoc audit payment_service.ko --min-confidence 0.9
```
