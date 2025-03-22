const blockKeys = [35, 36, 37, 38, 39, 40];
const cancelKeys = [27, 13, 8]; // esc, enter, backspace
var digraphBuffer = "";
var showPartial = true;
var disabled = false;
var shortcutKey = "k";
var shortcutModifers = [true, false, false];
var activeElement;
var posCache;
var curselCache;
var digraphs;

function stringReverse(st) {
    return [...st].reverse().join("");
}

function isEditable(el) {
    var name = el.nodeName.toLowerCase();
    return document.designMode == "on" || (el.nodeType == 1 && (el.isContentEditable || name == "textarea" || (name == "input" && RegExp("^(?:text|email|number|search|tel|url|password)$").test(el.type))));
}

function matchEvent(ev) {
    return ((ev.key.toLowerCase() == shortcutKey) && (ev.ctrlKey == shortcutModifiers[0]) && (ev.altKey == shortcutModifiers[1]) && (ev.shiftKey == shortcutModifiers[2]));
}

function setCursor(el, cursel, p) {
    if (el.isContentEditable) {
        var range = document.createRange();
        var selection = window.getSelection();

        range.setStart(cursel, p);
        range.collapse(true);

        selection.removeAllRanges();
        selection.addRange(range);
    } else {
        cursel.selectionStart = el.selectionEnd = p;
    }
    posCache = p;
    curselCache = cursel;
}

function getCursor(el) {
    if (el.isContentEditable) {
        var selection = window.getSelection();
        for (var i = 0; i < selection.rangeCount; i++) {
            var range = selection.getRangeAt(i);
            if (el.contains(range.startContainer)) {
                return [range.startContainer, range.startOffset];
            }
        }
        return -1;
    } else {
        return [el, el.selectionStart];
    }
}

function appendValue(st) {
    document.execCommand("insertText", false, st);

}

function getValue(el) {
    if (el.value) {
        return el.value;
    } else {
        return el.textContent;
    }
}

function cutValue(n) {
    for (var i = 0; i < n; i++) {
        document.execCommand("delete", false);
    }
}

function digraphCancel() {
    if (activeElement && showPartial) {
        cutValue(1 + !!digraphBuffer);
    }
    activeElement = null;
    digraphBuffer = "";
}

function digraphGet() {
    if (!digraphBuffer) {
        return "";
    } else if (!digraphs) {
        return digraphBuffer.at(-1);
    } else if (digraphBuffer in digraphs) {
        return digraphs[digraphBuffer];
    } else if (stringReverse(digraphBuffer) in digraphs) {
        return digraphs[stringReverse(digraphBuffer)];
    } else {
        return digraphBuffer.at(-1);
    }

};

function pokeBoss() {
    browser.runtime.sendMessage({
        "content": "poke"
    }).then((msg) => {
        console.log(msg);
        if (msg.shortcutKey) {
            shortcutKey = msg.shortcutKey;
        }
        if (msg.shortcutModifiers) {
            shortcutModifiers = msg.shortcutModifiers;
        }
        if (msg.disabled) {
            disabled = msg.disabled;
        }
        if (msg.showp) {
            showPartial = msg.showp;
        }
    })
}
document.addEventListener("keydown", (ev) => {
    console.log(disabled);
    if (matchEvent(ev)) {
        if (activeElement) {

            digraphCancel();
            ev.preventDefault();
            ev.stopPropagation();
        } else if (!disabled) {


            var el = ev.originalTarget;
            if (isEditable(el)) {

                ev.preventDefault();
                ev.stopPropagation();
                activeElement = el;
                if (showPartial) {
                    appendValue("?");
                }
            }
        }
    } else if (activeElement && !ev.altKey && !ev.ctrlKey && !ev.metaKey && ev.key.length == 1) { //no modifiers + printable
        ev.preventDefault();
        ev.stopPropagation();
        digraphBuffer += ev.key;
        if (digraphBuffer.length == 2) {

            var dig = digraphGet();
            digraphCancel();

            setTimeout(() => {
                appendValue(dig)
            });

        } else if (showPartial) {

            appendValue(ev.key);
        }
    } else if (activeElement && blockKeys.includes(ev.keyCode)) {
        ev.preventDefault();
        ev.stopPropagation();

    } else if (activeElement && cancelKeys.includes(ev.keyCode)) { // esc, enter, etc
        digraphCancel();
        ev.preventDefault();
        ev.stopPropagation();
    }
}, true);
["focusout", "blur"].forEach((i) => {
    document.addEventListener(i, (ev) => {
        if (activeElement) {
            // no way to block the event, so we just refocus and cancel
            var ae = activeElement;
            setTimeout(() => {
                ae.focus();
                digraphCancel();
                setTimeout(() => {
                    ae.blur()
                });
            });
        }
    })
});
document.addEventListener("mousedown", (ev) => {
    if (ev.target == activeElement) {
        ev.preventDefault();
    }
});
// don't bind to a specific event to run on extension reload
fetch(browser.runtime.getURL('data/digs.json'))
    .then(response => response.json())
    .then(data => {
        digraphs = data;
    })
    .catch(error => console.error("Error loading digs.json:", error));

browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.content == 'ping') {
        sendResponse({
            "content": "pong"
        });
    }
    if (msg.content == 'die') {
        disabled = true;
        sendResponse({
            "content": "dead"
        });
    }
    if (msg.content == 'resurrect') {
        disabled = false;
        sendResponse({
            "content": "alive"
        });
    }
    if (msg.content == 'hidep') {
        showPartial = false;
        console.log("hide");
        sendResponse({
            "content": "ok"
        })
    }
    if (msg.content == 'showp') {
        showPartial = true;
        console.log("show");
        sendResponse({
            "content": "ok"
        })
    }
    if (msg.content == "pokeBoss") {
        pokeBoss();
    }
});
pokeBoss();