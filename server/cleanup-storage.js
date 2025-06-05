const mongoose = require('mongoose');
const Laptop = require('./model/Laptop.js');
const matchLaptop = require('./model/matchLaptop.js');
require('dotenv').config();

async function cleanupStorageData() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.Mongo_URL);
        console.log('Connected to database');

        // Find and fix records in Laptop collection with invalid storage.size
        console.log('Cleaning Laptop collection...');
        const laptopResult = await Laptop.updateMany(
            {
                $or: [
                    { 'specs.storage.size': { $type: 'string' } },
                    { 'specs.storage.size': { $not: { $type: 'number' } } }
                ]
            },
            [
                {
                    $set: {
                        'specs.storage.size': {
                            $cond: {
                                if: { $isNumber: '$specs.storage.size' },
                                then: '$specs.storage.size',
                                else: {
                                    $cond: {
                                        if: { $regexMatch: { input: { $toString: '$specs.storage.size' }, regex: /^\d+\.?\d*$/ } },
                                        then: { $toDouble: '$specs.storage.size' },
                                        else: 0
                                    }
                                }
                            }
                        }
                    }
                }
            ]
        );
        console.log(`Updated ${laptopResult.modifiedCount} laptop records`);

        // Find and fix records in matchLaptop collection with invalid storage.size
        console.log('Cleaning matchLaptop collection...');
        const matchLaptopResult = await matchLaptop.updateMany(
            {
                $or: [
                    { 'specs.storage.size': { $type: 'string' } },
                    { 'specs.storage.size': { $not: { $type: 'number' } } }
                ]
            },
            [
                {
                    $set: {
                        'specs.storage.size': {
                            $cond: {
                                if: { $isNumber: '$specs.storage.size' },
                                then: '$specs.storage.size',
                                else: {
                                    $cond: {
                                        if: { $regexMatch: { input: { $toString: '$specs.storage.size' }, regex: /^\d+\.?\d*$/ } },
                                        then: { $toDouble: '$specs.storage.size' },
                                        else: 0
                                    }
                                }
                            }
                        }
                    }
                }
            ]
        );
        console.log(`Updated ${matchLaptopResult.modifiedCount} matchLaptop records`);

        console.log('Cleanup completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error during cleanup:', error);
        process.exit(1);
    }
}

cleanupStorageData();
