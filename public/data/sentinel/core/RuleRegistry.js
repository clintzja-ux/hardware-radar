/**
 * Canonical registry for Sentinel rule sets.
 *
 * RuleRegistry owns rule-set discovery and lifecycle only. It does not execute
 * rules, perform validation, or aggregate Sentinel decisions.
 */
export class RuleRegistry {
    constructor() {
        this._ruleSets = new Map();
    }

    /**
     * Registers an immutable defensive copy of a rule set.
     *
     * @param {object} ruleSet
     * @returns {object} The stored immutable rule set.
     */
    register(ruleSet) {
        RuleRegistry.assertRuleSet(ruleSet);

        const id = ruleSet.id.trim();

        if (this._ruleSets.has(id)) {
            throw new Error(
                `RuleRegistry already contains a rule set with id: ${id}.`
            );
        }

        const storedRuleSet = RuleRegistry.cloneAndFreeze({
            ...ruleSet,
            id,
            version: ruleSet.version.trim()
        });

        this._ruleSets.set(id, storedRuleSet);
        return storedRuleSet;
    }

    /**
     * Removes a rule set by identifier.
     *
     * @returns {boolean} True when a registration was removed.
     */
    unregister(id) {
        RuleRegistry.assertIdentifier("id", id);
        return this._ruleSets.delete(id.trim());
    }

    has(id) {
        RuleRegistry.assertIdentifier("id", id);
        return this._ruleSets.has(id.trim());
    }

    /**
     * Returns the immutable registered rule set or null when it is absent.
     */
    get(id) {
        RuleRegistry.assertIdentifier("id", id);
        return this._ruleSets.get(id.trim()) ?? null;
    }

    /**
     * Returns registrations in insertion order without exposing the Map.
     */
    getAll() {
        return Object.freeze(Array.from(this._ruleSets.values()));
    }

    /**
     * Returns rule sets associated with an extension.
     *
     * Extension metadata may be expressed as:
     * - ruleSet.extension
     * - ruleSet.metadata.extension
     * - ruleSet.metadata.extensions[]
     */
    getByExtension(extension) {
        RuleRegistry.assertIdentifier("extension", extension);
        const normalizedExtension = extension.trim().toLowerCase();

        const matches = Array.from(this._ruleSets.values())
            .filter((ruleSet) =>
                RuleRegistry.getExtensions(ruleSet)
                    .some((value) => value.toLowerCase() === normalizedExtension)
            );

        return Object.freeze(matches);
    }

    /**
     * Removes every registration and returns the number removed.
     */
    clear() {
        const removedCount = this._ruleSets.size;
        this._ruleSets.clear();
        return removedCount;
    }

    get size() {
        return this._ruleSets.size;
    }

    static assertRuleSet(ruleSet) {
        if (!RuleRegistry.isPlainObject(ruleSet)) {
            throw new TypeError(
                "RuleRegistry requires each rule set to be a plain object."
            );
        }

        RuleRegistry.assertIdentifier("ruleSet.id", ruleSet.id);
        RuleRegistry.assertIdentifier("ruleSet.version", ruleSet.version);

        if (!Array.isArray(ruleSet.rules)) {
            throw new TypeError(
                "RuleRegistry ruleSet.rules must be an array."
            );
        }

        if (!RuleRegistry.isPlainObject(ruleSet.metadata)) {
            throw new TypeError(
                "RuleRegistry ruleSet.metadata must be a plain object."
            );
        }

        RuleRegistry.assertExtensionMetadata(ruleSet);
    }

    static assertExtensionMetadata(ruleSet) {
        if (
            ruleSet.extension !== undefined &&
            ruleSet.extension !== null
        ) {
            RuleRegistry.assertIdentifier(
                "ruleSet.extension",
                ruleSet.extension
            );
        }

        const metadataExtension = ruleSet.metadata.extension;
        if (
            metadataExtension !== undefined &&
            metadataExtension !== null
        ) {
            RuleRegistry.assertIdentifier(
                "ruleSet.metadata.extension",
                metadataExtension
            );
        }

        const metadataExtensions = ruleSet.metadata.extensions;
        if (
            metadataExtensions !== undefined &&
            metadataExtensions !== null
        ) {
            if (!Array.isArray(metadataExtensions)) {
                throw new TypeError(
                    "RuleRegistry ruleSet.metadata.extensions must be an array."
                );
            }

            for (const extension of metadataExtensions) {
                RuleRegistry.assertIdentifier(
                    "ruleSet.metadata.extensions entry",
                    extension
                );
            }
        }
    }

    static getExtensions(ruleSet) {
        const extensions = [];

        if (typeof ruleSet.extension === "string") {
            extensions.push(ruleSet.extension.trim());
        }

        if (typeof ruleSet.metadata.extension === "string") {
            extensions.push(ruleSet.metadata.extension.trim());
        }

        if (Array.isArray(ruleSet.metadata.extensions)) {
            extensions.push(
                ...ruleSet.metadata.extensions.map((value) => value.trim())
            );
        }

        return extensions;
    }

    static assertIdentifier(name, value) {
        if (
            typeof value !== "string" ||
            value.trim().length === 0
        ) {
            throw new TypeError(
                `RuleRegistry ${name} must be a non-empty string.`
            );
        }
    }

    static isPlainObject(value) {
        if (
            value === null ||
            typeof value !== "object" ||
            Array.isArray(value)
        ) {
            return false;
        }

        const prototype = Object.getPrototypeOf(value);
        return prototype === Object.prototype || prototype === null;
    }

    /**
     * Clones arrays and plain objects recursively, then freezes the clone.
     * Functions and other immutable/runtime values are preserved by reference,
     * allowing rule definitions to contain validator functions.
     */
    static cloneAndFreeze(value, seen = new WeakMap()) {
        if (
            value === null ||
            (typeof value !== "object" && typeof value !== "function")
        ) {
            return value;
        }

        if (typeof value === "function") {
            return value;
        }

        if (seen.has(value)) {
            return seen.get(value);
        }

        if (Array.isArray(value)) {
            const clone = [];
            seen.set(value, clone);

            for (const entry of value) {
                clone.push(RuleRegistry.cloneAndFreeze(entry, seen));
            }

            return Object.freeze(clone);
        }

        if (RuleRegistry.isPlainObject(value)) {
            const clone = {};
            seen.set(value, clone);

            for (const [key, entry] of Object.entries(value)) {
                clone[key] = RuleRegistry.cloneAndFreeze(entry, seen);
            }

            return Object.freeze(clone);
        }

        return value;
    }
}

export default RuleRegistry;
