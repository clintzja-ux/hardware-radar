 export async function loadRAMData() {
    const response = await fetch("data/ram.json");

    if (!response.ok) {
        throw new Error("Unable to load RAM data.");
    }

    return await response.json();
}