const blockKeys = [35, 36, 37, 38, 39, 40];
const cancelKeys = [27, 13, 8]; // esc, enter, backspace
var digraphBuffer = "";
var showPartial = true;
var disabled = false;
var shortcutKey = "k";
var shortcutModifiers = [true, false, false];
var activeElement;
var digraphs;
var custom;

function stringReverse(st) {
    return [...st].reverse().join("");
}

function isEditable(el) {
    if (!el) return false;
    var name = el.nodeName.toLowerCase();
    return document.designMode === "on" || 
           (el.nodeType === 1 && (el.isContentEditable || 
           name === "textarea" || 
           (name === "input" && /^(?:text|email|number|search|tel|url|password)$/.test(el.type))));
}

function matchEvent(ev) {
    return ((ev.key.toLowerCase() === shortcutKey) && 
            (ev.ctrlKey === shortcutModifiers[0]) && 
            (ev.altKey === shortcutModifiers[1]) && 
            (ev.shiftKey === shortcutModifiers[2]));
}

function appendValue(st) {
    if (activeElement) activeElement.focus();
    document.execCommand("insertText", false, st);
}

function cutValue(n) {
    if (activeElement) activeElement.focus();
    for (var i = 0; i < n; i++) {
        document.execCommand("delete", false);
    }
}

function digraphCancel() {
    if (activeElement && showPartial) {
        cutValue(1 + (digraphBuffer.length > 0 ? 1 : 0));
    }
    activeElement = null;
    digraphBuffer = "";
}

function digraphGet() {
    var rev = stringReverse(digraphBuffer);
    if (!digraphBuffer) {
        return "";
    } else if (custom && digraphBuffer in custom) {
        return custom[digraphBuffer];
    } else if (digraphs && digraphBuffer in digraphs) {
        return digraphs[digraphBuffer];
    } else if (digraphs && rev in digraphs) {
        return digraphs[rev];
    } else {
        return digraphBuffer.at(-1);
    }
}

function pokeBoss() {
    chrome.runtime.sendMessage({ "content": "poke" }, (msg) => {
        if (chrome.runtime.lastError) return;
        if (!msg) return;
        
        if (msg.shortcutKey) shortcutKey = msg.shortcutKey;
        if (msg.shortcutModifiers) shortcutModifiers = msg.shortcutModifiers;
        if (msg.disabled !== undefined) disabled = msg.disabled;
        if (msg.showp !== undefined) showPartial = msg.showp;
        if (msg.custom) custom = msg.custom;
    });
}

document.addEventListener("keydown", (ev) => {
    const target = ev.target;

    if (matchEvent(ev)) {
        if (activeElement) {
            digraphCancel();
            ev.preventDefault();
            ev.stopPropagation();
        } else if (!disabled) {
            if (isEditable(target)) {
                ev.preventDefault();
                ev.stopPropagation();
                activeElement = target;
                if (showPartial) {
                    appendValue("?");
                }
            }
        }
    } else if (activeElement && !ev.altKey && !ev.ctrlKey && !ev.metaKey && ev.key.length === 1) {
        ev.preventDefault();
        ev.stopPropagation();
        digraphBuffer += ev.key;
        
        if (digraphBuffer.length === 2) {
            var dig = digraphGet();
            digraphCancel();
            setTimeout(() => {
                appendValue(dig);
            }, 0);
        } else if (showPartial) {
            appendValue(ev.key);
        }
    } else if (activeElement && blockKeys.includes(ev.keyCode)) {
        ev.preventDefault();
        ev.stopPropagation();
    } else if (activeElement && cancelKeys.includes(ev.keyCode)) {
        digraphCancel();
        ev.preventDefault();
        ev.stopPropagation();
    }
}, true);

["focusout", "blur"].forEach((i) => {
    document.addEventListener(i, (ev) => {
        if (activeElement) {
            var ae = activeElement;
            setTimeout(() => {
                ae.focus();
                digraphCancel();
                setTimeout(() => { ae.blur(); }, 0);
            }, 0);
        }
    });
});

document.addEventListener("mousedown", (ev) => {
    if (activeElement && ev.target === activeElement) {
    }
});

// Load digraph data
fetch(chrome.runtime.getURL('data/digs.json'))
    .then(response => response.json())
    .then(data => {
        digraphs = data;
    })
    .catch(error => console.error("Error loading digs.json:", error));

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    switch (msg.content) {
        case 'ping':
            sendResponse({ "content": "pong" });
            break;
        case 'die':
            disabled = true;
            sendResponse({ "content": "dead" });
            break;
        case 'resurrect':
            disabled = false;
            sendResponse({ "content": "alive" });
            break;
        case 'hidep':
            showPartial = false;
            sendResponse({ "content": "ok" });
            break;
        case 'showp':
            showPartial = true;
            sendResponse({ "content": "ok" });
            break;
        case 'pokeBoss':
            pokeBoss();
            sendResponse({ "content": "poked" });
            break;
    }
    return true; // Keep channel open for async response
});

pokeBoss();
