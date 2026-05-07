const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const filePath = path.resolve(__dirname, 'flyer-patriot250.html');
  await page.goto('file://' + filePath, { waitUntil: 'networkidle' });

  // Wait for fonts
  await page.waitForTimeout(2000);

  await page.pdf({
    path: 'flyer-patriot250.pdf',
    width:  '8.5in',
    height: '11in',
    printBackground: true,
    margin: { top: 0, bottom: 0, left: 0, right: 0 },
  });

  await browser.close();
  console.log('PDF saved: flyer-patriot250.pdf');
})();
