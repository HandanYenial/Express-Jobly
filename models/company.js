"use strict"; 
//Why Strict Mode? Strict mode makes it easier to write "secure" JavaScript. Strict mode changes previously accepted 
//"bad syntax" into real errors. As an example, in normal JavaScript, mistyping a variable name creates a new global variable.
//W3Schools


const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */
  //company table : {handle, name, description, num_employees, logo_url}

  static async create({ handle, name, description, numEmployees, logoUrl }) { //
    const duplicateCheck = await db.query( //check if company already exists
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]); 

    if (duplicateCheck.rows[0])// if company already exists
      throw new BadRequestError(`Duplicate company: ${handle}`); // throw error

    const result = await db.query( 
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

/** Find all companies.Returns [{ handle, name, description, numEmployees, logoUrl }, ...]* */
//static async findAll() { 
//    const companiesRes = await db.query(
//          `SELECT handle,
//                  name,
//                  description,
//                  num_employees AS "numEmployees",
//                  logo_url AS "logoUrl"
//           FROM companies
//           ORDER BY name`);
//    return companiesRes.rows;}

//Adding Filtering
//The route for listing all companies (GET /companies) works, but it currently shows all companies. 
//Add a new feature to this, allowing API users to filter the results based on optional filtering criteria, 
//any or all of which can be passed in the query string:

//name: filter by company name: if the string “net” is passed in, this should find any company who name contains the word “net”, case-insensitive (so “Study Networks” should be included).
//minEmployees: filter to companies that have at least that number of employees.
//maxEmployees: filter to companies that have no more than that number of employees.
//If the minEmployees parameter is greater than the maxEmployees parameter, respond with a 400 error with an appropriate message.
//Some requirements:
//Do not solve this by issuing a more complex SELECT statement than is needed (for example, if the user isn’t filtering 
// minEmployees or maxEmployees, the SELECT statement should not include anything about the num_employees.

//Validate that the request does not contain inappropriate other filtering fields in the route. 

  static async findAll(searchFilters ={}){ //searchFilters is a query string
    let query = 
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
            FROM companies`;
    
    let whereExpressions =[]; 
    let queryValues =[];
    // we can pass in a search filter object with the following keys:
    const { minEmployees, maxEmployees, name } = searchFilters; 

    if(minEmployees > maxEmployees){ //if minEmployees is greater than maxEmployees
      throw new BadRequestError("minEmployees must be less than maxEmployees"); //throw error
    }

    if(minEmployees !== undefined){ //if minEmployees is defined
      queryValues.push(minEmployees); //push minEmployees to queryValues
      whereExpressions.push(`num_employees >= $${queryValues.length}`); //the length of the queryValues array= meanning the number of                                                                   //employees
    }

    if(maxEmployees !== undefined){
      queryValues.push(maxEmployees);
      whereExpressions.push(`num_employees <+ $${queryValues.length}`);
    }

    if(name){
      queryValues.push(`%${name}%`);
      whereExpressions.push(`name ILIKE $${queryValues.length}`);
    }

    if(whereExpressions.length > 0){
      query += ` WHERE ${whereExpressions.join(" AND ")}`;
    }

    query += "ORDER BY name";
    const companiesRes = await db.query(query, queryValues);
    return companiesRes.rows;
    }
         
  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) { //get company by handle
    const companyRes = await db.query( 
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
        [handle]
      );

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(  ////????????????????
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
