// yt-dlp wrapper script - reads keyword from file to avoid encoding issues
const { spawn } = require('child_process');
const fs = require('fs');

const ytDlpPath = process.argv[2];
const outputPath = process.argv[3];
const keywordFile = process.argv[4];

if (!ytDlpPath || !outputPath || !keywordFile) {
  console.error('Usage: node exec-ytdl.cjs <yt-dlp-path> <output-path> <keyword-file>');
  process.exit(1);
}

const keyword = fs.readFileSync(keywordFile, 'utf8').trim();
console.log('[exec-ytdl] Searching for:', keyword);

const searchQuery = `ytsearch1:${keyword}`;
const child = spawn(ytDlpPath, [
  '-x', '--audio-format', 'mp3',
  '-o', outputPath,
  searchQuery
], { stdio: ['ignore', 'pipe', 'pipe'] });

child.stdout.on('data', d => process.stdout.write(d));
child.stderr.on('data', d => process.stderr.write(d));

child.on('close', (code) => {
  process.exit(code ? 1 : 0);
});
