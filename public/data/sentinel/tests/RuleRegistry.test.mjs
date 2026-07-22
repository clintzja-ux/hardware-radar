import assert from "node:assert/strict";
import RuleRegistry from "../core/RuleRegistry.js";

function createRuleSet({
    id = "ram",
    version = "1.0.0",
    extension = "ram"
} = {}) {
    return {
        id,
        version,
        rules: [
            {
                id: `${id.toUpperCase()}-001`,
                severity: "HIGH",
                validate: () => true,
                config: {
                    enabled: true
                }
            }
        ],
        metadata: {
            extension,
            owner: "Sentinel"
        }
    };
}

function assertThrowsTypeError(callback, messagePattern) {
    assert.throws(callback, {
        name: "TypeError",
        message: messagePattern
    });
}

{
    const registry = new RuleRegistry();
    const source = createRuleSet();
    const registered = registry.register(source);

    assert.equal(registry.size, 1);
    assert.equal(registry.has("ram"), true);
    assert.strictEqual(registry.get("ram"), registered);
    assert.notStrictEqual(registered, source);
    assert.equal(Object.isFrozen(registered), true);
    assert.equal(Object.isFrozen(registered.rules), true);
    assert.equal(Object.isFrozen(registered.rules[0]), true);
    assert.equal(Object.isFrozen(registered.rules[0].config), true);

    source.metadata.owner = "Changed externally";
    source.rules[0].config.enabled = false;

    assert.equal(registered.metadata.owner, "Sentinel");
    assert.equal(registered.rules[0].config.enabled, true);
}

{
    const registry = new RuleRegistry();
    registry.register(createRuleSet());

    assert.throws(
        () => registry.register(createRuleSet()),
        /already contains a rule set with id: ram/
    );
}

{
    const registry = new RuleRegistry();
    const ram = registry.register(createRuleSet());
    const cpu = registry.register(createRuleSet({
        id: "cpu-core",
        extension: "cpu"
    }));
    const shared = registry.register({
        id: "shared-hardware",
        version: "1.0.0",
        rules: [],
        metadata: {
            extensions: ["ram", "cpu"]
        }
    });

    const all = registry.getAll();
    assert.deepEqual(all, [ram, cpu, shared]);
    assert.equal(Object.isFrozen(all), true);
    assert.throws(() => all.push(ram), TypeError);

    assert.deepEqual(registry.getByExtension(" RAM "), [ram, shared]);
    assert.deepEqual(registry.getByExtension("cpu"), [cpu, shared]);
    assert.deepEqual(registry.getByExtension("gpu"), []);
}

{
    const registry = new RuleRegistry();
    registry.register(createRuleSet());

    assert.equal(registry.unregister("ram"), true);
    assert.equal(registry.unregister("ram"), false);
    assert.equal(registry.has("ram"), false);
    assert.equal(registry.get("ram"), null);
}

{
    const registry = new RuleRegistry();
    registry.register(createRuleSet());
    registry.register(createRuleSet({ id: "cpu", extension: "cpu" }));

    assert.equal(registry.clear(), 2);
    assert.equal(registry.size, 0);
    assert.equal(registry.clear(), 0);
}

{
    const registry = new RuleRegistry();

    assertThrowsTypeError(
        () => registry.register(null),
        /plain object/
    );
    assertThrowsTypeError(
        () => registry.register({
            id: "",
            version: "1.0.0",
            rules: [],
            metadata: {}
        }),
        /ruleSet.id/
    );
    assertThrowsTypeError(
        () => registry.register({
            id: "ram",
            version: "",
            rules: [],
            metadata: {}
        }),
        /ruleSet.version/
    );
    assertThrowsTypeError(
        () => registry.register({
            id: "ram",
            version: "1.0.0",
            rules: {},
            metadata: {}
        }),
        /ruleSet.rules must be an array/
    );
    assertThrowsTypeError(
        () => registry.register({
            id: "ram",
            version: "1.0.0",
            rules: [],
            metadata: []
        }),
        /ruleSet.metadata must be a plain object/
    );
    assertThrowsTypeError(
        () => registry.register({
            id: "ram",
            version: "1.0.0",
            rules: [],
            metadata: {
                extensions: "ram"
            }
        }),
        /metadata.extensions must be an array/
    );
    assertThrowsTypeError(
        () => registry.getByExtension(""),
        /extension must be a non-empty string/
    );
}

console.log("RuleRegistry tests passed.");
