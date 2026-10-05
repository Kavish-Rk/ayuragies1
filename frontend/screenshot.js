import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
  
  await page.screenshot({ path: 'screenshot.png' });
  await browser.close();
})();
