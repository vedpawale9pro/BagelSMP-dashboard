const API_BASE = 'https://api.bagelsmp.com/v1';

exports.handler = async function (event, context) {
  const apiKey = process.env.BAGEL_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server misconfigured: BAGEL_API_KEY is missing' })
    };
  }

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Accept': 'application/json'
  };

  try {
    // Fetch all endpoints concurrently
    const [statusRes, meRes, auctionsRes, ordersRes, bountiesRes] = await Promise.all([
      fetch(`${API_BASE}/status`, { headers }),
      fetch(`${API_BASE}/me`, { headers }),
      fetch(`${API_BASE}/auctions`, { headers }),
      fetch(`${API_BASE}/orders/mine`, { headers }),
      fetch(`${API_BASE}/bounties`, { headers })
    ]);

    // Extract rate limit info from headers
    const rateLimit = {
      remaining: statusRes.headers.get('x-ratelimit-remaining') || '120',
      reset: statusRes.headers.get('x-ratelimit-reset') || '60'
    };

    const statusData = statusRes.ok ? await statusRes.json() : null;
    const meData = meRes.ok ? await meRes.json() : null;
    const auctionsData = auctionsRes.ok ? await auctionsRes.json() : [];
    const ordersData = ordersRes.ok ? await ordersRes.json() : [];
    const bountiesData = bountiesRes.ok ? await bountiesRes.json() : [];

    // Format consolidated dashboard payload
    const payload = {
      server: {
        online: statusRes.ok && (statusData?.online ?? true),
        playerCount: statusData?.players?.online || 0
      },
      user: {
        username: meData?.username || 'Player',
        balance: meData?.balance ? (meData.balance / 100).toFixed(2) : '0.00' // Cents to USD
      },
      rateLimit,
      auctions: Array.isArray(auctionsData) ? auctionsData.slice(0, 5) : [],
      orders: Array.isArray(ordersData) ? ordersData.slice(0, 5) : [],
      bounties: Array.isArray(bountiesData) ? bountiesData.slice(0, 5) : []
    };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch BagelSMP data', details: err.message })
    };
  }
};