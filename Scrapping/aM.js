const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const { executablePath } = require('puppeteer');

// Add stealth plugin
puppeteer.use(StealthPlugin());

// Anti-blocking configurations
const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
];

const randomDelay = (min, max) =>
    new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min));

async function scrapeProductDetails(page, productUrl) {
    try {
        await page.goto(productUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        // await randomDelay(2000, 5000);

        return await page.evaluate(() => {
            const details = {};

            // Technical Details
            const techRows = Array.from(document.querySelectorAll('#productDetails_techSpec_section_1 tr, #productDetails_db_sections tr, #technicalSpecifications_section_1 tr'));
            techRows.forEach(row => {
                const key = row.querySelector('th')?.textContent.trim();
                const value = row.querySelector('td')?.textContent.trim().replace(/\u200E/g, '');
                if (key && value) details[key] = value;
            });

            // Additional Details - try to find more specific details for laptops
            try {
                // Product name
                const productName = document.querySelector('#productTitle')?.textContent.trim();
                if (productName) details['Product Name'] = productName;

                // Description
                const description = document.querySelector('#productDescription p')?.textContent.trim();
                if (description) details['Description'] = description;

                // Features
                const features = Array.from(document.querySelectorAll('#feature-bullets li'))
                    .map(li => li.textContent.trim())
                    .filter(text => text && !text.includes('›'));
                if (features.length > 0) details['Features'] = features;
            } catch (e) {
                console.log('Error getting additional details');
            }

            // Image Links - try multiple approaches
            const imageLinks = new Set();

            // Method 3: All thumbnails
            try {
                document.querySelectorAll('#altImages img, .item.imageThumbnail img').forEach(img => {
                    if (img.src && img.src.includes('images/I/')) {
                        const match = img.src.match(/images\/I\/([^.]+)/);
                        if (match && match[1]) {
                            imageLinks.add(`https://m.media-amazon.com/images/I/${match[1]}._SL1500_.jpg`);
                        }
                    }
                });
            } catch (e) { }

            details.imageLinks = Array.from(imageLinks);
            return details;
        });
    } catch (error) {
        console.error(`Error scraping ${productUrl}:`, error.message);
        return { error: error.message, imageLinks: [] };
    }
}

async function scrapeAmazon() {
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: executablePath(),
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    await page.setJavaScriptEnabled(true);
    await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 1 });

    // Initial product listing scrape
    const products = [];
    try {
        // Start with the deals page (more natural browsing pattern)
        const dealsUrl = 'https://www.amazon.in/deals';
        console.log(`First navigating to ${dealsUrl}...`);
        await page.goto(dealsUrl, { waitUntil: 'networkidle2', timeout: 6000 });
        await randomDelay(30, 60);

        // Handle cookies if present on deals page
        const cookiesButton = await page.$('#sp-cc-accept');
        if (cookiesButton) {
            await cookiesButton.click();
            await randomDelay(10, 20);
        }

        // Simulate user browsing behavior on deals page
        await page.evaluate(() => {
            window.scrollBy(0, 500);
        });


        // Fix the malformed URL (remove the duplicate part after quotation mark)
        const laptopUrl = 'https://www.amazon.in/s?i=computers&rh=n%3A1375424031%2Cp_123%3A110955%257C219979%257C240067%257C241862%257C247341%257C308445%257C378555%257C391242&dc&qid=1746464279&rnid=91049095031&xpid=8-y8VezqgPhL7&ref=sr_pg_1';
        console.log(`Now navigating to laptop listings: ${laptopUrl}...`);
        await page.goto(laptopUrl, { waitUntil: 'networkidle2', timeout: 6000 });
        await randomDelay(20, 40);

        // Save screenshot to see what's on the page
        // await page.screenshot({ path: 'amazon-debug.png' });
        // console.log('Debug screenshot saved to amazon-debug.png');

        let pageCount = 1;
        const maxPages = 1; // Limit to 3 pages for testing

        while (pageCount <= maxPages) {
            console.log(`Scraping page ${pageCount}...`);

            // Extract products from current page
            const pageProducts = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('.s-result-item[data-component-type="s-search-result"]'))
                    .map(card => {
                        const title = card.querySelector('h2')?.textContent.trim();
                        const price = card.querySelector('.a-price .a-offscreen')?.textContent;
                        const asin = card.getAttribute('data-asin');

                        return {
                            title,
                            price,
                            asin,
                            url: asin ? `https://www.amazon.in/dp/${asin}/` : null
                        };
                    })
                    .filter(p => p.asin && p.title && p.title.toLowerCase().includes('laptop'));
            });

            console.log(`Found ${pageProducts.length} laptop products on page ${pageCount}`);
            products.push(...pageProducts);

            // Break if we've reached max pages
            if (pageCount >= maxPages) break;

            // Check for pagination using multiple selector approaches
            try {
                // First check if pagination exists at all
                const hasPagination = await page.evaluate(() => {
                    return document.querySelector('.s-pagination-container, .a-pagination') !== null;
                });

                if (!hasPagination) {
                    console.log('No pagination found. Only one page of results available.');
                    break;
                }

                // Check if there's a "Next" button that's not disabled
                const hasNextPage = await page.evaluate(() => {
                    // Try multiple selectors for the next button
                    const nextSelectors = [
                        '.s-pagination-next',
                        '.a-pagination .a-last a',
                        'a:has-text("Next")',
                        'a[aria-label="Go to next page"]'
                    ];

                    for (const selector of nextSelectors) {
                        const nextBtn = document.querySelector(selector);
                        if (nextBtn) {
                            // Check if it's disabled
                            const isDisabled =
                                nextBtn.getAttribute('aria-disabled') === 'true' ||
                                nextBtn.classList.contains('a-disabled') ||
                                nextBtn.parentElement?.classList.contains('a-disabled');

                            if (!isDisabled) {
                                nextBtn.click();
                                return true;
                            }
                        }
                    }
                    return false;
                });

                if (hasNextPage) {
                    console.log('Clicked next page button. Waiting for navigation...');
                    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 1000 })
                        .catch(() => console.log('Navigation timeout - continuing anyway'));

                    await randomDelay(30, 60);
                    pageCount++;


                } else {
                    console.log('No more pages available.');
                    break;
                }
            } catch (error) {
                console.error(`Pagination error: ${error.message}`);
                // Save the page HTML to debug
                const html = await page.content();
                fs.writeFileSync('error-page.html', html);
                console.log('Saved page HTML to error-page.html');
                break;
            }
        }
    } catch (error) {
        console.error('Error during listing scrape:', error);
    }

    console.log(`Total products found: ${products.length}`);

    // Save products found so far regardless of errors
    fs.writeFileSync('amazon_products.json', JSON.stringify(products, null, 2));
    console.log('Saved product listings to amazon_products.json');

    if (products.length === 0) {
        console.log('No products found. Check the screenshots and HTML for issues.');
        await browser.close();
        return;
    }

    // Scrape individual product details - limit to first 5 for testing
    const productsToProcess = products.slice(0, 10);
    const finalData = [];

    for (const [index, product] of productsToProcess.entries()) {
        try {
            // Rotate user agents and viewport
            await page.setUserAgent(userAgents[index % userAgents.length]);

            // Occasionally switch to mobile viewport for better image access
            if (index % 2 === 0) {
                await page.setViewport({
                    width: 390,
                    height: 844,
                    deviceScaleFactor: 1,
                    isMobile: true
                });
            } else {
                await page.setViewport({
                    width: 1366,
                    height: 768,
                    deviceScaleFactor: 1
                });
            }

            console.log(`Scraping details for ${product.asin} (${index + 1}/${productsToProcess.length})`);
            const details = await scrapeProductDetails(page, product.url);

            if (details) {
                finalData.push({ ...product, details });

                // Save progress after each product
                fs.writeFileSync('combined_results.json', JSON.stringify(finalData, null, 2));
                console.log(`Progress saved: ${finalData.length}/${productsToProcess.length}`);

                await randomDelay(5, 10); // Longer delay between product pages
            }
        } catch (error) {
            console.error(`Failed to process ${product.asin}:`, error);

            // Add the error to our results but continue processing
            finalData.push({
                ...product,
                details: { error: error.message, imageLinks: [] }
            });
        }
    }

    await browser.close();

    // Save final results
    fs.writeFileSync('combined_results.json', JSON.stringify(finalData, null, 2));
    console.log(`Saved ${finalData.length} products with details`);
}

// Run the scraper
scrapeAmazon().catch(console.error);