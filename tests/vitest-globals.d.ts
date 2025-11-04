import type { TestAPI, ExpectStatic } from 'vitest'

declare global {
	const beforeAll: TestAPI['beforeAll']
	const afterAll: TestAPI['afterAll']
	const beforeEach: TestAPI['beforeEach']
	const afterEach: TestAPI['afterEach']
	const describe: TestAPI['describe']
	const it: TestAPI['it']
	const test: TestAPI['test']
	const expect: ExpectStatic
}

export { }
