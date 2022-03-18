import fs from 'fs'
import fsPromises from 'fs/promises'
import { join, extname } from 'path'
import config from './config.js'

const publicDirectory = config.dir.publicDirectory
export default class Service {
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