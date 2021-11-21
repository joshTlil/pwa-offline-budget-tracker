let db;


// Create a new db request for a "budget" database.
const request = indexedDB.open('BudgetDB', 1);

request.onupgradeneeded = function (e) {
  console.log('Upgrade needed in IndexDB');

  db = e.target.result;
// If there are no store names then create one 
  if (db.objectStoreNames.length === 0) {
    db.createObjectStore('Offline', { autoIncrement: true });
  }
};
//error check 
request.onerror = function (e) {
  console.log(`Woops! ${e.target.errorCode}`);
};

request.onsuccess = function (e) {
    console.log('success');
    db = e.target.result;
  
    // Check if app is online before reading from db
    if (navigator.onLine) {
      console.log('Backend online! 🗄️');
      checkDatabase();
    }
  };

function checkDatabase() {
  console.log('check db invoked');

  // Open a transaction into the offline store 
  let transaction = db.transaction(['Offline'], 'readwrite');

  // access to offline store object
  const store = transaction.objectStore('Offline');

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
            transaction = db.transaction(['Offline'], 'readwrite');

            // Assign the current store to a variable
            const currentStore = transaction.objectStore('Offline');

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
  const transaction = db.transaction(['Offline'], 'readwrite');

  // Access the Offline object store
  const store = transaction.objectStore('Offline');

  // Add record to your store with add method.
  store.add(record);
};

// Listen for app coming back online
window.addEventListener('online', checkDatabase);