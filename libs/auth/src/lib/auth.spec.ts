import { createAccessToken } from './auth'

describe('auth', () => {
  it('should create an access token', () => {
    const user = {
      id: 1,
      tokenVersion: 1,
      email: '',
      password: '',
      firstName: '',
      lastName: '',
    }
    const token = createAccessToken(user)
    expect(token).toBeTruthy()
  })
})
