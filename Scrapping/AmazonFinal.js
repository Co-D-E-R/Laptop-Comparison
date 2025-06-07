const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const { executablePath } = require('puppeteer');

// Add stealth plugin
puppeteer.use(StealthPlugin());

// IMPORTANT: Use a SINGLE user agent throughout the entire scraping session
// Choose desktop agent for more consistent product listings
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const randomDelay = (min, max) =>
    new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min));

async function scrapeProductDetails(page, productUrl) {
    try {
        console.log(`Visiting product: ${productUrl}`);
        await page.goto(productUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        await randomDelay(3000, 6000);

        return await page.evaluate(() => {
            const details = {};

            // Technical Details
            const techRows = Array.from(document.querySelectorAll('#productDetails_techSpec_section_1 tr, #productDetails_db_sections tr, #technicalSpecifications_section_1 tr'));
            techRows.forEach(row => {
                const key = row.querySelector('th')?.textContent.trim();
                const value = row.querySelector('td')?.textContent.trim().replace(/\u200E/g, '');
                if (key && value) details[key] = value;
            });

            // Additional Details
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

            // Image Links
            const imageLinks = new Set();

            // Method 1: Carousel items
            try {
                const carouselItems = document.querySelectorAll('li[data-csa-c-media-type="IMAGE"]');
                carouselItems.forEach(item => {
                    const elementId = item.getAttribute('data-csa-c-element-id');
                    if (elementId) {
                        imageLinks.add(`https://m.media-amazon.com/images/I/${elementId}._SL1500_.jpg`);
                    }
                });
            } catch (e) { }

            // Method 2: Main image
            try {
                const mainImage = document.querySelector('#landingImage, #imgBlkFront');
                if (mainImage && mainImage.dataset.oldHires) {
                    imageLinks.add(mainImage.dataset.oldHires);
                } else if (mainImage && mainImage.src) {
                    // Try to get high-res version
                    const src = mainImage.src;
                    if (src.includes('images/I/')) {
                        const match = src.match(/images\/I\/([^.]+)/);
                        if (match && match[1]) {
                            imageLinks.add(`https://m.media-amazon.com/images/I/${match[1]}._SL1500_.jpg`);
                        } else {
                            imageLinks.add(src);
                        }
                    }
                }
            } catch (e) { }

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
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--window-size=1920,1080' // Use a consistent window size
        ]
    });

    // For storing all products across pages
    const allProducts = [];

    try {
        // Create a new page with consistent settings
        const page = await browser.newPage();

        // IMPORTANT: Use the SAME user agent throughout - don't change it during scraping
        await page.setUserAgent(USER_AGENT);

        // Use a consistent desktop viewport
        await page.setViewport({
            width: 1366,
            height: 768,
            deviceScaleFactor: 1
        });

        await page.setJavaScriptEnabled(true);

        // Start with the deals page (more natural browsing pattern)
        const dealsUrl = 'https://www.amazon.in/deals';
        console.log(`First navigating to ${dealsUrl}...`);
        await page.goto(dealsUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        await randomDelay(3000, 6000);

        // Handle cookies if present on deals page
        const cookiesButton = await page.$('#sp-cc-accept');
        if (cookiesButton) {
            await cookiesButton.click();
            await randomDelay(1000, 2000);
        }

        // Simulate user browsing behavior on deals page
        await page.evaluate(() => {
            window.scrollBy(0, 500);
        });
        await randomDelay(2000, 4000);

        // Now go to laptop search - using a simpler URL structure
        const laptopUrl = 'https://www.amazon.in/s?i=computers&rh=n%3A1375424031%2Cp_123%3A110955%257C219979%257C240067%257C241862%257C247341%257C308445%257C378555%257C391242&dc&qid=1746464279&rnid=91049095031&xpid=8-y8VezqgPhL7&ref=sr_pg_1';
        console.log(`Now navigating to laptop listings: ${laptopUrl}...`);
        await page.goto(laptopUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        await randomDelay(3000, 6000);

        let pageCount = 1;
        const maxPages = 100; // Set this to how many pages you want to scrape

        // Add at the top of your scrapeAmazon function
        // This will track our current search page URL
        let currentSearchPageUrl = laptopUrl; // Initialize with first page URL

        // Process page by page
        while (pageCount <= maxPages) {
            console.log(`\n===== PROCESSING PAGE ${pageCount} =====`);

            // 1. Improved product listing extraction with less restrictive filtering
            const pageProducts = await page.evaluate(() => {
                // Get all products
                const products = Array.from(document.querySelectorAll('.s-result-item[data-component-type="s-search-result"]'))
                    .map(card => {
                        const title = card.querySelector('h2')?.textContent.trim();
                        const asin = card.getAttribute('data-asin');

                        // Skip sponsored products or products without ASIN
                        if (!asin || card.querySelector('.puis-sponsored-label-text')) {
                            return null;
                        }

                        // Get rating
                        const ratingElement = card.querySelector('.a-icon-star-small, .a-icon-star');
                        let rating = "N/A";
                        if (ratingElement) {
                            const ratingText = ratingElement.textContent.trim();
                            const match = ratingText.match(/(\d+(\.\d+)?)/);
                            rating = match ? match[1] : "N/A";
                        }

                        // Get price
                        const priceElement = card.querySelector('.a-price .a-offscreen');
                        const price = priceElement ? priceElement.textContent : "N/A";

                        // Base price (without discount)
                        const basePriceElement = card.querySelector('span.a-price.a-text-price > span.a-offscreen');
                        const basePrice = basePriceElement ? basePriceElement.textContent : "N/A";

                        //  Ratings number
                        const ratingsNumberElement = card.querySelector('span.a-size-base.s-underline-text');
                        const ratingsNumber = ratingsNumberElement ? ratingsNumberElement.textContent.trim() : "N/A";

                        return {
                            title,
                            price,
                            asin,
                            url: `https://www.amazon.in/dp/${asin}/`,
                            basePrice,
                            rating,
                            ratingsNumber
                        };
                    })
                    .filter(p => p !== null);

                // Log for debugging
                console.log(`Found ${products.length} total products`);
                return products;
            });

            console.log(`Found ${pageProducts.length} products on page ${pageCount}`);

            // Process a limited number of products per page to avoid detection
            const productsToProcess = 1;

            // 2. Process products from current page
            for (let i = 0; i < productsToProcess; i++) {
                const product = pageProducts[i];
                if (!product || !product.url) continue;

                console.log(`Processing product ${i + 1}/${productsToProcess}: ${product.title}`);

                // Get product details
                const details = await scrapeProductDetails(page, product.url);

                // Combine listing and details
                const completeProduct = { ...product, details };
                allProducts.push(completeProduct);

                // Save progress after each product
                fs.writeFileSync('amazon_complete_data.json', JSON.stringify(allProducts, null, 2));
                console.log(`Progress saved: Total products: ${allProducts.length}`);

                // Wait between products (random delay)
                if (i < productsToProcess - 1) {
                    const delay = Math.floor(Math.random() * 2000) + 3000; // 3-5 seconds
                    console.log(`Waiting ${delay / 1000} seconds before next product...`);
                    await randomDelay(delay, delay + 100);
                }
            }

            // 3. COMPLETELY REWRITTEN PAGINATION APPROACH - return to CURRENT search page
            try {
                console.log("\nChecking for next page...");

                // IMPORTANT: Go back to the CURRENT search results page
                console.log("Returning to search results page...");

                // Always navigate to our tracked current search page URL
                await page.goto(currentSearchPageUrl, { waitUntil: 'networkidle2', timeout: 60000 });
                await randomDelay(3000, 5000);

                // Now look for the next page button while on search results page
                const hasNextPage = await page.evaluate(() => {
                    // First check if there's a "Next" button (look for all possible selectors)
                    const nextSelectors = [
                        '.s-pagination-item.s-pagination-next:not(.s-pagination-disabled)',
                        'a.s-pagination-next:not(.s-pagination-disabled)',
                        'a[aria-label="Go to next page"]',
                        '.a-pagination .a-last a'
                    ];

                    for (const selector of nextSelectors) {
                        const nextBtn = document.querySelector(selector);
                        if (nextBtn && nextBtn.href) {
                            console.log(`Found next button with selector: ${selector}`);
                            return nextBtn.href;
                        }
                    }

                    // If no next button found using selectors, look for any pagination link with text "Next"
                    const allLinks = Array.from(document.querySelectorAll('a'));
                    for (const link of allLinks) {
                        if (link.textContent.trim() === 'Next' && link.href) {
                            console.log("Found next link by text content");
                            return link.href;
                        }
                    }

                    return null;
                });

                if (hasNextPage) {
                    console.log(`Next page URL found: ${hasNextPage}`);

                    // Add longer delay before navigation
                    console.log(`Waiting before going to next page...`);
                    await randomDelay(8000, 12000);

                    // Navigate directly to the next page URL
                    await page.goto(hasNextPage, { waitUntil: 'networkidle2', timeout: 60000 });

                    // UPDATE OUR TRACKED SEARCH PAGE URL - this is the critical fix!
                    currentSearchPageUrl = hasNextPage;

                    // Add delay after navigation
                    await randomDelay(5000, 8000);

                    // Confirm page loaded by checking for products
                    const hasProducts = await page.evaluate(() => {
                        return document.querySelectorAll('.s-result-item[data-component-type="s-search-result"]').length > 0;
                    });

                    if (hasProducts) {
                        pageCount++;
                        console.log(`Successfully navigated to page ${pageCount}`);

                        // Quick scroll to make it look natural
                        await page.evaluate(() => window.scrollBy(0, 300));
                        await randomDelay(2000, 4000);
                    } else {
                        console.log("Navigation failed - no products found on next page");


                        fs.writeFileSync(`next-page-no-products-${pageCount}.html`, await page.content());
                        break;
                    }
                } else {
                    console.log("No next page link found. We've reached the end of results.");

                    // For debugging: save the last page to see what the pagination looks like
                    fs.writeFileSync(`last-page-${pageCount}.html`, await page.content());
                    break;
                }
            } catch (error) {
                console.error(`Pagination error: ${error.message}`);

                const html = await page.content();
                fs.writeFileSync(`pagination-error-${pageCount}.html`, html);
                break;
            }

            // Take longer breaks between pages to avoid detection
            const pageDelay = Math.floor(Math.random() * 3000) + 3000; // 3-6 seconds
            console.log(`Taking a ${pageDelay / 1000} second break between pages...`);
            await randomDelay(pageDelay, pageDelay + 100);
        }

    } catch (error) {
        console.error('Scraping error:', error);
    } finally {
        // Save all collected data
        fs.writeFileSync('amazon_complete_data.json', JSON.stringify(allProducts, null, 2));
        console.log(`Completed scraping. Saved ${allProducts.length} products with details`);

        await browser.close();
    }
}

// Run the scraper
scrapeAmazon().catch(console.error);