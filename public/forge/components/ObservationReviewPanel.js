const ALLOWED_DECISIONS = new Set(["REVIEWED", "HOLD", "REJECTED"]);

export class ObservationReviewPanel {
    constructor(root, { copyToClipboard } = {}) {
        this.root = root;
        this.copyToClipboard = copyToClipboard;
        this.item = null;
        this.decision = null;

        this.fileInput = root.querySelector("#reviewBundleFile");
        this.statusBadge = root.querySelector("#reviewBundleStatus");
        this.summary = root.querySelector("#reviewBundleSummary");
        this.details = root.querySelector("#reviewBundleDetails");
        this.reviewer = root.querySelector("#reviewedBy");
        this.notes = root.querySelector("#reviewNotes");
        this.decisionOutput = root.querySelector("#reviewDecisionOutput");
        this.copyButton = root.querySelector("#copyReviewDecisionButton");
        this.downloadButton = root.querySelector("#downloadReviewDecisionButton");
        this.actionButtons = [...root.querySelectorAll("[data-review-decision]")];

        this.fileInput.addEventListener("change", () => this.loadSelectedFile());
        this.actionButtons.forEach((button) => button.addEventListener("click", () => this.createDecision(button.dataset.reviewDecision)));
        this.copyButton.addEventListener("click", () => this.copyDecision());
        this.downloadButton.addEventListener("click", () => this.downloadDecision());
        this.reset();
    }

    reset() {
        this.item = null;
        this.decision = null;
        this.statusBadge.textContent = "NO BUNDLE";
        this.statusBadge.className = "status-badge pending";
        this.summary.textContent = "Load a locally exported Mercury review bundle to inspect an accepted observation.";
        this.details.textContent = "{}";
        this.decisionOutput.textContent = "{}";
        this.copyButton.disabled = true;
        this.downloadButton.disabled = true;
        this.actionButtons.forEach((button) => { button.disabled = true; });
    }

    async loadSelectedFile() {
        const file = this.fileInput.files?.[0];
        if (!file) return this.reset();
        try {
            const parsed = JSON.parse(await file.text());
            this.loadItem(parsed);
        } catch (error) {
            this.reset();
            this.statusBadge.textContent = "INVALID";
            this.statusBadge.className = "status-badge blocked";
            this.summary.textContent = `Review bundle could not be loaded: ${error.message}`;
        }
    }

    loadItem(item) {
        if (!item || typeof item !== "object" || typeof item.status !== "string" || typeof item.observationId !== "string") {
            throw new TypeError("Not a valid Mercury review bundle.");
        }
        this.item = item;
        this.decision = null;
        this.decisionOutput.textContent = "{}";
        this.copyButton.disabled = true;
        this.downloadButton.disabled = true;

        this.statusBadge.textContent = item.status;
        this.statusBadge.className = `status-badge ${item.reviewable ? "ready" : "blocked"}`;

        const observation = item.observation;
        const audit = item.audit;
        if (item.reviewable && observation) {
            const price = observation.offer?.price;
            const currency = observation.offer?.currency ?? "";
            this.summary.textContent = `${item.observationId} · ${observation.retailerId} · ${Number.isFinite(price) ? `${currency} ${price.toFixed(2)}` : "price unavailable"}`;
        } else {
            this.summary.textContent = `${item.observationId} · ${item.reasons?.join(", ") || "not reviewable"}`;
        }

        this.details.textContent = JSON.stringify({ audit, observation }, null, 2);
        this.actionButtons.forEach((button) => { button.disabled = !item.reviewable; });
    }

    createDecision(decision) {
        if (!this.item?.reviewable || !ALLOWED_DECISIONS.has(decision)) return;
        const reviewedBy = this.reviewer.value.trim();
        if (!reviewedBy) {
            window.alert("Enter the reviewer identifier before recording a review decision draft.");
            return;
        }

        this.decision = Object.freeze({
            schemaVersion: "1.0",
            observationId: this.item.observationId,
            decision,
            reviewedBy,
            reviewedAt: new Date().toISOString(),
            reasonCodes: [],
            notes: this.notes.value,
            canonicalObservationModified: false
        });
        this.decisionOutput.textContent = JSON.stringify(this.decision, null, 2);
        this.copyButton.disabled = false;
        this.downloadButton.disabled = false;
    }

    downloadDecision() {
        if (!this.decision) return;
        const blob = new Blob([`${JSON.stringify(this.decision, null, 2)}\n`], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `review-${this.item.observationId}-${this.decision.decision.toLowerCase()}.json`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
    }

    async copyDecision() {
        if (!this.decision || !this.copyToClipboard) return;
        await this.copyToClipboard(JSON.stringify(this.decision, null, 2));
    }
}
