function retrieveShortcut(){
	var storageItem = browser.storage.sync.getItem("shortcut");
	if(!storageItem||storageItem.length<2){
		return;
	}
	return storageItem;
}
function storeShortcut(key, modifs){
	browser.storage.sync.setItem("shortcut", [key, modifs]);
}

