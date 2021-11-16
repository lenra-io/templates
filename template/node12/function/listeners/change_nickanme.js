'use strict'

/*BDD struct
    dataspace -> nickname
        datastore -> value
*/

module.exports = (data, event) => {
    data.nickname.value = event.value;
    return data;
}

/*
    return
    data {
        nickanme: {
            {
                id: datastore_id
                value: event.value
            }

        }
    }

    this make an update on the datastore_id with the new value
*/