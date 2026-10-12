import puppeteer from 'puppeteer';

(async () => {
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    const selector = 'div#root:nth-of-type(1) > div:nth-of-type(1) > main:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(3)';
    
    const routes = [
      'http://127.0.0.1:3000/orders/123',
      'http://127.0.0.1:3000/product/prod_123',
      'http://127.0.0.1:3000/shop',
      'http://127.0.0.1:3000/'
    ];
    
    for (const url of routes) {
      await page.goto(url, { waitUntil: 'networkidle2' });
      let el = await page.evaluate((sel) => {
        const element = document.querySelector(sel);
        if (!element) return null;
        return {
          id: element.id,
          className: element.className,
          html: element.outerHTML.substring(0, 300)
        };
      }, selector);
      if (el) {
        console.log(`Found on ${url}:`, JSON.stringify(el, null, 2));
        break;
      } else {
        console.log(`Not found on ${url}`);
      }
    }

    await browser.close();
  } catch (e) {
    console.error(e);
  }
})();
