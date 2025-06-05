const mongoose = require("mongoose");
require("dotenv").config();
const Laptop = require("./model/Laptop");

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const laptop = await Laptop.findById("683c9e5a441f212457bc7d2e");
    console.log("Laptop data:");
    console.log("allTimeLowPrice:", laptop.allTimeLowPrice);
    console.log("specs.basePrice:", laptop.specs?.basePrice);
    console.log(
      "sites:",
      laptop.sites.map((s) => ({
        source: s.source,
        price: s.price,
        basePrice: s.basePrice,
      }))
    );
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

checkData();
