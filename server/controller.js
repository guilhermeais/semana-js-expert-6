import Service  from './service.js';

export default class Controller {
  constructor() {
    this.service = new Service()
  }

  async getFileStream(filename){
    return this.service.getFileStream(filename)
  }
}