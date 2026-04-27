export default async function handler(req, res) {
  // Support both /api/job?id=xxx and /api/job/xxx if we use a dynamic route
  const id = req.query.id;

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  const host = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173';
  
  if (!supabaseUrl || !supabaseKey || !id) {
    return res.redirect(302, `/empleo`);
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/public_job_campaigns?id=eq.${id}&select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    const data = await response.json();
    const job = data && data.length > 0 ? data[0] : null;

    if (!job) {
      return res.redirect(302, `/empleo`);
    }

    // Try to fetch the built index.html
    const indexRes = await fetch(`${host}/`);
    let html = await indexRes.text();

    const title = `Vacante: ${job.title} - ${job.business_name} | AgendiApp`;
    const description = job.description ? job.description.slice(0, 160).replace(/"/g, '&quot;') + '...' : 'Únete a nuestro equipo.';
    const image = job.business_logo_url || `${host}/logo.png`; // Basic fallback

    // Replace the title
    html = html.replace(/<title>(.*?)<\/title>/i, `<title>${title}</title>`);
    
    const ogTags = `
      <meta property="og:title" content="${title}" />
      <meta property="og:description" content="${description}" />
      <meta property="og:image" content="${image}" />
      <meta property="og:url" content="${host}/empleo/${id}" />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="${title}" />
      <meta name="twitter:description" content="${description}" />
      <meta name="twitter:image" content="${image}" />
    `;
    
    // Inject tags before </head>
    html = html.replace('</head>', `${ogTags}</head>`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate'); // Cache for 60s
    res.status(200).send(html);

  } catch (error) {
    console.error('Error fetching job for OG tags:', error);
    res.redirect(302, `/empleo`);
  }
}
