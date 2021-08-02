export default async function profile (request, reply): Promise<void> {
  console.log('/profile')
  reply.code(200).send({
    hello: 'world'
  })
}
