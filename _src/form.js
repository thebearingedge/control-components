import PropTypes from 'prop-types'
import * as _ from './util'
import * as FieldSet from './field-set'

export const Model = class FormModel extends FieldSet.Model {
  constructor(...args) {
    super(...args)
    this.root = this
    this.state.active = null
  }
  register({ init, route, config, Model }) {
    const names = route.map(_.invoke)
    const registered = this.getField(names)
    if (registered) return registered
    const value = _.get(this.state.init, names, init)
    const field = Model.create(this, value, route, config)
    super.register(names, field)
    return field
  }
  patch(names, state, options) {
    if ('visits' in state) {
      super.patch(
        [],
        _.set(this.state, ['active'], this.getField(names)),
        { silent: true }
      )
    }
    if ('touches' in state) {
      super.patch(
        [],
        _.set(this.state, ['active'], null),
        { silent: true }
      )
    }
    super.patch(names, state, options)
    return this
  }
  static create(name, init, config) {
    return super.create(null, init, [_ => name], config)
  }
}

export class View extends FieldSet.View {
  get Model() {
    return Model
  }
  componentWillMount() {
    const { props: { name }, init, config } = this
    this.model = this.Model.create(name, init, config)
    this.unsubscribe = this.model.subscribe(this.setState.bind(this))
  }
  register(...args) {
    return this.model.register(...args)
  }
  static get displayName() {
    return 'Form'
  }
  static get propTypes() {
    return {
      ...super.propTypes,
      name: PropTypes.string
    }
  }
  static get defaultProps() {
    return {
      ...super.defaultProps,
      component: 'form'
    }
  }
}
