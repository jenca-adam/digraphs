var tab;
var digraphs;
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
        if (digTab.children.length == 0) {
            var tabHead = elFromString("<thead class=\"tab-header\"></thead>");
            tabHead.appendChild(elFromString("<th class=\"fill\">Digraph</th>"));
            tabHead.appendChild(elFromString("<th class=\"shrink\">Character</th>"));

            tabHead.appendChild(elFromString("<th class=\"shrink\">&nbsp;</th>"));
            digTab.appendChild(tabHead);
            var tabBody = document.createElement("tbody");
            digTab.appendChild(tabBody);
        }
        var tabBody = digTab.getElementsByTagName("tbody")[0];
        console.log(tabBody, digTab.children);
        var tabElement = elFromString("<tr class=\"tab-row\"></tr>");
        tabElement.appendChild(elFromString("<td class=\"fill\"><input type=\"text\" maxlength=\"2\" class=\"digraph\"></td>"));
        tabElement.appendChild(elFromString("<td class=\"shrink\"><input type=\"text\" maxlength=\"1\" class=\"character\"></td>"));
        tabElement.appendChild(elFromString("<td class=\"shrink action\"><button class=\"action-button\" disabled>S</button></td>"));
        tabBody.appendChild(tabElement);
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
        ev.preventDefault();
        ev.stopPropagation();
    }
});

document.addEventListener("keyup", (ev) => {
    if (ev.target.classList.contains("digraph")) {
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
            showDigError("Digraph value must be 2 chars long");
            saveButton.disabled = true;
        } else {
            clearDigErr();
        }
    } else if (ev.target.classList.contains("character")) {
        var saveButton = ev.target.parentElement.parentElement.getElementsByClassName("action-button")[0];
        var digInput = ev.target.parentElement.parentElement.getElementsByClassName("digraph")[0];
        saveButton.disabled = true;
        if (digInput.value.length == 2 && ev.target.value.length == 1) {
            saveButton.disabled = false;
        }
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

    })

fetch(browser.runtime.getURL('data/digs.json'))
    .then(response => response.json())
    .then(data => {
        digraphs = data;
    })
    .catch(error => console.error("Error loading digs.json:", error));