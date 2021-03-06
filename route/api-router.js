'use strict';

const express = require('express');
const path = require('path');
const request = require('superagent');
const showdown  = require('showdown');

require('showdown-prettify');
const converter = new showdown.Converter({ extensions: ['prettify'] });
converter.setFlavor('github');


const apiRouter = module.exports = express.Router();

const url = 'https://ways2go.herokuapp.com';
const endpoints = {
  GET: {
    user_signin_url: `${url}/api/signin`,
    profile_url: `${url}/api/profile/:id`,
    all_profiles_url: `${url}/api/profile`,
    way_url: `${url}/api/way/:id`,
    all_ways_url: `${url}/api/way`,
    review_url: `${url}/api/wayerz/:wayerzID/review`,
    message_url: `${url}/api/message/:id`
  },
  POST: {
    user_signup_url: `${url}/api/signup`,
    profile_url: `${url}/api/profile`,
    way_url: `${url}/api/way`,
    add_wayer_to_way_url: `${url}/api/way/:wayID/wayerz/:wayerID`,
    review_url: `${url}/api/wayerz/:wayerzID/review`,
    message_url: `${url}/api/profile/:profileID/message`
  },
  PUT: {
    way_url: `${url}/api/way/:id`,
    profile_url: `${url}/api/profile`,
    review_url: `${url}/api/review/:id`,
    message_url: `${url}/api/message/:id`
  },
  DELETE: {
    way_url: `${url}/api/way/:id`,
    profile_url: `${url}/api/profile`,
    remove_wayer_from_way_url: `${url}/api/way/:wayID/wayerz/:wayerID`,
    review_url: `${url}/api/review/:id`,
    message_url: `${url}/api/message/:id`
  }
};


apiRouter.use(express.static(path.join(__dirname, 'public')));

apiRouter.get('/api', (req, res) => res.json(endpoints));

apiRouter.get('/api/developer', (req, res, next) => {
  // res.sendFile('developer.html', { root: 'public'});
  request.get('https://raw.githubusercontent.com/dkulp23/ways2go/staging/README.md')
  .then( response => {
    const input = response.text;
    const html = converter.makeHtml(input);
    res.send(html);
  })
  .catch(next);
});
