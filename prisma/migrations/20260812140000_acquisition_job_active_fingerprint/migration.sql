-- Atomic active-fingerprint uniqueness for AcquisitionJob (review fix).
-- Allows reusing fingerprint after SUCCEEDED/FAILED; blocks concurrent QUEUED/RUNNING.

CREATE UNIQUE INDEX "AcquisitionJob_active_fingerprint_key"
ON "AcquisitionJob" ("fingerprint")
WHERE "status" IN ('QUEUED', 'RUNNING');
