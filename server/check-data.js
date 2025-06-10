const mongoose = require('mongoose');
const Laptop = require('./model/Laptop.js');
require('dotenv').config();

async function checkData() {
    try {
        await mongoose.connect(process.env.Mongo_URL);
        console.log('Connected to MongoDB');

        // Find a laptop with only one site
        const singleSiteLaptop = await Laptop.findOne({
            $expr: { $eq: [{ $size: "$sites" }, 1] }
        });

        if (singleSiteLaptop) {
            console.log('=== Single Site Laptop Data ===');
            console.log('ID:', singleSiteLaptop._id);
            console.log('Title:', singleSiteLaptop.specs?.head);
            console.log('Sites:', JSON.stringify(singleSiteLaptop.sites, null, 2));
            console.log('allTimeLowPrice:', singleSiteLaptop.allTimeLowPrice);
            console.log('specs.basePrice:', singleSiteLaptop.specs?.basePrice);

            // Check if site has basePrice
            const site = singleSiteLaptop.sites[0];
            console.log('\n=== Site Data Analysis ===');
            console.log('Site source:', site.source);
            console.log('Site price:', site.price);
            console.log('Site basePrice:', site.basePrice);
            console.log('Site rating:', site.rating);

            // Show what should be displayed as base price
            console.log('\n=== Base Price Logic ===');
            if (site.basePrice && site.basePrice > site.price) {
                console.log('✓ Should show site.basePrice:', site.basePrice);
            } else if (singleSiteLaptop.allTimeLowPrice && singleSiteLaptop.allTimeLowPrice > site.price) {
                console.log('✓ Should show allTimeLowPrice:', singleSiteLaptop.allTimeLowPrice);
            } else if (singleSiteLaptop.specs?.basePrice && singleSiteLaptop.specs.basePrice > site.price) {
                console.log('✓ Should show specs.basePrice:', singleSiteLaptop.specs.basePrice);
            } else {
                console.log('✗ No valid base price found');
            }
        } else {
            console.log('No single site laptop found');
        }

        // Also check a specific laptop by ID from the screenshot
        console.log('\n=== Checking specific laptop ===');
        const specificLaptop = await Laptop.findById('6848a1a61a5b12561c19fd82');
        if (specificLaptop) {
            console.log('Specific laptop sites:', JSON.stringify(specificLaptop.sites, null, 2));
            console.log('Specific laptop allTimeLowPrice:', specificLaptop.allTimeLowPrice);
            console.log('Specific laptop specs.basePrice:', specificLaptop.specs?.basePrice);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkData();
