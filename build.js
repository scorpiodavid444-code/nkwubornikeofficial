const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');

// Find all JSON files in /content/ (except news.json to avoid loops)
const contentFiles = glob.sync('content/*.json', { ignore: 'content/news.json' });

const allPosts = contentFiles.map(file => {
  const data = fs.readFileSync(file, 'utf8');
  return JSON.parse(data);
});

// Sort by date descending (optional, but matches your JS sorting)
allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

// Write to /public/news.json (instead of /content/)
fs.writeFileSync('public/news.json', JSON.stringify(allPosts, null, 2));
console.log(`Aggregated ${allPosts.length} posts into public/news.json`);

