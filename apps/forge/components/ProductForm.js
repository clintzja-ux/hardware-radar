export class ProductForm {
    constructor(formElement) {
        if (!(formElement instanceof HTMLFormElement)) {
            throw new TypeError(
                "ProductForm requires a valid HTML form element."
            );
        }

        this.formElement = formElement;
    }

    read() {
        return {
            ...this.readIdentity(),
            ...this.readObservation(),

            ram: {
                memory: this.readMemorySpecifications(),
                performance: this.readPerformanceSpecifications(),
                physical: this.readPhysicalSpecifications(),
                technology: this.readTechnologySpecifications()
            }
        };
    }

    readIdentity() {
        return {
            manufacturerUrl: this.readText("manufacturerUrl"),
            retailerUrl: this.readText("retailerUrl"),
            brandId: this.readValue("brandId"),
            category: this.readValue("category"),
            subcategory: this.readValue("subcategory"),
            retailerId: this.readValue("retailerId"),
            manufacturerPartNumber: this.readText(
                "manufacturerPartNumber"
            ),
            productName: this.readText("productName"),
            productNumber: this.readNumber("productNumber"),
            observationNumber: this.readNumber(
                "observationNumber"
            )
        };
    }

    readObservation() {
        return {
            price: this.readNumber("price"),
            currency: this.readValue("currency"),
            availability: this.readValue("availability"),
            condition: this.readValue("condition"),
            sellerType: this.readValue("sellerType")
        };
    }

    readMemorySpecifications() {
        return {
            series: this.readText("series"),
            generation: this.readText("memoryGeneration"),
            formFactor: this.readValue("formFactor"),
            capacityGB: this.readNumber("capacityGB"),
            moduleCount: this.readNumber("moduleCount"),
            capacityPerModuleGB: this.readNumber(
                "capacityPerModuleGB"
            )
        };
    }

    readPerformanceSpecifications() {
        return {
            speedMTs: this.readNumber("speedMTs"),
            casLatency: this.readNumber("casLatency"),

            timings: {
                tCL: this.readNumber("timingTCL"),
                tRCD: this.readNumber("timingTRCD"),
                tRP: this.readNumber("timingTRP"),
                tRAS: this.readNumber("timingTRAS")
            },

            testedVoltage: this.readNumber("testedVoltage")
        };
    }

    readPhysicalSpecifications() {
        return {
            moduleHeightMM: this.readOptionalNumber(
                "moduleHeightMM"
            ),
            color: this.readValue("moduleColor"),
            heatSpreader: this.readChecked("heatSpreader")
        };
    }

    readTechnologySpecifications() {
        return {
            xmp: {
                supported: this.readChecked("xmpSupported"),
                version: this.readOptionalValue("xmpVersion")
            },

            expo: {
                supported: this.readChecked("expoSupported"),
                version: this.readOptionalValue("expoVersion")
            },

            ecc: this.readChecked("ecc"),
            onDieEcc: this.readChecked("onDieEcc"),
            registered: this.readChecked("registered"),
            buffered: this.readChecked("buffered")
        };
    }

    getElement(id) {
        const element = this.formElement.querySelector(`#${id}`);

        if (!element) {
            throw new Error(
                `Forge form control "${id}" could not be found.`
            );
        }

        return element;
    }

    readValue(id) {
        return this.getElement(id).value;
    }

    readOptionalValue(id) {
        const value = this.readValue(id).trim();

        return value || null;
    }

    readText(id) {
        return this.readValue(id).trim();
    }

    readNumber(id) {
        const value = this.readValue(id);

        if (value === "") {
            return 0;
        }

        const number = Number(value);

        return Number.isFinite(number) ? number : 0;
    }

    readOptionalNumber(id) {
        const value = this.readValue(id);

        if (value === "") {
            return null;
        }

        const number = Number(value);

        return Number.isFinite(number) ? number : null;
    }

    readChecked(id) {
        return this.getElement(id).checked;
    }
}