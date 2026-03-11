const sharp = require("sharp");
const path = require("path");

const w = 600;
const h = 400;

const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6f8bff"/>
      <stop offset="100%" stop-color="#9a5bd5"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>

  <!-- Top bar -->
  <rect x="30" y="20" width="540" height="40" rx="8" fill="rgba(255,255,255,0.15)"/>
  <rect x="40" y="30" width="80" height="20" rx="4" fill="rgba(255,255,255,0.25)"/>
  <rect x="140" y="30" width="60" height="20" rx="4" fill="rgba(255,255,255,0.18)"/>
  <rect x="220" y="30" width="60" height="20" rx="4" fill="rgba(255,255,255,0.18)"/>

  <!-- Left panel: Cover Letter Builder -->
  <rect x="30" y="80" width="260" height="300" rx="12" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
  <text x="50" y="110" font-family="sans-serif" font-size="11" font-weight="600" fill="rgba(255,255,255,0.9)">Cover Letter Builder</text>
  <rect x="50" y="125" width="220" height="14" rx="3" fill="rgba(255,255,255,0.15)"/>
  <rect x="50" y="145" width="180" height="14" rx="3" fill="rgba(255,255,255,0.12)"/>
  <rect x="50" y="165" width="200" height="14" rx="3" fill="rgba(255,255,255,0.12)"/>

  <rect x="50" y="195" width="220" height="60" rx="6" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
  <text x="60" y="215" font-family="sans-serif" font-size="9" fill="rgba(255,255,255,0.5)">Write your response here...</text>

  <rect x="50" y="270" width="220" height="60" rx="6" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
  <text x="60" y="290" font-family="sans-serif" font-size="9" fill="rgba(255,255,255,0.5)">Selection criteria response...</text>

  <rect x="50" y="345" width="90" height="24" rx="12" fill="rgba(111,139,255,0.6)"/>
  <text x="70" y="361" font-family="sans-serif" font-size="9" font-weight="600" fill="white">Export PDF</text>

  <!-- Right panel: Snippet Library -->
  <rect x="310" y="80" width="260" height="140" rx="12" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
  <text x="330" y="110" font-family="sans-serif" font-size="11" font-weight="600" fill="rgba(255,255,255,0.9)">Snippet Library</text>
  <rect x="330" y="125" width="220" height="28" rx="5" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
  <text x="340" y="143" font-family="sans-serif" font-size="8" fill="rgba(255,255,255,0.6)">Leadership experience paragraph</text>
  <rect x="330" y="158" width="220" height="28" rx="5" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
  <text x="340" y="176" font-family="sans-serif" font-size="8" fill="rgba(255,255,255,0.6)">Project management response</text>
  <rect x="330" y="191" width="220" height="28" rx="5" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
  <text x="340" y="209" font-family="sans-serif" font-size="8" fill="rgba(255,255,255,0.6)">Teamwork and collaboration</text>

  <!-- Right panel: AI Assist -->
  <rect x="310" y="240" width="260" height="140" rx="12" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
  <text x="330" y="270" font-family="sans-serif" font-size="11" font-weight="600" fill="rgba(255,255,255,0.9)">AI Assist</text>
  <rect x="480" y="258" width="70" height="18" rx="9" fill="rgba(72,187,120,0.3)" stroke="rgba(72,187,120,0.5)" stroke-width="1"/>
  <text x="495" y="270" font-family="sans-serif" font-size="8" fill="rgba(72,187,120,0.9)">Optional</text>
  <rect x="330" y="285" width="220" height="40" rx="6" fill="rgba(255,255,255,0.06)"/>
  <text x="340" y="302" font-family="sans-serif" font-size="8" fill="rgba(255,255,255,0.45)">Refine tone and structure...</text>
  <rect x="330" y="340" width="80" height="24" rx="12" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
  <text x="345" y="356" font-family="sans-serif" font-size="9" fill="rgba(255,255,255,0.7)">Refine</text>
  <rect x="420" y="340" width="80" height="24" rx="12" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
  <text x="440" y="356" font-family="sans-serif" font-size="9" fill="rgba(255,255,255,0.5)">Skip</text>
</svg>`;

const outPath = path.join(__dirname, "..", "public", "screenshot.png");

sharp(Buffer.from(svg))
  .png()
  .toFile(outPath)
  .then(() => console.log("Created", outPath))
  .catch((err) => console.error(err));
