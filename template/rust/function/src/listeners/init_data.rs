use json::object;
use json::JsonValue;

pub fn init_data(data: JsonValue, props: JsonValue) -> JsonValue {
  return object!{
    value: "World"
  };
}
