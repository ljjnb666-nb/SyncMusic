const { spawn } = require('child_process');

const ytDlpPath = 'D:/python/Scripts/yt-dlp.exe';
const args = [
  '-x', '--audio-format', 'mp3',
  '-o', 'C:/Users/LJJ2004/所有项目/SyncMusic/downloads/%(title)s [%(id)s].%(ext)s',
  'ytsearch1:夜曲 周杰伦'
];

console.log('Executing:', ytDlpPath, args.join(' '));

const child = spawn(ytDlpPath, args, {
  cwd: 'C:/Users/LJJ2004/所有项目/SyncMusic/downloads',
  env: { ...process.env, LC_ALL: 'en_US.UTF-8' },
  stdio: ['ignore', 'pipe', 'pipe']
});

let stdout = '', stderr = '';
child.stdout.on('data', (data) => {
  stdout += data.toString();
  process.stdout.write(data);
});
child.stderr.on('data', (data) => {
  stderr += data.toString();
});

child.on('close', (code) => {
  console.log('\n--- EXIT CODE:', code);
  console.log('--- STDOUT LENGTH:', stdout.length);
  console.log('--- STDERR LENGTH:', stderr.length);
});
