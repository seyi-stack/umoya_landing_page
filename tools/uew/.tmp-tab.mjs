import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:'shell', args:['--no-sandbox'] });
for (const [label,url] of [['raw','http://localhost:8765/uew-home-hero-raw/'],['widget','http://localhost:8765/uew-home-hero/']]) {
  const p = await b.newPage();
  await p.setViewport({width:768,height:1024});
  await p.setRequestInterception(true);
  p.on('request', r => {
    const u = r.url();
    if (u.startsWith('http://localhost:') || u.startsWith('data:')) return r.continue();
    return r.abort();
  });
  await p.goto(url,{waitUntil:'domcontentloaded'});
  await p.waitForSelector('#umoya-hero',{timeout:20000});
  await p.evaluate(()=>document.fonts.ready);
  await new Promise(r=>setTimeout(r,1500));
  const info = await p.evaluate(()=>{
    const el = document.querySelector('#umoya-hero .sub') || document.querySelector('#umoya-hero h2');
    const out=[]; let n=el;
    while(n && n!==document.documentElement){ const r=n.getBoundingClientRect(); const cs=getComputedStyle(n);
      out.push(`${n.tagName.toLowerCase()}${n.id?'#'+n.id:''}${typeof n.className==='string'&&n.className?'.'+n.className.trim().split(/\s+/).slice(0,3).join('.'):''} w=${r.width.toFixed(1)} x=${r.left.toFixed(1)} pad=${cs.paddingLeft}/${cs.paddingRight} mx=${cs.marginLeft}/${cs.marginRight} maxw=${cs.maxWidth} box=${cs.boxSizing}`); n=n.parentElement; }
    return { chain: out, scrollW: document.documentElement.clientWidth, bodyW: document.body.getBoundingClientRect().width };
  });
  console.log('=== '+label+' === clientWidth='+info.scrollW+' bodyW='+info.bodyW.toFixed(1));
  info.chain.forEach(l=>console.log('   '+l));
  await p.close();
}
await b.close();
