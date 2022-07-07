//Routes for jobs
//Add routes for jobs. The same routes should be handled as we did for companies 
//(for now, omit the special filtering on the GET / route), with the same security requirements 
//(anyone can get the jobs, but only admins can add, update, or delete them). Make sure you suitably validate incoming data.

const jsonschema = require('jsonschema');

const express = require('express');
const { BadRequestError } = require('../expressError'); //importing the BadRequestError class from expressError.js
const { ensureAdmin } = require('../middleware/auth'); //ensureAdmin is a function that checks if the user is an admin
const Job = require('../models/job'); //import Job model
const jobNewSchema = require('../schemas/jobNew.json'); //import jobNew schema
const jobUpdateSchema = require('../schemas/jobUpdate.json'); //import jobUpdate schema
const jobSearchSchema = require('../schemas/jobSearch.json'); //import jobSearch schema

const router = express.Router( ({ mergeParams: true }) ); //creating a router

//post jobs route
//add a new job to the database, only admins can do this
router.post('/' , ensureAdmin, async function(req,res,next){
    try{
        const validator = jsonschema.validate(req.body, jobNewSchema);
        if(!validator.valid){
            const err = validator.errors.map( e => e.stack);
            throw new BadRequestError(err);
        }

        const job = await Job.create(req.body);
        return res.status(201).json({ job });
    }  catch (err){
        return next(err);
    }
});