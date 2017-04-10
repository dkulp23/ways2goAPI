'use strict';

const Router = require('express').Router;
const jsonParser = require('body-parser').json();
const createError = require('http-errors');
const debug = require('debug')('ways2go:profile-router');

const bearerAuth = require('../lib/bearer-auth-middleware.js');
const Profile = require('../model/profile.js');
const Location = require('../model/location.js');
const parseLocationGoogle = require('../lib/parse-location-google.js');

const del = require('del');
const multer = require('multer');
const dataDir = `${__dirname}/../data`;
const upload = multer({ dest: dataDir });
const promS3upload = require('../lib/s3-uploads.js');

const profileRouter = module.exports = Router();

profileRouter.post('/api/profile', bearerAuth, jsonParser, upload.single('image'), function(req, res, next) {
  debug('POST: /api/profile');

  req.body.profileID = req.user._id;

  let promLocation = parseLocationGoogle(req.body.address)
  .then( geolocation => new Location(geolocation).save())
  .then( location => req.body.address = location._id)
  .catch(next);

  if (req.body.photo) {
    var promPicUpload = promS3upload(req)
    .then( s3data => {
      del([`${dataDir}/*`]);
      req.body.photo['s3Key'] = s3data.Key;
      req.body.photo['imageURI'] = s3data.Location;
    })
    .catch(next);
  }

  Promise.all([promLocation, promPicUpload])
  .then( () => new Profile(req.body).save())
  .then( profile => res.json(profile))
  .catch(next);
});

profileRouter.get('/api/profile/:id', bearerAuth, function(req, res, next) {
  debug('GET: /api/profile/:id');

  Profile.findById(req.params.id)
  .populate('reviews')
  .populate('address')
  .then( profile => {
    if (!profile) return next(createError(404, 'Profile Not Found'));
    res.json(profile);
  })
  .catch(next);
});

profileRouter.get('/api/profile', bearerAuth, function(req, res, next) {
  debug('GET: /api/profile');

  Profile.find({})
  .then( profiles => {
    if (!profiles) return next(createError(404, 'no profiles available'));
    res.json(profiles);
  })
  .catch(next);
});

profileRouter.put('/api/profile', bearerAuth, jsonParser, function(req, res, next) {
  debug('PUT: /api/profile');

  let reqKeys = Object.keys(req.body);

  if (reqKeys.includes('address')) {
    parseLocationGoogle(req.body.address)
    .then( geolocation => {
      return new Location(geolocation).save();
    })
    .then( location => {
      req.body.address = location._id;
      return Profile.findOneAndUpdate({ profileID: req.user._id }, req.body, { new: true });
    })
    .then( profile => res.json(profile))
    .catch(next);
    return;
  }
  Profile.findOneAndUpdate({ profileID: req.user._id }, req.body, { new: true })
  .then( profile => {
    if (!profile[reqKeys]) return next(createError(400, 'bad request'));
    res.json(profile);
  })
  .catch(next);
});

profileRouter.delete('/api/profile', bearerAuth, function(req, res, next) {
  debug('DELETE: /api/profile');

  Profile.findOneAndRemove({ profileID: req.user._id })
  .then( deleted => {
    if (!deleted) return next(createError(404, 'profile not found'));
    deleted.remove();
    return next(res.status(204).send('profile deleted'));
  })
  .catch(next);
});
