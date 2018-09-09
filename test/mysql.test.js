require('dotenv').config()
var funcmatic = require('@funcmatic/funcmatic')
var MySQLPlugin = require('../lib/mysql')

funcmatic.use(MySQLPlugin, {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
})

// var handler = Funcmatic.wrap(async (event, context, { mysql }) => {
//   await mysql.query('DELETE FROM users')
//   var user = { 
//     id: "TEST-USER-ID", 
//     created_at: new Date(), 
//     updated_at: new Date() 
//   }
//   var insertRes = await mysql.query('INSERT INTO users SET ?', user)
//   var q = { id: "TEST-USER-ID" }
//   var selectRes = await mysql.query('SELECT * FROM users WHERE ?', q)
//   var deleteRes = await mysql.query('DELETE FROM users WHERE ?', { id: "TEST-USER-ID" } )
//   return {
//     statusCode: 200,
//     insertRes, selectRes
//   }    
// })

describe('Request', () => {
  var plugin = null
  beforeEach(async () => {
    funcmatic = funcmatic.clone()
    plugin = funcmatic.getPlugin('mysql')
  })
  afterEach(async () => {
    await funcmatic.teardown()
  })

  it ('should create an uncached connection', async () => {
    var event = { }
    var context = { }
    await funcmatic.invoke(event, context, async (event, context, { mysql }) => {
      expect(mysql).toBeTruthy()
    })
    expect(plugin.cachedConn).toBeFalsy()
  })
  it ('should create a cached connection', async () => {
    var funcmaticCached = funcmatic.clone()
    funcmaticCached.clear()
    funcmaticCached.use(MySQLPlugin, {
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      cache: true
    })
    plugin = funcmaticCached.getPlugin('mysql')
    var event = { }
    var context = { }
    await funcmaticCached.invoke(event, context, async (event, context, { mysql }) => {
      expect(mysql).toBeTruthy()
    })
    expect(plugin.cachedConn).toBeTruthy()
    await funcmaticCached.teardown()
    expect(plugin.cachedConn).toBeFalsy()
  })
  it ('should perform basic SQL operations', async () => {
    var event = { }
    var context = { }
    await funcmatic.invoke(event, context, async (event, context, { mysql }) => {
      var id = `TEST-USER-ID-${new Date().getTime()}`
      var user = { 
        id, 
        created_at: new Date(), 
        updated_at: new Date() 
      }
      var insertRes = await mysql.query('INSERT INTO users SET ?', user)
      expect(insertRes.length).toBe(2)
      expect(insertRes[0]).toMatchObject({
        affectedRows: 1
      })
      
      var q = { id }
      var selectRes = await mysql.query('SELECT * FROM users WHERE ?', q)
      expect(selectRes[0].length).toBe(1)
      expect(selectRes[0][0]).toMatchObject({
        id
      })
      var deleteRes = await mysql.query('DELETE FROM users WHERE ?', q)
      expect(deleteRes.length).toBe(2)
      expect(deleteRes[0]).toMatchObject({
        affectedRows: 1
      })
    })
  })
}) 