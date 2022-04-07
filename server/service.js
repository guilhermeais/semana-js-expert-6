import crypto from 'crypto'
import fs from 'fs'
import fsPromises from 'fs/promises'
import path, { join, extname } from 'path'
import { PassThrough, Writable } from 'stream'
import config from './config.js'
import Throttle from 'throttle'
import childProcess from 'child_process'
import { logger } from './util.js'
import { once } from 'events'
import streamProises from 'stream/promises'

const publicDirectory = config.dir.publicDirectory
const fxDirectory = config.dir.fxDirectory
const fallbackBitRate = config.constants.fallbackBitRate
const englishConversation = config.constants.englishConversation
const bitRateDivisor = config.constants.bitRateDivisor

export default class Service {
  constructor(){
    this.clientStreams = new Map();
    this.currentSong = englishConversation
    this.currentBitRate = 0
    this.throttleTransform = {}
    this.currentReadable = {}
  }

  createClientStream(){
    const id = crypto.randomUUID()
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

       await Promise.all([
         once(stderr, 'readable'),
         once(stdout, 'readable')
        ])
        
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

  broadCast(){
    return new Writable({
      write: (chunk, encoding, cb) => {
        for (const [id, stream] of this.clientStreams) {
          if(stream.writableEnded){ // se o cliente desconectou, não mandaremos mais dados a ele
            this.clientStreams.delete(id)
            continue;
          }
          stream.write(chunk)
        }

        cb()
      }
    })
  }

  async startStreaming() {
    logger.info(`starting with ${this.currentSong}`)
    const bitRate = this.currentBitRate = (await this.getBitRate(this.currentSong)) / bitRateDivisor
    const throttleTransform = this.throttleTransform = new Throttle(bitRate)
    const songReadable = this.currentReadable = this.createFileStream(this.currentSong)
    return streamProises.pipeline(
      songReadable, // a medida que a stream do song chega
      throttleTransform, // o throttle pega, porem manda somente a quantia setada na constante bitRate (backpressure)
      this.broadCast()
    )
    
  }

  stopStreaming(){
    this.throttleTransform?.end?.()
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

  async readFxByName(fxName) {
    const songs = await fsPromises.readdir(fxDirectory)
    const chosenSong = songs.find(filename => filename.toLowerCase().includes(fxName.toLowerCase()))

    if(!chosenSong) {
      return Promise.reject(`fx ${fxName} not found`)
    }

    return path.join(fxDirectory, chosenSong)
  }
}