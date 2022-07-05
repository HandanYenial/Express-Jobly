const { BadRequestError } = require("../expressError"); //BadRequestError class is defined in expressError.js file
// We use BadRequestError to send a 400-"Bad Request" : No data or invalid data--something not supported by our app.

//We will use this function to convert a JavaScript object to a SQL query, when updating a company or user.
// We do that to avoid SQL injection attacks. 
//function(body of the request , column names of the table)
//function(whatever field we want to update(object), name of the column in the table)
//function(I want to change the name to Aliya, name)
//function(Aliya,name)

//keys is an array of the keys of the object dataToUpdate
//So in an object [{name: Aliya}, {age: 20}] as [{key:value} , {key:value}]
// so I'll get the keys of the object dataToUpdate and put them in an array
// const keys = Object.keys(keys of the object I want to change);
// converting js to sql is necessary because it has different names in the database and in the js object

function sqlForPartialUpdate(dataToUpdate, jsToSql) { //
  const keys = Object.keys(dataToUpdate); //keys is an array of the keys of the object dataToUpdate
  if (keys.length === 0) throw new BadRequestError("No data");//if there is no data, throw a 400 error--bad request mentioned above

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  //
  const cols = keys.map((colName, idx) =>//cols is an array of the keys of the object dataToUpdate
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,//
  );

  return {
    setCols: cols.join(", "), //setCols is a string of the keys of the object dataToUpdate
    values: Object.values(dataToUpdate), //values is an array of the values of the object dataToUpdate
  };
}

module.exports = { sqlForPartialUpdate };
