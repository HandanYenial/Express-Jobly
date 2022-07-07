"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");
const { ensureLoggedIn } = require("../middleware/auth");
const {ensureAdmin } = require("../middleware/auth");
const { ensureCorrectUserOrAdmin } = require("../middleware/ensureCorrectUserOrAdmin");
const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");

const router = express.Router();


/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: login
 **/
//Creating users should only permitted by admins (registration, however, should remain open 
//to everyone).

router.post("/", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.register(req.body);
    const token = createToken(user);
    return res.status(201).json({ user, token });
  } catch (err) {
    return next(err);
  }
});


/** GET / => { users: [ {username, firstName, lastName, email }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: admin
 **/
//Getting the list of all users should only be permitted by admins.

router.get("/", ensureAdmin, async function (req, res, next) {
  try {
    const users = await User.findAll();
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});


/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, isAdmin }
 *
 * Authorization required: login
 **/
//Getting information on a user, updating, or deleting a user should only be permitted either by an admin, 
//or by that user.

router.get("/:username", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    const user = await User.get(req.params.username);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: login
 **/
////Getting information on a user, updating, or deleting a user should only be permitted either by an admin, 
//or by that user.

router.patch("/:username", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userUpdateSchema);//validating the data that is being sent to the server.
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.update(req.params.username, req.body);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: login
 **/
////Getting information on a user, updating, or deleting a user should only be permitted either by an admin, 
//or by that user.

router.delete("/:username", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    await User.remove(req.params.username);
    return res.json({ deleted: req.params.username });
  } catch (err) {
    return next(err);
  }
});


// Add a route at POST /users/:username/jobs/:id that allows that user to apply for a job (or an admin to do it for them).
//That route should return JSON like:
//{ applied : jobId}

router.post("/:username/jobs/:id" , ensureCorrectUserOrAdmin, async function(req,res,next){
  try{
    const jobId = +req.params.id;
    await User.applyToJob(req.params.username, jobId);
    return res.json({ applied: jobId });
  } catch(err){
    return next(err);
  }
});


module.exports = router;
