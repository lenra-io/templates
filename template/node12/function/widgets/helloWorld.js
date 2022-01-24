'use strict'

module.exports = (data, props) => {
  return {
    type: "flex",
    children: [
      {
        type: "text",
        value: `Hello ${data.value}!`
      },
      {
        type: "textfield",
        value: data.value,
        onChanged: {
          action: "changeValue"
        }
      }
    ]
  }
}

