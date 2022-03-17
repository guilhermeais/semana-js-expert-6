import { jest, expect, describe, test, beforeEach } from '@jest/globals'
import config from '../../../server/config';
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
  // https://youtu.be/_yolPPGtySM?t=6167
  test.todo(`GET /home - should response with ${pages.homeHTML} file stream`)
  test.todo(`GET /controller - should response with ${pages.controllerHTML} file stream`)
  test.todo(`GET /file.ext - should response with file stream`)
  test.todo(`GET /unknown - given an inexistent route/file should response with 404`)

  describe('exceptions', ()=> {
    test.todo('given inexistent file it should respond with 404')
    test.todo('given error it should respond with 500')
  })
});