mod widgets;
mod listeners;

use json::object;
use json::JsonValue;

type Error = Box<dyn std::error::Error>;

pub fn handle() -> Result<JsonValue, Error> {
    return Ok(object!{
        widgets: {
            helloWorld: "hello_world",
        },
        listeners: {
            InitData: "init_data",
            changeValue: "changed_value"
        },
        rootWidget: "helloWorld"
    });
}
