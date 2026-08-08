import AMAZON_ADAPTER_MANIFEST from "./amazon/manifest.js";

export const ADAPTER_MANIFEST = Object.freeze({
    frameworkVersion: "1.0.0",
    adapters: Object.freeze([AMAZON_ADAPTER_MANIFEST])
});

export default ADAPTER_MANIFEST;
