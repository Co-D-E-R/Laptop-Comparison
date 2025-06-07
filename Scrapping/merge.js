const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const randomUseragent = require('random-useragent');
const fs = require('fs');
const os = require('os');

// Optimize for parallel processing - use half of CPU cores
const MAX_CONCURRENT_BROWSERS = Math.max(1, Math.floor(os.cpus().length / 2));
console.log(`Using ${MAX_CONCURRENT_BROWSERS} concurrent browsers for product details`);

// Reduced delay times for speed
const randomDelay = async (min = 500, max = 2000) => {
    const delay = Math.floor(Math.random() * (max - min) + min);
    return new Promise(resolve => setTimeout(resolve, delay));
};

// Function to handle cookies window
async function handleCookiesPopup(page) {
    try {
        const cookiesButton = await page.$('#sp-cc-accept');
        if (cookiesButton) {
            await cookiesButton.click();
        }
    } catch (error) {
        // Silently continue
    }
}

// Function to get technical details from product page - optimized
async function getProductDetails(url) {
    console.log(`Getting technical details for ${url}`);

    const browser = await puppeteer.launch({
        headless: 'new', // Use headless for speed
        defaultViewport: {
            width: 390,
            height: 844,
            isMobile: true
        }
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1');

    try {
        // Faster page loading
        await page.goto(url, {
            waitUntil: 'domcontentloaded', // Much faster than networkidle2
            timeout: 30000
        });

        await handleCookiesPopup(page);

        // Get technical specs and images in a single evaluation for efficiency
        const result = await page.evaluate(() => {
            //   const details = {};

            //   // Get technical specifications
            //   const allTechSpecRows = [
            //     ...document.querySelectorAll('#productDetails_techSpec_section_1 tr'),
            //     ...document.querySelectorAll('#prodDetails tr')
            //   ];

            //   allTechSpecRows.forEach(row => {
            //     const key = row.querySelector('th')?.innerText.trim();
            //     let value = row.querySelector('td')?.innerText.trim();
            //     if (key && value) {
            //       value = value.replace(/\u200E/g, ''); // Remove special characters
            //       details[key] = value;
            //     }
            //   });
            const details = {};
            // Get technical specifications from all potential tables
            const allTechSpecRows = [
                ...document.querySelectorAll(
                    '#productDetails_techSpec_section_1 tr, #prodDetails tr, #productDetails_detailBullets_sections1 tr, .techD'
                ),
            ];

            allTechSpecRows.forEach(row => {
                const keyElement = row.querySelector('th, .prodDetSectionEntry');
                const valueElement = row.querySelector('td, .prodDetAttrValue');

                if (keyElement && valueElement) {
                    const key = keyElement.textContent.trim().replace(/\u200E/g, '');
                    const value = valueElement.textContent.trim().replace(/\u200E/g, '');
                    if (key && value) details[key] = value;
                }
            });

            // Get image links
            const imageLinks = [];
            const elements = document.querySelectorAll('.a-carousel-viewport.a-gesture.a-gesture-horizontal li[data-csa-c-media-type="IMAGE"]');
            elements.forEach(element => {
                const id = element.getAttribute('data-csa-c-element-id');
                if (id) {
                    imageLinks.push(`https://m.media-amazon.com/images/I/${id}._SL1500_.jpg`);
                }
            });

            return { details, imageLinks };
        });

        await browser.close();

        return {
            ...result.details,
            imageLinks: result.imageLinks
        };
    } catch (error) {
        console.error(`Error getting details for ${url}: ${error.message}`);
        await browser.close();
        return { error: error.message };
    }
}

async function scrapeAmazon() {
    // Main scraping browser
    const browser = await puppeteer.launch({
        headless: 'new', // Use headless for speed
        args: [
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });

    const page = await browser.newPage();
    const userAgent = randomUseragent.getRandom();
    await page.setUserAgent(userAgent);

    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br'
    });

    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        window.chrome = { runtime: {} };
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = parameters =>
            parameters.name === 'notifications'
                ? Promise.resolve({ state: Notification.permission })
                : originalQuery(parameters);
    });

    const cardData = [];

    try {
        const baseUrl = "https://www.amazon.in/s?i=computers&rh=n%3A1375424031%2Cp_123%3A110955%257C219979%257C240067%257C241862%257C247341%257C308445%257C378555%257C391242%257C46655&dc&qid=1746468158&rnid=91049095031&xpid=8-y8VezqgPhL7&ref=sr_nr_p_123_9&ds=v1%3Ae%2BgpbjW65IxHSb1AuAN%2FFQnEmkF%2FjGFEbNJGNaz0CJo";

        async function navigateToTargetPage(targetPage) {
            console.log('Starting from safe page 1');
            let currentPage = 1;
            let nextPageUrl = null;
        
            while(currentPage < targetPage) {
                console.log(`Navigating to page ${currentPage}`);
                const targetUrl = currentPage === 1 ? baseUrl : nextPageUrl;
                console.log(`Navigating to: ${targetUrl}`);
                
                try {
                    await page.goto(targetUrl, {
                        waitUntil: 'networkidle2',
                        timeout: 60000
                    });
                } catch (error) {
                    console.log(`Navigation timeout, retrying...`);
                    await randomDelay(3000, 5000);
                    continue;
                }
        
                // Check for blocks
                const isBlocked = await page.evaluate(() => 
                    document.body.innerText.includes('robot') ||
                    document.body.innerText.includes('CAPTCHA')
                );
                
                if(isBlocked) {
                    console.log('Block detected during navigation!');
                    await page.screenshot({ path: `nav-blocked-${currentPage}.png` });
                    await randomDelay(20000, 30000);
                    continue;
                }
        
                // Get next page URL
                try {
                    await page.waitForSelector('.s-pagination-next:not(.s-pagination-disabled)', { timeout: 10000 });
                    nextPageUrl = await page.evaluate(() => {
                        const nextBtn = document.querySelector('.s-pagination-next:not(.s-pagination-disabled)');
                        return nextBtn ? nextBtn.href : null;
                    });
                } catch (error) {
                    console.log('No more pages available');
                    break;
                }
        
                if(!nextPageUrl) {
                    console.log('Reached last available page:', currentPage);
                    break;
                }
        
                currentPage++;
                console.log(`Navigated to page ${currentPage}`);
                await randomDelay(2500, 4000); // Realistic delay
            }
            
            if(currentPage < targetPage) {

                throw new Error(`Only reached page ${currentPage} instead of 25`);
            }
            
            return page.url();
        }
        
        async function scrapePage(url, currentPage = 1, scrapeToPage = null) {
            console.log(`Scraping page ${currentPage}...`);

            if (scrapeToPage !== null && currentPage > scrapeToPage) {
                return;
            }

            // Faster page loading
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });

            // Minimal essential delays
            await randomDelay(800, 1500);

            await handleCookiesPopup(page);

            const isBlocked = await page.evaluate(() =>
                document.body.innerText.includes('robot') ||
                document.body.innerText.includes('CAPTCHA') ||
                document.body.innerText.includes('verify')
            );

            if (isBlocked) {
                console.log("BOT DETECTION! Taking screenshot and waiting...");
                await page.screenshot({ path: `blocked-${currentPage}.png` });
                await new Promise(resolve => setTimeout(resolve, 20000));
            }

            try {
                // Unified selector approach - faster
                await page.waitForSelector('.s-result-item', { timeout: 20000 });

                // Extract product information more efficiently
                const pageCardData = await page.evaluate(() => {
                    return Array.from(document.querySelectorAll('.s-result-item[data-asin]:not([data-asin=""])'))
                        .map(card => {
                            // Product name
                            const productName = card.querySelector('h2')?.textContent.trim();
                            if (!productName) return null;

                            // Product link and ID
                            const productLinkElement = card.querySelector('h2 a') || card.querySelector('a.a-link-normal');
                            let productLink = "N/A";
                            let productId = card.getAttribute('data-asin') || "unknown";
                            let cleanProductLink = "N/A";

                            if (productLinkElement) {
                                productLink = productLinkElement.href;
                                if (productId !== "unknown") {
                                    cleanProductLink = `https://www.amazon.in/dp/${productId}/`;
                                }
                            }

                            // Get other details
                            const sponsoredTag = card.querySelector('.puis-sponsored-label-text');
                            const sponsored = sponsoredTag ? "yes" : "no";

                            const badgeElement = card.querySelector('span.a-badge-label-inner');
                            const badge = badgeElement ? badgeElement.textContent : "N/A";

                            const priceElement = card.querySelector('.a-price .a-offscreen');
                            const price = priceElement ? priceElement.textContent : "N/A";

                            const basePriceElement = card.querySelector('span.a-price.a-text-price > span.a-offscreen');
                            const basePrice = basePriceElement ? basePriceElement.textContent : "N/A";

                            const ratingElement = card.querySelector('span.a-icon-alt');
                            const decimalRegex = /^\d+([,.]\d+)?$/;
                            const ariaLabel = ratingElement ? ratingElement.textContent.trim() : "N/A";
                            const firstThreeCharacters = typeof ariaLabel === 'string' ? ariaLabel.substring(0, 3) : '';
                            const rating = decimalRegex.test(firstThreeCharacters) ? firstThreeCharacters.replace(',', '.') : "N/A";

                            const ratingsNumberElement = card.querySelector('span.a-size-base.s-underline-text');
                            const ratingsNumber = ratingsNumberElement ? ratingsNumberElement.textContent.trim() : "N/A";

                            const boughtPastMonthElement = card.querySelector('.a-size-base .a-color-secondary');
                            const textContent = boughtPastMonthElement ? boughtPastMonthElement.textContent : "N/A";
                            const plusSignRegex = /\b.*?\+/;
                            const plusSignText = textContent.match(plusSignRegex);
                            const boughtPastMonth = plusSignRegex.test(plusSignText) ? plusSignText[0] : "N/A";

                            return {
                                productName,
                                productLink,
                                cleanProductLink,
                                productId,
                                sponsored,
                                badge,
                                price,
                                basePrice,
                                rating,
                                ratingsNumber,
                                boughtPastMonth
                            };
                        }).filter(card => card !== null);
                });

                cardData.push(...pageCardData);

                // Check for next page
                if (scrapeToPage === null || currentPage < scrapeToPage) {
                    const nextPageUrl = await page.evaluate(() => {
                        const nextBtn = document.querySelector('.s-pagination-next:not(.s-pagination-disabled)');
                        return nextBtn ? nextBtn.href : null;
                    });

                    if (nextPageUrl) {
                        console.log(`Moving to next page: ${currentPage + 1}`);
                        await randomDelay(500, 1000);
                        await scrapePage(nextPageUrl, currentPage + 1, scrapeToPage);
                    } else {
                        console.log(`All available pages scraped: ${currentPage}`);
                    }
                }
            } catch (error) {
                console.error(`Error on page ${currentPage}:`, error.message);
            }
        }

        const targetPageUrl = await navigateToTargetPage(3);
        console.log(`Navigating to page targetPage: ${targetPageUrl}`);

        

        // Start scraping from first page
        // await scrapePage(url, 1, null); // Limiting to 2 pages for testing
        await scrapePage(targetPageUrl, 2, 3);
        console.log('Basic scraping finished. Found', cardData.length, 'products');

        // Filter products with valid cleanProductLink
        const validProducts = cardData.filter(product => product.cleanProductLink !== "N/A");
        console.log(`${validProducts.length} products have valid clean product links`);

        // Process products in parallel batches
        const enhancedData = [];
        const batchSize = MAX_CONCURRENT_BROWSERS;

        for (let i = 0; i < validProducts.length; i += batchSize) {
            const batch = validProducts.slice(i, i + batchSize);
            console.log(`Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} products)`);

            // Process this batch in parallel
            const promises = batch.map(product => {
                return new Promise(async (resolve) => {
                    try {
                        const technicalDetails = await getProductDetails(product.cleanProductLink);

                        // Maintain the same data structure
                        const enhancedProduct = {
                            ...product,
                            technicalDetails
                        };

                        enhancedData.push(enhancedProduct);
                        console.log(`Completed: ${product.productName}`);
                        resolve();
                    } catch (err) {
                        console.error(`Error processing ${product.productName}: ${err.message}`);
                        resolve(); // Resolve even on error to continue the batch
                    }
                });
            });

            // Wait for all products in this batch to complete
            await Promise.all(promises);

            // Save progress after each batch
            fs.writeFileSync('scrapedData.json', JSON.stringify(enhancedData, null, 2), 'utf8');
            console.log(`Progress saved: ${enhancedData.length}/${validProducts.length}`);
        }

        console.log('All processing complete. Saved to scrapedData.json');
    } catch (error) {
        console.error('Scraping error:', error);
    } finally {
        await browser.close();
    }
}

// Run the scraper
scrapeAmazon();