var mysql = require('mysql2/promise')

class MySQLPlugin {

 constructor() {
    this.name = 'mysql'
    this.cachedConn = null
    this.cache = false
  }
  
  async start(conf, env) {
    console.log("STARTCONF", conf)
    this.name == conf.name || this.name
    this.host = conf.host || env.MYSQL_HOST
    this.user = conf.user || env.MYSQL_USER
    this.password = conf.password || env.MYSQL_PASSWORD
    this.database = conf.database || env.MYSQL_DATABASE
    if ('cache' in conf) {  // conf.cache could equal false
      this.cache = conf.cache
    } else {
      this.cache =  (env.MYSQL_CACHE_CONNECTION && env.MYSQL_CACHE_CONNECTION == 'true') || false
    }
    console.log("STARTENDCONF", this)
  }
  
  async request(event, context) {
    var conn = await this.connectToDatabase()
    return { service: conn }
  }
  
  async response(event, context, res) {
    if (!this.cache) {
      await this.disconnectFromDatabase()
    }
  }

  async end(options) {
    if (options.teardown || !this.cache) {
      return await this.disconnectFromDatabase()
    }
  }
  
  async connectToDatabase() {
    if (this.cache && this.cachedConn) {
      return this.cachedConn
    }
    var conn = await mysql.createConnection({
      host: this.host,
      user: this.user,
      password: this.password,
      database: this.database
    })
    this.cachedConn = conn
    return this.cachedConn
  }

  async disconnectFromDatabase() {
    if (!this.cachedConn) return 
    await this.cachedConn.end()
    this.cachedConn = null
  }
}

module.exports = MySQLPlugin