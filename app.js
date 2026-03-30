// ================= CONFIG =================
const ICO = "0xA6F33c57891E52258d68BC99c593207E5C1B4a51";

const ABI = [
  "function usdPrice() view returns(uint256)"
];

// ✅ MULTI RPC (AUTO FALLBACK)
const RPCS = [
  "https://polygon.llamarpc.com",
  "https://rpc.ankr.com/polygon",
  "https://polygon-rpc.com"
];

let provider;
let contract;

// ================= INIT PROVIDER =================
async function initProvider(){

  for(let rpc of RPCS){

    try{
      const testProvider = new ethers.providers.JsonRpcProvider(rpc);
      await testProvider.getBlockNumber();

      provider = testProvider;
      contract = new ethers.Contract(ICO, ABI, provider);

      console.log("Connected RPC:", rpc);
      return;

    }catch(e){
      console.log("RPC failed:", rpc);
    }

  }

  document.getElementById("price").innerText = "RPC Failed";
}

// ================= CHART =================
let chart, series;

function initChart(){

  const container = document.getElementById("chart");

  chart = LightweightCharts.createChart(container,{
    width: container.clientWidth,
    height: 500
  });

  series = chart.addLineSeries();

  // ✅ FORCE SHOW SOMETHING
  series.setData([
    { time: 1, value: 100 },
    { time: 2, value: 120 },
    { time: 3, value: 110 }
  ]);
}

// ================= LOAD PRICE =================
async function loadPrice(){

  try{

    if(!contract){
      document.getElementById("price").innerText = "No Contract";
      return;
    }

    const price = await contract.usdPrice();

    const p = Number(ethers.utils.formatUnits(price,18));

    console.log("Price:", p);

    if(p === 0){
      document.getElementById("price").innerText = "Price = 0";
      return;
    }

    document.getElementById("price").innerText = "$" + p.toFixed(2);

    const now = Math.floor(Date.now()/1000);

    series.update({ time: now, value: p });

  }catch(e){

    console.error(e);
    document.getElementById("price").innerText = "Error fetching price";

  }
}

// ================= START =================
window.addEventListener("load", async ()=>{

  initChart();

  await initProvider();

  await loadPrice();

  setInterval(loadPrice, 10000);

});

// ================= RESIZE =================
window.addEventListener("resize", ()=>{
  if(chart){
    chart.resize(window.innerWidth, 500);
  }
});
