'use strict'

/*BDD struct
    dataspace -> name
        datastore -> value
*/

/* data struct
    data -> datspace -> datastore value
    data: {
        name: {
            value: test || [test]
        }
    }
*/
module.exports = (data) => {
    return {
        type: "text",
        value: data.name.value // || data.name[0]
    }
}