const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const Campground = require('./models/campground');
const ejsMate = require('ejs-mate');
const catchAsync = require('./utils/catchAsync');
const RestError = require('./utils/RestError');
const { campgroundSchema, reviewSchema } = require('./joi-schemas');
const Review = require('./models/review');

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

const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

const validateCampground = (req, res, next) => {
  const { error } = campgroundSchema.validate(req.body);

  if (error) {
    // console.log(error);
    let message = error.details.map(el => el.message).join(',')
    // console.log(message);
    throw new RestError(400, message);
  }
  else next();
}

const validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);

  if (error) {
    // console.log(error);
    let message = error.details.map(el => el.message).join(',')
    // console.log(message);
    throw new RestError(400, message);
  }
  else next();
}

app.get('/', (req, res) => {
  res.render('home')
});
app.get('/campgrounds', catchAsync(async (req, res) => {
  const campgrounds = await Campground.find({});
  res.render('campgrounds/index', { campgrounds })
}));
app.get('/campgrounds/new', (req, res) => {
  res.render('campgrounds/new');
})

app.post('/campgrounds', validateCampground, catchAsync(async (req, res, next) => {
  const campground = new Campground(req.body.campground);
  await campground.save();
  res.redirect(`/campgrounds/${campground._id}`)
}))

app.get('/campgrounds/:id', catchAsync(async (req, res,) => {
  const campground = await Campground.findById(req.params.id).populate('reviews')
  res.render('campgrounds/show', { campground });
}));

app.get('/campgrounds/:id/edit', catchAsync(async (req, res) => {
  const campground = await Campground.findById(req.params.id)
  res.render('campgrounds/edit', { campground });
}))

app.put('/campgrounds/:id', validateCampground, catchAsync(async (req, res) => {
  const { id } = req.params;
  const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
  res.redirect(`/campgrounds/${campground._id}`)
}));

app.delete('/campgrounds/:id', catchAsync(async (req, res) => {
  const { id } = req.params;
  await Campground.findByIdAndDelete(id);
  res.redirect('/campgrounds');
}));

app.post('/campgrounds/:id/reviews', validateReview, catchAsync(async (req, res) => {
  const campground = await Campground.findById(req.params.id).populate('reviews');
  console.log(campground);
  const review = new Review(req.body.review);
  campground.reviews.push(review);
  await campground.save();
  await review.save();
  res.redirect(`/campgrounds/${campground._id}`)

}))

app.delete('/campgrounds/:campid/reviews/:revid', catchAsync(async (req, res) => {
  const { campid, revid } = req.params;
  await Campground.findByIdAndUpdate(campid, { $pull: { reviews: revid } });
  await Review.findByIdAndDelete(revid);
  res.redirect(`/campgrounds/${campid}`)
  // res.send("delete me");
}))


app.all("*", (req, res, next) => {
  next(new RestError(404, 'Page not found!'));
})

app.use((err, req, res, next) => {
  if (!err.message) err.message = 'Something went wrong';
  if (!err.status) err.status = 500;
  // const { status = 500, message = 'Something went wrong!!' } = err;
  res.status(err.status).render('error', { err });
})

app.listen(3000, () => {
  console.log('Serving on port 3000')
})


