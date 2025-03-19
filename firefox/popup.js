var shortcutKey = "k";
var shortcutModifiers = [true, false, false]; // ctrl alt shift
function buildKeyName(key, modifiers) {
    var keyName = key.charAt(0).toUpperCase() + key.slice(1);
    if (modifiers[2] && key != "Shift") {
        keyName = "Shift-" + keyName;
    }
    if (modifiers[1] && key != "Alt") {
        keyName = "Alt-" + keyName;
    }
    if (modifiers[0] && key != "Control") {
        keyName = "Ctrl-" + keyName;
    }
    return keyName;
}
async function retrieveShortcut() {
    var storageItem = await browser.storage.local.get("shortcut");
    console.log(storageItem);
    if (!storageItem || !("shortcut" in storageItem)) {
        console.error("nothing in storage");
        return null;
    }
    var shortcutItem = storageItem["shortcut"];
    return shortcutItem;
}
async function storeShortcut() {
    await browser.storage.local.set({
        "shortcut": [shortcutKey, shortcutModifiers]
    });
}
document.addEventListener("DOMContentLoaded", () => {
    var shortcutInput = document.getElementById("shortcut-input");
    retrieveShortcut().then(shortcutItem=>{
    if (!shortcutItem) {
        storeShortcut();
    } else {
        shortcutKey = shortcutItem[0];
        shortcutModifiers = shortcutItem[1];
    }
    shortcutInput.value = buildKeyName(shortcutKey, shortcutModifiers);
    });
    shortcutInput.addEventListener("keydown", (ev) => {
        console.log(ev);
        ev.preventDefault();
        ev.stopPropagation();
        shortcutKey = ev.key;
        shortcutModifiers = [ev.ctrlKey, ev.altKey, ev.shiftKey];
        storeShortcut();
        shortcutInput.value = buildKeyName(shortcutKey, shortcutModifiers);
    })
})
