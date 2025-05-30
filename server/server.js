const express = require('express');
const mongoose = require('mongoose');
const LaptopData = require('./Data/final_laptops.json');
const matchLaptopData = require('./Data/matched_laptops.json');


const Laptop = require('./model/Laptop.js');
const matchLaptop = require('./model/matchLaptop.js');
const Comment = require('./model/Review.js');

const { AmazonData, FlipkartData } = require('./utils/dataFill.js');

// const amazonData = require('./Data/amazon_complete_data.json');
// const flipkartData = require('./Data/flipkart_complete_data.json');

const path = require('path');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./model/users.js');
//.env
require('dotenv').config({ path: path.resolve(__dirname, '.env') });



const cors = require('cors');

// const PORT = process.env.PORT || 8080;
const corsOptions = {
  origin: ["http://localhost:5173"],
  credentials: true,
}

const app = express();

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


//Seassion and Passport setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'laptop-compare-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {

    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
    maxAge: 1000 * 60 * 60 * 24 * 7

  } // Set to true if using HTTPS
}))

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


//MongoDB connection
connectDB().catch(err => console.log(err));
async function connectDB() {
  //add your own connection string
  try {
    await mongoose.connect(process.env.Mongo_URL);
    // console.log(process.env.Mongo_URL);
    console.log('Database Connected');
  } catch (err) {
    console.log(err);
  }
}



//api routes

//Authentication API
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    console.log(email, password, name);

    // Check if username already exists
    const existingUser = await User.findOne({ username: email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Create user with both username and email set
    const user = new User({
      username: email,
      email: email,  // Add this line to set the email field
      name: name,
    });

    const registeredUser = await User.register(user, password);

    req.login(registeredUser, (err) => {
      if (err) {
        console.log('Login Error', err);
        return res.status(500).json({ success: false, message: 'Login Error' });
      }
      res.status(200).json({ success: true, message: 'User Registered Successfully' });
    });

  } catch (err) {
    console.log('Registration Error', err);

    // Better error handling
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use'
      });
    }

    res.status(500).json({ success: false, message: err.message || 'Server Error' });
  }
});
//Login API
app.post('/api/login', passport.authenticate('local'), (req, res) => {

  res.status(200).json({ success: true, message: 'User Logged In Successfully' });

});
//Logout API
app.get('/api/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.log('Logout Error', err);
      return res.status(500).json({ success: false, message: 'Logout Error' });
    }
    res.status(200).json({ success: true, message: 'User Logged Out Successfully' });
  });
});
//Check Authentication API
app.get('/api/check-auth', (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json({ success: true, user: req.user });
  } else {
    res.status(401).json({ success: false, message: 'User Not Authenticated' });
  }
});

//Data filling API


app.get('/api/insertonetime', async (req, res) => {
  try {
    // Clean and transform the data to match schema requirements
    const cleanedData = LaptopData.map(laptop => {
      // Make sure we have required fields
      if (!laptop.brand || !laptop.series) {
        console.log('Missing required fields for laptop:', laptop.specs?.head || 'unknown');
        // Set default values for required fields
        laptop.brand = laptop.brand || 'Unknown Brand';
        laptop.series = laptop.series || 'Unknown Series';
      }

      const transformedLaptop = { ...laptop };

      // Fix specs.touch - convert string values to boolean
      if (transformedLaptop.specs && typeof transformedLaptop.specs.touch === 'string') {
        const touchValue = transformedLaptop.specs.touch.trim().toLowerCase();
        if (touchValue === "" || touchValue === "no" || touchValue === "false" || touchValue === "n/a") {
          transformedLaptop.specs.touch = false;
        } else if (touchValue === "yes" || touchValue === "true") {
          transformedLaptop.specs.touch = true;
        } else {
          // If it's some other string value, default to false
          transformedLaptop.specs.touch = false;
        }
      }

      // Fix rating count values by removing commas
      if (transformedLaptop.sites && Array.isArray(transformedLaptop.sites)) {
        transformedLaptop.sites = transformedLaptop.sites.map(site => {
          const updatedSite = { ...site };
          // Convert comma-separated numbers to plain numbers
          if (typeof updatedSite.ratingCount === 'string') {
            updatedSite.ratingCount = updatedSite.ratingCount === 'N/A' ? 0 :
              parseInt(updatedSite.ratingCount.replace(/,/g, ''));
          }
          return updatedSite;
        });
      }

      // Fix specs.ratingCount if it exists
      if (transformedLaptop.specs && typeof transformedLaptop.specs.ratingCount === 'string') {
        transformedLaptop.specs.ratingCount = transformedLaptop.specs.ratingCount === 'N/A' ? 0 :
          parseInt(transformedLaptop.specs.ratingCount.replace(/,/g, ''));
      }

      // Ensure RAM size is a number
      if (transformedLaptop.specs && transformedLaptop.specs.ram &&
        typeof transformedLaptop.specs.ram.size === 'string') {
        transformedLaptop.specs.ram.size = parseInt(transformedLaptop.specs.ram.size, 10);
      }

      // Convert displayInch to number if it's a string
      if (transformedLaptop.specs && typeof transformedLaptop.specs.displayInch === 'string') {
        transformedLaptop.specs.displayInch = parseFloat(transformedLaptop.specs.displayInch);
      }

      return transformedLaptop;
    });

    console.log(`Attempting to insert ${cleanedData.length} laptops`);

    // Log the first item to inspect its structure
    console.log('Sample item structure:', JSON.stringify(cleanedData[0], null, 2));

    await Laptop.insertMany(cleanedData, { ordered: false });

    res.status(200).json({
      success: true,
      message: `Successfully inserted ${cleanedData.length} laptops`,
      total: LaptopData.length
    });
  } catch (err) {
    console.error('Error inserting data:', err);
    res.status(500).json({ success: false, message: 'Error inserting data: ' + err.message });
  }
});

app.get('/api/match/insertonetime', async (req, res) => {
  try {
    // Clean and transform the data to match schema requirements
    const cleanedData = matchLaptopData.map(laptop => {
      // Make sure we have required fields
      if (!laptop.brand || !laptop.series) {
        console.log('Missing required fields for laptop:', laptop.specs?.head || 'unknown');
        // Set default values for required fields
        laptop.brand = laptop.brand || 'Unknown Brand';
        laptop.series = laptop.series || 'Unknown Series';
      }

      const transformedLaptop = { ...laptop };

      // Fix specs.touch - convert string values to boolean
      if (transformedLaptop.specs && typeof transformedLaptop.specs.touch === 'string') {
        const touchValue = transformedLaptop.specs.touch.trim().toLowerCase();
        if (touchValue === "" || touchValue === "no" || touchValue === "false" || touchValue === "n/a") {
          transformedLaptop.specs.touch = false;
        } else if (touchValue === "yes" || touchValue === "true") {
          transformedLaptop.specs.touch = true;
        } else {
          // If it's some other string value, default to false
          transformedLaptop.specs.touch = false;
        }
      }

      // Fix rating count values by removing commas
      if (transformedLaptop.sites && Array.isArray(transformedLaptop.sites)) {
        transformedLaptop.sites = transformedLaptop.sites.map(site => {
          const updatedSite = { ...site };
          // Convert comma-separated numbers to plain numbers
          if (typeof updatedSite.ratingCount === 'string') {
            updatedSite.ratingCount = updatedSite.ratingCount === 'N/A' ? 0 :
              parseInt(updatedSite.ratingCount.replace(/,/g, ''));
          }
          return updatedSite;
        });
      }

      // Fix specs.ratingCount if it exists
      if (transformedLaptop.specs && typeof transformedLaptop.specs.ratingCount === 'string') {
        transformedLaptop.specs.ratingCount = transformedLaptop.specs.ratingCount === 'N/A' ? 0 :
          parseInt(transformedLaptop.specs.ratingCount.replace(/,/g, ''));
      }

      // Ensure RAM size is a number
      if (transformedLaptop.specs && transformedLaptop.specs.ram &&
        typeof transformedLaptop.specs.ram.size === 'string') {
        transformedLaptop.specs.ram.size = parseInt(transformedLaptop.specs.ram.size, 10);
      }

      // Convert displayInch to number if it's a string
      if (transformedLaptop.specs && typeof transformedLaptop.specs.displayInch === 'string') {
        transformedLaptop.specs.displayInch = parseFloat(transformedLaptop.specs.displayInch);
      }

      return transformedLaptop;
    });

    console.log(`Attempting to insert ${cleanedData.length} laptops`);

    // Log the first item to inspect its structure
    console.log('Sample item structure:', JSON.stringify(cleanedData[0], null, 2));

    await matchLaptop.insertMany(cleanedData, { ordered: false });

    res.status(200).json({
      success: true,
      message: `Successfully inserted ${cleanedData.length} laptops`,
      total: matchLaptopData.length
    });
  } catch (err) {
    console.error('Error inserting data:', err);
    res.status(500).json({ success: false, message: 'Error inserting data: ' + err.message });
  }
});

//All details API

//Advaced Search API
app.get('/api/advancedsearch', async (req, res) => {
  try {
    // Extract query parameters
    const {
      query, price_min, price_max, ram, processor, storage, laptop_model, variant, gen,
      laptop_brand, os, rating_min, sort_by, sort_order, page = 1, limit = 30
    } = req.query;

    // Build the filter object
    const filter = {};

    // Text search across multiple fields if query is provided
    if (query) {
      const terms = query.split(/\s+/).filter(Boolean);
      const fieldsToSearch = [
        'specs.head', 'brand', 'series', 'specs.processor.name', 'specs.processor.variant',
        'specs.processor.gen', 'specs.storage.size', 'specs.storage.type'
      ];

      filter.$and = terms.map(term => ({
        $or: fieldsToSearch.map(field => ({
          [field]: { $regex: term, $options: 'i' }
        }))
      }));
    }

    // Add specific filters
    if (price_min || price_max) {
      // For price, we need to check across all sites
      const priceFilter = [];

      if (price_min) {
        priceFilter.push({ 'sites.price': { $gte: parseFloat(price_min) } });
      }

      if (price_max) {
        priceFilter.push({ 'sites.price': { $lte: parseFloat(price_max) } });
      }

      if (priceFilter.length > 0) {
        filter.$and = filter.$and || [];
        filter.$and.push({ $and: priceFilter });
      }
    }

    if (ram) {
      // Handle multiple RAM options
      const ramOptions = Array.isArray(ram) ? ram : [ram];
      filter['specs.ram.size'] = { $in: ramOptions };
    }

    if (processor) {
      // Handle multiple processor options
      const processorOptions = Array.isArray(processor) ? processor : [processor];
      filter['specs.processor.name'] = { $in: processorOptions.map(p => new RegExp(p, 'i')) };
    }

    if (storage) {
      // Handle multiple storage options
      const storageOptions = Array.isArray(storage) ? storage : [storage];
      // Match either size or type
      filter.$or = [
        { 'specs.storage.size': { $in: storageOptions } },
        { 'specs.storage.type': { $in: storageOptions.map(s => new RegExp(s, 'i')) } }
      ];
    }

    if (variant) {
      // Handle multiple variant options
      const variantOptions = Array.isArray(variant) ? variant : [variant];
      filter['specs.processor.variant'] = { $in: variantOptions.map(v => new RegExp(v, 'i')) };
    }
    if (gen) {
      // Handle multiple generation options   
      const genOptions = Array.isArray(gen) ? gen : [gen];
      filter['specs.processor.gen'] = { $in: genOptions.map(g => new RegExp(g, 'i')) };
    }
    if (laptop_brand) {
      // Handle multiple brand options
      const brandOptions = Array.isArray(laptop_brand) ? laptop_brand : [laptop_brand];
      filter['specs.brand'] = { $in: brandOptions.map(b => new RegExp(b, 'i')) };
    }

    if (laptop_model) {
      // Handle multiple laptop model options
      const modelOptions = Array.isArray(laptop_model) ? laptop_model : [laptop_model];
      filter['specs.head'] = { $in: modelOptions.map(m => new RegExp(m, 'i')) };
    }

    if (os) {
      // Handle multiple OS options
      const osOptions = Array.isArray(os) ? os : [os];
      filter['specs.os'] = { $in: osOptions.map(o => new RegExp(o, 'i')) };
    }

    if (rating_min) {
      // For rating, we need to check across all sites
      filter['sites.rating'] = { $gte: parseFloat(rating_min) };
    }

    // Create sort object
    const sortOptions = {};
    if (sort_by) {
      // Handle sorting for nested fields
      const field = sort_by === 'price' ? 'sites.price' :
        sort_by === 'rating' ? 'sites.rating' : sort_by;
      sortOptions[field] = sort_order === 'desc' ? -1 : 1;
    } else {
      // Default sorting by best rating
      sortOptions['sites.rating'] = -1;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Execute the query
    const laptops = await Laptop.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const totalResults = await Laptop.countDocuments(filter);
    const totalPages = Math.ceil(totalResults / limitNum);

    // Return results
    res.json({
      success: true,
      laptops,
      pagination: {
        total: totalResults,
        page: parseInt(page),
        limit: limitNum,
        totalPages,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (err) {
    console.error('Error in advanced search:', err.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

//Suggestions API(auto complete)
app.get('/api/suggestions', async (req, res) => {
  const query = req.query.query || '';
  try {
    const suggestions = await Laptop.find({
      $or: [
        { 'specs.head': { $regex: query, $options: 'i' } },
        { brand: { $regex: query, $options: 'i' } },
        { series: { $regex: query, $options: 'i' } },
        { 'specs.processor.name': { $regex: query, $options: 'i' } }
      ]
    })
      .limit(30)
      .select('brand series specs.head specs.processor specs.ram specs.storage sites.price specs.details.imageLinks');

    // Transform the results to make them more friendly for frontend consumption
    const formattedSuggestions = suggestions.map(laptop => {
      // Get the lowest price from all sites
      const lowestPrice = laptop.sites && laptop.sites.length > 0
        ? Math.min(...laptop.sites.map(site => site.price))
        : null;

      return {
        id: laptop._id,
        title: laptop.specs.head,
        brand: laptop.brand,
        series: laptop.series,
        processor: `${laptop.specs.processor.name} ${laptop.specs.processor.gen}th Gen`,
        ram: `${laptop.specs.ram.size}GB ${laptop.specs.ram.type.toUpperCase()}`,
        storage: `${laptop.specs.storage.size}GB ${laptop.specs.storage.type.toUpperCase()}`,
        price: lowestPrice,
        image: laptop.specs.details.imageLinks ? laptop.specs.details.imageLinks[0] : null,
      };
    });

    res.json(formattedSuggestions);
  } catch (err) {
    console.error('Error fetching suggestions:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//Notifications for above 30% discount in wishlist
app.get('/api/notifications/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId).populate('favorites');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const notifications = user.favorites
      .filter(laptop => {
        // Check if laptop has sites and at least one site with price and basePrice
        if (laptop.sites && laptop.sites.length > 0) {
          // Calculate discount for each site
          const siteDiscounts = laptop.sites.map(site => {
            if (site.basePrice && site.price) {
              return {
                source: site.source,
                discount: (site.basePrice - site.price) / site.basePrice,
                price: site.price,
                basePrice: site.basePrice
              };
            }
            return null;
          }).filter(Boolean); // Remove null entries

          // If we have valid discount calculations
          if (siteDiscounts.length > 0) {
            // Find the best discount across all sites
            const bestDiscount = siteDiscounts.reduce((best, current) =>
              current.discount > best.discount ? current : best, siteDiscounts[0]);

            // Return true if best discount is >= 30%
            return bestDiscount.discount >= 0.3;
          }
        }
        return false;
      })
      .map(laptop => {
        // Calculate the best discount again for the selected laptops
        const siteDiscounts = laptop.sites
          .filter(site => site.basePrice && site.price)
          .map(site => ({
            source: site.source,
            discount: (site.basePrice - site.price) / site.basePrice,
            price: site.price,
            basePrice: site.basePrice
          }));

        const bestDiscount = siteDiscounts.reduce((best, current) =>
          current.discount > best.discount ? current : best, siteDiscounts[0]);

        return {
          id: laptop._id,
          name: laptop.specs.head,
          brand: laptop.brand,
          currentPrice: bestDiscount.price,
          originalPrice: bestDiscount.basePrice,
          discountPercent: Math.round(bestDiscount.discount * 100),
          source: bestDiscount.source
        };
      });

    res.status(200).json({ success: true, notifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

//Get random laptops from matchLaptop collection
app.get('/api/random', async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 20; // Default to 8 if not specified

    // Validate count parameter
    if (count <= 0 || count > 50) {
      return res.status(400).json({
        success: false,
        message: 'Count must be between 1 and 50'
      });
    }

    // Use aggregation to get random laptops with selected fields
    const randomLaptops = await matchLaptop.aggregate([
      { $sample: { size: count } },
      {
        $project: {
          _id: 1,
          brand: 1,
          series: 1,
          'specs.head': 1,
          'specs.processor': 1,
          'specs.ram': 1,
          'specs.storage': 1,
          'sites': 1,
          'specs.details.imageLinks': 1,
          'allTimeLowPrice': 1
        }
      }
    ]);

    // Format the response data
    const formattedLaptops = randomLaptops.map(laptop => {
      // Extract Amazon and Flipkart prices separately
      let amazonPrice = null;
      let flipkartPrice = null;

      if (laptop.sites && laptop.sites.length > 0) {
        // Find Amazon site data
        const amazonSite = laptop.sites.find(site =>
          site.source && site.source.toLowerCase() === 'amazon');
        if (amazonSite && amazonSite.price) {
          amazonPrice = amazonSite.price;
        }

        // Find Flipkart site data
        const flipkartSite = laptop.sites.find(site =>
          site.source && site.source.toLowerCase() === 'flipkart');
        if (flipkartSite && flipkartSite.price) {
          flipkartPrice = flipkartSite.price;
        }
      }

      // Get images (limit to 2)
      const images = laptop.specs?.details?.imageLinks || [];
      const imageLinks = images.slice(0, 2);

      return {
        id: laptop._id,
        title: laptop.specs?.head || 'Unknown Model',
        brand: laptop.brand || 'Unknown Brand',
        series: laptop.series || 'Unknown Series',
        processor: laptop.specs?.processor ?
          `${laptop.specs.processor.name || ''} ${laptop.specs.processor.gen || ''}${laptop.specs.processor.gen ? 'th Gen' : ''}` :
          'Unknown Processor',
        ram: laptop.specs?.ram ?
          `${laptop.specs.ram.size || ''}${laptop.specs.ram.size ? 'GB' : ''} ${laptop.specs.ram.type?.toUpperCase() || ''}` :
          'Unknown RAM',
        storage: laptop.specs?.storage ?
          `${laptop.specs.storage.size || ''}${laptop.specs.storage.size ? 'GB' : ''} ${laptop.specs.storage.type?.toUpperCase() || ''}` :
          'Unknown Storage',
        amazonPrice: amazonPrice,
        flipkartPrice: flipkartPrice,
        basePrice: laptop.allTimeLowPrice,
        images: imageLinks.length > 0 ? imageLinks : null
      };
    });

    res.status(200).json({
      success: true,
      count: formattedLaptops.length,
      laptops: formattedLaptops
    });
  } catch (err) {
    console.error('Error fetching random laptops:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch random laptops'
    });
  }
});

//Get laptop by id API
app.get('/api/laptop/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const laptop = await Laptop.findById(id);
    if (!laptop) {
      return res.status(404).json({ success: false, message: 'Laptop not found' });
    }
    res.status(200).json({ success: true, laptop });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});





//Comment API
app.post("/api/comment", async (req, res) => {
  const { user, laptop, comment } = req.body;

  if (!user || !laptop || !comment) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  try {
    const newComment = new Comment({ user, laptop, comment });
    await newComment.save();
    res.status(200).json({ success: true, message: "Comment added" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
//Get comments for a laptop API

app.get("/api/comments/:laptopId", async (req, res) => {
  const { laptopId } = req.params;

  if (!laptopId) {
    return res.status(400).json({ success: false, message: "Laptop ID is required" });
  }

  try {
    // Find all comments for this laptop and populate user information
    const comments = await Comment.find({ laptop: laptopId })
      .populate('user', 'username name email') // Get user details but exclude sensitive data
      .sort({ createdAt: -1 }); // Sort by newest first

    res.status(200).json({
      success: true,
      count: comments.length,
      comments
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


//Add to favorites API
app.post('/api/favorites', async (req, res) => {
  const { userId, laptopId } = req.body;
  if (!userId || !laptopId) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const laptop = await Laptop.findById(laptopId);
    if (!laptop) {
      return res.status(404).json({ success: false, message: 'Laptop not found' });
    }
    if (user.favorites.includes(laptopId)) {
      return res.status(400).json({ success: false, message: 'Laptop already in favourites' });
    }
    user.favorites.push(laptopId);
    await user.save();
    res.status(200).json({ success: true, message: 'Laptop added to favourites' });
  }
  catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Servor error' });
  }
});

// Remove from favorites API
app.delete('/api/favorites', async (req, res) => {
  const { userId, laptopId } = req.body;
  if (!userId || !laptopId) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const laptop = await Laptop.findById(laptopId);
    if (!laptop) {
      return res.status(404).json({ success: false, message: 'Laptop not found' });
    }
    if (!user.favorites.includes(laptopId)) {
      return res.status(400).json({ success: false, message: 'Laptop not in favourites' });
    }
    user.favorites = user.favorites.filter(fav => fav.toString() !== laptopId);
    await user.save();
    res.status(200).json({ success: true, message: 'Laptop removed from favourites' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

//Get User Favorites API
app.get('/api/favorites/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId).populate('favorites');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, favorites: user.favorites });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

//Add to history API
app.post('/api/history', async (req, res) => {
  const { userId, laptopId } = req.body;
  if (!userId || !laptopId) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const laptop = await Laptop.findById(laptopId);
    if (!laptop) {
      return res.status(404).json({ success: false, message: 'Laptop not found' });
    }
    if (user.history.includes(laptopId)) {
      return res.status(400).json({ success: false, message: 'Laptop already in history' });
    }
    // user.history.push(laptopId);
    // Add to beginning of history array (most recent first)
    user.history.unshift(laptopId);

    // Limit history to last 20 items
    if (user.history.length > 20) {
      user.history = user.history.slice(0, 20);
    }
    await user.save();
    res.status(200).json({ success: true, message: 'Laptop added to history' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

//Get User History API
app.get('/api/history/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId).populate('history');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, history: user.history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
app.listen(8080, () => {
  console.log('Server Started at port 8080');
});
