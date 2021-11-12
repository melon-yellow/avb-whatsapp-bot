
/*
##########################################################################################################################
#                                                     CLASSE LAMINADOR                                                   #
##########################################################################################################################
*/

// Imports
import type Bot from 'ts-wapp'
import Laminador from './laminador.js'

// Imports Utils
import cron from 'node-cron'

/*
##########################################################################################################################
#                                                        BOT METHODS                                                     #
##########################################################################################################################
*/

// Add Actions
export function load(p: { bot: Bot, lam: Laminador }) {
  // Bot Actions
  const { bot, lam } = p

  // Cron Scheduled Messages
  cron.schedule('7 */1 * * *', async () => {
    /*
    // Producao Trefila Grupo
    await bot.sends({
      to: 'grupo_trefila',
      text: lam.relatorioProducaoTrefila(),
      log: 'cron::producaoTrefila'
    })
    */
    // Producao Laminador Calegari
    await bot.sends({
      to: 'calegari',
      text: lam.relatorioProducaoLaminador(),
      log: 'cron::producaoLaminador'
    })
  })
}

/*
##########################################################################################################################
#                                                        START BOT                                                       #
##########################################################################################################################
*/
