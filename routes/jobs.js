//Routes for jobs
//Add routes for jobs. The same routes should be handled as we did for companies 
//(for now, omit the special filtering on the GET / route), with the same security requirements 
//(anyone can get the jobs, but only admins can add, update, or delete them). Make sure you suitably validate incoming data.

const jsonschema = require('jsonschema');

const express = require('express');
const { BadRequestError } = require('../expressError'); //importing the BadRequestError class from expressError.js
const { ensureAdmin } = require('../middleware/auth'); //ensureAdmin is a function that checks if the user is an admin
const Job = require('../models/job'); //import Job model
