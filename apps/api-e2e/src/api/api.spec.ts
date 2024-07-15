import axios from 'axios'

describe('Auth layer', () => {
  it('should return health check message', async () => {
    const response = await axios.get('/api/health-check')
    expect(response.data).toEqual({ message: 'Hello world' })
  })
})
