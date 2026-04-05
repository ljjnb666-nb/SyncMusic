import subprocess
import sys
keyword = "test"
output = r"C:/Users/LJJ2004/所有项目/SyncMusic/downloads/%(title)s [%(id)s].%(ext)s"
result = subprocess.run(
    [r"D:/python/Scripts/yt-dlp.exe", "-x", "--audio-format", "mp3", "--match-filter", "duration > 15", "-o", output, "ytsearch1:" + keyword],
    capture_output=True, text=True, encoding="utf-8"
)
print(result.stdout)
print(result.stderr, file=sys.stderr)
