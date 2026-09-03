import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { FileSingleWriterRunLock, SINGLE_WRITER_LOCK_STATUSES } from "../index.js";

const root = await mkdtemp(join(tmpdir(), "hardware-radar-single-writer-"));
try {
    const lockPath = join(root, "acquisition.lock");
    const first = new FileSingleWriterRunLock({ lockPath, staleAfterMs: 10_000, heartbeatIntervalMs: 1_000, ownerId: () => "owner-a" });
    const second = new FileSingleWriterRunLock({ lockPath, staleAfterMs: 10_000, heartbeatIntervalMs: 1_000, ownerId: () => "owner-b" });

    const acquired = await first.acquire();
    assert.equal(acquired.status, SINGLE_WRITER_LOCK_STATUSES.ACQUIRED);
    const blocked = await second.acquire();
    assert.equal(blocked.status, SINGLE_WRITER_LOCK_STATUSES.BUSY);
    assert.equal(blocked.owner.ownerId, "owner-a");
    assert.equal(await first.release("owner-a"), true);

    let releaseRun;
    const runGate = new Promise((resolve) => { releaseRun = resolve; });
    let entered = 0;
    const runnerA = new FileSingleWriterRunLock({ lockPath, staleAfterMs: 10_000, heartbeatIntervalMs: 1_000, ownerId: () => "runner-a" });
    const runnerB = new FileSingleWriterRunLock({ lockPath, staleAfterMs: 10_000, heartbeatIntervalMs: 1_000, ownerId: () => "runner-b" });
    const running = runnerA.runExclusive(async () => { entered += 1; await runGate; return "done"; });
    while (entered === 0) await new Promise((resolve) => setTimeout(resolve, 1));
    const skipped = await runnerB.runExclusive(async () => { entered += 100; });
    assert.equal(skipped.status, SINGLE_WRITER_LOCK_STATUSES.SKIPPED_LOCKED);
    assert.equal(entered, 1);
    releaseRun();
    const completed = await running;
    assert.equal(completed.status, SINGLE_WRITER_LOCK_STATUSES.COMPLETED);
    assert.equal(completed.result, "done");

    const stalePath = join(root, "stale.lock");
    await mkdir(stalePath);
    await writeFile(join(stalePath, "owner.json"), JSON.stringify({
        schemaVersion: "1.0",
        ownerId: "crashed-owner",
        pid: 999999,
        acquiredAt: "2026-08-16T00:00:00.000Z",
        heartbeatAt: "2026-08-16T00:00:00.000Z"
    }), "utf8");
    const recovering = new FileSingleWriterRunLock({
        lockPath: stalePath,
        staleAfterMs: 10_000,
        heartbeatIntervalMs: 1_000,
        now: () => "2026-08-16T00:01:00.000Z",
        ownerId: () => "recovery-owner"
    });
    const recovered = await recovering.acquire();
    assert.equal(recovered.status, SINGLE_WRITER_LOCK_STATUSES.ACQUIRED);
    assert.equal(recovered.reclaimedStaleLock, true);
    assert.equal(recovered.owner.ownerId, "recovery-owner");

    const oldOwner = new FileSingleWriterRunLock({
        lockPath: stalePath,
        staleAfterMs: 10_000,
        heartbeatIntervalMs: 1_000,
        ownerId: () => "crashed-owner"
    });
    assert.equal(await oldOwner.release("crashed-owner"), false);
    const ownerOnDisk = JSON.parse(await readFile(join(stalePath, "owner.json"), "utf8"));
    assert.equal(ownerOnDisk.ownerId, "recovery-owner");
    assert.equal(await recovering.release("recovery-owner"), true);

    console.log("Single-writer persistence tests passed.");
} finally {
    await rm(root, { recursive: true, force: true });
}
