const fs = require('fs');
const path = require('path');

const Apple = require('./Apple.json');
const Dell = require('./Dell.json');
const HP = require('./hp.json');
const MSI = require('./msi.json');
const asar = require('./asar.json');
const asus = require('./asus.json');
const Lenovo = require('./Lenovo.json');

const brandData = {Apple, Dell, HP, MSI, asar, asus, Lenovo};



function removeDuplicates(data) {
    const filtered = data.filter((_, index) => index % 2 === 0);
    return filtered 
}

let allLaptops;

Object.entries(brandData).forEach(([brandName, laptops]) => {
    console.log(`Processing ${brandName}...`);
    console.log(`Original count: ${laptops.length}`);
    const removedLaptops = removeDuplicates(laptops);
    console.log(`New count after removing duplicates: ${removedLaptops.length}`);
    console.log(`Removed ${laptops.length - removedLaptops.length} duplicates from ${brandName}.`);
    allLaptops = allLaptops ? allLaptops.concat(removedLaptops) : removedLaptops;
});

console.log(`Total laptops after processing all brands: ${allLaptops.length}`);


const outputFilePath = path.join(__dirname, 'allLaptops.json');
fs.writeFileSync(outputFilePath, JSON.stringify(allLaptops, null, 2), 'utf8');
console.log(`All laptops combined and saved to ${outputFilePath}.`);
