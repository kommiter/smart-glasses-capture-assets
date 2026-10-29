const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const remote = 'https://raw.githubusercontent.com/kommiter/smart-glasses-capture-assets/main';
const filled = (part, d) => `<path data-part="${part}" d="${d}" fill="white"/>`;
const ring = d => `<path d="${d}" fill="white" fill-rule="evenodd"/>`;

const front =
  filled('left-temple', 'M130 196 L158 190 Q184 220 204 258 L243 319 Q253 337 239 344 Q225 351 216 333 L175 277 Q153 241 130 221 Z') +
  filled('right-temple', 'M830 196 L802 190 Q776 220 756 258 L717 319 Q707 337 721 344 Q735 351 744 333 L785 277 Q807 241 830 221 Z') +
  ring('M113 191 Q235 162 381 193 Q404 199 414 219 L427 250 Q480 219 533 250 L546 219 Q556 199 579 193 Q725 162 847 191 L832 233 Q813 240 806 265 L784 335 Q777 365 741 370 L590 370 Q558 369 548 337 L523 267 Q480 243 437 267 L412 337 Q402 369 370 370 L219 370 Q183 365 176 335 L154 265 Q147 240 128 233 Z M177 213 Q272 197 371 217 Q385 220 389 235 L406 278 L389 329 Q384 346 365 347 L222 347 Q202 345 197 326 L174 246 Q170 229 177 213 Z M783 213 Q688 197 589 217 Q575 220 571 235 L554 278 L571 329 Q576 346 595 347 L738 347 Q758 345 763 326 L786 246 Q790 229 783 213 Z M151 210 A6 6 0 1 0 139 210 A6 6 0 1 0 151 210 Z M821 210 A6 6 0 1 0 809 210 A6 6 0 1 0 821 210 Z');

// Both temples start at the upper outer corners, before the rims are drawn.
// The rear bridge is 20.5 px thick at its center, matching the front bridge.
const back =
  filled('left-temple', 'M194 165 L224 171 Q194 236 177 316 L145 431 Q140 450 126 448 Q112 446 117 426 L146 307 Q161 226 194 165 Z') +
  filled('right-temple', 'M766 165 L736 171 Q766 236 783 316 L815 431 Q820 450 834 448 Q848 446 843 426 L814 307 Q799 226 766 165 Z') +
  ring('M195 166 Q283 144 386 166 Q413 171 423 199 L439 238 Q480 212 521 238 L537 199 Q547 171 574 166 Q677 144 765 166 L745 215 L723 284 Q717 308 691 310 L587 310 Q560 309 552 283 L530 258 Q480 233 430 258 L408 283 Q400 309 373 310 L269 310 Q243 308 237 284 L215 215 Z M235 183 Q308 173 378 187 Q391 189 397 207 L412 243 L390 279 Q386 288 372 289 L272 289 Q259 288 255 272 L234 211 Q228 193 235 183 Z M725 183 Q652 173 582 187 Q569 189 563 207 L548 243 L570 279 Q574 288 588 289 L688 289 Q701 288 705 272 L726 211 Q732 193 725 183 Z');

// Wearer's left side: the front of the glasses points left. Both temples are surfaces.
const leftSide =
  filled('far-temple', 'M177 202 Q207 159 245 159 L626 172 Q658 173 682 201 L774 276 Q786 287 776 297 Q765 305 754 293 L657 220 Q646 207 624 206 L244 191 Q218 190 196 224 Z') +
  ring('M193 204 L178 345 Q176 368 160 379 L140 230 Q138 204 156 195 Q171 189 193 204 Z M160 219 Q153 221 155 236 L168 338 L177 218 Z') +
  filled('near-temple', 'M185 215 L659 221 Q718 224 741 265 L803 366 Q814 384 801 391 Q786 399 775 380 L711 292 Q697 273 667 272 L183 263 Z');
const rightSide = `<g transform="translate(960 0) scale(-1 1)">${leftSide}</g>`;
const views = {front, back, 'left-side': leftSide, 'right-side': rightSide};
const svg = body => `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="600" viewBox="0 0 960 600"><g opacity="0.55">${body}</g></svg>`;

async function main() {
  const manifest = {
    name: 'Smart glasses capture guides', version: 3,
    canvas: {width: 960, height: 600}, background: 'transparent', opacityBakedIn: 0.55,
    usage: 'Use at opacity 1. Opacity 0.55 is baked in. Fit with object-fit: contain.',
    sideConvention: 'Left and right refer to the wearer. Left-side points left; right-side points right. These generic guides are mirrored.',
    views: {}, legacyAliases: {'side': 'left-side'}
  };
  for (const [name, body] of Object.entries(views)) {
    const markup = svg(body);
    fs.writeFileSync(path.join(root, `assets/glasses-${name}.svg`), markup);
    await sharp(Buffer.from(markup)).png().toFile(path.join(root, `assets/glasses-${name}.png`));
    manifest.views[name] = {png: `${remote}/assets/glasses-${name}.png`, svg: `${remote}/assets/glasses-${name}.svg`};
  }
  // Keep existing integrations working, while documenting the explicit side names.
  for (const ext of ['svg', 'png']) fs.copyFileSync(path.join(root, `assets/glasses-left-side.${ext}`), path.join(root, `assets/glasses-side.${ext}`));
  const preview = `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="1020"><rect width="1440" height="1020" fill="#18232d"/><text x="50" y="55" fill="#eff4f7" font-size="26" font-family="Arial,sans-serif">SMART GLASSES / CAPTURE GUIDES v3</text>${Object.entries(views).map(([name, body], i) => {
    const x = 30 + (i % 2) * 705, y = 90 + Math.floor(i / 2) * 455;
    return `<rect x="${x}" y="${y}" width="675" height="380" rx="24" fill="#2c3b48"/><g transform="translate(${x},${y-15}) scale(0.703125)" opacity="0.55">${body}</g><text x="${x+337.5}" y="${y+418}" text-anchor="middle" fill="#b7c8d7" font-size="21" font-family="Arial,sans-serif">${name.toUpperCase().replace('-', ' ')}</text>`;
  }).join('')}</svg>`;
  await sharp(Buffer.from(preview)).png().toFile(path.join(root, 'preview.png'));
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  for (const name of Object.keys(views)) {
    const result = await sharp(path.join(root, `assets/glasses-${name}.png`)).stats();
    console.log(name, 'alpha:', result.channels[3].min, result.channels[3].max);
  }
}
main().catch(err => {console.error(err); process.exit(1);});
