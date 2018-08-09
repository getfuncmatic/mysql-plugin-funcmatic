var Funcmatic = require('@funcmatic/funcmatic')
var MySQLPlugin = require('../lib/mysql')
var mysqlconf = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
}

var handler = Funcmatic.wrap(async (event, context, { mysql }) => {
  await mysql.query('DELETE FROM users')
  var user = { 
    id: "TEST-USER-ID", 
    created_at: new Date(), 
    updated_at: new Date() 
  }
  var insertRes = await mysql.query('INSERT INTO users SET ?', user)
  var q = { id: "TEST-USER-ID" }
  var selectRes = await mysql.query('SELECT * FROM users WHERE ?', q)
  var deleteRes = await mysql.query('DELETE FROM users WHERE ?', { id: "TEST-USER-ID" } )
  return {
    statusCode: 200,
    insertRes, selectRes
  }    
})


afterAll(async () => {
  await MySQLPlugin.disconnectFromDatabase()
})

describe('Request', () => {
  beforeEach(async () => {
    Funcmatic.clear()
  })
  it ('should get an uncached connection', async () => {
    Funcmatic.use(MySQLPlugin, mysqlconf)
    var event = { }
    var context = { }
    var ret = await handler(event, context)
    console.log(JSON.stringify(ret.insertRes, null, 2))
    var results = ret.selectRes[0]
    var fields = ret.selectRes[1]
    expect(results.length).toBe(1)
    expect(results[0]).toMatchObject({
      id: "TEST-USER-ID"
    })
    expect(MySQLPlugin.cachedConn).toBeFalsy()
  })
  it ('should get an cached connection', async () => {
    Funcmatic.use(MySQLPlugin, Object.assign(mysqlconf, { cache: true }))
    var event = { }
    var context = { }
    await handler(event, context)
    expect(MySQLPlugin.cachedConn).toBeTruthy()
  })
}) 