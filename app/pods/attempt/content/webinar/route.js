import Route from '@ember/routing/route';

export default class WebinarRoute extends Route {
  model() {
    return this.modelFor('attempt.content')
  }

  setupController(controller, model) {
    controller.set('content', model)
    controller.set('webinar', model.payload)
  }
}
