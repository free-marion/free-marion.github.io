const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    viewport: { width: 816, height: 1056 },
  });
  const page = await context.newPage();

  const filePath = path.resolve(__dirname, 'flyer-patriot250.html');
  await page.goto('file://' + filePath, { waitUntil: 'networkidle' });

  await page.waitForTimeout(2000);

  await page.screenshot({
    path: 'flyer-patriot250.jpg',
    type: 'jpeg',
    quality: 95,
  });

  await browser.close();
  console.log('JPEG saved: flyer-patriot250.jpg');
})();
