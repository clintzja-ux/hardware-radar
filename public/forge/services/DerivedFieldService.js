export class DerivedFieldService {
    apply(input) {
        if (!input?.ram) {
            return input;
        }

        const derived = structuredClone(input);

        this.deriveGeneration(derived);
        this.deriveCapacityPerModule(derived);
        this.deriveDefaultFormFactor(derived);

        return derived;
    }

    deriveGeneration(input) {
        const subcategory =
            input.subcategory?.toUpperCase() ?? "";

        let generation = null;

        if (subcategory.includes("DDR5")) {
            generation = "DDR5";
        }
        else if (subcategory.includes("DDR4")) {
            generation = "DDR4";
        }

        input.ram.memory.generation = generation;
    }

    deriveCapacityPerModule(input) {
        const memory = input.ram.memory;

        const total =
            Number(memory.capacityGB);

        const modules =
            Number(memory.moduleCount);

        if (
            Number.isFinite(total) &&
            Number.isFinite(modules) &&
            modules > 0
        ) {
            memory.capacityPerModuleGB =
                total / modules;
        }
        else {
            memory.capacityPerModuleGB = null;
        }
    }

    deriveDefaultFormFactor(input) {
        const memory = input.ram.memory;

        if (memory.formFactor) {
            return;
        }

        const subcategory =
            input.subcategory?.toUpperCase() ?? "";

        if (subcategory.includes("LAPTOP")) {
            memory.formFactor = "SODIMM";
            return;
        }

        if (
            subcategory.includes("DDR4") ||
            subcategory.includes("DDR5")
        ) {
            memory.formFactor = "UDIMM";
        }
    }
}