import supabase from '../libs/supabase'

interface TextResponse {
  message: string
}

interface Response {
  count: number
}

export default async function totalUsers (
  request,
  reply
): Promise<TextResponse | Response> {
  reply.header('Access-Control-Allow-Origin', '*')

  try {
    const { count, error } = await supabase
      .from('tracked_users')
      .select('*', { count: 'exact' })

    if (error) {
      console.error('API totalUsers GET error :', error)
      return {
        message: error.message
      }
    }

    return {
      count
    }
  } catch (error) {
    console.error('API totalUsers GET error :', error)
    return {
      message: error
    }
  }
}
