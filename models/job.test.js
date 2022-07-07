"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const { findAll } = require("./job.js");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJobIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

////create a job with the given title, salary, equity, and company_handle

describe("create" , function(){
    const newJob = {
        
        title: "Software Engineer",
        salary: "100000",
        equity: "0.1",
        company_handle: "test"
    };

    test("should create a job" , async function(){
        let job = await Job.create(newJob);
        expect(job).toEqual(newJob);

        const result = await db.query(
            `SELECT * FROM jobs WHERE id = "1"`
        );
        expect(result.rows).toEqual([
            {
                id: "1",
                title: "Software Engineer",
                salary: "100000",
                equity: "0.1",
                company_handle: "test"
            },
        ]);
    });
});

describe("Get all jobs" , function(){
    test("should get all jobs" , async function(){
        let jobs = await Job.findAll();
        expect(jobs).toEqual([
            {
                id: "1",
                title: "Software Engineer",
                salary: "100000",
                equity: "0.1",
                company_handle: "test"
            },
            {
                id: "2",
                title: "Frontend Developer",
                salary: "150000",
                equity: "0.1",
                company_handle: "test2"
            },
            {
                id: "3",
                title: "Backend Developer",
                salary: "200000",
                equity: "0.1",
                company_handle: "test3"
            }
        ]);
    });

    test("should get all the jobs: filter by minSalary" , async function(){
        let jobs = await Job.findAll({ minSalary: "100000" });
        expect (jobs).toEqual([
            {   id: "1",
                title: "Software Engineer",
                salary: "100000",
                equity: "0.1",
                company_handle: "test"
            },
        ]);
    });

    test("should get all jobs: filter by equity" , async function(){
        let jobs = await Job.findAll({ hasEquity: true });
        expect(jobs).toEqual([
            {
                id: "1",
                title: "Software Engineer",
                salary: "100000",
                equity: "0.1",
                company_handle: "test"
            },
            {
                id: "2",
                title: "Frontend Developer",
                salary: "150000",
                equity: "0.1",
                company_handle: "test"
            }
        ]);
    });

    test("should get all the jobs: filter by min salary and equity" , async function(){
        let jobs = await Job.findAll({ minSalary: "100000", hasEquity: true });
        expect(jobs).toEqual([
            {
                id: "1",
                title: "Software Engineer",
                salary: "100000",
                equity: "0.1",
                company_handle: "test"
            }
        ]);
    });

    test("should get all the jobs: filter by title" , async function(){
        let jobs = await Job.findAll({ title: "Software Engineer" });
        expect(jobs).toEqual([
            {
                id: "1",
                title: "Software Engineer",
                salary: "100000",
                equity: "0.1",
                company_handle: "test"
            }
        ]);
    });       
});

describe("get a job" , function(){
    test("should get a job", async function(){
        let job = await Job.get(testJobIds[0]);
        expect (job).toEqual({
            id:testJobIds[0],
            title: "Software Engineer",
            salary: "100000",
            equity: "0.1",
            company: {
                handle: "test",
                name: "Test Company",
                num_employees: 10,
                description: "Test Description",
                logo_url: "https://test.com"
            }
        });
    });

    test("should throw a 404 error if job does not exist", async function(){
        try{
            await Job.get(0);
            fail();
        } catch(err){
            expect(err).toBeInstanceOf(NotFoundError).toBeTruthy();
        }
        });
});


describe("update a job" , function(){
    let updateData = {
        title : "New Title",
        salary : "200000",
        equity : "0.2"
    };

    test("should update a job" , async function(){
        let job = await Job.update(testJobIds[0], updateData);
        expect(job).toEqual({
            id:testJobIds[0],
            title: "New Title",
            salary: "200000",
            equity: "0.2",
            company: {
                handle: "test",
                name: "Test Company",
                num_employees: 10,
                description: "Test Description",
                logo_url: "https://test.com"
            }
        });
    });


    test("should throw a 404 error if job does not exist", async function(){
        try{
            await Job.update(0, {
                title : "test"
            });
            fail();
        } catch(err){
            expect(err).toBeInstanceOf(NotFoundError).toBeTruthy();
        }
 });

    test("should throw a 400 error if job is invalid", async function(){
        try{
            await Job.update(testJobIds[0], {});
            fail();
        } catch(err){
            expect(err).toBeInstanceOf(BadRequestError).toBeTruthy();
        }
    });
});

describe("delete a job" , function(){
    
    test("should delete a job", async function(){
        await Job.delete(testJobIds[0]);
        const res = await db.query(
            "SELECT id FROM jobs WHERE id = $1", [testJobIds[0]]
        );
        expect(res.rows.length).toEqual(0);
    });

    test("should throw a 404 error if job does not exist", async function(){
        try{
            await Job.delete(0);
            fail();
        } catch(err){
            expect(err).toBeInstanceOf(NotFoundError).toBeTruthy();
        }
    });
});


