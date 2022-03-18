import { jest, expect, describe, test, beforeEach } from '@jest/globals'
import config from '../../../server/config';
import fsPromises from 'fs/promises';
import fs from 'fs'
import { Service, } from '../../../server/service';
import { Controller } from '../../../server/controller'
import TestUtil from '../_util/testUtil';

describe('#Controller - test suite for controller return', () => {
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

      const getFileInfoSpy = jest.spyOn(Service.prototype, Service.prototype.getFileInfo.name).mockReturnValue(mockFileInfo)
      const createFileStreamSpy = jest.spyOn(Service.prototype, Service.prototype.createFileStream.name).mockReturnValue(mockFileStream)

      const result = await controller.getFileStream(mockFileInfo.name)

      expect(getFileInfoSpy).toHaveBeenCalledWith(mockFileInfo.name)
      expect(createFileStreamSpy).toHaveBeenCalledWith(mockFileInfo.name)
      expect(result).toEqual({
        stream: mockFileStream,
        type: mockFileInfo.type
      })
    })
  });
});