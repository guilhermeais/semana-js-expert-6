import { randomUUID } from 'crypto'
import fs from 'fs'
import fsPromises from 'fs/promises'
import { join, extname } from 'path'
import { PassThrough } from 'stream'
import config from './config.js'
import throttle from 'throttle'
import childProcess from 'child_process'
import { logger } from './util.js'

const publicDirectory = config.dir.publicDirectory
const fallbackBitRate = config.constants.fallbackBitRate
export default class Service {
  constructor(){
    this.clientStreams = new Map();
  }

  createClientStream(){
    const id = randomUUID()
    const clientStream = new PassThrough()
    this.clientStreams.set(id, clientStream)

    return {
      id,
      clientStream
    }
  }

  removeClientStream(id){
    this.clientStreams.delete(id)
  }

  _executeSoxCommand(args) {
    return childProcess.spawn('sox', args)
  }

  async getBitRate(song) {
    try {
      const args = [
        '--i', // info
        '-B', // bitrate
        song
      ]

      const {
        stderr, // tudo o que é erro
        stdout, // tudo o que é log
        // stdin // enviar dados como string
       } = this._executeSoxCommand(args)

       const [success, error] = [stdout, stderr].map(stream => stream.read())
       if(error) return await Promise.reject(error);
       
       return success
       .toString()
       .trim()
       .replace(/k/, '000') // k -> 000
    } catch (error) {
      logger.error(`error on getBitRate`,error)
      return fallbackBitRate
    }
  }

  createFileStream(filename){
    return fs.createReadStream(filename)
  }

  async getFileInfo(file){
    const fullFilePath = join(publicDirectory, file)

    await fsPromises.access(fullFilePath)
    const fileType = extname(fullFilePath)

    return {
      type: fileType,
      name: fullFilePath
    }
  }

  async getFileStream(file){
    const {name, type} = await this.getFileInfo(file)
    return {
      stream: this.createFileStream(name),
      type  
    }
  }
}