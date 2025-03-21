browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    //dispatches a message to a tab
    if (msg.content == "die") {
        browser.tabs.sendMessage(msg.tabId, {
            content: "die"
        }).then((msg) => {
                if (msg && msg.content == "dead") {
                    sendResponse({
                        ok: true
                    });
                } else {
                    sendResponse({
                        ok: false
                    });
                }
            },

            () => {
                sendResponse({
                    ok: true
                });

            }

        );
    } else if (msg.content == "resurrect") {
        browser.tabs.sendMessage(msg.tabId, {
            content: "resurrect"
        }).then((msg) => {
                if (msg && msg.content == "alive") {
                    sendResponse({
                        ok: true
                    });
                } else {
                    sendResponse({
                        ok: false
                    });
                }
            },

            () => {
                sendResponse({
                    ok: false
                });

            }

        );

    } else if (msg.content == "hidep") {
        browser.tabs.sendMessage(msg.tabId, {
            content: "hidep"
        }).then((msg) => {
                if (msg && msg.content == "ok") {
                    sendResponse({
                        ok: true
                    });
                } else {
                    sendResponse({
                        ok: false
                    });
                }
            },

            () => {
                sendResponse({
                    ok: false
                });

            }

        );

    } else if (msg.content == "showp") {
        browser.tabs.sendMessage(msg.tabId, {
            content: "showp"
        }).then((msg) => {
                if (msg && msg.content == "ok") {
                    sendResponse({
                        ok: true
                    });
                } else {
                    sendResponse({
                        ok: false
                    });
                }
            },

            () => {
                sendResponse({
                    ok: false
                });

            }

        );

    }
    // respond to pokes from content scripts
    else if (msg.content == "poke") {
        var shortcutKey;
        var shortcutModifiers;
        var disabled;
        var showp;
        var host;
        if (sender.url) {
            host = new URL(sender.url).host;
        } else {
            host = "";
        }
        browser.storage.local.get("shortcut", (it) => {
            var shortcutItem = it["shortcut"];
            if (shortcutItem) {
                shortcutKey = shortcutItem[0];
                shortcutModifiers = shortcutItem[1];
            }
            browser.storage.local.get("disabled", (it) => {
                var disabledItem = it["disabled"];
                disabled = disabledItem && disabledItem.includes(host);
                browser.storage.local.get("noprompt", (it) => {

                    var nopromptItem = it["noprompt"];

                    showp = !(nopromptItem && nopromptItem.includes(host));
                    sendResponse({
                        shortcutKey: shortcutKey,
                        shortcutModifiers: shortcutModifiers,
                        disabled: disabled,
                        showp: showp
                    });
                })
            })

        })

    } else if (msg.content == "update") {
        browser.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                browser.tabs.sendMessage(tab.id, {
                    content: "pokeBoss"
                }).then(()=>{},()=>{}); // catch errors
            })
        })
    } else {
        sendResponse({
            ok: false
        });
    }
    return true;
});
