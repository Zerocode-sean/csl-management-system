/**
 * CSL Management System - Frontend Integration Test
 * Tests the frontend UI and its integration with the backend API
 */

const puppeteer = require('puppeteer');
const axios = require('axios');

const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:5000/api/v1';

// Test credentials
const TEST_ADMIN = {
  email: 'admin@csl.com',
  password: 'Admin@2025'
};

// Helper functions
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const log = {
  info: (msg) => console.log(`\nℹ [${new Date().toISOString()}] ${msg}`),
  success: (msg) => console.log(`✓ [${new Date().toISOString()}] ${msg}`),
  error: (msg) => console.log(`✗ [${new Date().toISOString()}] ${msg}`),
  action: (msg) => console.log(`→ [${new Date().toISOString()}] ${msg}`),
  warn: (msg) => console.log(`⚠ [${new Date().toISOString()}] ${msg}`)
};

// Test counters
let testsPassed = 0;
let testsFailed = 0;
const testResults = [];

function testResult(name, passed, message = '') {
  if (passed) {
    testsPassed++;
    testResults.push({ name, status: 'PASSED', message });
    log.success(`${name} - PASSED ${message ? '(' + message + ')' : ''}`);
  } else {
    testsFailed++;
    testResults.push({ name, status: 'FAILED', message });
    log.error(`${name} - FAILED ${message ? '(' + message + ')' : ''}`);
  }
}

async function testFrontendIntegration() {
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                              ║');
  console.log('║          CSL MANAGEMENT SYSTEM - FRONTEND INTEGRATION TEST                   ║');
  console.log('║                                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

  let browser;
  let page;

  try {
    // Launch browser
    log.info('Launching browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Enable console logging from the page
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser Console Error:', msg.text());
      }
    });

    // Test 1: Check if frontend is accessible
    console.log('\n' + '='.repeat(80));
    console.log('1. FRONTEND ACCESSIBILITY TEST');
    console.log('='.repeat(80));
    
    log.action('Navigating to frontend URL...');
    try {
      await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2', timeout: 30000 });
      const title = await page.title();
      testResult('Frontend Accessibility', true, `Page loaded: ${title}`);
    } catch (error) {
      testResult('Frontend Accessibility', false, `Failed to load: ${error.message}`);
      throw error;
    }

    // Test 2: Login page functionality
    console.log('\n' + '='.repeat(80));
    console.log('2. LOGIN PAGE TEST');
    console.log('='.repeat(80));

    log.action('Checking for login form...');
    await sleep(2000);
    
    // Check if we're on login page or redirected there
    const currentUrl = page.url();
    log.info(`Current URL: ${currentUrl}`);
    
    const hasLoginForm = await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"], input[name="email"]');
      const passwordInput = document.querySelector('input[type="password"], input[name="password"]');
      const loginButton = document.querySelector('button[type="submit"]');
      return !!(emailInput && passwordInput && loginButton);
    });

    testResult('Login Page Elements', hasLoginForm, 'Login form found');

    if (hasLoginForm) {
      // Test 3: Login functionality
      console.log('\n' + '='.repeat(80));
      console.log('3. LOGIN AUTHENTICATION TEST');
      console.log('='.repeat(80));

      log.action('Attempting to login...');
      
      // Fill in login form
      await page.type('input[type="email"], input[name="email"]', TEST_ADMIN.email);
      await page.type('input[type="password"], input[name="password"]', TEST_ADMIN.password);
      
      // Click login button and wait for navigation
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
        page.click('button[type="submit"]')
      ]);

      await sleep(2000);
      
      const loginUrl = page.url();
      const loginSuccess = !loginUrl.includes('/login') && !loginUrl.includes('/auth');
      testResult('Login Authentication', loginSuccess, `Redirected to: ${loginUrl}`);

      if (loginSuccess) {
        // Test 4: Dashboard page
        console.log('\n' + '='.repeat(80));
        console.log('4. DASHBOARD PAGE TEST');
        console.log('='.repeat(80));

        log.action('Checking dashboard elements...');
        await sleep(2000);

        const dashboardElements = await page.evaluate(() => {
          const sidebar = document.querySelector('[role="navigation"], nav, .sidebar');
          const header = document.querySelector('header, .header');
          const mainContent = document.querySelector('main, .main-content');
          return {
            hasSidebar: !!sidebar,
            hasHeader: !!header,
            hasMainContent: !!mainContent
          };
        });

        testResult('Dashboard Layout', 
          dashboardElements.hasSidebar && dashboardElements.hasHeader && dashboardElements.hasMainContent,
          `Sidebar: ${dashboardElements.hasSidebar}, Header: ${dashboardElements.hasHeader}, Main: ${dashboardElements.hasMainContent}`
        );

        // Test 5: Navigation to Students page
        console.log('\n' + '='.repeat(80));
        console.log('5. STUDENTS PAGE NAVIGATION TEST');
        console.log('='.repeat(80));

        log.action('Navigating to Students page...');
        
        // Try to find and click students link
        const studentsLinkClicked = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a'));
          const studentsLink = links.find(link => 
            link.textContent.toLowerCase().includes('student') ||
            link.href.includes('/students')
          );
          if (studentsLink) {
            studentsLink.click();
            return true;
          }
          return false;
        });

        if (studentsLinkClicked) {
          await sleep(3000);
          const studentsUrl = page.url();
          testResult('Students Page Navigation', studentsUrl.includes('/students'), `URL: ${studentsUrl}`);

          // Check for students page elements
          const studentsPageElements = await page.evaluate(() => {
            const table = document.querySelector('table');
            const addButton = Array.from(document.querySelectorAll('button')).find(btn => 
              btn.textContent.toLowerCase().includes('add') || 
              btn.textContent.toLowerCase().includes('new')
            );
            const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]');
            return {
              hasTable: !!table,
              hasAddButton: !!addButton,
              hasSearch: !!searchInput
            };
          });

          testResult('Students Page Elements',
            studentsPageElements.hasTable || studentsPageElements.hasAddButton,
            `Table: ${studentsPageElements.hasTable}, Add Button: ${studentsPageElements.hasAddButton}, Search: ${studentsPageElements.hasSearch}`
          );
        } else {
          testResult('Students Page Navigation', false, 'Students link not found');
        }

        // Test 6: Navigation to Courses page
        console.log('\n' + '='.repeat(80));
        console.log('6. COURSES PAGE NAVIGATION TEST');
        console.log('='.repeat(80));

        log.action('Navigating to Courses page...');
        
        const coursesLinkClicked = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a'));
          const coursesLink = links.find(link => 
            link.textContent.toLowerCase().includes('course') ||
            link.href.includes('/courses')
          );
          if (coursesLink) {
            coursesLink.click();
            return true;
          }
          return false;
        });

        if (coursesLinkClicked) {
          await sleep(3000);
          const coursesUrl = page.url();
          testResult('Courses Page Navigation', coursesUrl.includes('/courses'), `URL: ${coursesUrl}`);

          const coursesPageElements = await page.evaluate(() => {
            const table = document.querySelector('table');
            const addButton = Array.from(document.querySelectorAll('button')).find(btn => 
              btn.textContent.toLowerCase().includes('add') || 
              btn.textContent.toLowerCase().includes('new')
            );
            return {
              hasTable: !!table,
              hasAddButton: !!addButton
            };
          });

          testResult('Courses Page Elements',
            coursesPageElements.hasTable || coursesPageElements.hasAddButton,
            `Table: ${coursesPageElements.hasTable}, Add Button: ${coursesPageElements.hasAddButton}`
          );
        } else {
          testResult('Courses Page Navigation', false, 'Courses link not found');
        }

        // Test 7: Navigation to Certificates page
        console.log('\n' + '='.repeat(80));
        console.log('7. CERTIFICATES PAGE NAVIGATION TEST');
        console.log('='.repeat(80));

        log.action('Navigating to Certificates page...');
        
        const certificatesLinkClicked = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a'));
          const certificatesLink = links.find(link => 
            link.textContent.toLowerCase().includes('certificate') ||
            link.href.includes('/certificates')
          );
          if (certificatesLink) {
            certificatesLink.click();
            return true;
          }
          return false;
        });

        if (certificatesLinkClicked) {
          await sleep(3000);
          const certificatesUrl = page.url();
          testResult('Certificates Page Navigation', certificatesUrl.includes('/certificates'), `URL: ${certificatesUrl}`);

          const certificatesPageElements = await page.evaluate(() => {
            const content = document.querySelector('main, .main-content');
            const hasContent = !!content && content.textContent.length > 0;
            return { hasContent };
          });

          testResult('Certificates Page Elements', certificatesPageElements.hasContent, 'Page has content');
        } else {
          testResult('Certificates Page Navigation', false, 'Certificates link not found');
        }

        // Test 8: Check if API calls are working
        console.log('\n' + '='.repeat(80));
        console.log('8. BACKEND API INTEGRATION TEST');
        console.log('='.repeat(80));

        log.action('Testing API connectivity from frontend...');
        
        // Intercept network requests
        await page.setRequestInterception(true);
        let apiCallsMade = [];
        
        page.on('request', request => {
          if (request.url().includes('/api/')) {
            apiCallsMade.push({
              url: request.url(),
              method: request.method()
            });
          }
          request.continue();
        });

        // Navigate to students page to trigger API calls
        await page.goto(`${FRONTEND_URL}/students`, { waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
        await sleep(3000);

        testResult('API Calls from Frontend',
          apiCallsMade.length > 0,
          `${apiCallsMade.length} API calls detected`
        );

        if (apiCallsMade.length > 0) {
          log.info(`API calls made: ${apiCallsMade.map(c => `${c.method} ${c.url}`).join(', ')}`);
        }

        // Test 9: Check for console errors
        console.log('\n' + '='.repeat(80));
        console.log('9. BROWSER CONSOLE ERRORS TEST');
        console.log('='.repeat(80));

        const consoleErrors = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        });

        await page.reload({ waitUntil: 'networkidle2' });
        await sleep(2000);

        testResult('No Console Errors',
          consoleErrors.length === 0,
          consoleErrors.length > 0 ? `${consoleErrors.length} errors found` : 'No errors'
        );

        if (consoleErrors.length > 0) {
          log.warn(`Console errors: ${consoleErrors.slice(0, 3).join(', ')}`);
        }
      }
    }

  } catch (error) {
    log.error(`Test suite error: ${error.message}`);
    console.error(error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  console.log('\n');

  testResults.forEach((result, index) => {
    const status = result.status === 'PASSED' ? '✓' : '✗';
    console.log(`${index + 1}. ${result.name.padEnd(40)} ${status} ${result.status}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log(`Total Tests: ${testsPassed + testsFailed}`);
  console.log(`Passed: ${testsPassed}`);
  console.log(`Failed: ${testsFailed}`);
  console.log(`Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(2)}%`);
  console.log('='.repeat(80));

  if (testsFailed === 0) {
    console.log('\n🎉 ALL FRONTEND TESTS PASSED! 🎉\n');
  } else {
    console.log('\n⚠️  SOME FRONTEND TESTS FAILED - Please review the logs above\n');
  }
}

// Run the tests
testFrontendIntegration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
