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
async function initProvider() {
  for (let rpc of RPCS) {
    try {
      const testProvider = new ethers.providers.JsonRpcProvider(rpc);
      await testProvider.getBlockNumber();

      provider = testProvider;
      contract = new ethers.Contract(ICO, ABI, provider);

      console.log("Connected RPC:", rpc);
      return;
    } catch (e) {
      console.log("RPC failed:", rpc);
    }
  }
  document.getElementById("price").innerText = "RPC Failed";
}

// ================= CHART =================
let chart, series;
let lastPrice = 100; // initial fallback price

function initChart() {
  const container = document.getElementById("chart");

  chart = LightweightCharts.createChart(container, {
    width: container.clientWidth,
    height: 500,
  });

  series = chart.addLineSeries();

  // ✅ INITIAL DUMMY DATA
  const now = Math.floor(Date.now() / 1000);
  series.setData([
    { time: now - 20, value: lastPrice },
    { time: now - 10, value: lastPrice + 5 },
    { time: now, value: lastPrice - 3 },
  ]);
}

// ================= LOAD PRICE =================
async function loadPrice() {
  const now = Math.floor(Date.now() / 1000);
  let p;

  try {
    if (!contract) throw new Error("No contract");

    const priceRaw = await contract.usdPrice();
    p = Number(ethers.utils.formatUnits(priceRaw, 18));

    if (!p || p === 0) throw new Error("Price = 0");

    document.getElementById("price").innerText = "$" + p.toFixed(2);
    lastPrice = p; // update last valid price
  } catch (e) {
    console.warn("Using dummy price", e.message);

    // Generate small random dummy movement around last price
    const delta = (Math.random() - 0.5) * 2; // -1 to +1
    p = lastPrice + delta;
    document.getElementById("price").innerText = "Dummy $" + p.toFixed(2);
    lastPrice = p;
  }

  // Update chart every 10s
  series.update({ time: now, value: p });
}

// ================= START =================
window.addEventListener("load", async () => {
  initChart();
  await initProvider();
  await loadPrice();
  setInterval(loadPrice, 10000);
});

// ================= RESIZE =================
window.addEventListener("resize", () => {
  if (chart) chart.resize(window.innerWidth, 500);
});
