const mongoose = require('mongoose');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');
const Campground = require('../models/campground');

mongoose.connect('mongodb://localhost:27017/yelp-camp', {
  useNewUrlParser: true,
  // useCreateIndex: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected");
});

const sample = array => array[Math.floor(Math.random() * array.length)];


const seedDB = async () => {
  await Campground.deleteMany({});
  for (let i = 0; i < 50; i++) {
    const price = Math.floor(Math.random() * 1000 + 40);
    const random400 = Math.floor(Math.random() * 400);
    const camp = new Campground({
      location: `${cities[random400].city}, ${cities[random400].admin_name}`,
      title: `${sample(descriptors)} ${sample(places)}`,
      image: `https://source.unsplash.com/collection/3340945`,
      description: "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Unde officia quasi incidunt sapiente sit quae nesciunt culpa illo mollitia architecto illum accusantium rerum veniam ipsum magnam, ducimus repellat nulla? Sequi est quisquam, magni culpa placeat debitis odit vel ex at.",
      price
    })
    await camp.save();
  }
}

seedDB().then(() => {
  mongoose.connection.close();
})
