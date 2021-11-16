'use strict'

/*BDD struct
    dataspace -> name
        datastore -> value
    dataspace -> nickname
        datastore -> value
*/

/* data struct
    data -> datspace -> datastore value
    data: {
        nickname: {
            value: test || [test]
        }
    }
*/
module.exports = (data) => {
    return {
        type: "text",
        value: data.nickname.value // || data.nickname[0]
    }
}