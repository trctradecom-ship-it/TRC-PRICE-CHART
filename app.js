// ================= CONFIG =================
const ICO = "0xA6F33c57891E52258d68BC99c593207E5C1B4a51";

const ABI = [
"function usdPrice() view returns(uint256)",
"event TokensPurchased(address indexed buyer,uint256 polPaid,uint256 tokensReceived)",
"event TokensSold(address indexed seller,uint256 tokensSold,uint256 polReceived)"
];

const provider = new ethers.providers.JsonRpcProvider("https://polygon-rpc.com");
const contract = new ethers.Contract(ICO, ABI, provider);

// ================= CHART =================
const chart = LightweightCharts.createChart(document.getElementById("chart"), {
  layout: { background: { color: "#0b0f14" }, textColor: "#AAA" },
  grid: {
    vertLines: { color: "#1a1a1a" },
    horzLines: { color: "#1a1a1a" }
  },
  crosshair: { mode: 1 },
  rightPriceScale: { borderColor: "#333" },
  timeScale: {
    borderColor: "#333",
    timeVisible: true,
    secondsVisible: false
  }
});

const series = chart.addCandlestickSeries({
  upColor: "#00ff99",
  downColor: "#ff4d4f",
  borderUpColor: "#00ff99",
  borderDownColor: "#ff4d4f",
  wickUpColor: "#00ff99",
  wickDownColor: "#ff4d4f"
});

// ================= STATE =================
let currentCandle = null;
let candles = [];

// ================= LOAD FROM DB =================
async function loadFromDB(){
  await initDB();
  candles = await loadCandles();

  if(candles.length > 0){
    series.setData(candles);
    currentCandle = candles[candles.length-1];
  }
}

// ================= CREATE CANDLE =================
function newCandle(price){

  const time = Math.floor(Date.now()/30)*30;

  currentCandle = {
    time,
    open: price,
    high: price,
    low: price,
    close: price
  };

  candles.push(currentCandle);
  saveCandle(currentCandle);

  series.update(currentCandle);
}

// ================= UPDATE =================
function updateCandle(price){

  if(!currentCandle){
    newCandle(price);
    return;
  }

  currentCandle.close = price;

  if(price > currentCandle.high) currentCandle.high = price;
  if(price < currentCandle.low) currentCandle.low = price;

  saveCandle(currentCandle);
  series.update(currentCandle);
}

// ================= EVENTS =================
function listenEvents(){

  contract.on("TokensPurchased", async ()=>{
    const price = await contract.usdPrice();
    updateCandle(Number(ethers.utils.formatUnits(price,18)));
  });

  contract.on("TokensSold", async ()=>{
    const price = await contract.usdPrice();
    updateCandle(Number(ethers.utils.formatUnits(price,18)));
  });

}

// ================= INTERVAL =================
setInterval(async ()=>{

  const price = await contract.usdPrice();
  const p = Number(ethers.utils.formatUnits(price,18));

  newCandle(p);

},30000);

// ================= INIT =================
async function start(){

  await loadFromDB();

  if(!currentCandle){
    const price = await contract.usdPrice();
    newCandle(Number(ethers.utils.formatUnits(price,18)));
  }

  listenEvents();
}

start();

// ================= RESIZE =================
window.addEventListener("resize",()=>{
  chart.resize(window.innerWidth,600);
});
