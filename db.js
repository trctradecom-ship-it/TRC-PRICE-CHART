const DB_NAME = "TRC_CHART_DB";
const STORE = "candles";

let db;

function initDB(){
  return new Promise((resolve)=>{
    const req = indexedDB.open(DB_NAME,1);

    req.onupgradeneeded = e=>{
      db = e.target.result;
      db.createObjectStore(STORE,{keyPath:"time"});
    };

    req.onsuccess = e=>{
      db = e.target.result;
      resolve();
    };
  });
}

function saveCandle(candle){
  const tx = db.transaction(STORE,"readwrite");
  tx.objectStore(STORE).put(candle);
}

function loadCandles(){
  return new Promise((resolve)=>{
    const tx = db.transaction(STORE,"readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = ()=> resolve(req.result || []);
  });
}
