import axios from 'axios'

interface GetTokenResponse {
  token_type: 'Bearer'
  expires_in: number
  access_token: string
  refresh_token: string
}

export default async function getToken (
  request,
  reply
): Promise<GetTokenResponse | string> {
  reply.header('Access-Control-Allow-Origin', '*')

  try {
    const grantType = request?.query?.grant_type || 'authorization_code'

    const querystring = new URLSearchParams()
    querystring.append('client_id', process.env.OSU_CLIENT_ID)
    querystring.append('client_secret', process.env.OSU_CLIENT_SECRET)
    querystring.append('grant_type', grantType)

    if (grantType === 'refresh_token') {
      querystring.append('refresh_token', request.body)
    } else {
      querystring.append('code', request.body)
      querystring.append('redirect_uri', process.env.OSU_CALLBACK_URL)
      querystring.append('scope', 'identify public')
    }

    try {
      const response = await axios.post(
        'https://osu.ppy.sh/oauth/token',
        querystring.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      )

      return response.data
    } catch (error) {
      console.error('API getToken POST error :', error)
      return 'Error'
    }
  } catch (error) {
    console.error('API getToken POST error :', error)
    return 'Error'
  }
}
