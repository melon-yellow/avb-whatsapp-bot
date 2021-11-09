
/*
##########################################################################################################################
#                                                     CLASSE LAMINADOR                                                   #
##########################################################################################################################
*/

// Imports
import type Bot from 'ts-wapp'

// Import Axios
import axios from 'axios'

/*
##########################################################################################################################
#                                                     CLASSE LAMINADOR                                                   #
##########################################################################################################################
*/

export default class Laminador {
  bot: Bot

  constructor (bot: Bot) {
    Object.defineProperty(this, 'bot',
      { get() { return bot } }
    )
  }

  get misc() { return this.bot.misc }

  /*
  ##########################################################################################################################
  #                                                  PRODUCAO DIA LAMINADOR                                                #
  ##########################################################################################################################
  */

  async relatorioProducaoLaminador() {
    try {
      // Resquest Data
      const responseList = await Promise.all([
        axios.get(`${process.env.UAVBSRV_ADDRESS}/api/furnace`),
        axios.get(`${process.env.UAVBSRV_ADDRESS}/api/mill`)
      ])
      const data = [responseList[0].data, responseList[1].data]
      // Parse Data
      let blbp = data[0].QTD_PECAS
      if (data[1].COBBLES > 0) blbp = this.misc.numbers.round(blbp / data[1].COBBLES)
      const pt = this.misc.numbers.round(data[0].PESO_TOTAL)
      const rd = this.misc.numbers.round(data[0].RITIMO_DIA)
      const hap = this.misc.numbers.round(data[0].ATUAL_HORA_PESO, 1)
      const rh = this.misc.numbers.round(data[0].RITIMO_HORA, 1)
      const uhp = this.misc.numbers.round(data[0].ULTIMA_HORA_PESO, 1)
      const vm = this.misc.numbers.round(data[0].VAZAO_MEDIA, 1)
      const ld = this.misc.numbers.round(data[0].QTD_PECAS)
      const lha = this.misc.numbers.round(data[0].ATUAL_HORA_PECAS)
      const luh = this.misc.numbers.round(data[0].ULTIMA_HORA_PECAS)
      const tp = this.misc.numbers.round(data[0].TEMPO_PARADO)
      const u = this.misc.numbers.round(data[0].UTIL * 100, 1)
      const cb = this.misc.numbers.round(data[1].COBBLES)
      // Create Message String
      const message = '\n' +
        '------------------------------------------------------\n' +
        '🤖 *Produção Laminador* 👾\n' +
        '------------------------------------------------------\n' +
        `✅ Produção do dia: *${pt} t*\n` +
        `📈 Ritmo do dia: *${rd} t*\n` +
        `✅ Produção da hora atual: *${hap} t*\n` +
        `📈 Ritmo da hora atual: *${rh} t*\n` +
        `✅ Produção da última hora: *${uhp} t*\n` +
        `📈 Vazão média: *${vm} t/h*\n` +
        '------------------------------------------------------\n' +
        `💰 Laminados no dia: *${ld}*\n` +
        `💵 Laminados na hora atual: *${lha}*\n` +
        `💵 Laminados na última hora: *${luh}*\n` +
        '------------------------------------------------------\n' +
        `⚠️ Paradas totais no dia: ${tp} min\n` +
        `📊 Utilização do dia: *${u}%*\n` +
        '------------------------------------------------------\n' +
        `💸 Sucatas totais no dia: *${cb}*\n` +
        `➿ BL/BP do dia: *${blbp}*\n` +
        '------------------------------------------------------\n'

      // Return Data
      return message
    // If an Error Occurred
    } catch (error) {
      console.log(`Throw(Laminador::relatorioProducaoLaminador) Catch(${error})`)
      return this.bot.chat.error.network
    }
  }

  /*
  ##########################################################################################################################
  #                                                   PRODUCAO MES LAMINADOR                                               #
  ##########################################################################################################################
  */

  async relatorioProducaoLaminadorMes() {
    try {
      // Request Data
      const response = await axios.get(
        `${process.env.UAVBSRV_ADDRESS}/api/prod_lam_quente`
      )
      const data = response.data
      // Parse Data
      const meses = [
        'Janeiro', 'Fevereiro', 'Março',
        'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro',
        'Outubro', 'Novembro', 'Dezembro'
      ]
      const mes = meses[Number(String(data[0].data).substring(3, 5)) - 1]
      const ano = String(data[0].data).substring(6, 10)
      let prodMes = 0

      // Create Message String
      let message = '\n' +
        '------------------------------------------------------\n' +
        '🤖 *Produção Laminador* 👾\n' +
        '------------------------------------------------------\n' +
        `📅 *${mes} de ${ano}:*\n` +
        '------------------------------------------------------\n'
      for (const i in data) {
        const date = data[i].data
        let prod = data[i].peso
        prodMes += prod
        prod = this.misc.numbers.round(prod)
        message += `${date} => *${prod} Ton*\n`
      }
      const prodAvg = this.misc.numbers.round(prodMes / data.length)
      prodMes = this.misc.numbers.round(prodMes)
      message += '' +
        '------------------------------------------------------\n' +
        `💰 Produção do mês: *${prodMes} Ton*\n` +
        `📊 Produção média: *${prodAvg} Ton/dia*\n` +
        '------------------------------------------------------\n'
      // Return data
      return message
    // If an Error Occurred
    } catch (error) {
      console.log(`Throw(Laminador::relatorioProducaoLaminadorMes) Catch(${error})`)
      return this.bot.chat.error.network
    }
  }

  /*
  ##########################################################################################################################
  #                                                   PRODUCAO DIA TREFILA                                                 #
  ##########################################################################################################################
  */

  async relatorioProducaoTrefila() {
    try {
      // Request Data
      const response = await axios.get(
        `${process.env.UAVBSRV_ADDRESS}/api/trf`
      )
      const data = response.data
      // Parse Data
      const p02 = this.misc.numbers.round(!data.p02 ? 0 : (data.p02 / 1000), 1)
      const p03 = this.misc.numbers.round(!data.p03 ? 0 : (data.p03 / 1000), 1)
      const p04 = this.misc.numbers.round(!data.p04 ? 0 : (data.p04 / 1000), 1)
      const p05 = this.misc.numbers.round(!data.p05 ? 0 : (data.p05 / 1000), 1)
      const ps = this.misc.numbers.round(p02 + p03 + p04 + p05)
      const u02 = this.misc.numbers.round(!data.u02 ? 0 : (data.u02 * 100), 1)
      const u03 = this.misc.numbers.round(!data.u03 ? 0 : (data.u03 * 100), 1)
      const u04 = this.misc.numbers.round(!data.u04 ? 0 : (data.u04 * 100), 1)
      const u05 = this.misc.numbers.round(!data.u05 ? 0 : (data.u05 * 100), 1)
      const us = this.misc.numbers.round((u02 + u03 + u04 + u05) / 4)
      const t02 = this.misc.numbers.round(!data.t02 ? 0 : (data.t02 / 60), 1)
      const t03 = this.misc.numbers.round(!data.t03 ? 0 : (data.t03 / 60), 1)
      const t04 = this.misc.numbers.round(!data.t04 ? 0 : (data.t04 / 60), 1)
      const t05 = this.misc.numbers.round(!data.t05 ? 0 : (data.t05 / 60), 1)
      const ts = this.misc.numbers.round(t02 + t03 + t04 + t05)
      const pt02 = this.misc.numbers.round(0.04000 * (u02 / 100) * (data.s / 60), 2)
      const pt03 = this.misc.numbers.round(0.05714 * (u03 / 100) * (data.s / 60), 2)
      const pt04 = this.misc.numbers.round(0.05000 * (u04 / 100) * (data.s / 60), 2)
      const pt05 = this.misc.numbers.round(0.04000 * (u05 / 100) * (data.s / 60), 2)
      const pts = this.misc.numbers.round(pt02 + pt03 + pt04 + pt05)
      const rpts = this.misc.numbers.round(86400 * (pts / data.s), 1)
      // Create Message String
      const message = '\n' +
        '------------------------------------------------------\n' +
        '🤖 *Produção Laminador a Frio* 👾\n' +
        '------------------------------------------------------\n' +
        `✅ Produção do dia M02: *${p02}t*\n` +
        `✅ Produção do dia M03: *${p03}t*\n` +
        `✅ Produção do dia M04: *${p04}t*\n` +
        `✅ Produção do dia M05: *${p05}t*\n` +
        `✅ *Produção total do dia: ${ps}t*\n` +
        '------------------------------------------------------\n' +
        `📊 Utilização M02: *${u02}%*\n` +
        `📊 Utilização M03: *${u03}%*\n` +
        `📊 Utilização M04: *${u04}%*\n` +
        `📊 Utilização M05: *${u05}%*\n` +
        `📊 *Utilização global: ${us}%*\n` +
        '------------------------------------------------------\n' +
        `⚠️ Tempo parado M02: *${t02}* horas\n` +
        `⚠️ Tempo parado M03: *${t03}* horas\n` +
        `⚠️ Tempo parado M04: *${t04}* horas\n` +
        `⚠️ Tempo parado M05: *${t05}* horas\n` +
        `⚠️ *Tempo total paradas: ${ts}h*\n` +
        '------------------------------------------------------\n' +
        `✅ Produção teórica M02: *${pt02}t*\n` +
        `✅ Produção teórica M03: *${pt03}t*\n` +
        `✅ Produção teórica M04: *${pt04}t*\n` +
        `✅ Produção teórica M05: *${pt05}t*\n` +
        `✅ *Produção teórica total: ${pts}t*\n` +
        `📈 *Ritmo de produção teórica: ${rpts}t*\n` +
        '------------------------------------------------------\n'
      // Return data
      return message
    // If an Error Occurred
    } catch (error) {
      console.log(`Throw(Laminador::relatorioProducaoTrefila) Catch(${error})`)
      return this.bot.chat.error.network
    }
  }
}

/*
##########################################################################################################################
#                                                           END                                                          #
##########################################################################################################################
*/
