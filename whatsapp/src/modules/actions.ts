
// Imports
import type Bot from 'ts-wapp'
import Laminador from './laminador.js'

// Import Axios
import axios from 'axios'

// Import Super-Guards
import { is } from 'ts-misc/dist/utils/guards.js'

/*
##########################################################################################################################
#                                                     CLASSE LAMINADOR                                                   #
##########################################################################################################################
*/

// Add Actions
export function add(p: { bot: Bot, lam: Laminador }) {
  // Bot Actions
  const { bot, lam } = p

  // Responde Agradecimento
  bot.add('cool_feedback',
    message => message.clean().match(/^\s*(obrigado|valeu)\s*$/),
    async message => {
      await message.quote({ text: 'Estou as ordens! 😉🤝', log: 'cool_feedback' })
    }
  )

  // Producao Trefila
  bot.add('prod_trf',
    message => message.clean().match(/^\s*(producao(\s+))?trefila\s*$/),
    async message => {
      await message.quote({ text: bot.chat.gotIt, log: 'got_it' })
      await message.send({ text: lam.getTref(), log: 'bot::prod_trf' })
    }
  )

  // Producao Laminador
  bot.add('prod_lam',
    message => message.clean().match(/^\s*(producao(\s+))?laminador\s*$/),
    async message => {
      await message.quote({ text: bot.chat.gotIt, log: 'got_it' })
      await message.send({ text: lam.getProd(), log: 'bot::prod_lam' })
    }
  )

  // Producao do Mes Laminador
  bot.add('prod_mes_lam',
    message => message.clean().match(/^\s*producao(\s+)(do(\s+))?mes((\s+)laminador)?\s*$/),
    async message => {
      await message.quote({ text: bot.chat.gotIt, log: 'got_it' })
      await message.send({ text: lam.getProdMes(), log: 'bot::prod_mes_lam' })
    }
  )

  // Responde Pergunta Geral do Usuario
  bot.add('else', async message => {
    await message.quote({ text: bot.chat.askPython.asking, log: 'asking_py' })
    axios.post(
      'http://gusal2:3000/questions',
      { question: message.clean() }
    )
      .catch(async error => {
        await bot.log(`Error(admin::exec) Throw(${error})`)
        await message.send({ text: bot.chat.error.network, log: 'error_in_request' })
      })
      .then(async answer => {
        if (!is.string(answer)) {
          await bot.log('Error(admin::exec) Throw(bad response)')
          await message.send({ text: bot.chat.error.network, log: 'error_in_request' })
          return
        }
        await message.quote({ text: bot.chat.askPython.finally, log: 'got_py_response' })
        await message.send({ text: answer, log: 'py_response' })
      })
  })
}

/*
##########################################################################################################################
#                                                     CLASSE LAMINADOR                                                   #
##########################################################################################################################
*/
