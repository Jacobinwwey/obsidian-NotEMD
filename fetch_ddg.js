const https = require('https');
const fs = require('fs');

const url = "https://html.duckduckgo.com/html/?q=Obsidian+Markdown";
const options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
};

https.get(url, options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    fs.writeFileSync('ddg_response.html', data);
    console.log('HTML saved to ddg_response.html');
  });
}).on('error', (e) => {
  console.error(e);
});
