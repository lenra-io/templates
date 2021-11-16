'use strict'

// Widgets
const print_nickname = require('../widgets/print_nickname')
const print_name = require('../widgets/print_name')

// listeners
const on_changed_nickname = require('../listeners/on_changed_nickname')


//call ui with basic data like user id ?
module.exports = (ctx) => {
  return {
    widgets: {
      "print_nickname": print_nickname,
      "print_name": print_name
    },
    root: {
        type: "flex",
        direction: "col",
        children: [
            //ui return widget with name, application_runner execute the query and call the named widget with data
            //application runner replace Widget with the named widget
            {
                type: "Widget",
                name: "print_nickname",
                //How get user id from her ?
                //maybe give by default some basic data and do data.user_id ?
                query: {
                    space: "nickname",
                    id: ctx.user_id,
                }
            },
            {
                type: "Widget",
                name: "print_name",
                //same her ?
                query: {
                    space: "nickname",
                    id: ctx.user_id,
                }
            },
            {
                type: "textfield",
                hintText: "New nickname",
                onchanged: {
                    action: on_change_nickname
                }
            }
        ]
    }
}
