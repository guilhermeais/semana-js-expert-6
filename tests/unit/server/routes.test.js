import { jest, expect, describe, test, beforeEach } from '@jest/globals'
import config from '../../../server/config';
import Controller from '../../../server/controller';
import { handler } from '../../../server/routes';
import TestUtil from '../_util/testUtil';
const { pages, location } = config
describe('Routes - test site for api response', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })
  test('GET / - should redirect to home page', async ()=> {
    const params = TestUtil.defaultHandleParams()  
    params.request.method = 'GET'
    params.request.url = '/' 
    
    await handler(...params.values())
    expect(params.response.end).toHaveBeenCalled()
    expect(params.response.writeHead).toHaveBeenCalledWith(302, {
      'Location': location.home
    })
  })

  test(`GET /home - should response with ${pages.homeHTML} file stream`, async () => {
    const params = TestUtil.defaultHandleParams()  
    params.request.method = 'GET'
    params.request.url = '/home' 
      const mockFileStream = TestUtil.generateReadableStream(['data'])
    jest.spyOn(
      Controller.prototype,
       Controller.prototype.getFileStream.name
    ).mockResolvedValue({
      stream: mockFileStream,
    })

    jest.spyOn(mockFileStream, 'pipe').mockReturnValue()
    await handler(...params.values())

    expect(Controller.prototype.getFileStream).toHaveBeenCalledWith(pages.homeHTML)
    expect(mockFileStream.pipe).toHaveBeenCalledWith(params.response)

  })
  test(`GET /controller - should response with ${pages.controllerHTML} file stream`,  async () => {
    const params = TestUtil.defaultHandleParams()  
    params.request.method = 'GET'
    params.request.url = '/controller' 
      const mockFileStream = TestUtil.generateReadableStream(['data'])
    jest.spyOn(
      Controller.prototype,
       Controller.prototype.getFileStream.name
    ).mockResolvedValue({
      stream: mockFileStream,
    })

    jest.spyOn(mockFileStream, 'pipe').mockReturnValue()
    await handler(...params.values())

    expect(Controller.prototype.getFileStream).toHaveBeenCalledWith(pages.controllerHTML)
    expect(mockFileStream.pipe).toHaveBeenCalledWith(params.response)

  })

  test(`GET /index.html - should response with file stream`, async () => {
    const params = TestUtil.defaultHandleParams()  
    const filename = '/index.html'
    params.request.method = 'GET'
    params.request.url = filename 
    const expectedType = '.html'
    const mockFileStream = TestUtil.generateReadableStream(['data'])

    jest.spyOn(
      Controller.prototype,
       Controller.prototype.getFileStream.name
    ).mockResolvedValue({
      stream: mockFileStream,
      type: expectedType
    })

    jest.spyOn(mockFileStream, 'pipe').mockReturnValue()
    await handler(...params.values())

    expect(Controller.prototype.getFileStream).toHaveBeenCalledWith(filename)
    expect(mockFileStream.pipe).toHaveBeenCalledWith(params.response)
    expect(params.response.writeHead).toHaveBeenCalledWith(200, {
      'Content-Type': config.constants.CONTENT_TYPE[expectedType]
    })

  })

  test(`GET /file.ext - should response with file stream`, async () => {
    const params = TestUtil.defaultHandleParams()  
    const filename = '/index.ext'
    params.request.method = 'GET'
    params.request.url = filename 
    const expectedType = '.ext'
    const mockFileStream = TestUtil.generateReadableStream(['data'])

    jest.spyOn(
      Controller.prototype,
       Controller.prototype.getFileStream.name
    ).mockResolvedValue({
      stream: mockFileStream,
      type: expectedType
    })

    jest.spyOn(mockFileStream, 'pipe').mockReturnValue()
    await handler(...params.values())

    expect(Controller.prototype.getFileStream).toHaveBeenCalledWith(filename)
    expect(mockFileStream.pipe).toHaveBeenCalledWith(params.response)
    expect(params.response.writeHead).not.toHaveBeenCalledWith(200, {
      'Content-Type': config.constants.CONTENT_TYPE[expectedType]
    })

  })

  test(`GET /unknown - given an inexistent route/file should response with 404`,  async () => {
    const params = TestUtil.defaultHandleParams()  
    params.request.method = 'POST'
    params.request.url = 'unknown' 

    await handler(...params.values())

 
    expect(params.response.writeHead).toHaveBeenCalledWith(404)
    expect(params.response.end).toHaveBeenCalled()
  })

  describe('exceptions', ()=> {
    test('given inexistent file it should respond with 404', async () => {
      const params = TestUtil.defaultHandleParams()  
      params.request.method = 'GET'
      params.request.url = '/index.png' 
      jest.spyOn(Controller.prototype, Controller.prototype.getFileStream.name).mockRejectedValue(new Error('Error: ENOENT: no such file or directory'))
      await handler(...params.values())
  
   
      expect(params.response.writeHead).toHaveBeenCalledWith(404)
      expect(params.response.end).toHaveBeenCalled()
    })
    test('given error it should respond with 500', async () => {
      const params = TestUtil.defaultHandleParams()  
      params.request.method = 'GET'
      params.request.url = '/index.png' 
      jest.spyOn(Controller.prototype, Controller.prototype.getFileStream.name).mockRejectedValue(new Error('Error'))
      await handler(...params.values())
  
   
      expect(params.response.writeHead).toHaveBeenCalledWith(500)
      expect(params.response.end).toHaveBeenCalled()
    })
  })
});