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
const { json } = require('body-parser');

const router = express.Router( ({ mergeParams: true }) ); //creating a router

//post jobs route
//add a new job to the database, only admins can do this
router.post('/' , ensureAdmin, async function(req,res,next){
    try {
        const validator = jsonschema.validate(req.body, jobNewSchema);
        if(!validator.valid){
            const err = validator.errors.map( e => e.stack);
            throw new BadRequestError(err);
        }

        const job = await Job.create(req.body);
        return res.status(201).json({ job });
    }  catch (err) {
       return next(err);
    }
});

//get jobs route
//get all jobs from the database, no authorization required
//Adding Filtering
//Similar to the companies filtering for the GET / route, add filtering for jobs for the following possible filters:
//title: filter by job title. Like before, this should be a case-insensitive, matches-any-part-of-string search.
//minSalary: filter to jobs with at least that salary.
//hasEquity: if true, filter to jobs that provide a non-zero amount of equity. If false or not included in the filtering,
//list all jobs regardless of equity.

router.get("/" , async function(req,res,next){
    const query = req.query;
    //arrive as strings from query string but we need it as integers
    if(query.minSalary !== undefined){ query.minSalary = +query.minSalary; } // is it ok to write as parseInt(query.minSalary) ?
    if(query.hasEquity !== undefined){ query.hasEquity = 'true'; }

    try{
        const validator = jsonschema.validate(query,jobSearchSchema);
        if (!validator.valid){ //if the query is not valid
            const err = validator.errors.map( e => e.stack); //get the error messages 
            throw new BadRequestError(err);
        }

        const jobs = await Job.findAll(query);
        return res.json({ jobs }); //return the jobs
    } catch (err){
        return next(err);
    }
});

//get the job by id route
//get a job by id, no authorization required

router.get("/:id" , async function(req,res,next){
    try{
        const job = await Job.get(req.params.id);
        return res.json({ job });
    } catch(err) {
        return next(err);
    }
});

//update the job by id route
//update a job by id, only admins can do this

router.patch("/:id" , ensureAdmin , async function(req,res,next){
    try{
        const validator = jsonschema.validate(req.body, jobUpdateSchema);
        if(!validator.valid){
            const errs = validator.errors.map( e => e.stack );
            throw new BadRequestError(errs);
        }

        const job = await Job.update(req.params.id , req.body);
        return res.json({ job });
    } catch(err) {
        return next(err);
    }
});


// delete the job route
//delete a job by id, only admins can do this

router.delete("/:id" , ensureAdmin , async function(req,res,next){
    try{
        await Job.delete(req.params.id);
        return res.json({ deleted: +req.params.id});
    } catch {
        return next(err);
    }
});

module.exports = router;