#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { buildSync } = require('esbuild');
const { chromium } = require('playwright');
(async () => {
  const bundle = buildSync({ entryPoints: ['src/rendering/preview/pngPreview.ts'], bundle: true,
    format: 'iife', globalName: 'NotemdPng', write: false }).outputFiles[0].text;
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.addScriptTag({ content: bundle });
    const receipt = await page.evaluate(async () => {
      const samples = [
        { width: 2700, height: 90, ppi: 300, viewBox: '10 -20 1350 45', aspect: 'none' },
        { width: 100, height: 2700, ppi: 300, viewBox: '-10 30 50 1350', aspect: 'xMaxYMin slice' },
        { width: 1320, height: 80, ppi: 600, viewBox: '10 -20 660 40', aspect: 'xMidYMid meet' }
      ];
      const receipts = [];
      const load = async url => { const image = new Image(); await new Promise((ok, fail) => {image.onload=ok;image.onerror=fail;image.src=url;}); return image; };
      for (const sample of samples) {
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="'+sample.width+'" height="'+sample.height+'" viewBox="'+sample.viewBox+'" preserveAspectRatio="'+sample.aspect+'"><defs><pattern id="grid" width="13" height="17" patternUnits="userSpaceOnUse"><rect width="7" height="11" fill="#437aad"/></pattern></defs><rect x="-20" y="-30" width="3000" height="3000" fill="url(#grid)"/><path d="M 0 0 L 1300 1300" stroke="red" stroke-width="3"/><text x="40" y="12" font-size="20">中文关系 label</text><rect x="20%" y="25%" width="5%" height="5%" fill="#0f0"/></svg>';
        const result = await NotemdPng.rasterizeSvgToImageArrayBuffer(svg, undefined, {ppi:sample.ppi});
        const canvas = document.createElement('canvas'); canvas.width=result.imageWidthPx; canvas.height=result.imageHeightPx;
        const ctx=canvas.getContext('2d'); ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);
        const sourceUrl=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));
        const source=await load(sourceUrl);ctx.save();ctx.scale(sample.ppi/96,sample.ppi/96);ctx.drawImage(source,0,0,sample.width,sample.height);ctx.restore();
        const expected=ctx.getImageData(0,0,canvas.width,canvas.height).data;
        const pngUrl=URL.createObjectURL(new Blob([result.data],{type:'image/png'}));const png=await load(pngUrl);
        ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(png,0,0);
        const actual=ctx.getImageData(0,0,canvas.width,canvas.height).data;
        let changed=0,maxDifference=0,totalDifference=0,interiorMax=0,interiorTotal=0;
        for(let i=0;i<actual.length;i++){
          const delta=Math.abs(actual[i]-expected[i]);if(delta)changed++;maxDifference=Math.max(maxDifference,delta);totalDifference+=delta;
          const x=Math.floor(i/4)%canvas.width,y=Math.floor(i/4/canvas.width);
          // A fractional final CSS pixel clips differently in nested SVG and
          // drawImage. All interior pixels, including tile seams, must match.
          if(x<canvas.width-1&&y<canvas.height-1){interiorMax=Math.max(interiorMax,delta);interiorTotal+=delta;}
        }
        URL.revokeObjectURL(sourceUrl);URL.revokeObjectURL(pngUrl);canvas.width=0;canvas.height=0;
        receipts.push({ppi:result.ppi,width:png.width,height:png.height,changed,maxDifference,meanDifference:totalDifference/actual.length,bytes:result.data.byteLength,interiorMax,interiorMean:interiorTotal/actual.length});
      }
      return receipts;
    });
    for(const row of receipt){assert(row.ppi>=72);assert(row.interiorMax<=2,JSON.stringify(row));assert(row.interiorMean<0.001,JSON.stringify(row));}
    const dir=path.resolve('.cache/diagram-png-streaming');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'pixel-comparison.json'),JSON.stringify(receipt,null,2));
    console.log(JSON.stringify(receipt));
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
