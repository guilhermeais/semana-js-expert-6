import { jest, expect, describe, test, beforeEach } from '@jest/globals'
import config from '../../../server/config';
import fsPromises from 'fs/promises';
import fs from 'fs'
import Service from '../../../server/service';
import TestUtil from '../_util/testUtil';
import { extname, join } from 'path';
import crypto from 'crypto';
import { PassThrough, Writable } from 'stream';
import childProcess from 'child_process'
const { pages, location, dir: {publicDirectory} } = config

describe('Service - test manipulation of file streams', () => {
  const getSpawnResponse = ({
    stdout = '',
    stderr = '',
    stdin = () => {}
  }) => ({
    stdout: TestUtil.generateReadableStream([stdout]),
    stderr: TestUtil.generateReadableStream([stderr]),
    stdin: TestUtil.generateWritableStream(stdin),
  })

  beforeEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })
  

  describe('getFileInfo', () => {
    test('should return the correct type and name', async ()=> {
      jest.spyOn(fsPromises, 'access')

      const file = pages.controllerHTML
      const fullFilePath = join(publicDirectory, file)
      const fileType = extname(fullFilePath)
      const service = new Service()
      const result = await service.getFileInfo(file)
      
      expect(fsPromises.access).toHaveBeenCalledWith(fullFilePath)
      expect(result).toEqual({
        type: fileType,
        name: fullFilePath
      })
    })

    describe('exceptions', () => {
      test('should throw if fsPromises.access is an non-existing path', async () => {
        jest.spyOn(fsPromises, 'access').mockImplementation(() => {
          throw new Error('ENOENT')
        })

        const file = pages.controllerHTML
        const service = new Service()

        expect(service.getFileInfo(file)).rejects.toThrow('ENOENT')
      });
    });
  });

  describe('getFileStream', () => {
    test('should return the correct type and name', async ()=> {
      const mockFileInfo = {
        type: '.html',
        name: 'test.html'
      }
      const mockFileStream = TestUtil.generateReadableStream(['data'])

      jest.spyOn(Service.prototype, 'getFileInfo').mockReturnValue(mockFileInfo)
      jest.spyOn(Service.prototype, 'createFileStream').mockReturnValue(mockFileStream)

      const service = new Service()
      const result = await service.getFileStream(mockFileInfo.name)
      
      expect(Service.prototype.getFileInfo).toHaveBeenCalledWith(mockFileInfo.name)
      expect(Service.prototype.createFileStream).toHaveBeenCalledWith(mockFileInfo.name)
      

      expect(result).toStrictEqual({
        stream: mockFileStream,
        type: '.html'
      })
    });
  })

  describe('createFileStream', () => {
    test('should return a file stream', async () => {
      const mockFileStream = TestUtil.generateReadableStream(['data'])
      jest.spyOn(fs, 'createReadStream').mockReturnValue(mockFileStream)

      const service = new Service()
      const result =  service.createFileStream('test.html')
      
      expect(fs.createReadStream).toHaveBeenCalledWith('test.html')
      expect(result).toStrictEqual(mockFileStream)
    })

    describe('exceptions', () => {
      test('should throw if fs.createReadStream is called with an non-existing path', async () => {

        jest.spyOn(fs, 'createReadStream').mockRejectedValue(
           new Error('ENOENT')
        )

        const service = new Service()

        expect(()=> service.createFileStream('non-existing.html')).rejects.toThrow('ENOENT')
      })
    });
  });

  describe('createClientStream', () => {
    test('should return a clientStream and an id', () => {
      const service = new Service()
      
      const spyRandomUUID = jest.spyOn(crypto, 'randomUUID').mockReturnValue('test-uuid')
      const spyCreateClientStream = jest.spyOn(service, 'createClientStream')
      const result = service.createClientStream()

      expect(spyCreateClientStream).toHaveBeenCalled()
      expect(spyRandomUUID).toHaveBeenCalled()
      expect(result.clientStream).toBeInstanceOf(PassThrough)
      expect(result.id).toBe('test-uuid')
    })
  });

  describe('removeCLientStream', () => {
    test('should remove the clientStream from the service', () => {
      const service = new Service()
      const clientStream = new PassThrough()
      const id = 'test-uuid'
      service.clientStreams.set(id, clientStream)

      service.removeClientStream(id)

      expect(service.clientStreams[id]).toBeUndefined()
    })
  })

  describe('_executeSoxCommand', () => {
    test('should call childProcess.spawn with correct params', () => {
      const service = new Service()
      const spawnResponse = getSpawnResponse({stdout: '1k'})
      const spySpawn = jest.spyOn(childProcess, 'spawn').mockReturnValue(spawnResponse)
      const testCommand = ['test-command']

      const result = service._executeSoxCommand(testCommand)

      expect(spySpawn).toHaveBeenCalledWith('sox', testCommand)
      expect(result).toStrictEqual(spawnResponse)
    });
  });
  describe('getBitRate', () => {
    test('should return the bitRate as string', async () =>{
      const songName = 'someSong.mp3'
      const service = new Service()

      jest.spyOn(service, '_executeSoxCommand').mockReturnValue(
        getSpawnResponse({stdout: ' 1k '})
      )
      
      const bitRatePromise = service.getBitRate(songName)
      const result = await bitRatePromise

      expect(result).toStrictEqual('1000')
      expect(service._executeSoxCommand).toHaveBeenCalledWith(['--i', '-B', songName])
    })
    test('should return fallbackBitRate if occur an error', async () => {
      const fallbackBitRate = config.constants.fallbackBitRate
      const songName = 'someSong.mp3'
      const service = new Service()

      jest.spyOn(service, '_executeSoxCommand').mockReturnValue(
        getSpawnResponse({stderr: 'Error!'})
      )
      
      const bitRatePromise = service.getBitRate(songName)
      const result = await bitRatePromise

      expect(result).toStrictEqual(fallbackBitRate)
      expect(service._executeSoxCommand).toHaveBeenCalledWith(['--i', '-B', songName])
    });
  });

  describe('broadCast', () => {
    test('should write only for active client streams', () => {
      const service = new Service()
      const onData = jest.fn()
      const client1 = TestUtil.generateWritableStream(onData)
      const client2 = TestUtil.generateWritableStream(onData)
      jest.spyOn(service.clientStreams,  service.clientStreams.delete.name)

      service.clientStreams.set('1', client1)
      service.clientStreams.set('2', client2)
      client2.end() // client2 desconectado
      
      const writable = service.broadCast()
      // vai mandar somenta para o client1 porquê o outro desconectou
      writable.write('hello world!')
      expect(writable).toBeInstanceOf(Writable)
      expect(service.clientStreams.delete).toHaveBeenCalled()
      expect(onData).toHaveBeenCalledTimes(1)
    })
  })
});