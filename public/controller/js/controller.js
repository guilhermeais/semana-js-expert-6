export default class Controller {
  constructor({view, service}){
    this.view = view
    this.service = service
  }

  static initialize(dependencies) {
    return new Controller(dependencies)
  }
}