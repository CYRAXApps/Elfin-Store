import puppeteer from 'puppeteer';

(async () => {
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:3000', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));
    
    // Check if we need to click "Shop" or "Account" to see the matches
    // But let's first check on the Home page
    const matches = await page.evaluate(() => {
      const elements = document.querySelectorAll('div > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(3)');
      let res = [];
      for (const element of elements) {
        let current = element;
        let path = [];
        while(current && current.tagName !== 'BODY') {
          path.unshift(current.tagName + (current.id ? '#' + current.id : '') + (current.className ? '.' + current.className.split(' ').join('.') : ''));
          current = current.parentElement;
        }
        res.push({
          path: path.join(' > '),
          html: element.outerHTML.substring(0, 300)
        });
      }
      return res;
    });
    console.log('Result on Home:', JSON.stringify(matches, null, 2));
    
    // Now let's try going to Account page
    await page.goto('http://127.0.0.1:3000/account', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));
    const matchesAccount = await page.evaluate(() => {
      const elements = document.querySelectorAll('div > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(3)');
      let res = [];
      for (const element of elements) {
        let current = element;
        let path = [];
        while(current && current.tagName !== 'BODY') {
          path.unshift(current.tagName + (current.id ? '#' + current.id : '') + (current.className ? '.' + current.className.split(' ').join('.') : ''));
          current = current.parentElement;
        }
        res.push({
          path: path.join(' > '),
          html: element.outerHTML.substring(0, 300)
        });
      }
      return res;
    });
    console.log('Result on Account:', JSON.stringify(matchesAccount, null, 2));
    
    await browser.close();
  } catch (e) {
    console.error(e);
  }
})();
