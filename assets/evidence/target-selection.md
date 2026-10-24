# Target selection: ownership before publication

Selected source from the owner's private homelab-ansible repository, snapshot 6df1c56 (October 2026).
File: scripts/onboard_lxcs.py, targets_for.
Exact excerpt from inside the managed-target loop; surrounding setup and target construction are omitted.
No private addresses, guest identifiers, credentials or hostnames are included.

```python
row = current.get(key)
if (
    not row
    or row["identity"] != h["identity"]
    or row["status"] != "running"
    or h["address"] not in row.get("addresses", [])
):
    continue
```

Problem: an old target must not survive guest replacement, shutdown or an address change.
Decision: iterate only automation-owned records, then compare them with current discovery before publishing a scrape target.
Verification: NewGuestSelection.test_only_owned_running_targets_are_published checks ownership, running state and identity mismatch. A separate discovery test covers settling again after an address change.

All nine NewGuestSelection unit tests passed locally during portfolio preparation. This selection predicate shows the stale-target guard; it does not by itself show the atomic file writer or prove that a live Prometheus scrape succeeds. No infrastructure deployment was run.
