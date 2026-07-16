export async function copyToClipboard(value) {
    if (!value) {
        throw new Error("There is no content to copy.");
    }

    if (!navigator.clipboard) {
        throw new Error(
            "Clipboard access is unavailable. Run Forge through Live Server."
        );
    }

    await navigator.clipboard.writeText(value);
}