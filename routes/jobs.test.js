"use strict";

const request = require("supertest");

const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJobIds,
  u1Token,
  adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

// POST/jobs

describe("POST/jobs" , function(){
    
    test("admin should create a new job", async function(){
        const newJob = await request(app)
             .post(`/jobs`)
             .send({
                companyHandle: "test",
                title: "new job",
                salary :"15",
                equity:"0.2",
             })
            .set("autharization", `Bearer ${adminToken}`);
        expect(newJob.statusCode).toEqual(201); 
        expect(newJob.body).toEqual({
            job:{
                id: expect.any(Number),
                title : "new job",
                salary : "15",
                equity : "0.2",
                companyHandle : "test",
            }
        });
    });

    test("unauthorized user should not create a new job", async function(){
        const newJob = await request(app)
                .post(`/jobs`)
                .send({
                    companyHandle: "test",
                    title: "new job",
                    salary :"15",
                    equity:"0.2",
                })
                .set("autharization", `Bearer ${u1Token}`);
            expect(newJob.statusCode).toEqual(401); 
        });


    test("should give an error for missing data" , async function(){
        const newJob = await request(app)
                .post(`/jobs`)
                .send({
                    companyHandle : "test",
                })
                .set("autharization", `Bearer ${adminToken}`);
            expect(newJob.statusCode).toEqual(400);
    });

    test("should give an error for invalid data" , async function(){
        const newJob = await request(app)
                .post(`/jobs`)
                .send({
                    companyHandle : "test",
                    title : "new job",
                    salary : "15",
                    equity : "0.2",
                })
                .set("autharization", `Bearer ${adminToken}`);
            expect(newJob.statusCode).toEqual(400);
    });
});

//GET/jobs

describe("GET/jobs" , function(){
    test("anyone can get all jobs", async function(){
        const response = await request(app).get(`/jobs`);
        expect(response.body).toEqual({
            jobs: [
                {
                    id: expect.any(Number),
                    title : "Job1",
                    salary: 10,
                    equity : 0.2,
                    companyHandle : "test",
                    companyName : "testtest",
                },
                {
                    id : expect.any(Number),
                    title : "Job2",
                    salary : 20,
                    equity : 0.4,
                    companyHandle : "test",
                    companyName : "testtest",
                },
                {
                    id : expect.any(Number),
                    title : "Job3",
                    salary : 30,
                    equity : 0.6,
                    companyHandle : "test",
                    companyName : "testtest",
                },
            ],
        });
    });

    test(" should filter " , async function(){
        const response = await request(app)
            .get(`/jobs`)
            .query({ hasEquity : true });
        expect(response.body).toEqual({
            jobs:[
                {
                    id : expect.any(Number),
                    title : "Job2",
                    salary : 20,
                    equity : 0.4,
                    companyHandle : "test",
                    companyName : "testtest",
                },
                {
                    id : expect.any(Number),
                    title : "Job3",
                    salary : 30,
                    equity : 0.6,
                    companyHandle : "test",
                    companyName : "testtest",
                },
            ],
        },
        );
    });


    test(" should work filtering on 2 filters" , async function(){
        const resp = await request(app)
            .get(`/jobs`)
            .query(({ minSalary :2, title: "Job2" }));
        
        expect(resp.body).toEqual({
            jobs:[
                {
                    id : expect.any(Number),
                    title : "Job2",
                    salary : 20,
                    equity : 0.4,
                    companyHandle : "test",
                    companyName : "testtest",
                },
            ],
        },
        );
    });


    test("should give an error for invalid filters" , async function(){
        const response = await request(app)
            .get(`/jobs`)
            .query({ minSalary : "a" });
        expect(response.statusCode).toEqual(400);
    });
});

//GET/jobs/:id
describe("GET/jobs/:id" , function(){

    test("anyone can get a job", async function(){
        const response = await request(app)
            .get(`/jobs/${testJobIds[0]}`);
        expect(response.body).toEqual({
            job: {
                id: testJobIds[0],
                title : "Job1",
                salary: 10,
                equity : 0.2,
                company: {
                    handle : "test",
                    name : "testtest",
                    description: "Just a company",
                    num_employees: 10,
                    logo_url: "https://logo.com",
                },
            },
        });
    });

    test("should give an error for no jobs found" , async function(){
        const response = await request(app)
             .get(`/jobs/0`);
        expect(response.statusCode).toEqual(404);
    });
});


//patch/jobs/:id
describe("PATCH/jobs/:id" , function(){

    test("should update a job for admin" , async function(){
        const response = await request(app)
            .patch(`/jobs/${testJobIds[0]}`) //for patch request(as patch/jobs/:id)
            .send({ //send what you want to update.
                title: "latest job",
            })
            .set("authorization" , `Bearer ${adminToken}`);
        
        expect(response.body).toEqual({
            job:{
                id: expect.any(Number),
                title : "latest job",
                salary : 10,
                equity : 0.2,
                companyHandle : "test",
            },
        });
    });

    test(" should give an error for unauth" , async function(){
        const response = await request(app)
            .patch(`/jobs/${testJobIds[0]}`)
            .send({
                title: "latest job",
            })
            .set("authorization" , `Bearer ${u1Token}`);
        expect(response.statusCode).toEqual(401);
    });

    test(" should give an error for no-such-job" , async function(){
        const response = await request(app)
            .patch(`jobs/0`)
            .send({
                handle : "new",
            })
            .set("authorization" , `Bearer ${adminToken}`);
        expect(response.statusCode).toEqual(400);
    });

    test("should give an error for handle change" , async function(){
        const response = await request(app)
            .patch(`/jobs/${testJobIds[0]}`)
            .send({
                handle : "new",
            })
            .set("authorization" , `Bearer ${adminToken}`);
        expect(response.statusCode).toEqual(400);
    });

    test(" should give an error for invalid data" , async function(){
        const response = await request(app)
            .patch(`/jobs/${testJobIds[0]}`)
            .send({
                salary:"not-a-number",
            })
            .set("authorization" , `Bearer ${adminToken}`);
        expect(response.statusCode).toEqual(400);
    });
});

//delete/jobs/:id
describe("/DELETE/jobs/:id" , function(){

    test("should delete a job for admin", async function(){
        const response = await request(app)
            .delete(`/jobs/${testJobIds[0]}`)
            .set("authorization" , `Bearer ${adminToken}`);
        expect(response.body).toEqual({deleted: testJobIds[0]});
    });

    test("should give an error for unauth" , async function(){
        const response = await request(app)
            .delete(`/jobs/${testJobIds[0]}`)
            .set("authorization" , `Bearer ${u1Token}`);
        expect(response.statusCode).toEqual(401);
    });

    test("should give an error for no-such-job" , async function(){
        const response = await request(app)
            .delete(`/jobs/0`)
            .set("authorization" , `Bearer ${adminToken}`);
        expect(response.statusCode).toEqual(400);
    });
});