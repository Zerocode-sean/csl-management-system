/**
 * Simple Frontend Check - Takes screenshot and checks basic accessibility
 */

const puppeteer = require('puppeteer');

async function checkFrontend() {
  let browser;
  try {
    console.log('Launching browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer'
      ]
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Capture console messages
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
    });
    
    // Capture page errors
    const pageErrors = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });
    
    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });
    
    console.log('Page loaded! Waiting for content...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Take screenshot
    await page.screenshot({ path: 'frontend-screenshot.png', fullPage: true });
    console.log('✓ Screenshot saved to frontend-screenshot.png');
    
    // Get page info
    const info = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        bodyText: document.body.innerText.substring(0, 500),
        hasReact: !!window.React || !!document.querySelector('[data-reactroot]') || !!document.querySelector('#root'),
        rootContent: document.querySelector('#root')?.innerHTML?.substring(0, 300)
      };
    });
    
    console.log('\n=== Frontend Info ===');
    console.log('Title:', info.title);
    console.log('URL:', info.url);
    console.log('Has React:', info.hasReact);
    console.log('\nBody text preview:', info.bodyText);
    console.log('\nRoot content preview:', info.rootContent);
    
    console.log('\n=== Console Messages ===');
    consoleMessages.forEach((msg, i) => {
      console.log(`[${msg.type}] ${msg.text}`);
    });
    
    console.log('\n=== Page Errors ===');
    if (pageErrors.length === 0) {
      console.log('No page errors');
    } else {
      pageErrors.forEach((err, i) => {
        console.log(`Error ${i + 1}:`, err);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

checkFrontend();
