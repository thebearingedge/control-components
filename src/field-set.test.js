import React from 'react'
import { describe, beforeEach, it } from 'mocha'
import { expect, stub, mountWith } from './__test__'
import * as Form from './form'
import * as Field from './field'
import * as FieldSet from './field-set'
import * as FieldArray from './field-array'
import * as SuperControl from './super-control'

describe('FieldSet.Model', () => {

  let form

  beforeEach(() => {
    form = { isInitialized: false }
  })

  describe('_register', () => {

    it('registers a child field', () => {
      const fieldSet = FieldSet.Model.create(form, {})
      const field = Field.Model.create(fieldSet, '', 'foo')
      fieldSet._register(['foo'], field)
      expect(fieldSet.fields.foo).to.equal(field)
      expect(fieldSet.fields.foo).to.be.an.instanceOf(Field.Model)
    })

    it('registers a child fieldSet', () => {
      const parent = FieldSet.Model.create(form, {})
      const child = FieldSet.Model.create(parent, {}, 'foo')
      parent._register(['foo'], child)
      expect(parent.fields.foo).to.equal(child)
      expect(parent.fields.foo).to.be.an.instanceOf(FieldSet.Model)
    })

    it('registers a grandchild field', () => {
      const parent = FieldSet.Model.create(form, {})
      const child = FieldSet.Model.create(parent, {}, 'foo')
      const grandchild = Field.Model.create(parent, '', 'foo.bar')
      parent
        ._register(['foo'], child)
        ._register(['foo', 'bar'], grandchild)
      expect(parent.fields.foo.fields.bar).to.equal(grandchild)
      expect(parent.fields.foo.fields.bar).to.be.an.instanceOf(Field.Model)
    })

  })

  describe('_patchField', () => {

    it('patches its own state', () => {
      const fieldSet = FieldSet.Model.create(form, {})
      fieldSet._patchField([], { value: { foo: 'bar' } })
      expect(fieldSet.getState()).to.deep.include({
        value: { foo: 'bar' }
      })
    })

    it('patches the state of descendant fields', () => {
      const fieldSet = FieldSet.Model.create(form, {})
      const field = Field.Model.create(form, '', 'foo')
      fieldSet
        ._register(['foo'], field)
        ._patchField(['foo'], { value: 'bar' })
      expect(fieldSet.getState()).to.deep.include({
        value: { foo: 'bar' }
      })
      expect(field.getState()).to.include({
        value: 'bar'
      })
    })

    it('tracks the visits of descendant fields', () => {
      const fieldSet = FieldSet.Model.create(form, {})
      const field = Field.Model.create(fieldSet, '', 'foo')
      fieldSet
        ._register(['foo'], field)
        ._patchField(['foo'], { visits: 1 })
      expect(fieldSet.getState()).to.include({ anyVisited: true })
    })

    it('tracks the touches of descendant fields', () => {
      const fieldSet = FieldSet.Model.create(form, {})
      const field = Field.Model.create(fieldSet, '', 'foo')
      fieldSet
        ._register(['foo'], field)
        ._patchField(['foo'], { touches: 1 })
      expect(fieldSet.getState()).to.include({ anyTouched: true })
    })

    it('tracks isActive of descendant fields', () => {
      const fieldSet = FieldSet.Model.create(form, {})
      const field = Field.Model.create(fieldSet, '', 'foo')
      fieldSet
        ._register(['foo'], field)
        ._patchField(['foo'], { visits: 1 }, { activate: true })
      expect(fieldSet.getState()).to.include({ isActive: true })
      fieldSet._patchField(['foo'], { touches: 1 }, { activate: true })
      expect(fieldSet.getState()).to.include({ isActive: false })
    })

    it('tracks focuses of descendant fields', () => {
      const fieldSet = FieldSet.Model.create('test', {})
      const field = Field.Model.create(fieldSet, '', 'foo')
      fieldSet
        ._register(['foo'], field)
        ._patchField(['foo'], { visits: 1 }, { activate: true })
      expect(fieldSet.getState()).to.include({ active: field })
    })

  })

  describe('_getField', () => {

    it('returns a registered child field', () => {
      const fieldSet = FieldSet.Model.create(form, {})
      fieldSet.form = fieldSet
      const field = Field.Model.create(fieldSet, '', 'foo')
      fieldSet._register(['foo'], field)
      expect(fieldSet._getField(['foo'])).to.equal(field)
    })

    it('returns a registered granchild field', () => {
      const parent = FieldSet.Model.create(form, {})
      const child = FieldSet.Model.create(parent, {}, 'foo')
      const grandchild = Field.Model.create(parent, {}, 'foo.bar')
      parent
        ._register(child.names, child)
        ._register(grandchild.names, grandchild)
      expect(parent._getField(grandchild.names)).to.equal(grandchild)
    })

    it('returns null if a field is not registered', () => {
      const parent = FieldSet.Model.create(form, {})
      const child = FieldSet.Model.create(parent, {}, 'foo')
      parent._register(child.names, child)
      const unregistered = parent._getField(['foo', 'bar'])
      expect(unregistered).to.equal(null)
    })

    it('returns null if the names list is too long', () => {
      const parent = FieldSet.Model.create(form, {})
      const child = Field.Model.create(parent, {}, 'foo')
      parent._register(child.names, child)
      const unregistered = parent._getField(['foo', 'bar'])
      expect(unregistered).to.equal(null)
    })

  })

  describe('_unregister', () => {

    it('unregisters a child field', () => {
      const fieldSet = FieldSet.Model.create(null, {})
      fieldSet.form = fieldSet
      const field = Field.Model.create(fieldSet, '', 'foo')
      fieldSet._register(['foo'], field)
      expect(fieldSet.fields.foo).to.equal(field)
      fieldSet._unregister(['foo'], field)
      expect(fieldSet.fields.foo).to.equal(void 0)
    })

    it('unsets the state of a child field', () => {
      const fieldSet = FieldSet.Model.create(null, {})
      fieldSet.form = fieldSet
      const field = Field.Model.create(fieldSet, '', 'foo')
      fieldSet._register(['foo'], field)
      expect(fieldSet.getState()).to.deep.include({
        init: { foo: '' },
        value: { foo: '' }
      })
      fieldSet._unregister(['foo'], field)
      expect(fieldSet.getState()).to.deep.include({
        init: { foo: '' },
        value: {}
      })
    })

    it('unregisters a child fieldSet', () => {
      const parent = FieldSet.Model.create(null, {})
      parent.form = parent
      const child = FieldSet.Model.create(parent, {}, 'foo')
      parent._register(child.names, child)
      expect(parent.fields.foo).to.equal(child)
    })

    it('unregisters a grandchild field', () => {
      const parent = FieldSet.Model.create(null, {})
      parent.form = parent
      const child = FieldSet.Model.create(parent, {}, 'foo')
      const grandchild = Field.Model.create(parent, '', 'foo.bar')
      parent
        ._register(['foo'], child)
        ._register(['foo', 'bar'], grandchild)
      expect(parent.fields.foo.fields.bar).to.equal(grandchild)
      parent._unregister(['foo', 'bar'], grandchild)
      expect(parent.fields.foo.fields.bar).to.equal(void 0)
    })

    it('unsets the state of a grandchild field', () => {
      const parent = FieldSet.Model.create(null, {})
      parent.form = parent
      const child = FieldSet.Model.create(parent, {}, 'foo')
      const grandchild = Field.Model.create(parent, '', 'foo.bar')
      parent
        ._register(['foo'], child)
        ._register(['foo', 'bar'], grandchild)
      expect(parent.getState()).to.deep.include({
        init: { foo: { bar: '' } },
        value: { foo: { bar: '' } }
      })
      parent._unregister(['foo', 'bar'], grandchild)
      expect(parent.getState()).to.deep.include({
        init: { foo: { bar: '' } },
        value: { foo: {} }
      })
    })

    it('unregisters subtrees of fields', () => {
      const parent = FieldSet.Model.create(null, {})
      parent.form = parent
      const child = FieldSet.Model.create(parent, {}, 'foo')
      const grandchild = Field.Model.create(parent, '', 'foo.bar')
      parent
        ._register(['foo'], child)
        ._register(['foo', 'bar'], grandchild)
      parent._unregister(['foo'], child)
      expect(parent.fields).to.deep.equal({})
      expect(parent.getState()).to.deep.include({
        init: { foo: { bar: '' } },
        value: {}
      })
    })

    it('does not throw if a detached field unregisters', () => {
      const parent = FieldSet.Model.create(null, {})
      parent.form = parent
      const child = FieldSet.Model.create(parent, {}, 'foo')
      const grandchild = Field.Model.create(parent, '', 'foo.bar')
      parent
        ._register(['foo'], child)
        ._register(['foo', 'bar'], grandchild)
      parent._unregister(['foo'])
      expect(() => parent._unregister(['foo', 'bar'])).not.to.throw()
    })

  })

  describe('broadcast', () => {

    it('calls subscribers on itself and all descendants', done => {
      const parent = FieldSet.Model.create(form, {})
      const child = FieldSet.Model.create(parent, {}, 'foo')
      const grandchild = Field.Model.create(parent, '', 'foo.bar')
      parent
        ._register(['foo'], child)
        ._register(['foo', 'bar'], grandchild)
      const subscriber = stub()
        .onCall(5).callsFake(() => done())
        .onCall(6).callsFake(() => done())
      parent.subscribe(subscriber)
      child.subscribe(subscriber)
      grandchild.subscribe(subscriber)
      parent.broadcast()
    })

  })

  describe('changeField', () => {

    it('sets the value of the field at the given path', () => {
      const fieldSet = FieldSet.Model.create(null, {})
      fieldSet.form = fieldSet
      const fieldArray = FieldArray.Model.create(fieldSet, [], 'bar')
      const field = Field.Model.create(fieldSet, '', 'bar[0]')
      fieldSet
        ._register(['bar'], fieldArray)
        ._register(['bar', 0], field)
      fieldSet.changeField('bar[0]', 'test')
      expect(fieldSet.getState()).to.deep.include({
        value: { bar: ['test'] }
      })
      expect(fieldArray.getState()).to.deep.include({
        value: ['test']
      })
      expect(field.getState()).to.include({
        value: 'test'
      })
    })

  })

  describe('touchField', () => {

    it('marks the given field as touched', () => {
      const fieldSet = FieldSet.Model.create(null, {})
      fieldSet.form = fieldSet
      const fieldArray = FieldArray.Model.create(fieldSet, [], 'bar')
      const field = Field.Model.create(fieldSet, '', 'bar[0]')
      fieldSet
        ._register(['bar'], fieldArray)
        ._register(['bar', 0], field)
        .touchField('bar[0]')
      expect(fieldSet._state.touches).to.equal(1)
      expect(fieldArray._state.touches).to.equal(1)
      expect(field._state.touches).to.equal(1)
    })

  })

  describe('untouchField', () => {

    it('unmarks the given field as touched', () => {
      const fieldSet = FieldSet.Model.create(null, {})
      fieldSet.form = fieldSet
      const fieldArray = FieldArray.Model.create(fieldSet, [], 'bar')
      const field = Field.Model.create(fieldSet, '', 'bar[0]')
      fieldSet
        ._register(['bar'], fieldArray)
        ._register(['bar', 0], field)
        ._patchField(['bar', 0], { touches: 1 })
        ._patchField(['bar', 0], { touches: 1 })
      expect(fieldSet._state.touches).to.equal(2)
      expect(fieldSet.fields.bar._state.touches).to.equal(2)
      expect(fieldSet.fields.bar.fields[0]._state.touches).to.equal(2)
      fieldSet.untouchField('bar[0]')
      expect(fieldSet._state.touches).to.equal(0)
      expect(fieldSet.fields.bar._state.touches).to.equal(0)
      expect(fieldSet.fields.bar.fields[0]._state.touches).to.equal(0)
    })

  })

  describe('touchAll', () => {

    it('marks all child fields as touched', () => {
      const fieldSet = FieldSet.Model.create(null, {})
      fieldSet.form = fieldSet
      fieldSet
        ._register(['foo'], Field.Model.create(fieldSet, [], 'foo'))
        ._register(['bar'], Field.Model.create(fieldSet, '', 'bar'))
        ._register(['baz'], Field.Model.create(fieldSet, '', 'baz'))
        .touchAll()
      expect(fieldSet.fields.foo._state.touches).to.equal(1)
      expect(fieldSet.fields.bar._state.touches).to.equal(1)
      expect(fieldSet.fields.baz._state.touches).to.equal(1)
    })

  })

  describe('untouchAll', () => {

    it('unmarks all child fields as touched', () => {
      const fieldSet = FieldSet.Model.create(null, {})
      fieldSet.form = fieldSet
      fieldSet
        ._register(['foo'], Field.Model.create(fieldSet, '', 'foo'))
        ._register(['bar'], Field.Model.create(fieldSet, '', 'bar'))
        ._register(['baz'], Field.Model.create(fieldSet, '', 'baz'))
        .touchAll()
      fieldSet.untouchAll()
      expect(fieldSet.fields.foo._state.touches).to.equal(0)
      expect(fieldSet.fields.bar._state.touches).to.equal(0)
      expect(fieldSet.fields.baz._state.touches).to.equal(0)
    })

  })

  describe('validateAll', () => {

    it('validates the model and its descendants', () => {
      const fieldSet = FieldSet.Model.create(null, {}, [], {
        validate: values => {
          return Object.keys(values).some(key => {
            return !values[key]
          }) && { error: 'incomplete' }
        }
      })
      fieldSet.form = fieldSet
      fieldSet
        ._register(['foo'], Field.Model.create(fieldSet, '', 'foo', {
          validate: value => !value && { error: 'foo required' }
        }))
        ._register(['bar'], Field.Model.create(fieldSet, '', 'bar', {
          validate: value => !value && { error: 'bar required' }
        }))
        ._register(['baz'], Field.Model.create(fieldSet, '', 'baz', {
          validate: value => !value && { error: 'baz required' }
        }))
        .validateAll()
      expect(fieldSet.error).to.equal('incomplete')
      expect(fieldSet.fields.foo.error).to.equal('foo required')
      expect(fieldSet.fields.bar.error).to.equal('bar required')
      expect(fieldSet.fields.baz.error).to.equal('baz required')
    })

  })

  describe('allErrors', () => {

    it('returns all validation errors in the model\'s hierarchy', () => {
      const fieldSet = FieldSet.Model.create(null, {}, [], {
        validate: values => {
          return Object.keys(values).some(key => {
            return !values[key]
          }) && { error: 'incomplete' }
        }
      })
      fieldSet.form = fieldSet
      fieldSet
        ._register(['foo'], Field.Model.create(fieldSet, '', 'foo', {
          validate: value => !value && { error: 'foo required' }
        }))
        ._register(['bar'], Field.Model.create(fieldSet, '', 'bar', {
          validate: value => !value && { error: 'bar required' }
        }))
        ._register(['baz'], Field.Model.create(fieldSet, '', 'baz', {
          validate: value => !value && { error: 'baz required' }
        }))
        .validateAll()
      expect(fieldSet.allErrors).to.deep.equal({
        $self: 'incomplete',
        foo: 'foo required',
        bar: 'bar required',
        baz: 'baz required'
      })
    })

  })

  describe('allValidations', () => {

    it('returns all pending validations in the model\'s hierarchy', () => {
      const fieldSet = FieldSet.Model.create(null, {}, [], {
        validate: _ => Promise.resolve({ error: 'incomplete' })
      })
      fieldSet.form = fieldSet
      fieldSet
        ._register(['foo'], Field.Model.create(fieldSet, '', 'foo', {
          validate: _ => Promise.resolve({ error: 'foo required' })
        }))
        ._register(['bar'], Field.Model.create(fieldSet, '', 'bar', {
          validate: _ => Promise.resolve({ error: 'bar required' })
        }))
        ._register(['baz'], Field.Model.create(fieldSet, '', 'baz', {
          validate: _ => Promise.resolve({ error: 'baz required' })
        }))
        .validateAll()
      const { $self, foo, bar, baz } = fieldSet.allValidations
      expect($self).to.be.a('promise')
      expect(foo).to.be.a('promise')
      expect(bar).to.be.a('promise')
      expect(baz).to.be.a('promise')
    })

  })

  describe('initialize', () => {

    it('patches the init and value states of itself', () => {
      const fieldSet = FieldSet.Model.create()
      fieldSet.form = fieldSet
      fieldSet.initialize({ foo: 'bar' })
      expect(fieldSet.getState()).to.deep.include({
        init: { foo: 'bar' },
        values: { foo: 'bar' }
      })
    })

    it('patches the init and value states of its descendants', () => {
      const parent = FieldSet.Model.create()
      parent.form = parent
      const child = FieldSet.Model.create(parent, {}, 'foo')
      const grandchild = Field.Model.create(parent, '', 'foo.bar')
      parent
        ._register(['foo'], child)
        ._register(['foo', 'bar'], grandchild)
      parent.initialize({ foo: { bar: 'baz' } })
      expect(parent.getState()).to.deep.include({
        init: { foo: { bar: 'baz' } },
        values: { foo: { bar: 'baz' } }
      })
      expect(child.getState()).to.deep.include({
        init: { bar: 'baz' },
        values: { bar: 'baz' }
      })
      expect(grandchild.getState()).to.include({
        init: 'baz',
        value: 'baz'
      })
    })

  })

  describe('toJSON', () => {

    it('returns the values within the fieldset', () => {
      const parent = FieldSet.Model.create()
      parent.form = parent
      parent
        ._register(['foo'], FieldSet.Model.create(parent, {}, 'foo'))
        ._register(['foo', 'bar'], Field.Model.create(parent, 'baz', 'foo.bar'))
      const json = JSON.stringify(parent)
      expect(json).to.equal('{"foo":{"bar":"baz"}}')
    })

    it('uses a custom serialize method', () => {
      const model = FieldSet.Model.create(null, {}, '', {
        serialize: model => model.value.toString()
      })
      const json = JSON.stringify(model)
      expect(json).to.equal('"[object Object]"')
    })

  })

  describe('reset', () => {

    it('resets the state of the model and its descendants', () => {
      const fieldSet = FieldSet.Model.create(null, {})
      fieldSet.form = fieldSet
      const fieldArray = FieldArray.Model.create(fieldSet, [], 'foo')
      const field = Field.Model.create(fieldSet, '', 'foo[0]')
      fieldSet
        ._register(['foo'], fieldArray)
        ._register(['foo', 0], field)
      fieldSet.changeField('foo[0]', 'bar')
      expect(fieldSet.getState()).to.deep.include({
        init: { foo: [''] },
        values: { foo: ['bar'] }
      })
      expect(fieldArray.getState()).to.deep.include({
        init: [''],
        values: ['bar']
      })
      expect(field.getState()).to.include({
        init: '',
        value: 'bar'
      })
      fieldSet.reset()
      expect(fieldSet.getState()).to.deep.include({
        init: { foo: [''] },
        values: { foo: [''] }
      })
      expect(fieldArray.getState()).to.deep.include({
        init: [''],
        values: ['']
      })
      expect(field.getState()).to.include({
        init: '',
        value: ''
      })
    })

    it('retains the active state of itself and active descendants', () => {
      const fieldSet = FieldSet.Model.create()
      fieldSet.form = fieldSet
      const fieldArray = FieldArray.Model.create(fieldSet, [], 'foo')
      const field = Field.Model.create(fieldSet, '', 'foo[0]')
      fieldSet
        ._register(['foo'], fieldArray)
        ._register(['foo', 0], field)
      field.visit({ activate: true })
      expect(fieldSet.getState()).to.include({
        active: field,
        isActive: true,
        anyVisited: true
      })
      expect(fieldArray.getState()).to.include({
        active: field,
        isActive: true,
        anyVisited: true
      })
      expect(field.getState()).to.include({
        isActive: true,
        isVisited: true
      })
      fieldSet.reset()
      expect(fieldSet.getState()).to.include({
        active: field,
        isActive: true,
        anyVisited: false
      })
      expect(fieldArray.getState()).to.include({
        active: field,
        isActive: true,
        anyVisited: false
      })
      expect(field.getState()).to.include({
        isActive: true,
        isVisited: false
      })
    })

    it('unregisters fields that were registered after initialization', () => {
      const fieldSet = FieldSet.Model.create()
      fieldSet.form = fieldSet
      const foo = Field.Model.create(fieldSet, '', 'foo')
      fieldSet._register(['foo'], foo)
      fieldSet.isInitialized = true
      const bar = Field.Model.create(fieldSet, '', 'bar')
      fieldSet._register(['bar'], bar)
      expect(fieldSet.fields.bar).to.equal(bar)
      fieldSet.reset()
      expect(fieldSet.fields.bar).to.equal(void 0)
    })

  })

})

describe('FieldSet.View', () => {

  let form
  let mount

  beforeEach(() => {
    form = Form.Model.create('test', {})
    mount = mountWith({ context: { '@@super-controls': form } })
  })

  describe('componentWillReceiveProps', () => {

    it('defers updates of its name field', done => {
      const foo = form.register({
        init: {},
        route: 'foo',
        Model: FieldSet.Model
      })
      class TestFieldSet extends FieldSet.View {
        componentDidUpdate() {
          expect(this.state).to.deep.equal(foo.getState())
          done()
        }
      }
      const wrapper = mount(<TestFieldSet name='bar'/>)
      wrapper.setProps({ name: 'foo' })
    })

  })

  describe('shouldComponentUpdate', () => {

    it('ignores shallow equal values', () => {
      class TestFieldSet extends FieldSet.View {
        componentDidUpdate() {
          throw new Error('did not ignore values')
        }
      }
      const wrapper = mount(<TestFieldSet name='test'/>)
      wrapper.setState({ values: {} })
    })

    it('ignores shallow equal initial values', () => {
      class TestFieldSet extends FieldSet.View {
        componentDidUpdate() {
          throw new Error('did not ignore init')
        }
      }
      const wrapper = mount(<TestFieldSet name='test'/>)
      wrapper.setState({ init: {} })
    })

  })

  describe('render', () => {

    it('renders a fieldset element by default', () => {
      const wrapper = mount(<FieldSet.View name='test'/>)
      expect(wrapper).to.have.tagName('fieldset')
    })

    it('registers and renders child SuperControls', () => {
      const wrapper = mount(
        <FieldSet.View name='test'>
          <SuperControl.View name='child' render={_ => <noscript/>}/>
        </FieldSet.View>
      )
      const { model } = wrapper.instance()
      expect(model.fields.child).to.be.an.instanceOf(SuperControl.Model)
      expect(wrapper).to.contain(<noscript/>)
    })

    it('passes a fields prop to a render function', done => {
      const test = ({ fields }) => {
        expect(fields).to.be.an.instanceOf(FieldSet.Model)
        done()
        return null
      }
      mount(<FieldSet.View name='test' render={test}/>)
    })

    it('passes a fields prop to a component function', done => {
      const test = ({ fields }) => {
        expect(fields).to.be.an.instanceOf(FieldSet.Model)
        done()
        return null
      }
      mount(<FieldSet.View name='test' component={test}/>)
    })

    it('passes a fields prop to a child function', done => {
      const test = ({ fields }) => {
        expect(fields).to.be.an.instanceOf(FieldSet.Model)
        done()
        return null
      }
      mount(
        <FieldSet.View name='test'>
          { test }
        </FieldSet.View>
      )
    })

  })

})
