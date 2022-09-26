var env = 'localhost'

switch (env) {
  case 'development':
    HOST_PORT = 8002
    HOST_DB = '10.33.133.3'
    PORT_DB = 5432
    USER_DB = 'itsmdb'
    PASSWORD_DB = 'itsmdb'
    DATABASE_DB = 'itsmdb'
    jiraEmail = 'tech_itsm@mk-lombard.kz'
    jiraToken = 'SMyurGzTfL6CLfINLtIR7157'
    key = 'bezkoder-secret-key'
    projectID = 10001
    break
  case 'production':
    HOST_PORT = 8002
    HOST_DB = '10.33.133.5'
    PORT_DB = 5432
    USER_DB = 'itsm'
    PASSWORD_DB = 'itsm'
    DATABASE_DB = 'itsm'
    jiraEmail = 'tech_itsm@mk-lombard.kz'
    jiraToken = 'SMyurGzTfL6CLfINLtIR7157'
    key = 'bezkoder-secret-key'
    projectID = 10003
    break
  case 'localhost':
    HOST_PORT = 8002
    HOST_DB = '10.33.133.3'
    PORT_DB = 5432
    USER_DB = 'itsmdb'
    PASSWORD_DB = 'itsmdb'
    DATABASE_DB = 'itsmdb'
    jiraEmail = 'tech_itsm@mk-lombard.kz'
    jiraToken = 'SMyurGzTfL6CLfINLtIR7157'
    key = 'bezkoder-secret-key'
    projectID = 10001
    break
  default:
    HOST_PORT = 8002
}
module.exports = {
  NODE_ENV: env,
  HOST_PORT: HOST_PORT,
  HOST_DB,
  PORT_DB,
  USER_DB,
  PASSWORD_DB,
  DATABASE_DB,
  jiraEmail,
  jiraToken,
  key,
  projectID
}
