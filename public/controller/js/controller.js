import Service from './service.js'
import View from './view.js'
export default class Controller {
  /**
   * @param {{view: View, service: Service}}
   */
  constructor({view, service}){
    this.view = view
    this.service = service
  }

  static initialize(dependencies) {
    const controller = new Controller(dependencies)
    controller.onLoad()
    return controller
  }

  async commandReceived(text){
    return this.service.makeRequest({
       command: text.toLowerCase()
    })
  }

  onLoad() {
    this.view.configureOnBtnClick(this.commandReceived.bind(this))
    this.view.onLoad()
  }
}