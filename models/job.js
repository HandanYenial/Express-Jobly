"use strict"

const db = require("../db");
const { BadRequestError , NotFoundError } = require("../expressError");
const { sqlForPartialUPdate } = require("../helpers/sql");

class Job{
    //create a job:
    static async create({id, title, salary, equity, company_handle}){
        const dublicateCheck = await db.query(
            `SELECT id 
             FROM jobs
             WHERE id =$1`,
          [id]);
    if(dublicateCheck.rows[0]){
        throw new BadRequestError(`Job with id ${id} already exists`);
    }
    
        const result = await db.query(
            `INSERT INTO jobs ( title, salary, equity, company_handle)
             VALUES($1, $2, $3, $4, $5)
             RETURNING id,title,salary,equity,company_handle`,
             [
              title,
              salary,
              equity,
              company_handle,
            ],
    );
    const job = result.rows[0];

    return job;
    }

    //get all jobs
    static async findAll( { minSalary, hasEquity, title} = {}){
        let query = `SELECT jobs.id,
                            jobs.title,
                            jobs.salary,
                            jobs.equity,
                            jobs.company_handle AS "companyHandle",
                            company.name AS "companyName",
                     FROM jobs
                     LEFT JOIN companies AS company ON company.handle = jobs.company_handle`;
        let whereExpressions = [];
        let queryValues = [];

    // For each possible search term, add to whereExpressions and
    // queryValues so we can generate the right SQL

    if (minSalary !== undefined){
        queryValues.push(minSalary);
        whereExpressions.push(`salary >= $${queryValues.length}`);
    }

    if (hasEquity === true){
        whereExpressions.push(`equity > 0`);
    }

    if (title !== undefined){
        queryValues.push(`%${title}%`);
        whereExpressions.push(`title ILIKE $${queryValues.length}`);
    }

    if (whereExpressions.length > 0){
        query += " WHERE " + whereExpressions.join(" AND ");
    }

// Finalize query and return results
    query += "ORDER BY title";
    const jobRes = await db.query(query,queryValues);
    return jobRes.rows;
    
    }

    //get a job by id

    static async get(id){
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

        const companiesResult = await db.query(
            `SELECT handle,
                    name,
                    description,
                    num_employees AS "numemployees",
                    logo_url AS "logoUrl",
              FROM companies
              WHERE handle = $1`,
              [job.companyHandle]
        );
        delete job.companyHandle;
        job.company = companiesResult.rows[0];

        return job;
    }

}



