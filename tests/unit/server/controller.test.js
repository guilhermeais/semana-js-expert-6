import { jest, expect, describe, test, beforeEach } from '@jest/globals'
import  Service  from '../../../server/service';
import Controller from '../../../server/controller'
import TestUtil from '../_util/testUtil';

class SpyService {
  constructor(){
    this.startStreaming = jest.fn()
    this.stopStreaming = jest.fn()
    this.createClientStream = jest.fn()
    this.removeClientStream = jest.fn()
  }
}

function makeController(){
  const spyService = new SpyService()
  const controller = new Controller()
  controller.service = spyService
  return {
    controller,
    spyService
  }
}

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

  describe('handleCommand', () => {
    test('should call service.startStreaming when command start was passed', async () => {
      const {controller, spyService} = makeController()

      jest.spyOn(String.prototype, String.prototype.toLowerCase.name)
      jest.spyOn(String.prototype, String.prototype.includes.name)
     
     const commandString = new String('start')
      const commandParamMock = {
        command: commandString
      }

      const result = await controller.handleCommand(commandParamMock)
      expect(commandString.toLowerCase).toHaveBeenCalled()
      expect(commandString.includes).toHaveBeenCalledWith('start')
      expect(spyService.startStreaming).toHaveBeenCalled()
      expect(result).toStrictEqual({
        message: 'ok'
      })
    });

    test('should call stopStreaming when command stop was provided', async () => {
      const {controller, spyService} = makeController()

      jest.spyOn(String.prototype, String.prototype.toLowerCase.name)
      jest.spyOn(String.prototype, String.prototype.includes.name)
      
      const commandString = new String('stop')
       const commandParamMock = {
         command: commandString
       }
 
       const result = await controller.handleCommand(commandParamMock)
       expect(commandString.toLowerCase).toHaveBeenCalled()
       expect(commandString.includes).toHaveBeenCalledWith('stop')
       expect(spyService.stopStreaming).toHaveBeenCalled()
       expect(result).toStrictEqual({
         message: 'ok'
       })
    });
    test('should do nothing if command is an empty string', async () => {
      const {controller, spyService} = makeController()

      jest.spyOn(String.prototype, String.prototype.toLowerCase.name)
      jest.spyOn(String.prototype, String.prototype.includes.name)
      
      const commandString = new String('')
       const commandParamMock = {
         command: commandString
       }
 
       const result = await controller.handleCommand(commandParamMock)
       expect(commandString.toLowerCase).toHaveBeenCalled()
 
       expect(result).toBeUndefined()
    });
  });
});