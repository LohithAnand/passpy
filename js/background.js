var dbVersion = 1;
var db;
var dbOpenRequest = indexedDB.open("pkl",dbVersion);
dbOpenRequest.onupgradeneeded = function(e) {
  console.log("upgrading database..");
  var thisDB = e.target.result;
  if(!thisDB.objectStoreNames.contains("pkl_logs")) {
      thisDB.createObjectStore("pkl_logs",{ autoIncrement: true });
  }
};
dbOpenRequest.onsuccess = function(e) {
  db = e.target.result;
  console.log("database initialized..");
};
dbOpenRequest.onerror = function(e) {
  console.log("failed to initialize database..",e);
};

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  var action = request.action;
  switch (action) {
    case 'DB':
      var operation = request.operation;
      switch (operation) {
        case 'save':
          var transaction = db.transaction(["pkl_logs"], "readwrite");
          var store = transaction.objectStore("pkl_logs");
          var d = new Date();
          request.data.timeStamp = d.toString();
          var storeAddRequest = store.add(request.data);
          storeAddRequest.onerror = function(e) {
              console.log("error while adding data to store",e.target.error.name);
          }
          storeAddRequest.onsuccess = function(e) {
              console.log("added data in store..");
          }
          break;
        case 'retrieve' :
          var records = [];
          var transaction = db.transaction(["pkl_logs"], "readonly");
          var store = transaction.objectStore("pkl_logs");
          var cursor = store.openCursor();
          cursor.onsuccess = function(e) {
            var res = e.target.result;
            if(res) {
                if(typeof res.value === 'object' && res.value !== null) {
                    records.push({
                      key : res.key,
                      value : res.value
                    });
                }
                res.continue();
            } else {
              sendResponse({'logs' : records});
            }
          }
          return true;
          break;
        case 'delete' :
          var transaction = db.transaction(["pkl_logs"], "readwrite");
          var store = transaction.objectStore("pkl_logs");
          if(request.hasOwnProperty('id')) {
            var objectStoreRequest = store.delete(parseInt(request.id));
            objectStoreRequest.onsuccess = function(event) {
              sendResponse({'success' : true});
            };
          } else {
            var objectStoreRequest = store.clear();
            objectStoreRequest.onsuccess = function(event) {
              sendResponse({'success' : true});
            };
          }
          return true;
          break;
        default:
          console.log("Unknown DB Operation, try save");
      }
      break;
    case 'PIN' :
      var pinKey = 'pkl_pin';
      var operation = request.operation;
      switch (operation) {
        case 'get':
          var pin = localStorage.getItem(pinKey);
          if(!pin || pin === '') {
            pin = 'openpkl'
          }
          sendResponse({'pin':pin});
          break;
        case 'set':
          if(request.pin && typeof request.pin === 'string') {
            localStorage.setItem(pinKey,request.pin);
          }
          break;
        default:
          console.log("Unknown PIN Operation, try get,set");
      }
      break;
    case 'SHOWLOGS' :
      chrome.tabs.create({'url': 'pkl.html'});
      break;
    default:
      console.log("Unknown Action, try DB,SHOWLOGS,PIN");
  }
});
