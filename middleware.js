export default function middleware(req) {
  // Povoliť známe vyhľadávače (Google, Bing, atď.), aby mohli indexovať web aj z USA
  const userAgent = req.headers.get('user-agent') || '';
  const isBot = /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot/i.test(userAgent);

  if (isBot) return;

  // Vercel na Edge úrovni poskytuje krajinu v hlavičke 'x-vercel-ip-country'
  // Nepotrebujeme importovať 'next/server'
  const country = req.headers.get('x-vercel-ip-country') || 'SK';

  const allowedCountries = ['SK', 'CH'];

  if (!allowedCountries.includes(country)) {
    return new Response('Prístup je povolený len zo Slovenska a Švajčiarska.', {
      status: 403,
      headers: { 'content-type': 'text/plain; charset=utf-8' }
    });
  }

  // Pre statické stránky Vercel automaticky pokračuje k index.html, ak vrátime prázdnu odpoveď alebo nič
}
