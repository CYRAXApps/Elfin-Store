import puppeteer from 'puppeteer';

(async () => {
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:3000', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 3000));
    
    const el = await page.evaluate(() => {
      const element = document.querySelector('div > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(3)');
      if (!element) return 'NOT_FOUND';
      
      return {
        elClass: element.className,
        elId: element.id,
        elTag: element.tagName,
        parentTag: element.parentElement?.tagName,
        parentClass: element.parentElement?.className,
        html: element.outerHTML.substring(0, 300)
      };
    });
    console.log('Result:', JSON.stringify(el, null, 2));
    
    await browser.close();
  } catch (e) {
    console.error(e);
  }
})();
