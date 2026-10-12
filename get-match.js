import puppeteer from 'puppeteer';

(async () => {
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:3000', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));
    
    const el = await page.evaluate(() => {
      const element = document.querySelector('div > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(3)');
      if (!element) return 'NOT_FOUND';
      
      let current = element;
      let path = [];
      while(current && current.tagName !== 'BODY') {
        path.unshift(current.tagName + (current.id ? '#' + current.id : '') + (current.className ? '.' + current.className.split(' ').join('.') : ''));
        current = current.parentElement;
      }
      return {
        path: path.join(' > '),
        html: element.outerHTML.substring(0, 300)
      };
    });
    console.log('Result:', JSON.stringify(el, null, 2));
    
    await browser.close();
  } catch (e) {
    console.error(e);
  }
})();
