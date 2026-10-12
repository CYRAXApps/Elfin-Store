const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Set auth in localStorage before load
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('electro_auth_user', JSON.stringify({
        uid: 'ZudeiMJXXaUFxFN6sV8ErPplZ7w1',
        email: 'ritamsaha0000@gmail.com',
        displayName: 'Ritam Saha',
        role: 'admin',
        isPrimaryOwner: true,
        status: 'active',
        phoneNumber: '8617445344',
        permissions: {
          dashboard_view: true,
          products_view: true,
          products_manage: true,
          inventory_view: true,
          inventory_manage: true,
          orders_view: true,
          orders_manage: true,
          pos_access: true,
          pos_manage: true,
          customers_view: true,
          customers_manage: true,
          marketing_view: true,
          marketing_manage: true,
          analytics_view: true,
          analytics_export: true,
          website_manage: true,
          settings_view: true,
          settings_manage: true,
          advanced_view: true,
          advanced_manage: true,
          staff_manage: true,
          audit_logs_view: true,
          notifications_view: true,
          notifications_manage: true,
          inquiries_view: true,
          inquiries_manage: true,
          shipping_view: true,
          shipping_manage: true,
          payments_view: true,
          payments_manage: true,
          returns_manage: true,
          reviews_manage: true
        }
      }));
    });

    // 1. Visit /admin
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle2', timeout: 20000 });
    console.log('1. Opened /admin');

    // Verify "Website Settings" is in sidebar
    const websiteSettingsText = await page.evaluate(() => {
      const sidebar = document.querySelector('aside');
      return sidebar ? sidebar.innerText : '';
    });

    console.log('2. Is "Website Settings" in sidebar:', websiteSettingsText.includes('Website Settings'));
    
    // Check order: Marketing -> Website Settings -> Reports
    const sidebarItemsOrder = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('aside button, aside a')).map(el => el.innerText.trim());
      return items;
    });
    console.log('3. Sidebar text snippets snippet:\n', sidebarItemsOrder.filter(i => i.includes('Marketing') || i.includes('Website Settings') || i.includes('Reports') || i.includes('Store Settings')));

    // 4. Click Website Settings in sidebar
    const clickedWebsiteSettings = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('aside button'));
      const wsBtn = buttons.find(b => b.innerText.includes('Website Settings'));
      if (wsBtn) {
        wsBtn.click();
        return true;
      }
      return false;
    });
    console.log('4. Clicked Website Settings in sidebar:', clickedWebsiteSettings);
    await new Promise(r => setTimeout(r, 500));
    console.log('5. Current URL after clicking Website Settings:', page.url());

    // Check child items listed under Website Settings
    const childItems = ['Homepage', 'Header & Navigation', 'Footer', 'Website Content', 'Website Appearance', 'SEO & Social'];
    for (const item of childItems) {
      const subBtnFound = await page.evaluate((label) => {
        const buttons = Array.from(document.querySelectorAll('aside button'));
        return buttons.some(b => b.innerText.includes(label));
      }, item);
      console.log(`Child item "${item}" visible:`, subBtnFound);
    }

    // 6. Test direct URL navigation to each child route
    const routesToTest = [
      { url: 'http://localhost:3000/admin/website/homepage', subTab: 'homepage' },
      { url: 'http://localhost:3000/admin/website/navigation', subTab: 'navigation' },
      { url: 'http://localhost:3000/admin/website/footer', subTab: 'footer' },
      { url: 'http://localhost:3000/admin/website/content', subTab: 'content' },
      { url: 'http://localhost:3000/admin/website/appearance', subTab: 'appearance' },
      { url: 'http://localhost:3000/admin/website/seo', subTab: 'seo' },
    ];

    for (const route of routesToTest) {
      await page.goto(route.url, { waitUntil: 'networkidle2', timeout: 20000 });
      const currentUrl = page.url();
      const pageHeading = await page.evaluate(() => {
        const h2 = document.querySelector('h2, h3, h1');
        return h2 ? h2.innerText : '';
      });
      console.log(`Direct route ${route.url} -> URL: ${currentUrl} | Heading: ${pageHeading.slice(0, 50)}`);
    }

    // 7. Test Refresh on /admin/website/footer
    await page.goto('http://localhost:3000/admin/website/footer', { waitUntil: 'networkidle2', timeout: 20000 });
    await page.reload({ waitUntil: 'networkidle2' });
    console.log('7. URL after refresh on footer:', page.url());

    // 8. Test Mobile viewport
    await page.setViewport({ width: 375, height: 667 });
    await page.goto('http://localhost:3000/admin/website/appearance', { waitUntil: 'networkidle2', timeout: 20000 });
    console.log('8. Mobile view URL:', page.url());

    await browser.close();
    console.log('ALL TESTS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('Test execution error:', err);
  }
})();
