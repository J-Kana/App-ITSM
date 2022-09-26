var env = 'prod'
var domain = 'https://test-backend-01.m-lombard.kz/'
var nsi_domain = 'http://10.33.132.161/'

// switch (env) {
//   case 'dev':
//     domain = 'https://dev-project.m-lombard.kz/'
//     nsi_domain = 'http://10.25.132.161/'
//     break
//   case 'test':
//     domain = 'https://test-backend-01.m-lombard.kz/'
//     nsi_domain = 'http://10.33.132.161/'
//     break
//   case 'prod':
//     domain = 'https://backend-01.m-lombard.kz/'
//     nsi_domain = 'http://10.33.133.61/'
//     break
//   default:
//     domain = 'https://dev-project.m-lombard.kz/'
//     nsi_domain = 'http://10.25.132.161/'
// }

module.exports = {
  domain: domain,
  nsi_domain: nsi_domain
}
