import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle0' });
  
  const el = await page.evaluate(() => {
    const element = document.querySelector('div > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(3)');
    return element ? element.outerHTML.substring(0, 500) : 'Not found';
  });
  console.log('Result:', el);
  
  await browser.close();
})();
