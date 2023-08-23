export function safeHost() {
    const host = window.location.host;
    // This function make host string safe for firebase database key
    return host.replace(/[\[\].#$\/\u0000-\u001F\u007F]/g, "_");
}
