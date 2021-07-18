export default async function wait (ms) {
  return await new Promise(resolve => setTimeout(resolve, ms))
}
