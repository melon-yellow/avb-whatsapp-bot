/*
##########################################################################################################################
#                                                       ACESSORIES                                                       #
##########################################################################################################################
*/

// Imports
import fs from 'fs'
import axios from 'axios'
import express from 'express'
import requestIp from 'request-ip'
import basicAuth from 'express-basic-auth'

/*
##########################################################################################################################
#                                                        TYPE GUARDS                                                     #
##########################################################################################################################
*/

// TypeGuards Class
class TypeGuards {
  // Check if Is Object
  isObject(obj: unknown): obj is Record<string, any> {
    if (typeof obj === 'object') return true
    else return false
  }

  // Check if Is Array
  isArray(obj: unknown): obj is Record<number, any> {
    if (obj instanceof Array) return true
    else return false
  }

  // Check if Is Promise
  isPromise(obj: unknown): obj is Promise<any> {
    if (obj instanceof Promise) return true
    else return false
  }
}

/*
##########################################################################################################################
#                                                       MISCELLANEOUS                                                    #
##########################################################################################################################
*/

// Miscellaneous Class
export default class Miscellaneous {
  // Miscellaneous Imports
  fs = fs
  axios = axios
  express = express
  requestIp = requestIp
  basicAuth = basicAuth

  // Type Guards
  typeGuards = new TypeGuards()

  // Allow Info Inside Misc
  get misc() { return this }

  // Get Date
  get timestamp() {
    return (
      new Date()
        .toLocaleString(
          'pt-BR', {
            timeZone: 'America/Fortaleza'
          }
        )
    )
  }

  // Wait Seconds
  wait(sec: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, sec * 1000))
  }

  // Get Random Item of Array
  rand(arr: Record<string | number, any>): any {
    const karr = Object.keys(arr)
    const k = karr[Math.floor(Math.random() * karr.length)]
    return arr[k]
  }

  // Round Number
  round(number: number, precision = 0): number {
    return parseFloat(Number(number).toFixed(precision))
  }

  // No-Op for JS
  noOp(...params: any[]) { return null }

  // Remove Cyclic References from Object
  serialize(obj: any) {
    const seen = new WeakSet()
    const getCircularReplacer = (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) return
        else seen.add(value)
      }
      return value
    }
    return JSON.parse(
      JSON.stringify(obj, getCircularReplacer)
    )
  }

  // Safe Pattern for Error Handling
  safe(
    func: (...params: any[]) => any
  ): (...params: any[]) => Promise<[ReturnType<typeof func>, Error]> {
    if (typeof func !== 'function') return
    // set async function
    const fasync = async(...params: any[]) => func(...params)
    // return decorated function
    return async (...params: any[]) => {
      // set variables
      let value: ReturnType<typeof func>
      let error: Error
      const promise = fasync(...params)
      // await then and catch
      await new Promise(resolve => {
        promise
          .catch(err => {
            error = err
            resolve(null)
          })
          .then(val => {
            value = val
            resolve(null)
          })
      })
      // return value and error
      return [value, error]
    }
  }

  // Try something
  async try(
    exec: () => unknown,
    verify: (res: unknown) => boolean | Promise<boolean>,
    repeat = 10,
    delay = 1
  ): Promise<any> {
    let i = 0
    while (i < repeat) {
      if (i > 0) await this.wait(delay)
      const res = await exec()
      let cond: boolean | Promise<boolean>
      try { cond = verify(res) } catch { cond = false }
      if (this.typeGuards.isPromise(cond)) {
        await cond
          .catch(e => { cond = false })
          .then(v => { cond = !!v })
      }
      if (cond) return res
      i++
    }
    throw Error()
  }
}

/*
##########################################################################################################################
#                                                         END                                                            #
##########################################################################################################################
*/
