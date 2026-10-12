import puppeteer from 'puppeteer';

(async () => {
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:3000/account', { waitUntil: 'domcontentloaded' }); // Or whatever page it might be. Let's try root and account
    await new Promise(r => setTimeout(r, 2000));
    
    const selector = 'div#root:nth-of-type(1) > div:nth-of-type(1) > main:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(3)';
    
    let el = await page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (!element) return 'NOT_FOUND';
      return {
        path: sel,
        html: element.outerHTML.substring(0, 500)
      };
    }, selector);
    console.log('Result on /account:', JSON.stringify(el, null, 2));

    await browser.close();
  } catch (e) {
    console.error(e);
  }
})();
