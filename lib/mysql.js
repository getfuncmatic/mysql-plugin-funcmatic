var mysql = require('mysql2/promise')

class MySQLPlugin {

 constructor() {
    this.name = 'mysql'
    this.cachedConn = null
    this.cache = false
  }
  
  async start(conf) {
    this.name == conf.name || this.name
    this.conf = conf
    this.cache = conf.cache 
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
      host: this.conf.host,
      user: this.conf.user,
      password: this.conf.password,
      database: this.conf.database
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