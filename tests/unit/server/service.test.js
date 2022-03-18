import { jest, expect, describe, test, beforeEach } from '@jest/globals'
import config from '../../../server/config';
import fsPromises from 'fs/promises';
import fs from 'fs'
import { Service } from '../../../server/service';
import TestUtil from '../_util/testUtil';
import { extname, join } from 'path';
const { pages, location, dir: {publicDirectory} } = config

describe('Service - test manipulation of file streams', () => {
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
});