const indexedDB = window.indexedDB = window.indexedDB || window.mozIndexedDB || 
window.webkitIndexedDB || window.msIndexedDB;
let db;
// create a new db request for a "budget" database.
const request = indexedDB.open("budgetDB", 1);

request.onupgradeneeded = function(event) {
   // create object store called "pending" and set autoIncrement to true
  const db = event.target.result;
  db.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = function(event) {
  db = event.target.result;
  // 25

  // check if app is online before reading from db
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function(event) {
  console.log("Woops! " + event.target.errorCode);
};

request.onsuccess = function (event) {
    console.log('success');
    db = event.target.result;
  
    // Check if app is online before reading from db
    if (navigator.onLine) {
      console.log('Backend online! 🗄️');
      checkDatabase();
    }
  };

function checkDatabase() {
  // console.log('check db invoked');

  // Open a transaction into the offline store 
  let transaction = db.transaction(["pending"], "readwrite");

  // access to offline store object
  const store = transaction.objectStore("pending");

  // Get all records from the store and set to a variable
  const getAll = store.getAll();

  // If the request was successful
  getAll.onsuccess = function () {
    // If there are items in the store, you can do a bulk request to add them when the server is back online
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then((res) => {
          // If the returned response is not empty
          if (res.length !== 0) {
            // Open another transaction to the offline store with the ability to read and write
            transaction = db.transaction(["pending"], "readwrite");

            // Assign the current store to a variable
            const currentStore = transaction.objectStore("pending");

            // Clear existing entries when the bulk add was successful
            currentStore.clear();
            console.log('Clearing store 🧹');
          }
        });
    }
  };
}

const saveRecord = (record) => {
  console.log('Save record invoked');
  // Create another transaction on the offline store with readwrite access
  const transaction = db.transaction(["pending"], "readwrite");

  // Access the Offline object store
  const store = transaction.objectStore("pending");

  // Add record to your store with add method.
  store.add(record);
};

// Listen for app coming back online
window.addEventListener('online', checkDatabase);
