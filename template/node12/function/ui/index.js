'use strict'

/*
context : {
    screen: {
        size: ...
        ...
    },
    session: {
        page: "page_name"
    },
    user_id: 1
}
*/

module.exports = async (ctx) => {
    return require(`./pages/${ctx.session?.page ?? 'home_page'}`)(ctx)
}

