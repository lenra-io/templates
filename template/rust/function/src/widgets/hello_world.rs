use json::object;
use json::JsonValue;

pub fn hello_world(data: JsonValue, props: JsonValue) -> JsonValue {
  return object!{
    type: "flex",
    children: [
      {
        type: "text",
        value: "Hello ${data.value}!"
      },
      {
        type: "textfield",
        value: "data.value",
        onChanged: {
          action: "changeValue"
        }
      }
    ]
  };
}
