// ================= CONFIG =================
const ICO = "0xA6F33c57891E52258d68BC99c593207E5C1B4a51";

const ABI = [
"function usdPrice() view returns(uint256)",
"event TokensPurchased(address indexed buyer,uint256 polPaid,uint256 tokensReceived)",
"event TokensSold(address indexed seller,uint256 tokensSold,uint256 polReceived)"
];

// FAST + STABLE RPC
const provider = new ethers.providers.JsonRpcProvider(
  "https://polygon-mainnet.g.alchemy.com/v2/demo"
);

const contract = new ethers.Contract(ICO, ABI, provider);

// ================= CHART =================
let chart, series;

function initChart(){

  const container = document.getElementById("chart");

  chart = LightweightCharts.createChart(container,{
    width: container.clientWidth,
    height: 500,

    layout:{
      background:{color:"#0b0f14"},
      textColor:"#AAA"
    },

    grid:{
      vertLines:{color:"#1a1a1a"},
      horzLines:{color:"#1a1a1a"}
    },

    timeScale:{
      timeVisible:true
    }
  });

  series = chart.addCandlestickSeries({
    upColor:"#00ff99",
    downColor:"#ff4d4f",
    borderUpColor:"#00ff99",
    borderDownColor:"#ff4d4f",
    wickUpColor:"#00ff99",
    wickDownColor:"#ff4d4f"
  });
}

// ================= STATE =================
let currentCandle = null;

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

  series.update(currentCandle);
}

// ================= PRICE LOAD =================
async function loadPrice(){

  try{
    const price = await contract.usdPrice();
    const p = Number(ethers.utils.formatUnits(price,18));

    document.getElementById("price").innerText = "$" + p.toFixed(2);

    updateCandle(p);

  }catch(e){
    console.error("Price error", e);
  }
}

// ================= EVENTS =================
function listenEvents(){

  contract.on("TokensPurchased", async ()=>{
    loadPrice();
  });

  contract.on("TokensSold", async ()=>{
    loadPrice();
  });

}

// ================= INIT =================
async function start(){

  initChart();

  // initial price
  await loadPrice();

  // create new candle every 30 sec
  setInterval(loadPrice, 30000);

  // live updates
  listenEvents();

}

// ================= START AFTER LOAD =================
window.addEventListener("load", start);

// ================= RESIZE =================
window.addEventListener("resize", ()=>{
  if(chart){
    chart.resize(window.innerWidth, 500);
  }
});
