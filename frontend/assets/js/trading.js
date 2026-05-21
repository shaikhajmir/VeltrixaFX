/**
 * VeltrixaFX - Active Leveraged Trading Engine Interface
 * Manages live price feeds, ticking orderbooks, positions, and leveraged order entry.
 */

let activeSymbol = 'BTC/USD';
let livePrices = {};
let activePositions = [];
let chartWidget = null;

// Initialize dynamic trading systems on DOM Load
document.addEventListener('DOMContentLoaded', () => {
  initTradingViewWidget(activeSymbol);
  
  // Set up click listeners for buy/sell order placement
  const buyBtn = document.getElementById('btn-buy');
  const sellBtn = document.getElementById('btn-sell');
  const leverageSlider = document.getElementById('trade-leverage');
  const leverageVal = document.getElementById('leverage-val');
  const amountInput = document.getElementById('trade-amount');

  if (leverageSlider && leverageVal) {
    leverageSlider.addEventListener('input', () => {
      leverageVal.textContent = `${leverageSlider.value}x`;
    });
  }

  if (buyBtn) {
    buyBtn.addEventListener('click', async () => {
      await submitMarketOrder('LONG');
    });
  }

  if (sellBtn) {
    sellBtn.addEventListener('click', async () => {
      await submitMarketOrder('SHORT');
    });
  }

  // Periodic poll loops (tickers & positions)
  pollMarketData();
  pollPositions();
  
  setInterval(pollMarketData, 1000);
  setInterval(pollPositions, 1000);
});

// INITIALIZE TRADINGVIEW LIVE CANDLESTICK CHART
function initTradingViewWidget(symbol) {
  const container = document.getElementById('trading-chart-container');
  if (!container) return;

  // Clear previous content
  container.innerHTML = `<div id="tradingview_widget_el" style="height:100%;width:100%"></div>`;

  // Translate Veltrixa symbol to TradingView symbol
  let tvSymbol = 'BINANCE:BTCUSDT';
  if (symbol === 'ETH/USD') tvSymbol = 'BINANCE:ETHUSDT';
  else if (symbol === 'EUR/USD') tvSymbol = 'FX:EURUSD';
  else if (symbol === 'GBP/USD') tvSymbol = 'FX:GBPUSD';
  else if (symbol === 'USD/JPY') tvSymbol = 'FX:USDJPY';
  else if (symbol === 'GOLD') tvSymbol = 'OANDA:XAUUSD';

  if (typeof TradingView !== 'undefined') {
    new TradingView.widget({
      "autosize": true,
      "symbol": tvSymbol,
      "interval": "15",
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "enable_publishing": false,
      "hide_side_toolbar": false,
      "allow_symbol_change": true,
      "container_id": "tradingview_widget_el",
      "studies": [
        "RSI@tv-basicstudies",
        "MASimple@tv-basicstudies"
      ]
    });
  } else {
    // Load script dynamically and retry
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.onload = () => {
      initTradingViewWidget(symbol);
    };
    document.head.appendChild(script);
  }
}

// POLL AND UPDATE TICKER METRICS AND ORDERBOOK
async function pollMarketData() {
  try {
    const res = await fetch('/api/trading/prices');
    if (!res.ok) return;

    livePrices = await res.json();
    const data = livePrices[activeSymbol];
    if (!data) return;

    // 1. Update Header Ticker Strip
    const priceEl = document.getElementById('ticker-price');
    const changeEl = document.getElementById('ticker-change');
    const highEl = document.getElementById('ticker-high');
    const lowEl = document.getElementById('ticker-low');
    const symbolTextEl = document.getElementById('ticker-symbol-text');
    
    if (symbolTextEl) symbolTextEl.textContent = activeSymbol;

    const precision = activeSymbol.includes('EUR') || activeSymbol.includes('GBP') ? 5 : 2;
    const formattedPrice = parseFloat(data.price).toFixed(precision);

    if (priceEl) {
      priceEl.textContent = `$${formattedPrice}`;
      // Highlight price ticks on change
      if (data.trend === 1) {
        priceEl.className = 'font-data-mono text-secondary transition-all duration-200';
      } else {
        priceEl.className = 'font-data-mono text-tertiary transition-all duration-200';
      }
    }

    if (changeEl) {
      const sign = data.change >= 0 ? '+' : '';
      changeEl.textContent = `${sign}${data.change.toFixed(2)}%`;
      if (data.change >= 0) {
        changeEl.className = 'text-secondary text-xs font-bold';
      } else {
        changeEl.className = 'text-tertiary text-xs font-bold';
      }
    }

    if (highEl) highEl.textContent = `$${parseFloat(data.high).toFixed(precision)}`;
    if (lowEl) lowEl.textContent = `$${parseFloat(data.low).toFixed(precision)}`;

    // 2. Generate and Render Fluctuating Order Book
    renderOrderBook(data.price, precision);
  } catch (error) {
    console.error('Market poll error:', error);
  }
}

// DYNAMIC FLUCTUATING ORDERBOOK GENERATOR
function renderOrderBook(centerPrice, precision) {
  const asksContainer = document.getElementById('orderbook-asks');
  const bidsContainer = document.getElementById('orderbook-bids');
  const spreadContainer = document.getElementById('orderbook-spread');

  if (!asksContainer || !bidsContainer) return;

  const tickSize = activeSymbol.includes('EUR') || activeSymbol.includes('GBP') ? 0.0001 : 0.5;
  const spreadVal = +(tickSize * 3).toFixed(precision);

  if (spreadContainer) {
    spreadContainer.innerHTML = `
      <span class="font-label-caps text-on-surface mr-md">Spread: ${spreadVal}</span>
      <span class="text-secondary font-bold font-data-mono">$${centerPrice.toFixed(precision)}</span>
    `;
  }

  // 1. Generate Asks (Red - selling pressure above center price)
  let asksHtml = '';
  let asksCumTotal = 0.0;
  for (let i = 3; i >= 1; i--) {
    const askPrice = centerPrice + (i * tickSize);
    const size = (Math.random() * 2 + 0.05).toFixed(3);
    asksCumTotal += parseFloat(size);
    asksHtml += `
      <div class="grid grid-cols-3 px-sm py-[2px] orderbook-row-ask hover:bg-white/5 transition-colors">
        <span class="text-tertiary font-bold">${askPrice.toFixed(precision)}</span>
        <span class="text-right text-on-surface">${size}</span>
        <span class="text-right text-on-surface-variant">${asksCumTotal.toFixed(3)}</span>
      </div>
    `;
  }
  asksContainer.innerHTML = asksHtml;

  // 2. Generate Bids (Green - buying pressure below center price)
  let bidsHtml = '';
  let bidsCumTotal = 0.0;
  for (let i = 1; i <= 3; i++) {
    const bidPrice = centerPrice - (i * tickSize);
    const size = (Math.random() * 2 + 0.05).toFixed(3);
    bidsCumTotal += parseFloat(size);
    bidsHtml += `
      <div class="grid grid-cols-3 px-sm py-[2px] orderbook-row-bid hover:bg-white/5 transition-colors">
        <span class="text-secondary font-bold">${bidPrice.toFixed(precision)}</span>
        <span class="text-right text-on-surface">${size}</span>
        <span class="text-right text-on-surface-variant">${bidsCumTotal.toFixed(3)}</span>
      </div>
    `;
  }
  bidsContainer.innerHTML = bidsHtml;
}

// POLL AND RENDER USER'S OPEN POSITIONS
async function pollPositions() {
  const tbody = document.getElementById('positions-tbody');
  const countEl = document.getElementById('positions-count');
  if (!tbody) return;

  try {
    const res = await fetch('/api/trading/positions');
    if (!res.ok) return;

    activePositions = await res.json();

    if (countEl) {
      countEl.textContent = `Open Positions (${activePositions.length})`;
    }

    if (activePositions.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="p-lg text-center text-on-surface-variant/50 font-label-caps">
            No active positions open. Select leverage and place an order.
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    activePositions.forEach(pos => {
      const isLong = pos.side === 'LONG';
      const sideClass = isLong ? 'text-secondary bg-secondary/10' : 'text-tertiary bg-tertiary/10';
      const pnlClass = pos.pnl >= 0 ? 'text-secondary' : 'text-tertiary';
      const pnlSign = pos.pnl >= 0 ? '+' : '';
      
      const precision = pos.symbol.includes('EUR') || pos.symbol.includes('GBP') ? 5 : 2;

      html += `
        <tr class="hover:bg-white/5 transition-all duration-150">
          <td class="p-sm font-bold text-on-surface font-label-caps">${pos.symbol}</td>
          <td class="p-sm">
            <span class="${sideClass} px-xs py-[2px] rounded text-[10px] font-bold uppercase tracking-wider">${pos.side} ${pos.leverage}x</span>
          </td>
          <td class="p-sm text-right font-data-mono">${pos.size} ${pos.symbol.split('/')[0]}</td>
          <td class="p-sm text-right font-data-mono">$${pos.entry_price.toFixed(precision)}</td>
          <td class="p-sm text-right font-data-mono text-secondary-fixed-dim font-bold">$${pos.markPrice.toFixed(precision)}</td>
          <td class="p-sm text-right font-data-mono ${pnlClass} font-bold">
            ${pnlSign}$${pos.pnl.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${pnlSign}${pos.roe.toFixed(1)}%)
          </td>
          <td class="p-sm text-right">
            <button onclick="closePosition(${pos.id})" class="material-symbols-outlined text-[18px] text-on-surface-variant hover:text-error hover:scale-110 transition-all cursor-pointer">
              close
            </button>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  } catch (error) {
    console.error('Positions fetch error:', error);
  }
}

// SUBMIT MARKET ORDER (LONG/SHORT)
async function submitMarketOrder(side) {
  const sizeInput = document.getElementById('trade-amount');
  const leverageSlider = document.getElementById('trade-leverage');

  if (!sizeInput) return;
  const size = parseFloat(sizeInput.value);
  const leverage = leverageSlider ? parseInt(leverageSlider.value) : 10;

  if (isNaN(size) || size <= 0) {
    showToast('Please provide a valid trade size amount.', 'error');
    return;
  }

  try {
    const res = await fetch('/api/trading/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol: activeSymbol,
        side,
        size,
        leverage
      })
    });

    const data = await res.json();
    if (res.ok) {
      showToast(data.message || 'Position opened successfully!', 'success');
      
      // Update local wallet view and details
      if (window.checkSession) window.checkSession();
      pollPositions();
    } else {
      showToast(data.message || 'Failed to place order.', 'error');
    }
  } catch (error) {
    console.error('Order submission error:', error);
    showToast('Network error placing order.', 'error');
  }
}

// CLOSE ACTIVE LEVERAGED POSITION
window.closePosition = async function(positionId) {
  try {
    const res = await fetch('/api/trading/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ positionId })
    });

    const data = await res.json();
    if (res.ok) {
      const pnlSign = data.pnl >= 0 ? '+' : '';
      const pnlMsg = `Realised P&L: ${pnlSign}$${data.pnl.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`;
      showToast(`${data.message} ${pnlMsg}`, 'success');

      // Update wallet details
      if (window.checkSession) window.checkSession();
      pollPositions();
    } else {
      showToast(data.message || 'Failed to close position.', 'error');
    }
  } catch (error) {
    console.error('Close position error:', error);
    showToast('Network error closing position.', 'error');
  }
};

// EXPOSE UTILITY TO SELECT DIFFERENT INSTRUMENT SYMBOLS
window.selectInstrument = function(symbol) {
  if (symbol === activeSymbol) return;
  activeSymbol = symbol;
  
  // Re-render chart and update poll state instantly
  initTradingViewWidget(symbol);
  pollMarketData();
  
  showToast(`Switched active terminal view to ${symbol}.`);
};
