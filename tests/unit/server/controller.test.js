import { jest, expect, describe, test, beforeEach } from '@jest/globals'
import config from '../../../server/config';
import fsPromises from 'fs/promises';
import fs from 'fs'
import { Service, } from '../../../server/service';
import { Controller } from '../../../server/controller'
import TestUtil from '../_util/testUtil';

describe('Controller - test controller', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  describe('getFileStream', () => {
    test('should return an file stream', async () => {
      const controller = new Controller()
      const mockFileInfo = {
        type: '.html',
        name: 'test.html'
      }
      const mockFileStream = TestUtil.generateReadableStream(['data'])

      jest.spyOn(Service.prototype, 'getFileInfo').mockReturnValue(mockFileInfo)
      jest.spyOn(Service.prototype, 'createFileStream').mockReturnValue(mockFileStream)

      const result = await controller.getFileStream(mockFileInfo.name)

      expect(Service.prototype.getFileInfo).toHaveBeenCalledWith(mockFileInfo.name)
      expect(Service.prototype.createFileStream).toHaveBeenCalledWith(mockFileInfo.name)
      expect(result).toEqual({
        stream: mockFileStream,
        type: mockFileInfo.type
      })
    })
  });
});