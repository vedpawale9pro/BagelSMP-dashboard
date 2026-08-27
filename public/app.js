async function loadDashboard() {
  try {
    const res = await fetch('/.netlify/functions/dashboard');
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Failed to load');

    // Server Status & Profile
    const statusElem = document.getElementById('server-status');
    statusElem.textContent = data.server.online ? '● SERVER ONLINE' : '● SERVER OFFLINE';
    statusElem.className = `status-badge ${data.server.online ? 'online' : 'offline'}`;

    document.getElementById('player-name').textContent = data.user.username;
    document.getElementById('player-balance').textContent = data.user.balance;

    // Rate Limits
    document.getElementById('rate-remaining').textContent = data.rateLimit.remaining;
    document.getElementById('rate-reset').textContent = data.rateLimit.reset;

    // Auctions Table
    const auctionsTbody = document.getElementById('auctions-table');
    if (data.auctions.length === 0) {
      auctionsTbody.innerHTML = '<tr><td colspan="4">No active auctions found.</td></tr>';
    } else {
      auctionsTbody.innerHTML = data.auctions.map(a => `
        <tr>
          <td>✦ ${a.item || a.name || 'Unknown'}</td>
          <td>${a.seller || 'N/A'}</td>
          <td>$${((a.price || 0) / 100).toFixed(2)}</td>
          <td>${a.expiresIn ? Math.round(a.expiresIn / 60) + 'm' : 'Live'}</td>
        </tr>
      `).join('');
    }

    // Orders Table
    const ordersTbody = document.getElementById('orders-table');
    if (data.orders.length === 0) {
      ordersTbody.innerHTML = '<tr><td colspan="4">No active orders placed.</td></tr>';
    } else {
      ordersTbody.innerHTML = data.orders.map(o => `
        <tr>
          <td><strong>${(o.type || 'BUY').toUpperCase()}</strong></td>
          <td>${o.item || 'Item'}</td>
          <td>${o.amount || o.quantity || 1}</td>
          <td>$${((o.price || 0) / 100).toFixed(2)}</td>
        </tr>
      `).join('');
    }

    // Bounties
    const bountiesContainer = document.getElementById('bounties-list');
    if (data.bounties.length === 0) {
      bountiesContainer.innerHTML = '<p>No active bounties available.</p>';
    } else {
      bountiesContainer.innerHTML = data.bounties.map(b => `
        <div style="padding: 8px 0; border-bottom: 1px solid #282f3d;">
          🎯 <strong>${b.target || b.player || 'Target'}</strong> — Reward: <span style="color: #10b981;">$${((b.reward || 0) / 100).toFixed(2)}</span>
        </div>
      `).join('');
    }

  } catch (err) {
    console.error('Dashboard Error:', err);
  }
}

// Initial fetch and auto-refresh every 30 seconds
loadDashboard();
setInterval(loadDashboard, 30000);