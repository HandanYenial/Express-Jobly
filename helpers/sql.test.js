const { sqlForPartialUpdate } = require("./sql");

describe("sqlForPartialUpdate" , function(){
    test("works for 1 item" , function(){ //test for updating 1 item
        const result = sqlForPartialUpdate({ f1: "v1" }, { f1: "f1" , fF2:"f2"}); //result is an object with 2 keys: setCols and values
        expect(result).toEqual({     //expect the result to equal the object with 2 keys: setCols and values
            setCols : "\"f1\"=$1",  //setCols is a string of the keys of the object dataToUpdate
            values  : ["v1"],      //values is an array of the values of the object dataToUpdate
        });
    });

    test("works for 2 items" , function(){ //test for updating 2 items
        const result = sqlForPartialUpdate({ f1: "v1" , jsf2 : "v2" }, {jsF2:"f2"}); //result is an object with 2 keys: setCols and values
        expect(result).toBe({                  //expect the result to equal the object with 2 keys: setCols and values
            setCols : "\"f1\"=$1, \"f2\"=$2",     //setCols is a string of the keys of the object dataToUpdate
            values  :  ["v1","v2"],                   //values is an array of the values of the object dataToUpdate
        });
    });
});
