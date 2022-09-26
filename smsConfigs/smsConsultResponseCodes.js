module.exports = {
  '100': {
      name: 'SCHEDULED',
      description: 'Сообщение поставлено в очередь на отправку. Доставка сообщения еще не начата.',
      is_finished: false
  },
  '101': {
      name: 'ENROUTE',
      description: 'Сообщение успешно отправлено на оборудование оператора.',
      is_finished: false
  },
  '102': {
      name: 'DELIVERED',
      description: 'Сообщение успешно доставлено абоненту',
      is_finished: true
  },
  '103': {
      name: 'EXPIRED',
      description: 'Истек срок жизни сообщения в процессе доставки на абонентское оборудование',
      is_finished: true
  },
  '104': {
      name: 'DELETED',
      description: 'Сообщение удалено из очереди на доставку на стороне SMSC оператора',
      is_finished: true
  },
  '105': {
      name: 'UNDELIVERABLE',
      description: 'Сообщение невозможно доставить',
      is_finished: true
  },
  '106': {
      name: 'ACCEPTED',
      description: 'Сообщение прочитано абонентом',
      is_finished: true
  },
  '107': {
      name: 'UNKNOWN',
      description: 'Сообщение находится в неопределенном статусе',
      is_finished: true
  },
  '108': {
      name: 'REJECTED',
      description: 'Сообщение отвергнуто системой оператора',
      is_finished: true
  },
  '109': {
      name: 'DISCARDED',
      description: 'Сообщение отвергнуто системой SMS-Consult',
      is_finished: true
  },
  '200': {
      name: 'ERR_UNKNOWN',
      description: 'Общая ошибка, покрывающая все неспецифичные причины синтаксической некорректности исходного запроса',
      is_finished: false
  },
  '201': {
      name: 'ERR_ID',
      description: 'Некорректный формат идентификатора сообщения',
      is_finished: false
  },
  '202': {
      name: 'ERR_SENDER',
      description: 'Некорректный формат имени отправителя',
      is_finished: false
  },
  '203': {
      name: 'ERR_RECIPIENT',
      description: 'Некорректный формат получателя',
      is_finished: false
  },
  '204': {
      name: 'ERR_LENGTH',
      description: 'Некорректная длина тела запроса',
      is_finished: false
  },
  '205': {
      name: 'ERR_USER_DISABLE',
      description: 'Пользователь заблокирован в системе SMS-Consult',
      is_finished: false
  },
  '206': {
      name: 'ERR_BILLING',
      description: 'Пользователь заблокирован в системе SMS-Consult по причине задолженности (чаще всего для пост-оплатных клиентов)',
      is_finished: false
  },
  '207': {
      name: 'ERR_OVERLIMIT',
      description: 'Пользователь заблокирован в системе SMS-Consult по причине превышения лимита (чаще всего для пред-оплатных клиентов)',
      is_finished: false
  },
};