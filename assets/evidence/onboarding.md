# Onboarding: don't race the installer

Selected source from the owner's private homelab-ansible repository, snapshot 6df1c56 (October 2026).
File: tests/test_onboarding.py, NewGuestSelection.test_active_community_installer_defers_ready_guest.
This is an exact method excerpt, not a complete standalone test file. Fixtures and imports are omitted.
No private addresses, guest identifiers, credentials or hostnames are included.

```python
def test_active_community_installer_defers_ready_guest(self):
    onboard.select([self.row], self.state, self.policy, 1000)
    self.assertFalse(
        onboard.select([{**self.row, "busy": True}], self.state, self.policy, 2000)[
            0
        ]
    )
```

Problem: a new guest can be discoverable while its application installer is still working.
Decision: discovery alone must not authorize monitoring installation; a busy guest is deferred.
Verification: this test advances discovery time but marks the guest busy and asserts that it is not selected.

All nine NewGuestSelection unit tests passed locally during portfolio preparation. They cover settling, identity changes, opt-out, unsupported/ambiguous addresses, existing identities, and target ownership. This is offline test evidence, not a check of current guest, Wazuh or Prometheus health. No infrastructure deployment was run.
