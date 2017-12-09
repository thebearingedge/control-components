import React from 'react'
import { describe, it } from 'mocha'
import { mount, expect, stub, spy, toThunks } from './__test__'
import { Form } from './form'
import { Field } from './field'
import { FieldArray } from './field-array'
import { FieldSet, modelFieldSet } from './field-set'

describe('FieldSet', () => {

  it('registers a field set model', done => {
    class TestFieldSet extends FieldSet {
      componentDidMount() {
        expect(this.model).to.be.an('object')
        done()
      }
    }
    mount(
      <Form>
        <TestFieldSet name='foo'/>
      </Form>
    )
  })

  it('unregisters its model when it unmounts', () => {
    let model
    class TestFieldSet extends FieldSet {
      componentDidMount() {
        model = this.model
      }
    }
    const wrapper = mount(
      <Form>
        <TestFieldSet name='foo'/>
      </Form>
    )
    const unregister = spy(model, 'unregister')
    wrapper.unmount()
    expect(unregister).to.have.callCount(1)
  })

  it('renders a component prop', () => {
    const wrapper = mount(
      <Form>
        <FieldSet name='foo' component={_ => <noscript/>}/>
      </Form>
    )
    expect(wrapper).to.contain(<noscript/>)
  })

  it('namespaces descendant fields', () => {
    const wrapper = mount(
      <Form>
        <FieldSet name='foo'>
          <Field name='bar'/>
        </FieldSet>
      </Form>
    )
    expect(wrapper.state()).to.deep.equal({
      errors: {},
      notices: {},
      touched: {},
      init: {
        foo: {
          bar: ''
        }
      },
      values: {
        foo: {
          bar: ''
        }
      }
    })
  })

  it('namespaces descendant field sets', () => {
    const wrapper = mount(
      <Form>
        <FieldSet name='foo'>
          <FieldSet name='bar'/>
        </FieldSet>
      </Form>
    )
    expect(wrapper.state()).to.deep.equal({
      errors: {},
      notices: {},
      touched: {},
      init: {
        foo: {
          bar: {}
        }
      },
      values: {
        foo: {
          bar: {}
        }
      }
    })
  })

  it('namespaces descendant field arrays', () => {
    const wrapper = mount(
      <Form>
        <FieldSet name='foo'>
          <FieldArray name='bars'/>
        </FieldSet>
      </Form>
    )
    expect(wrapper.state()).to.deep.equal({
      errors: {},
      notices: {},
      touched: {},
      init: {
        foo: {
          bars: []
        }
      },
      values: {
        foo: {
          bars: []
        }
      }
    })
  })

  it('tracks touches of its descendant fields', done => {
    class TestFieldSet extends FieldSet {
      componentDidUpdate() {}
    }
    const wrapper = mount(
      <Form>
        <TestFieldSet name='foo'>
          <Field name='bar' component='input'/>
        </TestFieldSet>
      </Form>
    )
    stub(TestFieldSet.prototype, 'componentDidUpdate')
      .callsFake(() => done())
    wrapper.find('input').simulate('blur')
  })

})

describe('modelFieldSet', () => {

  it('returns a field set model', () => {
    const values = { foo: { bar: '' } }
    const wrapper = mount(<Form values={values}/>)
    const form = wrapper.instance()
    const model = form.register({
      model: modelFieldSet,
      paths: toThunks('foo'),
      value: {}
    })
    expect(model).to.deep.include({
      init: { bar: '' },
      value: { bar: '' },
      touched: {}
    })
  })

})
