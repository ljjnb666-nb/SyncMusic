const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

const execAsync = promisify(exec);

async function test() {
  const DOWNLOAD_DIR = path.join(process.cwd(), '..', 'downloads');
  const ytDlpPath = 'D:/python/Scripts/yt-dlp.exe';
  const keyword = '周杰伦 听妈妈的话';
  const outputPath = path.join(DOWNLOAD_DIR, '%(title)s [%(id)s].%(ext)s').replace(/\\/g, '/');

  const command = `"${ytDlpPath}" -x --audio-format mp3 -o "${outputPath}" "ytsearch1:${keyword}"`;
  console.log('Command:', command);
  console.log('CWD:', DOWNLOAD_DIR);

  // List files before
  const before = fs.readdirSync(DOWNLOAD_DIR).filter(f => f.endsWith('.mp3') || f.endsWith('.flac'));
  console.log('Files before:', before.length);

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: DOWNLOAD_DIR,
      timeout: 120000,
      env: { ...process.env, LC_ALL: 'en_US.UTF-8' }
    });
    console.log('stdout:', stdout ? stdout.slice(0, 300) : 'empty');
    console.log('stderr:', stderr ? stderr.slice(0, 300) : 'empty');
  } catch (e) {
    console.log('Error:', e.message);
    console.log('stderr:', e.stderr ? e.stderr.slice(0, 300) : 'empty');
  }

  // List files after
  const after = fs.readdirSync(DOWNLOAD_DIR).filter(f => f.endsWith('.mp3') || f.endsWith('.flac'));
  console.log('Files after:', after);
  const newFiles = after.filter(f => !before.includes(f));
  console.log('New files:', newFiles);
}

test();
