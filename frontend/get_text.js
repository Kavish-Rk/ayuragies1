import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
  const html = await page.evaluate(() => document.body.innerText);
  console.log('TEXT:', html.substring(0, 500));
  
  await browser.close();
})();
