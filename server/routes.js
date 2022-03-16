import config from './config.js';
import { Controller } from './controller.js';
import { logger } from './util.js';
const controller = new Controller()
const homeHTML = config.pages.homeHTML
const controllerHTML = config.pages.controllerHTML


async function routes(request, response){
  const { method, url } = request

  if(method == 'GET' && url == '/'){
    response.writeHead(302, {
      'Location': config.location.home
    })

    return response.end()
  }

  if(method == 'GET' && url == '/home'){
    const {
      stream
    } = await controller.getFileStream(homeHTML)

    return stream.pipe(response)
  }

  if(method == 'GET' && url == '/controller'){
    const {
      stream
    } = await controller.getFileStream(controllerHTML)

    return stream.pipe(response)
  }
}

export function handler(request, response){
  return routes(request, response)
  .catch(error => logger.error(error.stack))
}