import test from 'ava'
const tmp = require('tmp')
const Database = require('../db')

let database = null

function * expectThrow(t, fn) {
    try {
        yield fn
    } catch (err) {
        return
    }
    t.fail('Function did not throw an error.')
}

test.before(function * () {
    const database_file = tmp.fileSync({keep: true});
    console.log(`Database file is ${database_file.name}`)
    database = yield Database.setup({ file: database_file.name })
})

test('globalSettings', function * (t) {
    t.is(yield database.getGlobalValue(1234), undefined)
    t.is(yield database.getGlobalValue(null), undefined)
    t.is(yield database.getGlobalValue('test_key'), undefined)

    yield expectThrow(t, database.setGlobalValue())
    yield expectThrow(t, database.setGlobalValue(null))
    yield expectThrow(t, database.setGlobalValue(''))

    yield database.setGlobalValue('test_key')
    t.is(yield database.getGlobalValue('test_key'), null)
    yield database.setGlobalValue('test_key', 'test_value')
    t.is(yield database.getGlobalValue('test_key'), 'test_value')
    yield database.setGlobalValue('test_key', {value1: 'value1', value2: 'value2'})
    t.is((yield database.getGlobalValue('test_key')).value1, 'value1')
    t.is((yield database.getGlobalValue('test_key')).value2, 'value2')
    yield database.setGlobalValue('test_key2', '?=+///z#;')
    t.is(yield database.getGlobalValue('test_key2'), '?=+///z#;')

    const arr = yield database.getGlobalValue()
    t.true(Array.isArray(arr))
    t.is(arr.length, 2)
})

test('skillSettings', function * (t) {
    t.is(yield database.getSkillValue(1234, 2342), undefined)
    t.is(yield database.getSkillValue(1234), undefined)
    t.is(yield database.getSkillValue(null), undefined)
    t.is(yield database.getSkillValue(undefined, 'test_key'), undefined)
    t.is(yield database.getSkillValue('test_key'), undefined)

    yield expectThrow(t, database.setSkillValue())
    yield expectThrow(t, database.setSkillValue(null))
    yield expectThrow(t, database.setSkillValue(''))
    yield expectThrow(t, database.setSkillValue(null, ''))

    yield database.setSkillValue('skill1', 'test_key')
    t.is(yield database.getSkillValue('skill1', 'test_key'), null)
    yield database.setSkillValue('skill1', 'test_key', 'value1')
    t.is(yield database.getSkillValue('skill1', 'test_key'), 'value1')
    yield database.setSkillValue('skill2', 'test_key2', '?=+///z#;')
    t.is(yield database.getSkillValue('skill2', 'test_key2'), '?=+///z#;')

    const arr = yield database.getSkillValue()
    t.true(Array.isArray(arr))
    t.is(arr.length, 2)
    const arr2 = yield database.getSkillValue('skill1')
    t.true(Array.isArray(arr2))
    t.is(arr2.length, 1)
})

test('userSettings', function * (t) {
    yield database.saveUser({ username:'test', password: 'test', is_admin: true });

    t.is(yield database.getValue(1234, 2342, 34534), undefined)
    t.is(yield database.getValue(1234), undefined)
    t.is(yield database.getValue(1234, '45345'), undefined)
    t.is(yield database.getValue(null), undefined)
    t.is(yield database.getValue(undefined, 'test_user'), undefined)
    t.is(yield database.getValue('test_key'), undefined)

    yield expectThrow(t, database.setValue())
    yield expectThrow(t, database.setValue(null))
    yield expectThrow(t, database.setValue(''))
    yield expectThrow(t, database.setValue(null, ''))
    yield expectThrow(t, database.setValue(null, '', ''))
    yield expectThrow(t, database.setValue('skill1', {user_id: 1}, 'test_key'))

    t.is(yield database.getValue('skill1', {user_id: 1}, 'test_key'), undefined)
    yield database.setValue('skill1', {user_id: 1}, 'test_key', 'value1')
    t.is(yield database.getValue('skill1', {user_id: 1}, 'test_key'), 'value1')
    yield database.setValue('skill2', {user_id: 1}, 'test_key2', '?=+///z#;')
    t.is(yield database.getValue('skill2', {user_id: 1}, 'test_key2'), '?=+///z#;')
})

test('multiSetup', async function (t) {
    const multi_database_file = tmp.fileSync();
    for (let i = 0; i < 5; i++) {
        await t.notThrows(function * () {
            const multi_database = yield Database.setup({ file: multi_database_file.name })
            yield multi_database.close()
        });
    }
})

test.after(function * () {
    yield database.close()
})
