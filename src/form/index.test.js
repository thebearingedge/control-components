import React from 'react'
import { describe, it } from 'mocha'
import { mount, expect, spy, stub } from '../__test__'
import createControl from '../create-control'
import Form from '.'
import FieldSet from '../field-set'

describe('Form', () => {

  it('calls a submit handler', () => {
    const handleSubmit = spy()
    const wrapper = mount(
      <Form values={{ test: { test: 'foo' } }} onSubmit={handleSubmit}/>
    )
    wrapper.find('form').simulate('submit')
    expect(handleSubmit).to.have.been.calledWith({
      test: {
        test: 'foo'
      }
    })
  })

  it('registers a reset handler', () => {
    const wrapper = mount(<Form values={{ test: 'foo' }}/>)
    const setState = spy(wrapper.instance(), 'setState')
    wrapper.find('form').simulate('reset')
    expect(setState).to.have.been.calledWith({
      values: { test: 'foo' },
      touched: { test: false }
    })
  })

  it('receives updates from its controls', done => {
    class TestForm extends Form {
      componentDidUpdate() {}
    }
    const wrapper = mount(<TestForm values={{ test: 'foo' }}/>)
    const form = wrapper.instance()
    stub(form, 'componentDidUpdate')
      .onCall(1)
      .callsFake(() => {
        expect(wrapper.state()).to.deep.equal({
          values: { test: 'bar' },
          touched: { test: true }
        })
        done()
      })
    const field = form.registerField({ name: 'test', value: 'foo' })
    field.update({ value: 'bar', isTouched: true })
  })

  it('registers controlled components', done => {
    const Input = createControl(({ field, control }) =>
      <input {...control}/>
    )()
    class TestForm extends Form {
      componentDidUpdate() {
        expect(this.state).to.deep.equal({
          values: { test: 'foo' },
          touched: { test: false }
        })
        done()
      }
    }
    mount(
      <TestForm>
        <Input name='test' value='foo'/>
      </TestForm>
    )
  })

  it('hydrates from a values prop', done => {
    const Input = createControl(({ field, control }) =>
      <input {...control}/>
    )()
    class TestForm extends Form {
      componentDidUpdate() {
        expect(this.state)
          .to.deep.equal({
            values: { 'test.test': 'foo' },
            touched: { 'test.test': false }
          })
        done()
      }
    }
    mount(
      <TestForm values={{ test: { test: 'foo' } }}>
        <FieldSet name='test'>
          <Input name='test'/>
        </FieldSet>
      </TestForm>
    )
  })
})