const express = require('express');
const mongoose = require('mongoose');
const LaptopData = require('./Data/final_laptops.json');
const matchLaptopData = require('./Data/matched_laptops.json');


const Laptop = require('./model/Laptop.js');
const matchLaptop = require('./model/matchLaptop.js');
const Comment = require('./model/Review.js');

const {AmazonData, FlipkartData} = require('./utils/dataFill.js');

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
connectDB().catch(err=> console.log(err));
async function connectDB(){
    //add your own connection string
    try{
        await mongoose.connect(process.env.Mongo_URL);  
        // console.log(process.env.Mongo_URL);
        console.log('Database Connected');
    }catch(err){
        console.log(err);
    }
}



//api routes

//Authentication API
app.post('/api/register', async(req, res) => {
    try {
        const {email, password, name} = req.body;
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
            if(err) {
                console.log('Login Error', err);
                return res.status(500).json({success: false, message: 'Login Error'});
            }
            res.status(200).json({success: true, message: 'User Registered Successfully'});
        });

    } catch(err) {
        console.log('Registration Error', err);
        
        // Better error handling
        if (err.code === 11000) {
            return res.status(400).json({
                success: false, 
                message: 'Email already in use'
            });
        }
        
        res.status(500).json({success: false, message: err.message || 'Server Error'});
    }
});
//Login API
app.post('/api/login',passport.authenticate('local'),(req,res)=>{

    res.status(200).json({success:true,message:'User Logged In Successfully'});

});
//Logout API
app.get('/api/logout',(req,res)=>{
    req.logout((err)=>{
        if(err){
            console.log('Logout Error',err);
            return res.status(500).json({success:false,message:'Logout Error'});
        }
        res.status(200).json({success:true,message:'User Logged Out Successfully'});
    });
});
//Check Authentication API
app.get('/api/check-auth',(req,res)=>{
    if(req.isAuthenticated()){
        res.status(200).json({success:true,user:req.user});
    }else{
        res.status(401).json({success:false,message:'User Not Authenticated'});
    }
});

//Data filling API


app.get('/api/insertonetime', async(req, res) => {
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
            
            // Fix storage size - convert string with units to number in GB
            if (transformedLaptop.specs && transformedLaptop.specs.storage && 
                typeof transformedLaptop.specs.storage.size === 'string') {
                const sizeStr = transformedLaptop.specs.storage.size;
                
                // Extract numeric part and unit
                const matches = sizeStr.match(/(\d+)\s*(\w+)/);
                if (matches) {
                    const value = parseInt(matches[1], 10);
                    const unit = matches[2].toLowerCase();
                    
                    // Convert to GB
                    if (unit === 'mb') {
                        transformedLaptop.specs.storage.size = value / 1024; // MB to GB
                    } else if (unit === 'tb') {
                        transformedLaptop.specs.storage.size = value * 1024; // TB to GB
                    } else {
                        // Assume GB or unrecognized unit
                        transformedLaptop.specs.storage.size = value;
                    }
                } else {
                    // If format is unexpected, default to 0
                    transformedLaptop.specs.storage.size = 0;
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
        res.status(500).json({success: false, message: 'Error inserting data: ' + err.message});
    }
});

app.get('/api/match/insertonetime', async(req, res) => {
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
            
            // Fix storage size - convert string with units to number in GB
            if (transformedLaptop.specs && transformedLaptop.specs.storage && 
                typeof transformedLaptop.specs.storage.size === 'string') {
                const sizeStr = transformedLaptop.specs.storage.size;
                
                // Extract numeric part and unit
                const matches = sizeStr.match(/(\d+)\s*(\w+)/);
                if (matches) {
                    const value = parseInt(matches[1], 10);
                    const unit = matches[2].toLowerCase();
                    
                    // Convert to GB
                    if (unit === 'mb') {
                        transformedLaptop.specs.storage.size = value / 1024; // MB to GB
                    } else if (unit === 'tb') {
                        transformedLaptop.specs.storage.size = value * 1024; // TB to GB
                    } else {
                        // Assume GB or unrecognized unit
                        transformedLaptop.specs.storage.size = value;
                    }
                } else {
                    // If format is unexpected, default to 0
                    transformedLaptop.specs.storage.size = 0;
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
        res.status(500).json({success: false, message: 'Error inserting data: ' + err.message});
    }
});

//All details API
app.get('/api/search', async (req, res) => {
  const { id, name, price, processor, ram, os, storage, img_link, display, rating, no_of_ratings, no_of_reviews, laptop_brand, os_brand, page = 1 } = req.query;


  let query = {
    ...(id && { laptop_id: id }),
    ...(name && { name }),
    ...(price && { price }),
    ...(processor && { processor }),
    ...(ram && { ram }),
    ...(os && { os }),
    ...(storage && { storage }),
    ...(img_link && { img_link }),
    ...(display && { display }),
    ...(rating && { rating }),
    ...(no_of_ratings && { no_of_ratings }),
    ...(no_of_reviews && { no_of_reviews }),
    ...(laptop_brand && { laptop_brand }),
    ...(os_brand && { os_brand })
  };

  const limit = 50;
  const skip = (page - 1) * limit;

  try {
    const laptops = await Laptop.find(query)
      .limit(limit)
      .skip(skip);

    const totalResults = await Laptop.countDocuments(query); // Get total number of matching documents
    const hasNext = page * limit < totalResults; // Check if there are more results

    res.status(200).json({
      success: true,
      laptops,
      hasNext,
      totalResults,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalResults / limit)
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }

})
//Advaced Search API
app.get('/api/advancedsearch', async (req, res) => {
  try {
    // Extract query parameters
    const { 
      query, price_min, price_max, ram, processor, storage, 
      laptop_brand, os, rating_min, sort_by, sort_order, page = 1, limit = 30 
    } = req.query;

    // Build the filter object
    const filter = {};

    // Text search across multiple fields if query is provided
    if (query) {
      const terms = query.split(/\s+/).filter(Boolean);
      const fieldsToSearch = [
        'name', 'ram', 'processor', 'os', 'storage',
        'laptop_brand', 'os_brand', 'processor_brand', 'usecases'
      ];

      filter.$and = terms.map(term => ({
        $or: fieldsToSearch.map(field => ({
          [field]: { $regex: term, $options: 'i' }
        }))
      }));
    }

    // Add specific filters
    if (price_min || price_max) {
      filter.price = {};
      if (price_min) filter.price.$gte = parseFloat(price_min);
      if (price_max) filter.price.$lte = parseFloat(price_max);
    }

    if (ram) {
      // Handle multiple RAM options
      const ramOptions = Array.isArray(ram) ? ram : [ram];
      filter.ram = { $in: ramOptions.map(r => new RegExp(r, 'i')) };
    }

    if (processor) {
      // Handle multiple processor options
      const processorOptions = Array.isArray(processor) ? processor : [processor];
      filter.processor = { $in: processorOptions.map(p => new RegExp(p, 'i')) };
    }

    if (storage) {
      // Handle multiple storage options
      const storageOptions = Array.isArray(storage) ? storage : [storage];
      filter.storage = { $in: storageOptions.map(s => new RegExp(s, 'i')) };
    }

    if (laptop_brand) {
      // Handle multiple brand options
      const brandOptions = Array.isArray(laptop_brand) ? laptop_brand : [laptop_brand];
      filter.laptop_brand = { $in: brandOptions.map(b => new RegExp(b, 'i')) };
    }

    if (os) {
      // Handle multiple OS options
      const osOptions = Array.isArray(os) ? os : [os];
      filter.os = { $in: osOptions.map(o => new RegExp(o, 'i')) };
    }

    if (rating_min) {
      filter.rating = { $gte: parseFloat(rating_min) };
    }

    // Create sort object
    const sortOptions = {};
    if (sort_by) {
      sortOptions[sort_by] = sort_order === 'desc' ? -1 : 1;
    } else {
      // Default sorting
      sortOptions.rating = -1;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Execute the query
    const laptops = await Laptop.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .select('name laptop_id img_link price processor ram storage rating laptop_brand os');

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
    res.status(500).json({ success: false, error: 'Internal server error' });
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
//Filer API
app.get('/api/filter', async (req, res) => {
  const { processor, ram, os, storage, price } = req.query;

  let filter = {};

  if (processor) {
    filter.processor = { $regex: processor, $options: 'i' };
  }
  if (ram) {
    filter.ram = { $regex: ram, $options: 'i' };
  }
  if (os) {
    filter.os = { $regex: os, $options: 'i' };
  }
  if (storage) {
    filter.storage = { $regex: storage, $options: 'i' };
  }
  if (price) {
    const [minPrice, maxPrice] = price.split('-').map(Number);
    filter.price = { $gte: minPrice, $lte: maxPrice };
  }
  try {
    const laptops = await Laptop.find(filter);
    res.status(200).json({ success: true, laptops });
  } catch (err) {
    console.error('Error fetching filtered laptops:', err.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

//Get User API

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

//Add to favorites API
app.post('/api/favorites', async (req, res) => {
  const { userId, laptopId} = req.body;
  if (!userId || !laptopId) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }
  try {
    const user=await User.findById(userId);
    if(!user){
      return res.status(404).json({ success: false, message: 'User not found'});
    }
    const laptop = await Laptop.findById(laptopId);
    if(!laptop){
      return res.status(404).json({ success: false, message: 'Laptop not found'});
    }
    if(user.favorites.includes(laptopId)){
      return res.status(400).json({success: false, message: 'Laptop already in favourites'});
    }
    user.favorites.push(laptopId);
    await user.save();
    res.status(200).json({ success: true, message: 'Laptop added to favourites' });
  }
  catch (err){
    console.error(err);
    res.status(500).json({ success: false, message: 'Servor error'});
  }
});

// Remove from favorites API
app.delete('/api/favorites', async (req, res) => {
  const {userId, laptopId} = req.body;
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
  const {userId, laptopId} = req.body;
  if(!userId || !laptopId) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }
  try {
    const user = await User.findById(userId);
    if(!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const laptop = await Laptop.findById(laptopId);
    if(!laptop) {
      return res.status(404).json({ success: false, message: 'Laptop not found' });
    }
    if(user.history.includes(laptopId)) {
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
})
