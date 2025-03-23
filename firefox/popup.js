var tab;
var digraphs;
var customDigs = {};
var customTabEditted = false;
var shortcutKey = "k";
var shortcutModifiers = [true, false, false]; // ctrl alt shift
var digError = document.getElementById("dig-error");

function stringReverse(st) {
    return [...st].reverse().join("");
}

function elFromString(st) {
    const template = document.createElement("template");
    template.innerHTML = st.trim();
    return template.content.firstElementChild;
}

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
        return;
    }
    var shortcutItem = storageItem["shortcut"];
    return shortcutItem;
}
async function storeShortcut() {
    await browser.storage.local.set({
        "shortcut": [shortcutKey, shortcutModifiers]
    });
    await browser.runtime.sendMessage({
        content: "update"
    });
}
async function retrieveCustom() {
    var storageItem = await browser.storage.local.get("custom");
    if (!storageItem || !("custom" in storageItem)) {
        return;
    }
    return storageItem["custom"];
}
async function storeCustom() {
    await browser.storage.local.set({
        "custom": customDigs
    });
    await browser.runtime.sendMessage({
        content: "update"
    });
}

function dispatch(msg) {
    var ret;
    browser.runtime.sendMessage({
        content: msg,
        tabId: tab.id
    }).then((msg) => {
        ret = msg && msg.ok;
    })
    return ret;

}

function killCs() {
    dispatch("die");
}

function resurrectCs() {
    dispatch("resurrect");
}

function showPd() {
    dispatch("showp");
}


function hidePd() {
    dispatch("hidep");
}

function passShortcut() {
    var ret;

}

function showDigError(error) {
    digError.classList.remove("warn");
    digError.classList.add("err");
    digError.hidden = false;
    digError.innerText = error;
}

function showDigWarn(error) {
    digError.classList.remove("err");
    digError.classList.add("warn");
    digError.hidden = false;
    digError.innerText = error;
}

function clearDigErr() {
    digError.hidden = true;
}

function showDigTabHead() {
    document.getElementById("digtab-header").hidden = false;
}

function hideDigTabHead() {
    document.getElementById("digtab-header").hidden = true;
}
var shortcutInput = document.getElementById("shortcut-input");
var newDig = document.getElementById("new-dig");
var digTab = document.getElementById("digtab");
var runningSwitch = document.getElementById("running-switch");
var pdSwitch = document.getElementById("pd-switch");


shortcutInput.addEventListener("keydown", (ev) => {
    console.log(ev);
    ev.preventDefault();
    ev.stopPropagation();
    shortcutKey = ev.key.toLowerCase();

    shortcutModifiers = [ev.ctrlKey, ev.altKey, ev.shiftKey];
    storeShortcut();
    shortcutInput.value = buildKeyName(shortcutKey, shortcutModifiers);
})
newDig.addEventListener("click", (ev) => {
    if (!customTabEditted) {
        showDigTabHead();
        var tabBody = document.getElementById("digtab-body");
        console.log(tabBody, digTab.children);
        var tabRowTemplate = document.getElementById("digtab-row-edit");
        var tabRowElement = tabRowTemplate.content.cloneNode(true);
        tabBody.appendChild(tabRowElement);
        newDig.innerText = "Cancel";
        customTabEditted = true;
    } else {
        var tabBody = digTab.getElementsByTagName("tbody")[0];
        if (tabBody && tabBody.children.length > 0) {
            tabBody.removeChild(tabBody.children[tabBody.children.length - 1]);
        }
        newDig.innerText = "Add";
        customTabEditted = false;
    }
    ev.preventDefault();
    ev.stopPropagation();
});
runningSwitch.addEventListener("click", (ev) => {
    if (!runningSwitch.checked) {
        killCs();
        browser.storage.local.get("disabled").then((it) => {

            var disabled = it["disabled"] || [];
            var url = new URL(tab.url);
            if (!disabled.includes(url.host)) {
                disabled.push(url.host);
            }
            browser.storage.local.set({
                disabled: disabled
            });
        })
    } else {
        browser.storage.local.get("disabled").then((it) => {

            var disabled = it["disabled"] || [];

            var url = new URL(tab.url);
            disabled = disabled.filter((it) => it != url.host);

            browser.storage.local.set({
                disabled: disabled
            });
        });

        resurrectCs();
    }
});
pdSwitch.addEventListener("click", (ev) => {
    if (!pdSwitch.checked) {
        hidePd();
        browser.storage.local.get("noprompt").then((it) => {

            var noprompt = it["noprompt"] || [];
            var url = new URL(tab.url);
            if (!noprompt.includes(url.host)) {
                noprompt.push(url.host);
            }
            browser.storage.local.set({
                noprompt: noprompt
            });
        })

    } else {
        browser.storage.local.get("noprompt").then((it) => {

            var noprompt = it["noprompt"] || [];

            var url = new URL(tab.url);
            noprompt = noprompt.filter((it) => it != url.host);

            browser.storage.local.set({
                noprompt: noprompt
            });
        });
        showPd();
    }
});
document.getElementById("popup-header-digs").addEventListener("click", () => {
    window.open(browser.runtime.getURL("digs.html"), "_blank").focus()
});

document.addEventListener("click", (ev) => {
    console.log(ev.target.tagName);
    if (ev.target.tagName.toLowerCase() == "button") {
        console.log(ev.target);
        if (ev.target.classList.contains("save")) {
            var digInput = ev.target.parentElement.parentElement.getElementsByClassName("digraph")[0];
            var charInput = ev.target.parentElement.parentElement.getElementsByClassName("character")[0];
            customDigs[digInput.value] = charInput.value;
            ev.target.innerText = "D";
            ev.target.classList.remove("save");
            ev.target.classList.add("delete");
            digInput.readOnly = true;
            charInput.readOnly = true;
            customTabEditted = false;
            newDig.innerText = "Add";
            clearDigErr();
            storeCustom();
        } else if (ev.target.classList.contains("delete")) {
            var row = ev.target.parentElement.parentElement;
            var digInput = row.getElementsByClassName("digraph")[0];
            delete customDigs[digInput.value];
            console.log(customDigs);
            if (!Object.keys(customDigs).length) {
                hideDigTabHead()
            };
            row.parentElement.removeChild(row);
            storeCustom();

        }
        ev.preventDefault();
        ev.stopPropagation();
    }
});

["keyup", "focus"].forEach((i) => {
    document.addEventListener(i, (ev) => {
        console.log(ev.target);
        if (ev.target.classList && ev.target.classList.contains("digraph") && !ev.target.readOnly) {
            var saveButton = ev.target.parentElement.parentElement.getElementsByClassName("action-button")[0];
            var charInput = ev.target.parentElement.parentElement.getElementsByClassName("character")[0];
            if (charInput.value.length == 1) {
                saveButton.disabled = false;
            }
            if (ev.target.value in digraphs) {
                showDigWarn(`Overriding primary digraph  '${ev.target.value}' for '${digraphs[ev.target.value]}'`);
            } else if (stringReverse(ev.target.value) in digraphs) {
                var rev = stringReverse(ev.target.value);
                showDigWarn(`Overriding secondary digraph '${ev.target.value}' for '${digraphs[rev]}'`);
            } else if (ev.target.value.length != 2) {
                //showDigError("Digraph value must be 2 chars long");
                saveButton.disabled = true;
                clearDigErr();
            } else {
                clearDigErr();
            }
        } else if (ev.target.classList && ev.target.classList.contains("character")) {
            var saveButton = ev.target.parentElement.parentElement.getElementsByClassName("action-button")[0];
            var digInput = ev.target.parentElement.parentElement.getElementsByClassName("digraph")[0];
            saveButton.disabled = true;
            if (digInput.value.length == 2 && ev.target.value.length == 1) {
                saveButton.disabled = false;
            }
        }

    });
});
document.addEventListener("focusout", (ev) => {

    if (ev.target.classList.contains("digraph")) {
        clearDigErr();
    }
});
browser.tabs.query({
    active: true,
    currentWindow: true
}).then(
    (tabs) => {
        tab = tabs[0];

        browser.tabs.sendMessage(tab.id, {
            content: "ping"
        }).then((msg) => {
                console.log(msg);
                if (msg && msg.content == "pong") {} else {
                    runningSwitch.disabled = true;
                    runningSwitch.checked = false;
                }
            },
            () => {
                runningSwitch.disabled = true;
                runningSwitch.checked = false;
            });
        browser.storage.local.get("disabled").then((it) => {
            var disabled = it["disabled"]
            if (!disabled) {
                browser.storage.local.set({
                    disabled: []
                });
            } else {
                var url = new URL(tab.url);
                console.log(url.host);
                if (disabled.includes(url.host)) {
                    runningSwitch.checked = false;
                } else if (!runningSwitch.disabled) {
                    runningSwitch.checked = true;
                }
            }
        });
        browser.storage.local.get("noprompt").then((it) => {
            var noprompt = it["noprompt"]
            if (!noprompt) {
                browser.storage.local.set({
                    noprompt: []
                });
            } else {
                var url = new URL(tab.url);
                if (noprompt.includes(url.host)) {
                    pdSwitch.checked = false;
                } else {
                    pdSwitch.checked = true;
                }
            }
        })
        retrieveShortcut().then(shortcutItem => {
            if (!shortcutItem) {
                storeShortcut();
            } else {
                shortcutKey = shortcutItem[0];
                shortcutModifiers = shortcutItem[1];
            }
            shortcutInput.value = buildKeyName(shortcutKey, shortcutModifiers);
        });
        retrieveCustom().then(customItem => {
            if (!customItem) {
                storeCustom();
            } else {
                customDigs = customItem;
                var tabBody = document.getElementById("digtab-body");
                for (dig in customDigs) {
                    showDigTabHead();
                    var character = customDigs[dig];
                    var tabRowTemplate = document.getElementById("digtab-row");
                    var tabRowElement = tabRowTemplate.content.cloneNode(true);
                    tabRowElement.querySelector(".digraph").value = dig;
                    tabRowElement.querySelector(".character").value = character;
                    tabBody.appendChild(tabRowElement);

                }
            }
        });

    })

fetch(browser.runtime.getURL('data/digs.json'))
    .then(response => response.json())
    .then(data => {
        digraphs = data;
    })
    .catch(error => console.error("Error loading digs.json:", error));