const express = require("express");
const mongoose = require("mongoose");
const LaptopData = require("./Data/final_laptops.json");
const matchLaptopData = require("./Data/matched_laptops.json");

// Configuration constants
const MAX_HISTORY_ITEMS = 9; // Maximum number of laptops to keep in user history (7-9 range)

const Laptop = require("./model/Laptop.js");
const matchLaptop = require("./model/matchLaptop.js");
const Comment = require("./model/Review.js");

const { AmazonData, FlipkartData } = require("./utils/dataFill.js");

// const amazonData = require('./Data/amazon_complete_data.json');
// const flipkartData = require('./Data/flipkart_complete_data.json');

const path = require("path");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./model/users.js");
//.env
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const cors = require("cors");

// const PORT = process.env.PORT || 8080;
const corsOptions = {
  origin: ["http://localhost:5173", "https://laptop-compare.vercel.app"],
  credentials: true,
};

const app = express();

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Seassion and Passport setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || "laptop-compare-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
      maxAge: 1000 * 60 * 60 * 24 * 7,
    }, // Set to true if using HTTPS
  })
);

app.use(passport.initialize());
app.use(passport.session());
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
    },
    User.authenticate()
  )
);
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//MongoDB connection
connectDB().catch((err) => console.log(err));
async function connectDB() {
  //add your own connection string
  try {
    await mongoose.connect(process.env.Mongo_URL);
    // console.log(process.env.Mongo_URL);
    console.log("Database Connected");
  } catch (err) {
    console.log(err);
  }
}

//api routes

//Authentication API
app.post("/api/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    console.log(email, password, name);

    // Check if username already exists
    const existingUser = await User.findOne({ username: email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Username already exists",
      });
    }

    // Create user with both username and email set
    const user = new User({
      username: email,
      email: email, // Add this line to set the email field
      name: name,
    });

    const registeredUser = await User.register(user, password);

    req.login(registeredUser, (err) => {
      if (err) {
        console.log("Login Error", err);
        return res.status(500).json({ success: false, message: "Login Error" });
      }
      res.status(200).json({
        success: true,
        message: "User Registered Successfully",
        user: {
          id: registeredUser._id,
          name: registeredUser.name,
          email: registeredUser.email,
        },
      });
    });
  } catch (err) {
    console.log("Registration Error", err);

    // Better error handling
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already in use",
      });
    }

    res
      .status(500)
      .json({ success: false, message: err.message || "Server Error" });
  }
});
//Login API
app.post("/api/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error("Login error:", err);
      return res.status(500).json({
        success: false,
        message: "Server error during login",
      });
    }

    if (!user) {
      console.log("Login failed - invalid credentials:", info);
      return res.status(401).json({
        success: false,
        message: info?.message || "Invalid email or password",
      });
    }

    req.logIn(user, (err) => {
      if (err) {
        console.error("Session error:", err);
        return res.status(500).json({
          success: false,
          message: "Error creating session",
        });
      }

      return res.status(200).json({
        success: true,
        message: "User Logged In Successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });
    });
  })(req, res, next);
});
//Logout API
app.get("/api/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.log("Logout Error", err);
      return res.status(500).json({ success: false, message: "Logout Error" });
    }
    res
      .status(200)
      .json({ success: true, message: "User Logged Out Successfully" });
  });
});
//Check Authentication API
app.get("/api/check-auth", (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json({
      authenticated: true,
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
      },
    });
  } else {
    res.status(401).json({
      authenticated: false,
      success: false,
      message: "User Not Authenticated",
    });
  }
});

//Data filling API

app.get("/api/insertonetime", async (req, res) => {
  try {
    // Clean and transform the data to match schema requirements
    const cleanedData = LaptopData.map((laptop) => {
      // Make sure we have required fields
      if (!laptop.brand || !laptop.series) {
        console.log(
          "Missing required fields for laptop:",
          laptop.specs?.head || "unknown"
        );
        // Set default values for required fields
        laptop.brand = laptop.brand || "Unknown Brand";
        laptop.series = laptop.series || "Unknown Series";
      }

      const transformedLaptop = { ...laptop };

      // Fix specs.touch - convert string values to boolean
      if (
        transformedLaptop.specs &&
        typeof transformedLaptop.specs.touch === "string"
      ) {
        const touchValue = transformedLaptop.specs.touch.trim().toLowerCase();
        if (
          touchValue === "" ||
          touchValue === "no" ||
          touchValue === "false" ||
          touchValue === "n/a"
        ) {
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
        transformedLaptop.sites = transformedLaptop.sites.map((site) => {
          const updatedSite = { ...site };
          // Convert comma-separated numbers to plain numbers
          if (typeof updatedSite.ratingCount === "string") {
            updatedSite.ratingCount =
              updatedSite.ratingCount === "N/A"
                ? 0
                : parseInt(updatedSite.ratingCount.replace(/,/g, ""));
          }
          return updatedSite;
        });
      }

      // Fix specs.ratingCount if it exists
      if (
        transformedLaptop.specs &&
        typeof transformedLaptop.specs.ratingCount === "string"
      ) {
        transformedLaptop.specs.ratingCount =
          transformedLaptop.specs.ratingCount === "N/A"
            ? 0
            : parseInt(transformedLaptop.specs.ratingCount.replace(/,/g, ""));
      }

      // Ensure RAM size is a number
      if (
        transformedLaptop.specs &&
        transformedLaptop.specs.ram &&
        typeof transformedLaptop.specs.ram.size === "string"
      ) {
        transformedLaptop.specs.ram.size = parseInt(
          transformedLaptop.specs.ram.size,
          10
        );
      }

      // Convert displayInch to number if it's a string
      if (
        transformedLaptop.specs &&
        typeof transformedLaptop.specs.displayInch === "string"
      ) {
        transformedLaptop.specs.displayInch = parseFloat(
          transformedLaptop.specs.displayInch
        );
      }

      return transformedLaptop;
    });

    console.log(`Attempting to insert ${cleanedData.length} laptops`);

    // Log the first item to inspect its structure
    console.log(
      "Sample item structure:",
      JSON.stringify(cleanedData[0], null, 2)
    );

    await Laptop.insertMany(cleanedData, { ordered: false });

    res.status(200).json({
      success: true,
      message: `Successfully inserted ${cleanedData.length} laptops`,
      total: LaptopData.length,
    });
  } catch (err) {
    console.error("Error inserting data:", err);
    res.status(500).json({
      success: false,
      message: "Error inserting data: " + err.message,
    });
  }
});

app.get("/api/match/insertonetime", async (req, res) => {
  try {
    // Clean and transform the data to match schema requirements
    const cleanedData = matchLaptopData.map((laptop) => {
      // Make sure we have required fields
      if (!laptop.brand || !laptop.series) {
        console.log(
          "Missing required fields for laptop:",
          laptop.specs?.head || "unknown"
        );
        // Set default values for required fields
        laptop.brand = laptop.brand || "Unknown Brand";
        laptop.series = laptop.series || "Unknown Series";
      }

      const transformedLaptop = { ...laptop };

      // Fix specs.touch - convert string values to boolean
      if (
        transformedLaptop.specs &&
        typeof transformedLaptop.specs.touch === "string"
      ) {
        const touchValue = transformedLaptop.specs.touch.trim().toLowerCase();
        if (
          touchValue === "" ||
          touchValue === "no" ||
          touchValue === "false" ||
          touchValue === "n/a"
        ) {
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
        transformedLaptop.sites = transformedLaptop.sites.map((site) => {
          const updatedSite = { ...site };
          // Convert comma-separated numbers to plain numbers
          if (typeof updatedSite.ratingCount === "string") {
            updatedSite.ratingCount =
              updatedSite.ratingCount === "N/A"
                ? 0
                : parseInt(updatedSite.ratingCount.replace(/,/g, ""));
          }
          return updatedSite;
        });
      }

      // Fix specs.ratingCount if it exists
      if (
        transformedLaptop.specs &&
        typeof transformedLaptop.specs.ratingCount === "string"
      ) {
        transformedLaptop.specs.ratingCount =
          transformedLaptop.specs.ratingCount === "N/A"
            ? 0
            : parseInt(transformedLaptop.specs.ratingCount.replace(/,/g, ""));
      }

      // Ensure RAM size is a number
      if (
        transformedLaptop.specs &&
        transformedLaptop.specs.ram &&
        typeof transformedLaptop.specs.ram.size === "string"
      ) {
        transformedLaptop.specs.ram.size = parseInt(
          transformedLaptop.specs.ram.size,
          10
        );
      }

      // Convert displayInch to number if it's a string
      if (
        transformedLaptop.specs &&
        typeof transformedLaptop.specs.displayInch === "string"
      ) {
        transformedLaptop.specs.displayInch = parseFloat(
          transformedLaptop.specs.displayInch
        );
      }

      return transformedLaptop;
    });

    console.log(`Attempting to insert ${cleanedData.length} laptops`);

    // Log the first item to inspect its structure
    console.log(
      "Sample item structure:",
      JSON.stringify(cleanedData[0], null, 2)
    );

    await matchLaptop.insertMany(cleanedData, { ordered: false });

    res.status(200).json({
      success: true,
      message: `Successfully inserted ${cleanedData.length} laptops`,
      total: matchLaptopData.length,
    });
  } catch (err) {
    console.error("Error inserting data:", err);
    res.status(500).json({
      success: false,
      message: "Error inserting data: " + err.message,
    });
  }
});

//All details API

//Advaced Search API
app.get("/api/advancedsearch", async (req, res) => {
  try {
    // Extract query parameters
    const {
      query,
      price_min,
      price_max,
      ram,
      processor,
      storage,
      gpu,
      screen_size,
      laptop_model,
      variant,
      gen,
      laptop_brand,
      os,
      rating_min,
      sort_by,
      sort_order,
      page = 1,
      limit = 30,
    } = req.query;

    // Build the filter object
    const filter = {};

    // Text search across multiple fields if query is provided
    if (query) {
      const terms = query.split(/\s+/).filter(Boolean);
      const fieldsToSearch = [
        "specs.head",
        "brand",
        "specs.gpu",
        "series",
        "specs.processor.name",
        "specs.processor.variant",
        "specs.processor.gen", // String field - safe for regex
        "specs.storage.type", // Keep storage type (string) but remove storage size (number)
        "specs.ram.type" // Add RAM type for better search
      ];

      filter.$and = terms.map((term) => ({
        $or: fieldsToSearch.map((field) => ({
          [field]: { $regex: term, $options: "i" },
        })),
      }));
    }

    // Add specific filters
    if (price_min || price_max) {
      // For price, we need to check across all sites
      const priceFilter = [];

      if (price_min) {
        priceFilter.push({ allTimeLowPrice: { $gte: parseFloat(price_min) } });
      }

      if (price_max) {
        priceFilter.push({ allTimeLowPrice: { $lte: parseFloat(price_max) } });
      }

      if (priceFilter.length > 0) {
        filter.$and = filter.$and || [];
        filter.$and.push({ $and: priceFilter });
      }
    }

    // Filter out laptops with price greater than 7 lakh (700000)
    filter.$and = filter.$and || [];
    filter.$and.push({ "sites.price": { $lte: 700000 } });

    if (ram) {
      // Handle multiple RAM options
      const ramOptions = Array.isArray(ram) ? ram : [ram];
      filter["specs.ram.size"] = { $in: ramOptions };
    }

    if (processor) {
      // Handle multiple processor options
      const processorOptions = Array.isArray(processor)
        ? processor
        : [processor];
      filter["specs.processor.name"] = {
        $in: processorOptions.map((p) => new RegExp(p, "i")),
      };
    }

    if (storage) {
      // Handle multiple storage options
      const storageOptions = Array.isArray(storage) ? storage : [storage];

      const storageConditions = [];

      storageOptions.forEach((option) => {
        // First, check if it's a storage type (SSD, HDD)
        if (
          typeof option === "string" &&
          option.match(/^(ssd|hdd|nvme|emmc)$/i)
        ) {
          storageConditions.push({
            "specs.storage.type": new RegExp(option, "i"),
          });
          return; // Skip the rest of processing for type-specific options
        }

        // Try to extract numeric value
        const numericValue = parseInt(option);

        // If it's a valid number, create storage size conditions
        if (!isNaN(numericValue)) {
          // Logic for TB vs GB:
          // - If value < 10, treat as TB (convert to GB for query)
          // - Otherwise treat as GB directly
          if (numericValue < 10) {
            // This is likely a TB value (1TB, 2TB)
            storageConditions.push(
              // Match direct TB values stored as single digits
              { "specs.storage.size": numericValue },
              // Match TB values stored in GB (1TB = 1024GB)
              { "specs.storage.size": numericValue * 1024 },
              // Match as string (just in case)
              { "specs.storage.size": numericValue.toString() }
            );
          } else {
            // This is likely a GB value (128GB, 256GB, 512GB)
            storageConditions.push(
              { "specs.storage.size": numericValue },
              { "specs.storage.size": numericValue.toString() }
            );
          }
        } else if (typeof option === "string") {
          // For non-numeric strings (but not empty), search for pattern matches in type field
          // but avoid treating single characters as storage values (like "i")
          if (option.length > 1) {
            storageConditions.push({
              "specs.storage.type": new RegExp(option, "i"),
            });
          }
        }
      });

      if (storageConditions.length > 0) {
        filter.$and = filter.$and || [];
        filter.$and.push({ $or: storageConditions });
      }
    }

    if (gpu) {
      // Handle multiple GPU options
      const gpuOptions = Array.isArray(gpu) ? gpu : [gpu];
      filter["specs.gpu"] = { $in: gpuOptions.map((g) => new RegExp(g, "i")) };
    }

    if (screen_size) {
      // Handle multiple screen size options
      const screenSizeOptions = Array.isArray(screen_size)
        ? screen_size
        : [screen_size];
      const sizeConditions = [];

      screenSizeOptions.forEach((size) => {
        const numSize = parseFloat(size);
        if (!isNaN(numSize)) {
          // Convert from CM to inches if the value seems to be in CM (> 50)
          const sizeInInches = numSize > 30 ? numSize / 2.54 : numSize;

          if (sizeInInches >= 17) {
            // For 17+ inch, match anything >= 17 (including CM values)
            sizeConditions.push(
              { "specs.displayInch": { $gte: 17 } },
              { "specs.displayInch": { $gte: 43.18 } } // 17 inches in CM
            );
          } else {
            // For specific sizes, match exactly or within a small range (both inches and CM)
            sizeConditions.push(
              {
                "specs.displayInch": {
                  $gte: sizeInInches - 0.2,
                  $lte: sizeInInches + 0.2,
                },
              },
              {
                "specs.displayInch": {
                  $gte: sizeInInches * 2.54 - 0.5, // CM equivalent with tolerance
                  $lte: sizeInInches * 2.54 + 0.5,
                },
              }
            );
          }
        }
      });

      if (sizeConditions.length > 0) {
        filter.$and = filter.$and || [];
        filter.$and.push({ $or: sizeConditions });
      }
    }

    if (variant) {
      // Handle multiple variant options
      const variantOptions = Array.isArray(variant) ? variant : [variant];
      filter["specs.processor.variant"] = {
        $in: variantOptions.map((v) => new RegExp(v, "i")),
      };
    }
    if (gen) {
      // Handle multiple generation options
      const genOptions = Array.isArray(gen) ? gen : [gen];
      filter["specs.processor.gen"] = {
        $in: genOptions.map((g) => new RegExp(g, "i")),
      };
    }
    if (laptop_brand) {
      // Handle multiple brand options
      const brandOptions = Array.isArray(laptop_brand)
        ? laptop_brand
        : [laptop_brand];
      filter["specs.brand"] = {
        $in: brandOptions.map((b) => new RegExp(b, "i")),
      };
    }

    if (laptop_model) {
      // Handle multiple laptop model options
      const modelOptions = Array.isArray(laptop_model)
        ? laptop_model
        : [laptop_model];
      filter["specs.head"] = {
        $in: modelOptions.map((m) => new RegExp(m, "i")),
      };
    }

    if (os) {
      // Handle multiple OS options
      const osOptions = Array.isArray(os) ? os : [os];
      filter["specs.os"] = { $in: osOptions.map((o) => new RegExp(o, "i")) };
    }

    if (rating_min) {
      // For rating, we need to check across all sites
      filter["sites.rating"] = { $gte: parseFloat(rating_min) };
    }

    // Create sort object
    const sortOptions = {};
    if (sort_by) {
      // Handle sorting for nested fields
      const field =
        sort_by === "price"
          ? "sites.price"
          : sort_by === "rating"
            ? "sites.rating"
            : sort_by;
      sortOptions[field] = sort_order === "desc" ? -1 : 1;
    } else {
      // Default sorting by best rating
      sortOptions["sites.rating"] = -1;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Execute the query with extra results to account for deduplication
    const laptops = await Laptop.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum * 3); // Get 3x more results to account for duplicates

    // Enhanced deduplication algorithm - more aggressive duplicate removal
    const uniqueLaptops = [];
    const seenLaptops = new Set();
    const seenTitles = new Map(); // Track similar titles

    for (const laptop of laptops) {
      // Normalize and create a reliable unique key
      const normalizeText = (text) => {
        if (!text) return "unknown";
        return text.toString().toLowerCase()
          .replace(/[^\w\s]/g, "") // Remove special characters
          .replace(/\s+/g, " ")    // Normalize spaces
          .trim();
      };

      // Create a more reliable unique key using normalized values
      const brand = normalizeText(laptop.specs?.brand || laptop.brand);
      const model = normalizeText(laptop.specs?.head);
      const processor = normalizeText(laptop.specs?.processor?.name || laptop.specs?.processor);
      const ram = normalizeText(laptop.specs?.ram?.size || laptop.specs?.ram);
      const storage = normalizeText(laptop.specs?.storage?.size || laptop.specs?.storage);
      const gpu = normalizeText(laptop.specs?.gpu);
      const display = normalizeText(laptop.specs?.display?.size);

      // Create unique key with consistent ordering
      const uniqueKey = `${brand}|${model}|${processor}|${ram}|${storage}|${gpu}|${display}`;

      // Check for similar titles to catch more duplicates
      const modelWords = model.split(' ').filter(word => word.length > 2);
      let isDuplicateTitle = false;

      for (const [existingTitle, existingBrand] of seenTitles.entries()) {
        if (existingBrand === brand) {
          const existingWords = existingTitle.split(' ').filter(word => word.length > 2);
          const commonWords = modelWords.filter(word => existingWords.includes(word));

          // If more than 60% of significant words match, consider it a duplicate
          if (commonWords.length / Math.max(modelWords.length, existingWords.length) > 0.6) {
            isDuplicateTitle = true;
            break;
          }
        }
      }

      // Additional check: if model names are very similar (>85% similarity), consider them duplicates
      const isDuplicate = Array.from(seenLaptops).some(existingKey => {
        const similarity = calculateStringSimilarity(uniqueKey, existingKey);
        return similarity > 0.85; // 85% similarity threshold
      });

      if (!seenLaptops.has(uniqueKey) && !isDuplicate && !isDuplicateTitle) {
        seenLaptops.add(uniqueKey);
        seenTitles.set(model, brand);
        uniqueLaptops.push(laptop);

        // Stop when we have enough unique results
        if (uniqueLaptops.length >= limitNum) {
          break;
        }
      }
    }

    // Helper function to calculate string similarity
    function calculateStringSimilarity(str1, str2) {
      const longer = str1.length > str2.length ? str1 : str2;
      const shorter = str1.length > str2.length ? str2 : str1;

      if (longer.length === 0) return 1.0;

      const matches = longer.length - editDistance(longer, shorter);
      return matches / longer.length;
    }

    // Levenshtein distance algorithm
    function editDistance(str1, str2) {
      const matrix = [];

      for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
      }

      for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
      }

      for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
          if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
          }
        }
      }

      return matrix[str2.length][str1.length];
    }

    // Get total count for pagination
    const totalResults = await Laptop.countDocuments(filter);
    const totalPages = Math.ceil(totalResults / limitNum);

    // Return results
    res.json({
      success: true,
      laptops: uniqueLaptops,
      pagination: {
        total: totalResults,
        page: parseInt(page),
        limit: limitNum,
        totalPages,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1,
      },
    });
  } catch (err) {
    console.error("Error in advanced search:", err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

//Suggestions API(auto complete) with pagination
app.get("/api/suggestions", async (req, res) => {
  const query = req.query.query || "";
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 30;
  const skip = (page - 1) * limit;

  try {
    // First, get total count for pagination metadata
    const totalCount = await Laptop.countDocuments({
      $or: [
        { "specs.head": { $regex: query, $options: "i" } },
        { brand: { $regex: query, $options: "i" } },
        { series: { $regex: query, $options: "i" } },
        { "specs.processor.name": { $regex: query, $options: "i" } },
      ],
    });

    // Then fetch the paginated results
    const suggestions = await Laptop.find({
      $or: [
        { "specs.head": { $regex: query, $options: "i" } },
        { brand: { $regex: query, $options: "i" } },
        { series: { $regex: query, $options: "i" } },
        { "specs.processor.name": { $regex: query, $options: "i" } },
      ],
    })
      .skip(skip)
      .limit(limit * 3) // Fetch more to account for duplicates that will be removed
      .select(
        "brand series specs.head specs.processor specs.ram specs.storage specs.gpu specs.display sites specs.details.imageLinks"
      );

    // Apply enhanced deduplication to suggestions
    const uniqueSuggestions = [];
    const seenSuggestions = new Set();
    const seenTitles = new Map(); // Track seen titles by brand

    // Normalize text for comparison
    const normalizeText = (text) => {
      if (!text) return "unknown";
      return text.toString().toLowerCase()
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    };

    // String similarity function
    const calculateSimilarity = (str1, str2) => {
      const len1 = str1.length;
      const len2 = str2.length;
      const matrix = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(0));

      for (let i = 0; i <= len1; i++) matrix[i][0] = i;
      for (let j = 0; j <= len2; j++) matrix[0][j] = j;

      for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
          if (str1[i - 1] === str2[j - 1]) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j - 1] + 1
            );
          }
        }
      }

      const maxLen = Math.max(len1, len2);
      return maxLen === 0 ? 1 : (maxLen - matrix[len1][len2]) / maxLen;
    };

    // Check for title similarity within same brand
    const checkTitleSimilarity = (title, brand) => {
      if (!seenTitles.has(brand)) return false;

      const seenTitlesForBrand = seenTitles.get(brand);
      const titleWords = title.split(' ');

      for (const seenTitle of seenTitlesForBrand) {
        const seenWords = seenTitle.split(' ');
        const commonWords = titleWords.filter(word =>
          seenWords.some(seenWord => seenWord.includes(word) || word.includes(seenWord))
        );

        // If 60% or more words are similar, consider it a duplicate
        if (commonWords.length / Math.max(titleWords.length, seenWords.length) >= 0.6) {
          return true;
        }
      }
      return false;
    };

    for (const laptop of suggestions) {
      // Create unique key with all available specs
      const brand = normalizeText(laptop.brand);
      const model = normalizeText(laptop.specs?.head);
      const processor = normalizeText(laptop.specs?.processor?.name);
      const ram = normalizeText(laptop.specs?.ram?.size);
      const storage = normalizeText(laptop.specs?.storage?.size);
      const gpu = normalizeText(laptop.specs?.gpu);
      const display = normalizeText(laptop.specs?.display?.size);

      const uniqueKey = `${brand}|${model}|${processor}|${ram}|${storage}|${gpu}|${display}`;

      // Check for string similarity duplicates
      let isDuplicate = false;
      for (const seenKey of seenSuggestions) {
        if (calculateSimilarity(uniqueKey, seenKey) > 0.85) {
          isDuplicate = true;
          break;
        }
      }

      // Check for title similarity within same brand
      const isDuplicateTitle = checkTitleSimilarity(model, brand);

      if (!seenSuggestions.has(uniqueKey) && !isDuplicate && !isDuplicateTitle) {
        seenSuggestions.add(uniqueKey);
        uniqueSuggestions.push(laptop);

        // Track seen titles by brand
        if (!seenTitles.has(brand)) {
          seenTitles.set(brand, []);
        }
        seenTitles.get(brand).push(model);

        // Stop when we have enough unique results
        if (uniqueSuggestions.length >= limit) {
          break;
        }
      }
    }

    // Transform the unique results to make them more friendly for frontend consumption
    const formattedSuggestions = uniqueSuggestions.map((laptop) => {
      // Get the lowest price from all sites
      const lowestPrice =
        laptop.sites && laptop.sites.length > 0
          ? Math.min(
            ...laptop.sites
              .map((site) => site.price || Infinity)
              .filter((price) => price !== Infinity)
          )
          : null;

      // Get the best rating from all sites and details from that site
      let bestRating = null;
      let bestRatingReviews = 0;
      let bestRatingSite = null;
      if (laptop.sites && laptop.sites.length > 0) {
        const sitesWithRatings = laptop.sites.filter(site => site.rating && site.rating > 0);
        if (sitesWithRatings.length > 0) {
          // Find the site with the highest rating
          const bestSite = sitesWithRatings.reduce((best, current) => {
            return current.rating > best.rating ? current : best;
          });

          bestRating = bestSite.rating;
          bestRatingSite = bestSite.source;

          // Get review count from the best rated site
          if (bestSite.ratingCount && bestSite.ratingCount !== "N/A") {
            const count = typeof bestSite.ratingCount === 'string'
              ? parseInt(bestSite.ratingCount.replace(/,/g, ""))
              : bestSite.ratingCount;
            if (!isNaN(count) && count > 0) {
              bestRatingReviews = count;
            }
          }
        }
      }

      // Add null checks to prevent errors with missing data
      return {
        id: laptop._id,
        title: laptop.specs?.head || "Unknown Model",
        brand: laptop.brand || "Unknown Brand",
        series: laptop.series || "Unknown Series",
        processor: laptop.specs?.processor
          ? `${laptop.specs.processor.name || ""} ${laptop.specs.processor.gen || ""
          }${laptop.specs.processor.gen ? "th Gen" : ""}`
          : "Unknown Processor",
        ram: laptop.specs?.ram
          ? `${laptop.specs.ram.size || ""}${laptop.specs.ram.size ? "GB" : ""
          } ${laptop.specs.ram.type?.toUpperCase() || ""}`
          : "Unknown RAM",
        storage: laptop.specs?.storage
          ? `${laptop.specs.storage.size || ""}${laptop.specs.storage.size ? "GB" : ""
          } ${laptop.specs.storage.type?.toUpperCase() || ""}`
          : "Unknown Storage",
        price: lowestPrice,
        rating: bestRating,
        reviewCount: bestRatingReviews,
        bestRatingSite: bestRatingSite,
        sites: laptop.sites || [],
        image: laptop.specs?.details?.imageLinks?.[0] || null,
      };
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      suggestions: formattedSuggestions,
      pagination: {
        total: totalCount,
        page: page,
        limit: limit,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    console.error("Error fetching suggestions:", err.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

//Notifications for above 30% discount in wishlist
app.get("/api/notifications/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId).populate("favorites");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const notifications = user.favorites
      .filter((laptop) => {
        // Check if laptop has sites and at least one site with price and basePrice
        if (laptop.sites && laptop.sites.length > 0) {
          // Calculate discount for each site
          const siteDiscounts = laptop.sites
            .map((site) => {
              if (site.basePrice && site.price) {
                return {
                  source: site.source,
                  discount: (site.basePrice - site.price) / site.basePrice,
                  price: site.price,
                  basePrice: site.basePrice,
                };
              }
              return null;
            })
            .filter(Boolean); // Remove null entries

          // If we have valid discount calculations
          if (siteDiscounts.length > 0) {
            // Find the best discount across all sites
            const bestDiscount = siteDiscounts.reduce(
              (best, current) =>
                current.discount > best.discount ? current : best,
              siteDiscounts[0]
            );

            // Return true if best discount is >= 30%
            return bestDiscount.discount >= 0.3;
          }
        }
        return false;
      })
      .map((laptop) => {
        // Calculate the best discount again for the selected laptops
        const siteDiscounts = laptop.sites
          .filter((site) => site.basePrice && site.price)
          .map((site) => ({
            source: site.source,
            discount: (site.basePrice - site.price) / site.basePrice,
            price: site.price,
            basePrice: site.basePrice,
          }));

        const bestDiscount = siteDiscounts.reduce(
          (best, current) =>
            current.discount > best.discount ? current : best,
          siteDiscounts[0]
        );

        return {
          id: laptop._id,
          name: laptop.specs.head,
          brand: laptop.brand,
          currentPrice: bestDiscount.price,
          originalPrice: bestDiscount.basePrice,
          discountPercent: Math.round(bestDiscount.discount * 100),
          source: bestDiscount.source,
        };
      });

    res.status(200).json({ success: true, notifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

//Get random laptops from matchLaptop collection
app.get("/api/random", async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 20; // Default to 20 if not specified

    // Validate count parameter
    if (count <= 0 || count > 50) {
      return res.status(400).json({
        success: false,
        message: "Count must be between 1 and 50",
      });
    }

    // Use aggregation to get random laptops with selected fields
    // Filter to only include laptops with exactly 2 sites (both Amazon and Flipkart)
    const randomLaptops = await Laptop.aggregate([
      {
        $match: {
          $expr: { $eq: [{ $size: "$sites" }, 2] }, // Only laptops with exactly 2 sites
          "sites.source": { $all: ["amazon", "flipkart"] }, // Must have both Amazon and Flipkart
        },
      },
      { $sample: { size: count } },
      {
        $project: {
          _id: 1,
          brand: 1,
          series: 1,
          "specs.head": 1,
          "specs.processor": 1,
          "specs.ram": 1,
          "specs.storage": 1,
          sites: 1,
          "specs.details.imageLinks": 1,
          allTimeLowPrice: 1,
        },
      },
    ]);

    // Format the response data
    const formattedLaptops = randomLaptops.map((laptop) => {
      // Extract Amazon and Flipkart data separately
      let amazonPrice = null;
      let amazonRating = null;
      let amazonUrl = null;
      let flipkartPrice = null;
      let flipkartRating = null;
      let flipkartUrl = null;

      if (laptop.sites && laptop.sites.length > 0) {
        // Find Amazon site data
        const amazonSite = laptop.sites.find(
          (site) => site.source && site.source.toLowerCase() === "amazon"
        );
        if (amazonSite) {
          amazonPrice = amazonSite.price;
          amazonRating = amazonSite.rating;
          amazonUrl = amazonSite.link;
        }

        // Find Flipkart site data
        const flipkartSite = laptop.sites.find(
          (site) => site.source && site.source.toLowerCase() === "flipkart"
        );
        if (flipkartSite) {
          flipkartPrice = flipkartSite.price;
          flipkartRating = flipkartSite.rating;
          flipkartUrl = flipkartSite.link;
        }
      }

      // Get images (limit to 2)
      const images = laptop.specs?.details?.imageLinks || [];
      const imageLinks = images.slice(0, 2);

      return {
        id: laptop._id,
        title: laptop.specs?.head || "Unknown Model",
        brand: laptop.brand || "Unknown Brand",
        series: laptop.series || "Unknown Series",
        processor: laptop.specs?.processor
          ? `${laptop.specs.processor.name || ""} ${laptop.specs.processor.gen || ""
          }${laptop.specs.processor.gen ? "th Gen" : ""}`
          : "Unknown Processor",
        ram: laptop.specs?.ram
          ? `${laptop.specs.ram.size || ""}${laptop.specs.ram.size ? "GB" : ""
          } ${laptop.specs.ram.type?.toUpperCase() || ""}`
          : "Unknown RAM",
        storage: laptop.specs?.storage
          ? `${laptop.specs.storage.size || ""}${laptop.specs.storage.size ? "GB" : ""
          } ${laptop.specs.storage.type?.toUpperCase() || ""}`
          : "Unknown Storage",
        amazonPrice: amazonPrice,
        amazonRating: amazonRating,
        amazonUrl: amazonUrl,
        flipkartPrice: flipkartPrice,
        flipkartRating: flipkartRating,
        flipkartUrl: flipkartUrl,
        basePrice: laptop.allTimeLowPrice,
        images: imageLinks.length > 0 ? imageLinks : null,
      };
    });

    res.status(200).json({
      success: true,
      count: formattedLaptops.length,
      laptops: formattedLaptops,
    });
  } catch (err) {
    console.error("Error fetching random laptops:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch random laptops",
    });
  }
});

//Get laptop by id API
app.get("/api/laptop/:id", async (req, res) => {
  const { id } = req.params;

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid laptop ID format",
    });
  }

  try {
    const laptop = await Laptop.findById(id);
    if (!laptop) {
      return res
        .status(404)
        .json({ success: false, message: "Laptop not found" });
    }
    res.status(200).json({ success: true, laptop });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// //Get product by id API (formatted for frontend Product interface)
// app.get("/api/products/:id", async (req, res) => {
//   const { id } = req.params;
//   try {
//     const laptop = await Laptop.findById(id);
//     if (!laptop) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Product not found" });
//     }

//     // Transform to Product interface format
//     let amazonPrice = null;
//     let amazonRating = null;
//     let amazonUrl = null;
//     let flipkartPrice = null;
//     let flipkartRating = null;
//     let flipkartUrl = null;

//     if (laptop.sites && laptop.sites.length > 0) {
//       // Find Amazon site data
//       const amazonSite = laptop.sites.find(
//         (site) => site.source && site.source.toLowerCase() === "amazon"
//       );
//       if (amazonSite) {
//         amazonPrice = amazonSite.price;
//         amazonRating = amazonSite.rating;
//         amazonUrl = amazonSite.link;
//       }

//       // Find Flipkart site data
//       const flipkartSite = laptop.sites.find(
//         (site) => site.source && site.source.toLowerCase() === "flipkart"
//       );
//       if (flipkartSite) {
//         flipkartPrice = flipkartSite.price;
//         flipkartRating = flipkartSite.rating;
//         flipkartUrl = flipkartSite.link;
//       }
//     }

//     // Get the best price for display
//     const displayPrice = amazonPrice && flipkartPrice
//       ? Math.min(amazonPrice, flipkartPrice)
//       : amazonPrice || flipkartPrice || laptop.allTimeLowPrice;

//     // Get images
//     const images = laptop.specs?.details?.imageLinks || [];

//     // Format the product data
//     const product = {
//       productId: laptop._id,
//       productName: laptop.specs?.head || "Unknown Model",
//       productLink: amazonUrl || flipkartUrl || "#",
//       cleanProductLink: amazonUrl || flipkartUrl,
//       price: displayPrice ? displayPrice.toString() : undefined,
//       basePrice: laptop.allTimeLowPrice ? laptop.allTimeLowPrice.toString() : undefined,
//       rating: amazonRating || flipkartRating || undefined,
//       ratingsNumber: undefined, // Not available in current schema
//       technicalDetails: {
//         imageLinks: images,
//         "Model Name": laptop.specs?.head || undefined,
//         "Processor Name": laptop.specs?.processor?.name || undefined,
//         "Processor Brand": laptop.specs?.processor?.brand || undefined,
//         RAM: laptop.specs?.ram ? `${laptop.specs.ram.size || ""}${laptop.specs.ram.size ? "GB" : ""} ${laptop.specs.ram.type?.toUpperCase() || ""}` : undefined,
//         "Screen Size": laptop.specs?.displayInch ? `${laptop.specs.displayInch}"` : undefined,
//         "Storage Type": laptop.specs?.storage?.type || undefined,
//         "SSD Capacity": laptop.specs?.storage?.type?.toLowerCase() === "ssd" ? `${laptop.specs.storage.size || ""}${laptop.specs.storage.size ? "GB" : ""}` : undefined,
//         "HDD Capacity": laptop.specs?.storage?.type?.toLowerCase() === "hdd" ? `${laptop.specs.storage.size || ""}${laptop.specs.storage.size ? "GB" : ""}` : undefined,
//       },
//       sites: [
//         ...(amazonPrice ? [{
//           source: "amazon",
//           price: amazonPrice.toString(),
//           link: amazonUrl || "#",
//           rating: amazonRating ? amazonRating.toString() : undefined,
//           ratingCount: undefined
//         }] : []),
//         ...(flipkartPrice ? [{
//           source: "flipkart",
//           price: flipkartPrice.toString(),
//           link: flipkartUrl || "#",
//           rating: flipkartRating ? flipkartRating.toString() : undefined,
//           ratingCount: undefined
//         }] : [])
//       ]
//     };

//     res.status(200).json(product);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });

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
    return res
      .status(400)
      .json({ success: false, message: "Laptop ID is required" });
  }

  try {
    // Find all comments for this laptop and populate user information
    const comments = await Comment.find({ laptop: laptopId })
      .populate("user", "username name email") // Get user details but exclude sensitive data
      .sort({ createdAt: -1 }); // Sort by newest first

    res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

//Add to favorites API
app.post("/api/favorites", async (req, res) => {
  const { userId, laptopId } = req.body;
  if (!userId || !laptopId) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const laptop = await Laptop.findById(laptopId);
    if (!laptop) {
      return res
        .status(404)
        .json({ success: false, message: "Laptop not found" });
    }
    if (user.favorites.includes(laptopId)) {
      return res
        .status(400)
        .json({ success: false, message: "Laptop already in favourites" });
    }
    user.favorites.push(laptopId);
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "Laptop added to favourites" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Servor error" });
  }
});

// Remove from favorites API
app.delete("/api/favorites", async (req, res) => {
  const { userId, laptopId } = req.body;
  if (!userId || !laptopId) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const laptop = await Laptop.findById(laptopId);
    if (!laptop) {
      return res
        .status(404)
        .json({ success: false, message: "Laptop not found" });
    }
    if (!user.favorites.includes(laptopId)) {
      return res
        .status(400)
        .json({ success: false, message: "Laptop not in favourites" });
    }
    user.favorites = user.favorites.filter(
      (fav) => fav.toString() !== laptopId
    );
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "Laptop removed from favourites" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

//Get User Favorites API
app.get("/api/favorites/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId).populate("favorites");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, favorites: user.favorites });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

//Add to history API
app.post("/api/history", async (req, res) => {
  const { userId, laptopId } = req.body;
  if (!userId || !laptopId) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const laptop = await Laptop.findById(laptopId);
    if (!laptop) {
      return res
        .status(404)
        .json({ success: false, message: "Laptop not found" });
    }

    // Remove laptop if it already exists in history (to avoid duplicates and move to front)
    if (user.history.includes(laptopId)) {
      user.history = user.history.filter(
        (historyItem) => historyItem.toString() !== laptopId
      );
    }

    // Add to beginning of history array (most recent first)
    user.history.unshift(laptopId);

    // Limit history to max 9 items (7-9 range, keeping 9 as upper limit)
    // When adding a new laptop, if history exceeds 9 items, remove the oldest (last) item
    if (user.history.length > MAX_HISTORY_ITEMS) {
      user.history = user.history.slice(0, MAX_HISTORY_ITEMS);
    }

    await user.save();
    res.status(200).json({
      success: true,
      message: "Laptop added to history",
      historyCount: user.history.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

//Get User History API
app.get("/api/history/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId).populate("history");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, history: user.history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Remove single item from history API
app.delete("/api/history/:userId/:laptopId", async (req, res) => {
  const { userId, laptopId } = req.params;
  if (!userId || !laptopId) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const laptop = await Laptop.findById(laptopId);
    if (!laptop) {
      return res
        .status(404)
        .json({ success: false, message: "Laptop not found" });
    }
    if (!user.history.includes(laptopId)) {
      return res
        .status(400)
        .json({ success: false, message: "Laptop not in history" });
    }
    user.history = user.history.filter(
      (historyItem) => historyItem.toString() !== laptopId
    );
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "Laptop removed from history" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Clear entire history API
app.delete("/api/history/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json({ success: false, message: "Missing userId" });
  }
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    user.history = [];
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "History cleared successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/search", async (req, res) => {
  const {
    id,
    name,
    price,
    processor,
    ram,
    os,
    storage,
    img_link,
    display,
    rating,
    no_of_ratings,
    no_of_reviews,
    laptop_brand,
    os_brand,
    page = 1,
  } = req.query;

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
    ...(os_brand && { os_brand }),
  };

  const limit = 50;
  const skip = (page - 1) * limit;

  try {
    const laptops = await Laptop.find(query).limit(limit).skip(skip);

    const totalResults = await Laptop.countDocuments(query); // Get total number of matching documents
    const hasNext = page * limit < totalResults; // Check if there are more results

    res.status(200).json({
      success: true,
      laptops,
      hasNext,
      totalResults,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalResults / limit),
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

//Get popular laptops API (rating >4 and reviews >400)
app.get("/api/popular", async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 16; // Default to 16 if not specified

    // Validate count parameter
    if (count <= 0 || count > 50) {
      return res.status(400).json({
        success: false,
        message: "Count must be between 1 and 50",
      });
    }

    // Find laptops with rating >4 and ratingCount >400 in at least one site
    const popularLaptops = await Laptop.aggregate([
      {
        $match: {
          $expr: { $eq: [{ $size: "$sites" }, 2] }, // Only laptops with exactly 2 sites
          "sites.source": { $all: ["amazon", "flipkart"] }, // Must have both Amazon and Flipkart
          $or: [
            {
              $and: [
                { "sites.rating": { $gt: 4 } },
                { "sites.ratingCount": { $gt: 400 } },
              ],
            },
          ],
        },
      },
      { $sample: { size: count } },
      {
        $project: {
          _id: 1,
          brand: 1,
          series: 1,
          "specs.head": 1,
          "specs.processor": 1,
          "specs.ram": 1,
          "specs.storage": 1,
          sites: 1,
          "specs.details.imageLinks": 1,
          allTimeLowPrice: 1,
        },
      },
    ]);

    // Format the response data
    const formattedLaptops = popularLaptops.map((laptop) => {
      // Extract Amazon and Flipkart data separately
      let amazonPrice = null;
      let flipkartPrice = null;
      let amazonRating = null;
      let flipkartRating = null;
      let amazonUrl = null;
      let flipkartUrl = null;

      if (laptop.sites && laptop.sites.length > 0) {
        // Find Amazon site data
        const amazonSite = laptop.sites.find(
          (site) => site.source && site.source.toLowerCase() === "amazon"
        );
        if (amazonSite) {
          amazonPrice = amazonSite.price;
          amazonRating = amazonSite.rating;
          amazonUrl = amazonSite.url;
        }

        // Find Flipkart site data
        const flipkartSite = laptop.sites.find(
          (site) => site.source && site.source.toLowerCase() === "flipkart"
        );
        if (flipkartSite) {
          flipkartPrice = flipkartSite.price;
          flipkartRating = flipkartSite.rating;
          flipkartUrl = flipkartSite.url;
        }
      }

      // Get images (limit to 2)
      const images = laptop.specs?.details?.imageLinks || [];
      const imageLinks = images.slice(0, 2);

      return {
        id: laptop._id,
        title: laptop.specs?.head || "Unknown Model",
        brand: laptop.brand || "Unknown Brand",
        series: laptop.series || "Unknown Series",
        processor: laptop.specs?.processor
          ? `${laptop.specs.processor.name || ""} ${laptop.specs.processor.gen || ""
          }${laptop.specs.processor.gen ? "th Gen" : ""}`
          : "Unknown Processor",
        ram: laptop.specs?.ram
          ? `${laptop.specs.ram.size || ""}${laptop.specs.ram.size ? "GB" : ""
          } ${laptop.specs.ram.type?.toUpperCase() || ""}`
          : "Unknown RAM",
        storage: laptop.specs?.storage
          ? `${laptop.specs.storage.size || ""}${laptop.specs.storage.size ? "GB" : ""
          } ${laptop.specs.storage.type?.toUpperCase() || ""}`
          : "Unknown Storage",
        amazonPrice: amazonPrice,
        amazonRating: amazonRating,
        amazonUrl: amazonUrl,
        flipkartPrice: flipkartPrice,
        flipkartRating: flipkartRating,
        flipkartUrl: flipkartUrl,
        basePrice: laptop.allTimeLowPrice,
        images: imageLinks.length > 0 ? imageLinks : null,
      };
    });

    res.status(200).json({
      success: true,
      count: formattedLaptops.length,
      laptops: formattedLaptops,
    });
  } catch (err) {
    console.error("Error fetching popular laptops:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch popular laptops",
    });
  }
});

//Get great deals API (≥30% discount on any site)
app.get("/api/deals", async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 12; // Default to 12 if not specified

    // Validate count parameter
    if (count <= 0 || count > 50) {
      return res.status(400).json({
        success: false,
        message: "Count must be between 1 and 50",
      });
    }

    // Find laptops with ≥30% discount on any site - no requirement for both sites
    const dealsLaptops = await Laptop.aggregate([
      {
        $match: {
          sites: { $exists: true, $ne: [] }, // Must have at least one site
        },
      },
      {
        $addFields: {
          // First normalize all prices across the document
          normalizedAllTimeLowPrice: {
            $cond: [
              { $gt: ["$allTimeLowPrice", 100000] },
              { $divide: ["$allTimeLowPrice", 100] },
              "$allTimeLowPrice",
            ],
          },
          normalizedSpecsBasePrice: {
            $cond: [
              { $gt: ["$specs.basePrice", 100000] },
              { $divide: ["$specs.basePrice", 100] },
              "$specs.basePrice",
            ],
          },
          // Normalize all site prices
          normalizedSites: {
            $map: {
              input: "$sites",
              as: "site",
              in: {
                source: "$$site.source",
                rating: "$$site.rating",
                link: "$$site.link",
                normalizedPrice: {
                  $cond: [
                    { $gt: ["$$site.price", 100000] },
                    { $divide: ["$$site.price", 100] },
                    "$$site.price",
                  ],
                },
                normalizedBasePrice: {
                  $cond: [
                    { $gt: ["$$site.basePrice", 100000] },
                    { $divide: ["$$site.basePrice", 100] },
                    "$$site.basePrice",
                  ],
                },
                originalPrice: "$$site.price",
                originalBasePrice: "$$site.basePrice",
              },
            },
          },
        },
      },
      {
        $addFields: {
          // Calculate discount for each site using normalized prices
          sitesWithValidDeals: {
            $map: {
              input: "$normalizedSites",
              as: "site",
              in: {
                source: "$$site.source",
                price: "$$site.normalizedPrice",
                rating: "$$site.rating",
                link: "$$site.link",
                originalPrice: "$$site.originalPrice",
                originalBasePrice: "$$site.originalBasePrice",
                // Determine the best base price to use for this site (all normalized)
                effectiveBasePrice: {
                  $cond: [
                    // If site has its own basePrice and it's valid and reasonable (not more than 10x the current price)
                    {
                      $and: [
                        { $ne: ["$$site.normalizedBasePrice", null] },
                        { $gt: ["$$site.normalizedBasePrice", 0] },
                        {
                          $gt: [
                            "$$site.normalizedBasePrice",
                            "$$site.normalizedPrice",
                          ],
                        },
                        {
                          $lt: [
                            "$$site.normalizedBasePrice",
                            { $multiply: ["$$site.normalizedPrice", 10] },
                          ],
                        },
                      ],
                    },
                    "$$site.normalizedBasePrice",
                    // Otherwise try to use normalized allTimeLowPrice
                    {
                      $cond: [
                        {
                          $and: [
                            { $ne: ["$normalizedAllTimeLowPrice", null] },
                            { $gt: ["$normalizedAllTimeLowPrice", 0] },
                            {
                              $gt: [
                                "$normalizedAllTimeLowPrice",
                                "$$site.normalizedPrice",
                              ],
                            },
                            {
                              $lt: [
                                "$normalizedAllTimeLowPrice",
                                { $multiply: ["$$site.normalizedPrice", 10] },
                              ],
                            },
                          ],
                        },
                        "$normalizedAllTimeLowPrice",
                        // Finally try normalized specs.basePrice
                        {
                          $cond: [
                            {
                              $and: [
                                { $ne: ["$normalizedSpecsBasePrice", null] },
                                { $gt: ["$normalizedSpecsBasePrice", 0] },
                                {
                                  $gt: [
                                    "$normalizedSpecsBasePrice",
                                    "$$site.normalizedPrice",
                                  ],
                                },
                                {
                                  $lt: [
                                    "$normalizedSpecsBasePrice",
                                    {
                                      $multiply: ["$$site.normalizedPrice", 10],
                                    },
                                  ],
                                },
                              ],
                            },
                            "$normalizedSpecsBasePrice",
                            null,
                          ],
                        },
                      ],
                    },
                  ],
                },
                // Calculate discount percentage using normalized prices
                discountPercent: {
                  $let: {
                    vars: {
                      basePrice: {
                        $cond: [
                          // If site has its own basePrice and it's valid and reasonable
                          {
                            $and: [
                              { $ne: ["$$site.normalizedBasePrice", null] },
                              { $gt: ["$$site.normalizedBasePrice", 0] },
                              {
                                $gt: [
                                  "$$site.normalizedBasePrice",
                                  "$$site.normalizedPrice",
                                ],
                              },
                              {
                                $lt: [
                                  "$$site.normalizedBasePrice",
                                  { $multiply: ["$$site.normalizedPrice", 10] },
                                ],
                              },
                            ],
                          },
                          "$$site.normalizedBasePrice",
                          // Otherwise try to use normalized allTimeLowPrice
                          {
                            $cond: [
                              {
                                $and: [
                                  { $ne: ["$normalizedAllTimeLowPrice", null] },
                                  { $gt: ["$normalizedAllTimeLowPrice", 0] },
                                  {
                                    $gt: [
                                      "$normalizedAllTimeLowPrice",
                                      "$$site.normalizedPrice",
                                    ],
                                  },
                                  {
                                    $lt: [
                                      "$normalizedAllTimeLowPrice",
                                      {
                                        $multiply: [
                                          "$$site.normalizedPrice",
                                          10,
                                        ],
                                      },
                                    ],
                                  },
                                ],
                              },
                              "$normalizedAllTimeLowPrice",
                              // Finally try normalized specs.basePrice
                              {
                                $cond: [
                                  {
                                    $and: [
                                      {
                                        $ne: [
                                          "$normalizedSpecsBasePrice",
                                          null,
                                        ],
                                      },
                                      { $gt: ["$normalizedSpecsBasePrice", 0] },
                                      {
                                        $gt: [
                                          "$normalizedSpecsBasePrice",
                                          "$$site.normalizedPrice",
                                        ],
                                      },
                                      {
                                        $lt: [
                                          "$normalizedSpecsBasePrice",
                                          {
                                            $multiply: [
                                              "$$site.normalizedPrice",
                                              10,
                                            ],
                                          },
                                        ],
                                      },
                                    ],
                                  },
                                  "$normalizedSpecsBasePrice",
                                  null,
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    },
                    in: {
                      $cond: [
                        {
                          $and: [
                            { $ne: ["$$basePrice", null] },
                            { $gt: ["$$basePrice", 0] },
                            { $ne: ["$$site.normalizedPrice", null] },
                            { $gt: ["$$site.normalizedPrice", 0] },
                            { $gt: ["$$basePrice", "$$site.normalizedPrice"] },
                          ],
                        },
                        {
                          $multiply: [
                            {
                              $divide: [
                                {
                                  $subtract: [
                                    "$$basePrice",
                                    "$$site.normalizedPrice",
                                  ],
                                },
                                "$$basePrice",
                              ],
                            },
                            100,
                          ],
                        },
                        0,
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          // Filter out sites with no valid deals and find the maximum discount
          validDeals: {
            $filter: {
              input: "$sitesWithValidDeals",
              cond: { $gte: ["$$this.discountPercent", 30] },
            },
          },
          maxDiscountPercent: {
            $max: {
              $map: {
                input: "$sitesWithValidDeals",
                as: "deal",
                in: "$$deal.discountPercent",
              },
            },
          },
        },
      },
      {
        $match: {
          $and: [
            { "validDeals.0": { $exists: true } }, // Must have at least one valid deal
            { maxDiscountPercent: { $gte: 30 } }, // Maximum discount must be ≥30%
          ],
        },
      },
      // Remove duplicates based on specs.head (model name) and brand combination
      {
        $group: {
          _id: {
            brand: "$brand",
            // Use a safer approach for deduplication without $substr
            simplifiedHead: {
              $replaceAll: {
                input: { $toLower: "$specs.head" },
                find: " ",
                replacement: "",
              },
            },
          },
          // Keep the laptop with the highest discount among duplicates
          laptop: { $first: "$$ROOT" },
          maxDiscount: { $max: "$maxDiscountPercent" },
        },
      },
      {
        $replaceRoot: { newRoot: "$laptop" },
      },
      // Sort by highest discount first instead of random sampling
      { $sort: { maxDiscountPercent: -1 } },
      { $limit: count },
      {
        $project: {
          _id: 1,
          brand: 1,
          series: 1,
          "specs.head": 1,
          "specs.processor": 1,
          "specs.ram": 1,
          "specs.storage": 1,
          sites: 1,
          normalizedSites: 1,
          "specs.details.imageLinks": 1,
          allTimeLowPrice: 1,
          normalizedAllTimeLowPrice: 1,
          "specs.basePrice": 1,
          normalizedSpecsBasePrice: 1,
          sitesWithValidDeals: 1,
          validDeals: 1,
          maxDiscountPercent: 1,
        },
      },
    ]);

    // Format the response data
    const formattedLaptops = dealsLaptops.map((laptop) => {
      // Extract Amazon and Flipkart data from valid deals
      let amazonPrice = null;
      let flipkartPrice = null;
      let amazonDiscount = 0;
      let flipkartDiscount = 0;
      let amazonBasePrice = null;
      let flipkartBasePrice = null;
      let amazonUrl = null;
      let flipkartUrl = null;
      let amazonOriginalPrice = null;
      let flipkartOriginalPrice = null;

      if (laptop.sitesWithValidDeals && laptop.sitesWithValidDeals.length > 0) {
        // Find Amazon site data
        const amazonSite = laptop.sitesWithValidDeals.find(
          (site) => site.source && site.source.toLowerCase() === "amazon"
        );
        if (amazonSite && amazonSite.price) {
          amazonPrice = amazonSite.price; // Normalized price
          amazonOriginalPrice = amazonSite.originalPrice; // Original price
          amazonDiscount = amazonSite.discountPercent || 0;
          amazonBasePrice = amazonSite.effectiveBasePrice;
          amazonUrl = amazonSite.link;
        }

        // Find Flipkart site data
        const flipkartSite = laptop.sitesWithValidDeals.find(
          (site) => site.source && site.source.toLowerCase() === "flipkart"
        );
        if (flipkartSite && flipkartSite.price) {
          flipkartPrice = flipkartSite.price; // Normalized price
          flipkartOriginalPrice = flipkartSite.originalPrice; // Original price
          flipkartDiscount = flipkartSite.discountPercent || 0;
          flipkartBasePrice = flipkartSite.effectiveBasePrice;
          flipkartUrl = flipkartSite.link;
        }
      }

      // Find the best deal from valid deals
      const bestDeal =
        laptop.validDeals && laptop.validDeals.length > 0
          ? laptop.validDeals.reduce((best, current) =>
            current.discountPercent > best.discountPercent ? current : best
          )
          : null;

      const bestPrice = bestDeal
        ? bestDeal.price
        : Math.min(amazonPrice || Infinity, flipkartPrice || Infinity);
      const bestDiscount = laptop.maxDiscountPercent || 0;
      const bestBasePrice = bestDeal
        ? bestDeal.effectiveBasePrice
        : amazonBasePrice || flipkartBasePrice;

      // Get images (limit to 2)
      const images = laptop.specs?.details?.imageLinks || [];
      const imageLinks = images.slice(0, 2);

      return {
        id: laptop._id,
        productId: laptop._id,
        productName: laptop.specs?.head || "Unknown Model",
        title: laptop.specs?.head || "Unknown Model",
        brand: laptop.brand || "Unknown Brand",
        series: laptop.series || "Unknown Series",
        processor: laptop.specs?.processor
          ? `${laptop.specs.processor.name || ""} ${laptop.specs.processor.gen || ""
          }${laptop.specs.processor.gen ? "th Gen" : ""}`
          : "Unknown Processor",
        ram: laptop.specs?.ram
          ? `${laptop.specs.ram.size || ""}${laptop.specs.ram.size ? "GB" : ""
          } ${laptop.specs.ram.type?.toUpperCase() || ""}`
          : "Unknown RAM",
        storage: laptop.specs?.storage
          ? `${laptop.specs.storage.size || ""}${laptop.specs.storage.size ? "GB" : ""
          } ${laptop.specs.storage.type?.toUpperCase() || ""}`
          : "Unknown Storage",
        // Frontend expects formatted price strings
        price: `₹${bestPrice.toLocaleString("en-IN")}`,
        basePrice: bestBasePrice
          ? `₹${bestBasePrice.toLocaleString("en-IN")}`
          : null,
        // Multi-site data for advanced display
        amazonPrice: amazonPrice,
        flipkartPrice: flipkartPrice,
        amazonOriginalPrice: amazonOriginalPrice,
        flipkartOriginalPrice: flipkartOriginalPrice,
        amazonDiscount: Math.round(amazonDiscount),
        flipkartDiscount: Math.round(flipkartDiscount),
        amazonBasePrice: amazonBasePrice,
        flipkartBasePrice: flipkartBasePrice,
        amazonUrl: amazonUrl,
        flipkartUrl: flipkartUrl,
        currentPrice: bestPrice, // Keep numeric for calculations
        discountPercent: Math.round(bestDiscount),
        images: imageLinks.length > 0 ? imageLinks : null, // Add images at top level for useProducts hook
        bestDealSource: bestDeal
          ? bestDeal.source
          : amazonDiscount > flipkartDiscount
            ? "amazon"
            : "flipkart",
        // Technical details for frontend display
        technicalDetails: {
          imageLinks: imageLinks.length > 0 ? imageLinks : null,
          "Processor Name":
            laptop.specs?.processor?.name || "Unknown Processor",
          RAM: laptop.specs?.ram
            ? `${laptop.specs.ram.size || ""}${laptop.specs.ram.size ? "GB" : ""
            } ${laptop.specs.ram.type?.toUpperCase() || ""}`
            : "Unknown RAM",
          "Screen Size": laptop.specs?.display?.size || "Unknown Screen Size",
        },
        // Sites array for multi-platform display
        sites: [
          ...(amazonPrice
            ? [
              {
                source: "amazon",
                price: `₹${amazonPrice.toLocaleString("en-IN")}`,
                link: amazonUrl,
                rating: laptop.sites?.find(
                  (s) => s.source?.toLowerCase() === "amazon"
                )?.rating,
                ratingCount: laptop.sites?.find(
                  (s) => s.source?.toLowerCase() === "amazon"
                )?.ratingCount,
              },
            ]
            : []),
          ...(flipkartPrice
            ? [
              {
                source: "flipkart",
                price: `₹${flipkartPrice.toLocaleString("en-IN")}`,
                link: flipkartUrl,
                rating: laptop.sites?.find(
                  (s) => s.source?.toLowerCase() === "flipkart"
                )?.rating,
                ratingCount: laptop.sites?.find(
                  (s) => s.source?.toLowerCase() === "flipkart"
                )?.ratingCount,
              },
            ]
            : []),
        ],
        totalValidDeals: laptop.validDeals ? laptop.validDeals.length : 0,
        // Debug information (can be removed later)
        debug: {
          originalBasePrice: laptop.allTimeLowPrice,
          normalizedBasePrice: laptop.normalizedAllTimeLowPrice,
          priceNormalizationApplied: {
            allTimeLowPriceNormalized: laptop.allTimeLowPrice > 100000,
            specsBasePriceNormalized: (laptop.specs?.basePrice || 0) > 100000,
            amazonPriceNormalized: amazonOriginalPrice > 100000,
            flipkartPriceNormalized: flipkartOriginalPrice > 100000,
          },
        },
      };
    });

    res.status(200).json({
      success: true,
      count: formattedLaptops.length,
      laptops: formattedLaptops,
    });
  } catch (err) {
    console.error("Error fetching great deals:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch great deals",
    });
  }
});

// Recommendation API
app.use("/api/recommendations", require("./recommendation"));

app.listen(8080, () => {
  console.log("Server Started at port 8080");
});
