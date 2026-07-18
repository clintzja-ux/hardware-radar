import { ProductForm } from "./components/ProductForm.js";
import { ForgeGenerator } from "./services/ForgeGenerator.js";
import { copyToClipboard } from "./utils/clipboard.js";

const forge = new ForgeGenerator();

const form = document.getElementById("forgeForm");
const productForm = new ProductForm(form);

const atlasOutput = document.getElementById("atlasOutput");
const mercuryOutput = document.getElementById("mercuryOutput");

const atlasFilename = document.getElementById("atlasFilename");
const mercuryFilename = document.getElementById("mercuryFilename");

const validationList = document.getElementById("validationList");

const copyAtlasButton =
    document.getElementById("copyAtlasButton");

const copyMercuryButton =
    document.getElementById("copyMercuryButton");

let latestAtlasJson = "";
let latestMercuryJson = "";

form.addEventListener("submit", handleGenerate);

copyAtlasButton.addEventListener("click", async () => {
    await handleCopy(
        latestAtlasJson,
        copyAtlasButton,
        "Atlas copied"
    );
});

copyMercuryButton.addEventListener("click", async () => {
    await handleCopy(
        latestMercuryJson,
        copyMercuryButton,
        "Mercury copied"
    );
});

function handleGenerate(event) {
    event.preventDefault();

    const input = productForm.read();
    console.debug("Forge form input:", input);
    const result = forge.generateProduct(input);

    

    renderValidation(result.validation);

    if (!result.atlasProduct || !result.mercuryObservation) {
        clearOutputs();
        return;
    }

    latestAtlasJson = JSON.stringify(
        result.atlasProduct,
        null,
        2
    );

    latestMercuryJson = JSON.stringify(
        result.mercuryObservation,
        null,
        2
    );

    atlasOutput.textContent = latestAtlasJson;
    mercuryOutput.textContent = latestMercuryJson;

    atlasFilename.textContent = result.atlasFilename;
    mercuryFilename.textContent = result.mercuryFilename;

    copyAtlasButton.disabled = false;
    copyMercuryButton.disabled = false;
}


function renderValidation(validation) {
    validationList.innerHTML = "";

    if (validation.valid) {
        appendValidationItem(
            "Forge pipeline completed successfully.",
            "success"
        );
    }

    validation.errors.forEach(error => {
        appendValidationItem(error, "error");
    });

    validation.warnings.forEach(warning => {
        appendValidationItem(warning, "warning");
    });
}

function appendValidationItem(message, type) {
    const item = document.createElement("li");

    item.textContent = message;
    item.className = `validation-${type}`;

    validationList.appendChild(item);
}

function clearOutputs() {
    latestAtlasJson = "";
    latestMercuryJson = "";

    atlasOutput.textContent = "{}";
    mercuryOutput.textContent = "{}";

    atlasFilename.textContent = "No file generated.";
    mercuryFilename.textContent = "No file generated.";

    copyAtlasButton.disabled = true;
    copyMercuryButton.disabled = true;
}

async function handleCopy(value, button, successText) {
    const originalText = button.textContent;

    try {
        await copyToClipboard(value);

        button.textContent = successText;

        window.setTimeout(() => {
            button.textContent = originalText;
        }, 1500);
    } catch (error) {
        console.error(error);
        window.alert(error.message);
    }
}