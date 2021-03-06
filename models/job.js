"use strict"

const db = require("../db"); //import the database connection
const { BadRequestError , NotFoundError } = require("../expressError"); //import the error classes
const { sqlForPartialUPdate } = require("../helpers/sql"); //import the function to create partial update sql


//CREATE TABLE jobs (
//    id SERIAL PRIMARY KEY,
//    title TEXT NOT NULL,
//    salary INTEGER CHECK (salary >= 0),
//    equity NUMERIC CHECK (equity <= 1.0),
//    company_handle VARCHAR(25) NOT NULL
//      REFERENCES companies ON DELETE CASCADE ===> this is the foreign key
// it will join with companies table on handle. (companies table (handle,name , ....))
//  );


class Job{
    //create a job with the given title, salary, equity, and company_handle
    static async create(data){ 
        const result = await db.query( //create the job
            `INSERT INTO jobs ( title, salary, equity, company_handle)
             VALUES($1, $2, $3, $4)
             RETURNING id,title,salary,equity,company_handle`,
             [
              data.title,
              data.salary,
              data.equity,
              data.company_handle,
            ],
    );
    const job = result.rows[0]; //get the job that was just created

    return job; //return the job
    }

    //static async create(id,{title,salary,equity,company_handle}){
    //    const result = await db.query( //create the job
    //        `INSERT INTO jobs ( title, salary, equity, company_handle)
    //         VALUES($1, $2, $3, $4)
    //         RETURNING id,title,salary,equity,company_handle`,
    //         [
    //          title,
    //          salary,
    //          equity,
    //          company_handle,
    //        ],
    //    );
    //    const job = result.rows[0]; //get the job that was just created
    //    return job; //return the job

    //get all jobs
    static async findAll( { minSalary, hasEquity, title} = {}){
        let query = `SELECT jobs.id,
                            jobs.title,
                            jobs.salary,
                            jobs.equity,
                            jobs.company_handle AS "companyHandle",
                            company.name AS "companyName"
                     FROM jobs
                     LEFT JOIN companies AS company ON company.handle = jobs.company_handle`;
        let whereExpressions = [];
        let queryValues = [];

    // For each possible search term, add to whereExpressions and
    // queryValues so we can generate the right SQL

    if (minSalary !== undefined){ //if minSalary is defined
        queryValues.push(minSalary); //add the minSalary to the queryValues
        whereExpressions.push(`salary >= ${queryValues.length}`); //add the minSalary to the whereExpressions
    }

    if (hasEquity === true){ //if hasEquity is true
        whereExpressions.push(`equity > 0`); //add the hasEquity to the whereExpressions
    }

    if (title !== undefined){ //if title is defined
        queryValues.push(`%${title}%`); //add the title to the queryValues
        whereExpressions.push(`title ILIKE $${queryValues.length}`); //add the title to the whereExpressions
    }

    if (whereExpressions.length > 0){
        query += " WHERE " + whereExpressions.join(" AND ");
    }

// Finalize query and return results
   // query += "ORDER BY title"; // gives us the jobs in alphabetical order(gives 500 error)
    const jobRes = await db.query(query,queryValues);
    return jobRes.rows;
    
    }

    //get a job by id

    static async get(id){ //get the job with the given id
        const result = await db.query(
            `SELECT id,
                    title,
                    salary,
                    equity,
                    company_handle AS "companyHandle",
             FROM jobs,
             WHERE id = $1`,
            [id]  
        );

        const job = result.rows[0];
        if (!job){
            throw new NotFoundError(`Job with id ${id} not found`);
        }

        //company_handle VARCHAR(25) NOT NULL
        //REFERENCES companies ON DELETE CASCADE

        const companiesResult = await db.query( //get the company with the given handle
            `SELECT handle,
                    name,
                    description,
                    num_employees AS "numemployees",
                    logo_url AS "logoUrl",
              FROM companies
              WHERE handle = $1`,
              [job.companyHandle]
        );
        delete job.companyHandle; //delete the companyHandle from the job
        job.company = companiesResult.rows[0];

        return job;
    }

    //Updating a job should never change the ID of a job, nor the company associated with a job.
    //Title, salary, equity should be updatable.
    //Returns {id, title, salary, equity, company_handle} ===> this is the new job

    static async update(id,{title,salary,equity}){ //update the job with the given id
        const result = await db.query( //update the job
            `UPDATE jobs
             SET title = $1,
                 salary = $2,
                 equity = $3
             WHERE id = $4
             RETURNING id,title,salary,equity,company_handle`,
            [title,salary,equity,id] //the values to update the job with
        );
        const job = result.rows[0];
        if (!job){
            throw new NotFoundError(`Job with id ${id} not found`);
        }
        return job;
    }

//////////////////////////
    //  static async update(id, data) {
    //const { setCols, values } = sqlForPartialUpdate(
        //data,
        //{});
    //const idVarIdx = "$" + (values.length + 1);

   // const querySql = `UPDATE jobs 
                     // SET ${setCols} 
                     // WHERE id = ${idVarIdx} 
                     // RETURNING id, 
                               // title, 
                               // salary, 
                               // equity,
                               // company_handle AS "companyHandle"`;
   // const result = await db.query(querySql, [...values, id]);
    //const job = result.rows[0];

  //  if (!job) throw new NotFoundError(`No job: ${id}`);

    //return job;
  //}

//Delete the job with the given id
    static async delete(id){ //delete the job with the given id
        const result = await db.query( 
            `DELETE FROM jobs
            WHERE id = $1
            RETURNING id`,
            [id]
        );
        const job = result.rows[0]; //

        if(!job){
            throw new NotFoundError(`Job with id ${id} not found`);
        }
    }

}


module.exports = Job; //export the class
