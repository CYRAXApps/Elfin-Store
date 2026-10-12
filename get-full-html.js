import puppeteer from 'puppeteer';

(async () => {
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:3000', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 3000));
    
    const html = await page.evaluate(() => document.body.innerHTML.substring(0, 5000));
    console.log(html);
    
    await browser.close();
  } catch (e) {
    console.error(e);
  }
})();
