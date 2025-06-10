const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Laptop = require('./model/Laptop.js');
const matchLaptop = require('./model/matchLaptop.js');
const User = require('./model/users.js');

async function optimizeDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.Mongo_URL);
        console.log('Connected to MongoDB');

        console.log('Creating indexes for better performance...');

        // Laptop collection indexes
        console.log('Creating Laptop collection indexes...');

        // Index for deals API - sites array operations
        await Laptop.collection.createIndex({
            'sites.price': 1,
            'sites.basePrice': 1,
            'sites.source': 1
        });
        console.log('✓ Created sites price index');

        // Index for search operations
        await Laptop.collection.createIndex({
            'specs.head': 'text',
            'brand': 'text',
            'series': 'text',
            'specs.processor.name': 'text'
        });
        console.log('✓ Created text search index');

        // Index for filtering operations
        await Laptop.collection.createIndex({
            'brand': 1,
            'specs.processor.name': 1,
            'specs.ram.size': 1,
            'specs.storage.size': 1,
            'specs.gpu': 1
        });
        console.log('✓ Created filter index');

        // Index for random sampling with site size
        await Laptop.collection.createIndex({
            'sites': 1,
            'sites.source': 1
        });
        console.log('✓ Created sites structure index');

        // Index for popular laptops
        await Laptop.collection.createIndex({
            'sites.rating': 1,
            'sites.ratingCount': 1
        });
        console.log('✓ Created rating index');

        // Index for price range queries
        await Laptop.collection.createIndex({
            'allTimeLowPrice': 1
        });
        console.log('✓ Created price range index');

        // Compound index for deals optimization
        await Laptop.collection.createIndex({
            'sites.price': 1,
            'allTimeLowPrice': 1,
            'specs.basePrice': 1
        });
        console.log('✓ Created compound price index');

        // MatchLaptop collection indexes (if needed)
        console.log('Creating MatchLaptop collection indexes...');

        await matchLaptop.collection.createIndex({
            'specs.head': 'text',
            'brand': 'text',
            'series': 'text'
        });
        console.log('✓ Created matchLaptop text search index');

        // User collection indexes
        console.log('Creating User collection indexes...');

        await User.collection.createIndex({
            'email': 1
        }, { unique: true });
        console.log('✓ Created user email index');

        await User.collection.createIndex({
            'username': 1
        }, { unique: true });
        console.log('✓ Created user username index');

        // Favorites and history indexes
        await User.collection.createIndex({
            'favorites': 1
        });
        console.log('✓ Created favorites index');

        await User.collection.createIndex({
            'history': 1
        });
        console.log('✓ Created history index');

        console.log('\n✅ Database optimization completed successfully!');
        console.log('\nIndex Summary:');

        // Show all indexes
        const laptopIndexes = await Laptop.collection.indexes();
        console.log('Laptop collection indexes:', laptopIndexes.length);

        const matchLaptopIndexes = await matchLaptop.collection.indexes();
        console.log('MatchLaptop collection indexes:', matchLaptopIndexes.length);

        const userIndexes = await User.collection.indexes();
        console.log('User collection indexes:', userIndexes.length);

    } catch (error) {
        console.error('Error optimizing database:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run optimization
optimizeDatabase();
