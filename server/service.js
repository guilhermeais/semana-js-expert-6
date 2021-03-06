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
import streamPromises from 'stream/promises'

const publicDirectory = config.dir.publicDirectory
const fxDirectory = config.dir.fxDirectory
const fallbackBitRate = config.constants.fallbackBitRate
const englishConversation = config.constants.englishConversation
const bitRateDivisor = config.constants.bitRateDivisor
const audioMediaType = config.constants.audioMediaType
const songVolume = config.constants.songVolume
const fxVolume = config.constants.fxVolume


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
            logger(`client ${id} disconnected, removing from stream`)
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
    return streamPromises.pipeline(
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

  appendFxStream(fx) {
    const throttleTransformable = new Throttle(this.currentBitRate)
    streamPromises.pipeline(
      throttleTransformable,
      this.broadCast()
    )

    const unpipe = () => {
      // Aqui, nós usamos a função de mergear audios
      // Ela pega o audio atual no this.currentReadable
      const transformStream = this.mergeAudioStreams(fx, this.currentReadable)

      this.throttleTransform = throttleTransformable
      this.currentReadable = transformStream
      this.currentReadable.removeListener('unpipe', unpipe)

      streamPromises.pipeline(
        transformStream,
        throttleTransformable
      )
    }

    this.throttleTransform.on('unpipe', unpipe)
    this.throttleTransform.pause()
    this.currentReadable.unpipe(this.throttleTransform)
  }

  mergeAudioStreams(song, readable) {
    const transformStream = new PassThrough()
    const args = [
      // Arquivo de entrada
      // -t => tipo do arquivo de entrada
      '-t', audioMediaType,
      '-v', songVolume,
      // -m => merge e o - é pra receber como stream
      '-m', '-',
      // Arquivo de que vai ser mergeado
      '-t', audioMediaType,
      '-v', fxVolume,
      // caminho do arquivo que vai ser mergeado
      song,
      // Saída
      '-t', audioMediaType,
      '-'
    ]

    const {
      stdout,
      stdin
    } = this._executeSoxCommand(args)

    // Plugamos a stream de conversação
    // na entrada de dados do terminal
    streamPromises.pipeline(
      readable,
      stdin
    )
    .catch(error => logger.error(`error on sending stream to sox`, error))

    streamPromises.pipeline(
      stdout,
      transformStream
    )
    .catch(error => logger.error(`error on receiving stream from sox`, error))


    return transformStream
  }
}